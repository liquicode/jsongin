'use strict';
/*md

## Operators > Expression > $ceil

Usage: `$ceil: expression`

Returns the smallest integer greater than or equal to a number.

A `null` or ***missing*** operand gives `null`.
An operand which is present but is not a number is an error.

*/

module.exports = function ( jsongin )
{

	const rounding = require( './_rounding' )( jsongin );

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
				return rounding.Apply( Document, Args, '$ceil', Math.ceil, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ceil: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
