'use strict';
/*md

## Operators > Expression > $trim

Usage: `$trim: { input: expression, chars: expression }`

Removes characters from both ends of a string.

`chars` is a ***set*** of characters, each of which is removed in any order, rather than
  a sequence to match. Without it, whitespace is removed.
A null `input` or a null `chars` gives null.

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
				let values = string.Arguments( Document, Args, '$trim', [ 'input' ], [ 'chars' ] );

				let text = string.AsStringOrNull( values.input, '$trim' );
				if ( text === null ) { return null; }

				// A null chars is a null result rather than a fall back to whitespace, which is
				// what MongoDB does and is measured in the String Operator Tests.
				let characters = null;
				if ( typeof values.chars !== 'undefined' )
				{
					characters = string.AsStringOrNull( values.chars, '$trim' );
					if ( characters === null ) { return null; }
				}

				return string.Trim( text, characters, true, true );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$trim: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
