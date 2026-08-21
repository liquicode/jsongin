'use strict';
/*md

## Operators > Expression > $ltrim

Usage: `$ltrim: { input: expression, chars: expression }`

Removes characters from the left end of a string. See [$trim](#$trim).

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
				let values = string.Arguments( Document, Args, '$ltrim', [ 'input' ], [ 'chars' ], Scope );

				let text = string.AsStringOrNull( values.input, '$ltrim' );
				if ( text === null ) { return null; }

				// A null chars is a null result rather than a fall back to whitespace, which is
				// what MongoDB does and is measured in the String Operator Tests.
				let characters = null;
				if ( typeof values.chars !== 'undefined' )
				{
					characters = string.AsStringOrNull( values.chars, '$ltrim' );
					if ( characters === null ) { return null; }
				}

				return string.Trim( text, characters, true, false );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ltrim: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
