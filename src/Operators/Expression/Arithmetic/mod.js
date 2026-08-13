'use strict';
/*md

## Operators > Expression > $mod

Usage: `$mod: [ expression1, expression2 ]`

Divides the first operand by the second and returns the remainder.
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
		ArgTypes: 'a',
		ArgCount: 2,

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$mod', 2, 2 );

				let number_a = arithmetic.AsOperandNumber( operands[ 0 ], '$mod' );
				let number_b = arithmetic.AsOperandNumber( operands[ 1 ], '$mod' );
				if ( ( number_a === null ) || ( number_b === null ) ) { return null; }
				if ( number_b === 0 ) { throw new Error( `$mod: cannot divide by zero.` ); }

				return ( number_a % number_b );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$mod: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
