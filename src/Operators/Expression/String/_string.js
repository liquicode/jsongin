'use strict';

/*
	Shared operand handling for the expression string operators.
	This is a helper module, not an operator.

	Twenty operators, and what separates them is mostly their operand rules rather than the
	string function underneath, so the rules live here and each operator names the one it
	follows. Three of them recur, and ***the family is not consistent about which it uses***:

		AsStringOrNull    a null or missing operand makes the result null.
		                  $concat, $split, $trim, $ltrim, $rtrim, $indexOfBytes, $indexOfCP,
		                  $replaceOne, $replaceAll, and the three regex operators.

		AsStringOrEmpty   a null or missing operand is read as an empty string, and a number
		                  is rendered rather than refused.
		                  $toLower, $toUpper, $strcasecmp, $substr, $substrBytes, $substrCP.

		AsRequiredString  a null operand is an error.
		                  $strLenBytes, $strLenCP.

	The dividing line is MongoDB 3.4: the operators which predate it carry the old coercion and
	render a number, and everything added since refuses one. That is measured rather than
	reasoned about - see 'Operand Types' in the String Operator Tests.

	***Bytes are counted by hand rather than through Buffer.*** src/ requires no Node built-ins
	because the package is bundled for the browser (see build/webpack.config.js), so the UTF-8
	arithmetic the byte operators need is done here.
*/

