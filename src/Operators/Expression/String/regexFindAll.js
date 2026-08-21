'use strict';
/*md

## Operators > Expression > $regexFindAll

Usage: `$regexFindAll: { input: expression, regex: pattern, options: flags }`

Every match of a pattern, as an array of `{ match, idx, captures }`.

***No match is an empty array***, where [$regexFind](#$regexFind) gives null for the same
  input. The two disagree on purpose, and so does MongoDB.

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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let values = string.Arguments( Document, Args, '$regexFindAll', [ 'input', 'regex' ], [ 'options' ], Scope );

				// A missing input is an empty array here and a null in $regexFind.
				if ( string.IsNullish( values.input ) ) { return []; }

				let text = string.AsRequiredString( values.input, '$regexFindAll' );
				let pattern = string.RegExpFrom( values.regex, values.options, '$regexFindAll', 'g' );

				return string.MatchAll( text, pattern );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$regexFindAll: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
