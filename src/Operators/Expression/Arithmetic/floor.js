'use strict';
/*md

## Operators > Expression > $floor

Usage: `$floor: expression`

Returns the largest integer less than or equal to a number.

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
				return rounding.Apply( Document, Args, '$floor', Math.floor, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$floor: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