module.exports = function ( jsongin )
{

	// Operand evaluation and counting is not specific to arithmetic despite where it lives:
	// it evaluates an operator's arguments and checks how many there are, which every
	// expression operator taking an operand list needs.
	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	const LIB_REGEXP_OPTIONS = require( '../../../RegExpOptions' );

	// What $trim, $ltrim, and $rtrim remove when no chars are given. This is MongoDB's set,
	// which includes the null character and is therefore not the same as Javascript's \s.
	// Written as character codes rather than as literals because three of them are control
	// characters which do not survive being typed into a source file.
	const DEFAULT_TRIM_CHARACTERS = [ 0, 32, 9, 10, 11, 12, 13 ].map(
		function ( Code ) { return String.fromCharCode( Code ); } );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = arithmetic.Operands;


	//---------------------------------------------------------------------
	// True when the operand is a null or a missing field, which the rules above turn on.
	helper.IsNullish = function ( Operand )
	{
		return 'lu'.includes( jsongin.ShortType( Operand ) );
	};


	//---------------------------------------------------------------------
	// Null propagates. Returns null for a null or missing operand, which the caller returns
	// as the whole result rather than continuing with it.
	helper.AsStringOrNull = function ( Operand, OperatorName )
	{
		if ( helper.IsNullish( Operand ) ) { return null; }

		let short_type = jsongin.ShortType( Operand );
		if ( short_type !== 's' )
		{
			throw new Error( `${OperatorName}: requires a string operand but found a [${short_type}] operand instead.` );
		}
		return Operand;
	};


	//---------------------------------------------------------------------
	// Null is an empty string, and a number is rendered.
	//
	// Only the operators which predate MongoDB 3.4 use this. It is not a nicer version of
	// AsStringOrNull to be preferred: it is a different documented behavior, and using it
	// where MongoDB refuses would be a parity gap rather than a kindness.
	helper.AsStringOrEmpty = function ( Operand, OperatorName )
	{
		if ( helper.IsNullish( Operand ) ) { return ''; }

		let short_type = jsongin.ShortType( Operand );
		if ( short_type === 's' ) { return Operand; }
		if ( short_type === 'n' ) { return String( Operand ); }

		throw new Error( `${OperatorName}: requires a string operand but found a [${short_type}] operand instead.` );
	};


	//---------------------------------------------------------------------
	// Null is refused. The length operators cannot answer for a value which is not there.
	helper.AsRequiredString = function ( Operand, OperatorName )
	{
		let short_type = jsongin.ShortType( Operand );
		if ( short_type !== 's' )
		{
			throw new Error( `${OperatorName}: requires a string operand but found a [${short_type}] operand instead.` );
		}
		return Operand;
	};


	//---------------------------------------------------------------------
	// A position or a length operand.
	//
	// Truncate says whether a fractional value is truncated toward zero or refused, and the
	// two substring families disagree about it: $substrBytes truncates and $substrCP refuses.
	// Verified against MongoDB 6.0.1.
	helper.AsPosition = function ( Operand, OperatorName, Label, Truncate, AllowNegative )
	{
		let short_type = jsongin.ShortType( Operand );
		if ( short_type !== 'n' )
		{
			throw new Error( `${OperatorName}: ${Label} must be a number but found a [${short_type}] instead.` );
		}
		if ( !isFinite( Operand ) )
		{
			throw new Error( `${OperatorName}: ${Label} must be a finite number.` );
		}

		let position = Operand;
		if ( position !== Math.trunc( position ) )
		{
			if ( !Truncate )
			{
				throw new Error( `${OperatorName}: ${Label} must be a whole number but found [${Operand}] instead.` );
			}
			position = Math.trunc( position );
		}

		if ( ( position < 0 ) && !AllowNegative )
		{
			throw new Error( `${OperatorName}: ${Label} cannot be negative but found [${Operand}] instead.` );
		}

		return position;
	};


	//---------------------------------------------------------------------
	// The document-form operators - $trim and its two siblings, the three regex operators,
	// and the two replace operators - take named fields rather than an operand list.
	//
	// Returns a map of the evaluated field values, with a missing optional field left
	// undefined. An unknown field is refused rather than ignored, which is what MongoDB does
	// and what stops a misspelled 'chars' from silently doing nothing.
	helper.Arguments = function ( Document, Args, OperatorName, Required, Optional, Scope )
	{
		jsongin.Scope.Require( Scope, 'string.Arguments' );

		let short_type = jsongin.ShortType( Args );
		if ( short_type !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document of arguments but found a [${short_type}] instead.` );
		}

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			let key = keys[ index ];
			if ( Required.includes( key ) ) { continue; }
			if ( Optional.includes( key ) ) { continue; }
			throw new Error( `${OperatorName}: does not take an argument named [${key}].` );
		}

		let values = {};
		for ( let index = 0; index < Required.length; index++ )
		{
			let key = Required[ index ];
			if ( !Object.prototype.hasOwnProperty.call( Args, key ) )
			{
				throw new Error( `${OperatorName}: requires an argument named [${key}].` );
			}
			values[ key ] = jsongin.Evaluate( Document, Args[ key ], Scope );
		}
		for ( let index = 0; index < Optional.length; index++ )
		{
			let key = Optional[ index ];
			if ( !Object.prototype.hasOwnProperty.call( Args, key ) ) { continue; }
			values[ key ] = jsongin.Evaluate( Document, Args[ key ], Scope );
		}

		return values;
	};


	//---------------------------------------------------------------------
	// The code points of a string, as an array. A code point outside the basic plane is one
	// element here and two Javascript characters, which is the whole reason this exists.
	helper.CodePoints = function ( Text )
	{
		return Array.from( Text );
	};


	//---------------------------------------------------------------------
	// The UTF-8 bytes of a string, as an array of byte values.
	helper.ToBytes = function ( Text )
	{
		let bytes = [];
		let code_points = helper.CodePoints( Text );

		for ( let index = 0; index < code_points.length; index++ )
		{
			let code_point = code_points[ index ].codePointAt( 0 );

			if ( code_point < 0x80 )
			{
				bytes.push( code_point );
			}
			else if ( code_point < 0x800 )
			{
				bytes.push( 0xC0 | ( code_point >> 6 ) );
				bytes.push( 0x80 | ( code_point & 0x3F ) );
			}
			else if ( code_point < 0x10000 )
			{
				bytes.push( 0xE0 | ( code_point >> 12 ) );
				bytes.push( 0x80 | ( ( code_point >> 6 ) & 0x3F ) );
				bytes.push( 0x80 | ( code_point & 0x3F ) );
			}
			else
			{
				bytes.push( 0xF0 | ( code_point >> 18 ) );
				bytes.push( 0x80 | ( ( code_point >> 12 ) & 0x3F ) );
				bytes.push( 0x80 | ( ( code_point >> 6 ) & 0x3F ) );
				bytes.push( 0x80 | ( code_point & 0x3F ) );
			}
		}

		return bytes;
	};


	//---------------------------------------------------------------------
	// The string those bytes spell, or a refusal when they do not spell one.
	//
	// ***This is what refuses a byte range which splits a character.*** $substrBytes slices the
	// byte array and asks for the string back, and a slice starting or ending inside a
	// multi-byte character is not a valid sequence, so the refusal falls out of the decoding
	// rather than needing a boundary check of its own.
	helper.FromBytes = function ( Bytes, OperatorName )
	{
		function invalid()
		{
			return new Error( `${OperatorName}: the byte range does not fall on character boundaries.` );
		}

		let text = '';
		let index = 0;

		while ( index < Bytes.length )
		{
			let byte = Bytes[ index ];
			let code_point = 0;
			let continuations = 0;

			if ( byte < 0x80 ) { code_point = byte; continuations = 0; }
			else if ( ( byte & 0xE0 ) === 0xC0 ) { code_point = byte & 0x1F; continuations = 1; }
			else if ( ( byte & 0xF0 ) === 0xE0 ) { code_point = byte & 0x0F; continuations = 2; }
			else if ( ( byte & 0xF8 ) === 0xF0 ) { code_point = byte & 0x07; continuations = 3; }
			else { throw invalid(); }

			if ( ( index + continuations ) >= Bytes.length ) { throw invalid(); }

			// ***This check cannot fire on a slice of ToBytes output, and is kept anyway.***
			// The bytes always come from ToBytes, which emits well formed UTF-8, and slicing
			// preserves adjacency: a lead byte is still followed by its own continuations. A
			// slice which begins inside a character is caught by the lead byte test above and
			// one which ends short by the length test, so the only way here is a caller which
			// built the array some other way. A decoder which trusts its input is a decoder
			// which returns nonsense when the invariant changes.
			for ( let step = 1; step <= continuations; step++ )
			{
				let continuation = Bytes[ index + step ];
				if ( ( continuation & 0xC0 ) !== 0x80 ) { throw invalid(); }
				code_point = ( code_point << 6 ) | ( continuation & 0x3F );
			}

			text += String.fromCodePoint( code_point );
			index += continuations + 1;
		}

		return text;
	};


	//---------------------------------------------------------------------
	// One implementation for $substr, $substrBytes, and $substrCP.
	//
	// Units is the array the operator counts in - bytes or code points - and Rejoin puts a
	// slice of it back together. A length below zero means "to the end" for the byte forms
	// and is refused by $substrCP before it gets here.
	helper.Substring = function ( Units, Start, Length, Rejoin )
	{
		if ( Start >= Units.length ) { return Rejoin( [] ); }

		let end = ( Length < 0 ) ? Units.length : ( Start + Length );
		if ( end > Units.length ) { end = Units.length; }

		return Rejoin( Units.slice( Start, end ) );
	};


	//---------------------------------------------------------------------
	// One implementation for $indexOfBytes and $indexOfCP.
	//
	// Units and Search are the haystack and the needle counted in the operator's own unit, so
	// the offset returned is in that unit too. The whole of a match must fall inside the
	// window, which is why End bounds the last start position rather than the search.
	helper.IndexOf = function ( Units, Search, Start, End )
	{
		let last = End - Search.length;

		for ( let index = Start; index <= last; index++ )
		{
			let found = true;
			for ( let step = 0; step < Search.length; step++ )
			{
				if ( Units[ index + step ] !== Search[ step ] ) { found = false; break; }
			}
			if ( found ) { return index; }
		}

		return -1;
	};


	//---------------------------------------------------------------------
	// One implementation for $trim, $ltrim, and $rtrim.
	helper.Trim = function ( Text, Characters, TrimLeft, TrimRight )
	{
		let set = ( Characters === null ) ? DEFAULT_TRIM_CHARACTERS : helper.CodePoints( Characters );
		let units = helper.CodePoints( Text );

		let start = 0;
		let end = units.length;

		if ( TrimLeft )
		{
			while ( ( start < end ) && ( set.indexOf( units[ start ] ) >= 0 ) ) { start++; }
		}
		if ( TrimRight )
		{
			while ( ( end > start ) && ( set.indexOf( units[ end - 1 ] ) >= 0 ) ) { end--; }
		}

		return units.slice( start, end ).join( '' );
	};


	//---------------------------------------------------------------------
	// The RegExp the three regex operators match with.
	//
	// The pattern is a string rather than a Javascript RegExp, which is how the same
	// expression means the same thing over the wire and in process. A RegExp is accepted too,
	// because a caller in process has one to hand and MongoDB's drivers send it as a pattern.
	helper.RegExpFrom = function ( Pattern, Options, OperatorName, Extra )
	{
		let pattern_type = jsongin.ShortType( Pattern );
		if ( 'sr'.includes( pattern_type ) === false )
		{
			throw new Error( `${OperatorName}: regex must be a pattern or a string but found a [${pattern_type}] instead.` );
		}

		if ( typeof Options !== 'undefined' )
		{
			let options_type = jsongin.ShortType( Options );
			if ( ( options_type !== 's' ) && ( options_type !== 'l' ) && ( options_type !== 'u' ) )
			{
				throw new Error( `${OperatorName}: options must be a string but found a [${options_type}] instead.` );
			}
		}

		let options = ( jsongin.ShortType( Options ) === 's' ) ? Options : '';

		try
		{
			// See src/RegExpOptions.js. The 'x' option is MongoDB's rather than Javascript's
			// and is applied to the pattern, which is why this does not call new RegExp here.
			return LIB_REGEXP_OPTIONS.Build( Pattern, options, Extra );
		}
		catch ( error )
		{
			throw new Error( `${OperatorName}: options [${options}] are not valid. ${error.message}` );
		}
	};


	//---------------------------------------------------------------------
	// The result document $regexFind and $regexFindAll report a match as.
	//
	// ***idx is counted in code points***, not in Javascript characters and not in bytes, so a
	// match after an accented letter reports the same offset it would in an ASCII string.
	// Verified against MongoDB 6.0.1.
	helper.MatchResult = function ( Text, Match )
	{
		let captures = [];
		for ( let index = 1; index < Match.length; index++ )
		{
			// A group which did not participate is a null rather than being left out.
			captures.push( ( typeof Match[ index ] === 'undefined' ) ? null : Match[ index ] );
		}

		return {
			match: Match[ 0 ],
			idx: helper.CodePoints( Text.substring( 0, Match.index ) ).length,
			captures: captures,
		};
	};


	//---------------------------------------------------------------------
	// Every match of a global pattern, as match results.
	//
	// A pattern which can match nothing - `x*` against 'ab' - would never advance on its own,
	// so lastIndex is pushed forward by hand when a match is empty.
	//
	// ***An empty match at the end of a non-empty string is dropped***, which is where MongoDB
	// and Javascript disagree: exec() in a loop finds one at position length and MongoDB does
	// not, so 'ab' against `x*` is two matches rather than three. The empty string is the
	// exception, because position 0 is both its start and its end and the match there is kept.
	// Verified against MongoDB 6.0.1; see 'Patterns Which Match Nothing' in the String
	// Operator Tests.
	helper.MatchAll = function ( Text, Pattern )
	{
		let results = [];
		let match = Pattern.exec( Text );

		while ( match !== null )
		{
			let empty_at_the_end = ( match[ 0 ].length === 0 ) && ( match.index === Text.length );
			if ( !empty_at_the_end || ( Text.length === 0 ) )
			{
				results.push( helper.MatchResult( Text, match ) );
			}

			if ( match[ 0 ].length === 0 ) { Pattern.lastIndex++; }
			match = Pattern.exec( Text );
		}

		return results;
	};


	//---------------------------------------------------------------------
	return helper;
};
