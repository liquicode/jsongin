'use strict';
/*md

## Operators > Expression > $abs

Usage: `$abs: expression`

Returns the absolute value of a number.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

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
				let operands = arithmetic.Operands( Document, Args, '$abs', 1, 1, Scope );

				let number = arithmetic.AsOperandNumber( operands[ 0 ], '$abs' );
				if ( number === null ) { return null; }

				return Math.abs( number );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$abs: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
