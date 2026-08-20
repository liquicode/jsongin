'use strict';
/*md

## Operators > Expression > $rtrim

Usage: `$rtrim: { input: expression, chars: expression }`

Removes characters from the right end of a string. See [$trim](#$trim).

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
				let values = string.Arguments( Document, Args, '$rtrim', [ 'input' ], [ 'chars' ] );

				let text = string.AsStringOrNull( values.input, '$rtrim' );
				if ( text === null ) { return null; }

				// A null chars is a null result rather than a fall back to whitespace, which is
				// what MongoDB does and is measured in the String Operator Tests.
				let characters = null;
				if ( typeof values.chars !== 'undefined' )
				{
					characters = string.AsStringOrNull( values.chars, '$rtrim' );
					if ( characters === null ) { return null; }
				}

				return string.Trim( text, characters, false, true );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$rtrim: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
