'use strict';

/*
	Builds a RegExp from a MongoDB pattern and its option flags.

	MongoDB's flags are not quite Javascript's. `i`, `m`, and `s` mean the same thing in both,
	but `x` - extended mode, where whitespace and `#` comments in the pattern are ignored - has
	no Javascript counterpart, so it is applied to the pattern text and then dropped from the
	flags.

	Two callers need this and they are far apart: the query operator `$regex` with its sibling
	`$options`, and the expression operators `$regexMatch`, `$regexFind`, and `$regexFindAll`
	with their `options` field. Extended mode is a small parser rather than a flag to pass
	along, so it lives here once instead of in both.

	This is a private helper. It is not attached to the engine and is not part of the public
	surface: `jsongin.Text` is where user facing text helpers live.
*/


//---------------------------------------------------------------------
// Removes what extended mode ignores: unescaped whitespace, and `#` comments to end of line.
//
// Whitespace inside a character class is literal even in extended mode, and an escape carries
// its next character through untouched, so both are tracked rather than stripped blindly.
function StripExtendedPattern( Source )
{
	let stripped = '';
	let in_character_class = false;

	for ( let index = 0; index < Source.length; index++ )
	{
		let character = Source[ index ];

		if ( character === '\\' )
		{
			// An escape carries its next character through untouched, whatever it is.
			stripped += character;
			index++;
			if ( index < Source.length ) { stripped += Source[ index ]; }
			continue;
		}

		if ( in_character_class )
		{
			if ( character === ']' ) { in_character_class = false; }
			stripped += character;
			continue;
		}

		if ( character === '[' )
		{
			in_character_class = true;
			stripped += character;
			continue;
		}

		if ( character === '#' )
		{
			// A comment runs to the end of the line.
			while ( ( index < Source.length ) && ( Source[ index ] !== '\n' ) ) { index++; }
			continue;
		}

		if ( /\s/.test( character ) ) { continue; }

		stripped += character;
	}

	return stripped;
}


//---------------------------------------------------------------------
// Builds the RegExp, or throws when the flags are not usable.
//
// Source may be a pattern string or a RegExp, whose own source is taken. Extra is folded in
// on top of the flags given, which is how a caller asks for `g` without the caller's own
// options having to mention it.
function Build( Source, Options = '', Extra = '' )
{
	let pattern = Source;
	if ( pattern instanceof RegExp ) { pattern = pattern.source; }

	// Both callers establish that Options is a string before calling: Query.js refuses a
	// $options which is not one, and _string.js RegExpFrom does the same for the options
	// field. The default covers the one being left out rather than a wrong type.
	let flags = Options;

	// 'x' is MongoDB's, not Javascript's, so it is applied to the pattern and then removed
	// from the flags. The remaining flags are passed along as they are.
	if ( flags.includes( 'x' ) )
	{
		pattern = StripExtendedPattern( pattern );
		flags = flags.split( 'x' ).join( '' );
	}

	for ( let index = 0; index < Extra.length; index++ )
	{
		if ( !flags.includes( Extra[ index ] ) ) { flags += Extra[ index ]; }
	}

	// An unknown flag letter, or one given twice, throws here. The caller decides what to
	// say about it, because the wording belongs to the operator rather than to this helper.
	return new RegExp( pattern, flags );
}


//---------------------------------------------------------------------
module.exports = {

	StripExtendedPattern: StripExtendedPattern,
	Build: Build,

};
