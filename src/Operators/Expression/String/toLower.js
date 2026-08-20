'use strict';
/*md

## Operators > Expression > $toLower

Usage: `$toLower: expression`

Lowercases a string.

***A null or missing operand is an empty string here***, not a null result, and a number
  is rendered rather than refused. This operator predates MongoDB 3.4 and carries the
  coercion the newer string operators do not.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = string.Operands( Document, Args, '$toLower', 1, 1 );

				// Null is an empty string here rather than a null result. See _string.js.
				let text = string.AsStringOrEmpty( operands[ 0 ], '$toLower' );

				return text.toLowerCase();
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toLower: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
