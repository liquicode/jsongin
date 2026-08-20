'use strict';
/*md

## Operators > Expression > $regexFind

Usage: `$regexFind: { input: expression, regex: pattern, options: flags }`

The first match of a pattern, as `{ match, idx, captures }`, or null when there is none.

***`idx` is counted in code points***, not in bytes, so a match after an accented letter
  reports the offset a reader would give.
A capture group which did not participate is a `null` in `captures` rather than being
  left out.

*/

module.exports = function ( jsongin )
{

	const string = require( './_string' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let values = string.Arguments( Document, Args, '$regexFind', [ 'input', 'regex' ], [ 'options' ] );

				// A missing input is null here and an empty array in $regexFindAll.
				if ( string.IsNullish( values.input ) ) { return null; }

				let text = string.AsRequiredString( values.input, '$regexFind' );
				let pattern = string.RegExpFrom( values.regex, values.options, '$regexFind', '' );

				let match = pattern.exec( text );
				// No match is a null rather than an empty result document.
				if ( match === null ) { return null; }

				return string.MatchResult( text, match );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$regexFind: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
