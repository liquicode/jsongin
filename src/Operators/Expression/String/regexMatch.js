'use strict';
/*md

## Operators > Expression > $regexMatch

Usage: `$regexMatch: { input: expression, regex: pattern, options: flags }`

Whether a pattern matches a string.

`regex` is a pattern ***string*** rather than a Javascript `RegExp`, so that the same
  expression means the same thing in process and over the wire. A `RegExp` is accepted too.
`options` accepts the MongoDB flags `i`, `m`, `s`, and `x`.

***A null or missing input is `false`***, not null: this operator answers a question which
  has a false answer even when there is nothing to match.

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
				let values = string.Arguments( Document, Args, '$regexMatch', [ 'input', 'regex' ], [ 'options' ], Scope );

				// A missing input is false rather than null. This operator answers a question
				// which still has a false answer when there is nothing to match.
				if ( string.IsNullish( values.input ) ) { return false; }

				let text = string.AsRequiredString( values.input, '$regexMatch' );
				let pattern = string.RegExpFrom( values.regex, values.options, '$regexMatch', '' );

				return pattern.test( text );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$regexMatch: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
