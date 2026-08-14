'use strict';
/*md

## Operators > Expression > $divide

Usage: `$divide: [ expression1, expression2 ]`

Divides the first operand by the second.
Dividing by zero throws an error.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Arithmetic',
		// A single argument may be given without the enclosing array, so any expression type.
		ArgTypes: 'bnsdloaru',
		ArgCount: 2,

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$divide', 2, 2 );

				let number_a = arithmetic.AsOperandNumber( operands[ 0 ], '$divide' );
				let number_b = arithmetic.AsOperandNumber( operands[ 1 ], '$divide' );
				if ( ( number_a === null ) || ( number_b === null ) ) { return null; }
				if ( number_b === 0 ) { throw new Error( `$divide: cannot divide by zero.` ); }

				return ( number_a / number_b );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$divide: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
