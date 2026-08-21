'use strict';
/*md

## Operators > Expression > $toUpper

Usage: `$toUpper: expression`

Uppercases a string.

***A null or missing operand is an empty string here***, not a null result, and a number
  is rendered rather than refused. See [$toLower](#$toLower).

*/

module.exports = function ( jsongin )
{

	const string = require( './_string' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = string.Operands( Document, Args, '$toUpper', 1, 1, Scope );

				// Null is an empty string here rather than a null result. See _string.js.
				let text = string.AsStringOrEmpty( operands[ 0 ], '$toUpper' );

				return text.toUpperCase();
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toUpper: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
