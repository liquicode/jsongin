'use strict';

/*
	Small helpers the JSON Schema keywords share: what JSON type a value has, when two values
	are the same JSON value, and the string and pointer rules the specification writes in terms
	of code points and escapes.

	***The instance model.*** JSON Schema speaks about six JSON types. A jsongin document may
	also hold a Date, a RegExp or an undefined, which JSON has no form for, and those three are
	given a form here rather than refused:

		undefined   is absent. A field holding one is not a property, and an element holding
		            one is read as null, which is what JSON.stringify does to both.
		Date        is a string, its ISO form, so `type: 'string'` and `format: 'date-time'`
		            both describe it. The MongoDB dialect sees it as `bsonType: 'date'` instead.
		RegExp      is a string, its source, for want of any JSON form at all.

	This is jsongin's own answer and is unit tested as such; the specification has no opinion.
*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The JSON type of a value, by the specification's names. `integer` is never answered
	// here: a number is a number, and the type keyword asks Number.isInteger itself, so that
	// `1.0` is an integer the way the specification says it is.
	function JsonType( Value )
	{
		let short_type = jsongin.ShortType( Value );
		switch ( short_type )
		{
			case 'l': return 'null';
			case 'u': return 'null';
			case 'b': return 'boolean';
			case 'n': return 'number';
			case 's': return 'string';
			case 'd': return 'string';
			case 'r': return 'string';
			case 'a': return 'array';
			case 'o': return 'object';
		}
		throw new Error( `A value of type [${short_type}] has no JSON type.` );
	}


	//---------------------------------------------------------------------
	// The string a value stands for, where the instance model reads it as one.
	function AsString( Value )
	{
		let short_type = jsongin.ShortType( Value );
		if ( short_type === 'd' ) { return Value.toISOString(); }
		if ( short_type === 'r' ) { return Value.source; }
		return Value;
	}


	//---------------------------------------------------------------------
	// Whether two values are the same JSON value: objects by their members in any order, arrays
	// by their elements in order, numbers by value so that 1 and 1.0 agree, everything else by
	// identity of value. This is deliberately not StrictEquals, which orders object keys.
	function JsonEquals( A, B )
	{
		let type_a = JsonType( A );
		let type_b = JsonType( B );
		if ( type_a !== type_b ) { return false; }
		switch ( type_a )
		{
			case 'null':
				return true;
			case 'boolean':
			case 'number':
				return ( A === B );
			case 'string':
				return ( AsString( A ) === AsString( B ) );
			case 'array':
				if ( A.length !== B.length ) { return false; }
				for ( let index = 0; index < A.length; index++ )
				{
					if ( JsonEquals( A[ index ], B[ index ] ) === false ) { return false; }
				}
				return true;
			case 'object':
				{
					let keys_a = PropertyNames( A );
					let keys_b = PropertyNames( B );
					if ( keys_a.length !== keys_b.length ) { return false; }
					for ( let index = 0; index < keys_a.length; index++ )
					{
						let key = keys_a[ index ];
						if ( Object.prototype.hasOwnProperty.call( B, key ) === false ) { return false; }
						if ( typeof B[ key ] === 'undefined' ) { return false; }
						if ( JsonEquals( A[ key ], B[ key ] ) === false ) { return false; }
					}
					return true;
				}
		}
		return false;
	}


	//---------------------------------------------------------------------
	// The property names of an object as JSON sees them: own, and not holding undefined.
	function PropertyNames( Object_ )
	{
		let names = Object.keys( Object_ );
		let present = [];
		for ( let index = 0; index < names.length; index++ )
		{
			if ( typeof Object_[ names[ index ] ] !== 'undefined' ) { present.push( names[ index ] ); }
		}
		return present;
	}


	//---------------------------------------------------------------------
	// The length of a string in code points, which is what minLength and maxLength count. A
	// character outside the basic plane is two UTF-16 units and one code point.
	function CodePointLength( Text )
	{
		let length = 0;
		for ( const _character of Text ) { length++; }
		return length;
	}


	//---------------------------------------------------------------------
	// Escapes one JSON Pointer segment: `~` becomes `~0` and `/` becomes `~1`, in that order.
	function EscapePointerSegment( Segment )
	{
		return String( Segment ).replace( /~/g, '~0' ).replace( /\//g, '~1' );
	}


	//---------------------------------------------------------------------
	// Unescapes one JSON Pointer segment, in the reverse order.
	function UnescapePointerSegment( Segment )
	{
		return Segment.replace( /~1/g, '/' ).replace( /~0/g, '~' );
	}


	//---------------------------------------------------------------------
	// Joins segments into a JSON Pointer. No segments is the empty pointer, the whole document.
	function JoinPointer( Segments )
	{
		let pointer = '';
		for ( let index = 0; index < Segments.length; index++ )
		{
			pointer += '/' + EscapePointerSegment( Segments[ index ] );
		}
		return pointer;
	}


	//---------------------------------------------------------------------
	// Splits a JSON Pointer into its unescaped segments, or throws when it is not a pointer.
	function SplitPointer( Pointer )
	{
		if ( Pointer === '' ) { return []; }
		if ( Pointer.startsWith( '/' ) === false ) { throw new Error( `[${Pointer}] is not a JSON Pointer.` ); }
		let parts = Pointer.substring( 1 ).split( '/' );
		let segments = [];
		for ( let index = 0; index < parts.length; index++ )
		{
			segments.push( UnescapePointerSegment( parts[ index ] ) );
		}
		return segments;
	}


	//---------------------------------------------------------------------
	// Compiles a pattern the way the specification reads one: an ECMA 262 regular expression,
	// unanchored, with Unicode semantics where the pattern allows them. A pattern which the `u`
	// flag refuses - an escape it calls unnecessary, say - is compiled without it rather than
	// refused, so a schema written for an older engine still means what it meant.
	let PATTERN_CACHE = {};
	function CompilePattern( Pattern )
	{
		if ( Object.prototype.hasOwnProperty.call( PATTERN_CACHE, Pattern ) ) { return PATTERN_CACHE[ Pattern ]; }
		let expression = null;
		try
		{
			expression = new RegExp( Pattern, 'u' );
		}
		catch ( error )
		{
			expression = new RegExp( Pattern );
		}
		PATTERN_CACHE[ Pattern ] = expression;
		return expression;
	}


	//---------------------------------------------------------------------
	return {
		JsonType: JsonType,
		AsString: AsString,
		JsonEquals: JsonEquals,
		PropertyNames: PropertyNames,
		CodePointLength: CodePointLength,
		EscapePointerSegment: EscapePointerSegment,
		UnescapePointerSegment: UnescapePointerSegment,
		JoinPointer: JoinPointer,
		SplitPointer: SplitPointer,
		CompilePattern: CompilePattern,
	};
};
