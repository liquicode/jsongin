'use strict';

// These functions are declared at module scope so that they can call each other directly.
// Reaching a sibling through `this` would tie them to being called as members of the exported
// object, and a detached reference (e.g. `const SearchReplace = jsongin.Text.SearchReplace`)
// would throw.


//---------------------------------------------------------------------
function Compare( TextA, TextB, CaseSensitive = true )
{
	if ( typeof TextA !== 'string' ) { throw new Error( 'The parameter [TextA] must be a string.' ); }
	if ( typeof TextB !== 'string' ) { throw new Error( 'The parameter [TextB] must be a string.' ); }
	if ( !CaseSensitive )
	{
		TextA = TextA.toLowerCase();
		TextB = TextB.toLowerCase();
	}
	return TextA.localeCompare( TextB );
}


//---------------------------------------------------------------------
function FindBetween( Text, StartText, EndText, CaseSensitive = true )
{
	if ( typeof Text !== 'string' ) { throw new Error( 'The parameter [Text] must be a string.' ); }
	if ( ( StartText === undefined ) || ( StartText === null ) ) { StartText = ''; }
	if ( typeof StartText !== 'string' ) { throw new Error( 'The parameter [StartText] must be a string or null.' ); }
	if ( ( EndText === undefined ) || ( EndText === null ) ) { EndText = ''; }
	if ( typeof EndText !== 'string' ) { throw new Error( 'The parameter [EndText] must be a string or null.' ); }

	let work_text = Text;
	if ( !CaseSensitive )
	{
		work_text = work_text.toLowerCase();
		StartText = StartText.toLowerCase();
		EndText = EndText.toLowerCase();
	}

	// Find StartText
	let start_text_begin = 0;
	if ( StartText.length ) { start_text_begin = work_text.indexOf( StartText ); }
	if ( start_text_begin < 0 ) { return null; }

	// Find EndText
	let end_text_begin = work_text.length;
	if ( EndText.length ) { end_text_begin = work_text.indexOf( EndText, start_text_begin + StartText.length ); }
	if ( end_text_begin < 0 ) { return null; }

	let found_text = Text.substring( start_text_begin + StartText.length, end_text_begin );
	return found_text;
}


//---------------------------------------------------------------------
function Matches( Text, Pattern, CaseSensitive = true )
{
	// Every other function in this module reports a bad parameter with a described error.
	// Without these, a non string Pattern surfaced as a raw TypeError from .replace().
	if ( typeof Text !== 'string' ) { throw new Error( 'The parameter [Text] must be a string.' ); }
	if ( typeof Pattern !== 'string' ) { throw new Error( 'The parameter [Pattern] must be a string.' ); }

	//FROM: https://stackoverflow.com/a/57527468
	let wildcard_exp = Pattern.replace( /[.+^${}()|[\]\\]/g, '\\$&' ); // regexp escape
	let regexp_flags = '';
	if ( !CaseSensitive ) { regexp_flags += 'i'; }
	let reg_exp = new RegExp( `^${wildcard_exp.replace( /\*/g, '.*' ).replace( /\?/g, '.' )}$`, regexp_flags );
	return reg_exp.test( Text );
}


//---------------------------------------------------------------------
// Escapes the characters which have a meaning inside a regular expression, so that a search
// string is matched as the literal text it is.
// Without this, searching for 'a.b' also matched 'axb', and searching for '(' threw a
// SyntaxError while the expression was being built.
function escape_regexp( Text )
{
	return Text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}


//---------------------------------------------------------------------
function SearchReplacements( Text, ReplacementMap, CaseSensitive = true )
{
	if ( typeof Text !== 'string' ) { throw new Error( 'The parameter [Text] must be a string.' ); }
	if ( ( ReplacementMap === undefined ) || ( ReplacementMap === null ) ) { return Text; }

	let keys = Object.keys( ReplacementMap );

	// An empty map has nothing to search for. An empty expression would otherwise match at
	// every position and replace each one with nothing.
	if ( keys.length === 0 ) { return Text; }

	let patterns = [];
	for ( let index = 0; index < keys.length; index++ )
	{
		patterns.push( escape_regexp( keys[ index ] ) );
	}

	if ( CaseSensitive )
	{
		let regex = new RegExp( patterns.join( '|' ), 'g' );
		return Text.replace( regex,
			function ( Matched )
			{
				return ReplacementMap[ Matched ];
			} );
	}

	// Matching without regard to case means the matched text is not necessarily one of the
	// keys, so the replacements are looked up under a lowercased key.
	let replacements = {};
	for ( let index = 0; index < keys.length; index++ )
	{
		replacements[ keys[ index ].toLowerCase() ] = ReplacementMap[ keys[ index ] ];
	}

	let regex = new RegExp( patterns.join( '|' ), 'gi' );
	return Text.replace( regex,
		function ( Matched )
		{
			return replacements[ Matched.toLowerCase() ];
		} );
}


//---------------------------------------------------------------------
function SearchReplace( Text, Search, Replace, CaseSensitive = true )
{
	if ( typeof Search !== 'string' ) { throw new Error( 'The parameter [Search] must be a string.' ); }
	let replacements = {};
	replacements[ Search ] = Replace;
	return SearchReplacements( Text, replacements, CaseSensitive );
}


//---------------------------------------------------------------------
module.exports = {

	Compare: Compare,
	FindBetween: FindBetween,
	Matches: Matches,
	SearchReplacements: SearchReplacements,
	SearchReplace: SearchReplace,

};
