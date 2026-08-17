'use strict';
/*md

## Operators > Expression > $subtract

Usage: `$subtract: [ expression1, expression2 ]`

Subtracts the second operand from the first.
Subtracting two dates returns the number of milliseconds between them.
Subtracting a number from a date returns a date.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// A single argument may be given without the enclosing array, so any expression type.
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$subtract', 2, 2 );

				let date_a = arithmetic.AsOperandDate( operands[ 0 ] );
				let date_b = arithmetic.AsOperandDate( operands[ 1 ] );

				// Subtract two dates.
				if ( ( date_a !== null ) && ( date_b !== null ) )
				{
					return ( date_a.getTime() - date_b.getTime() );
				}

				// Subtract a number of milliseconds from a date.
				if ( date_a !== null )
				{
					let number_b = arithmetic.AsOperandNumber( operands[ 1 ], '$subtract' );
					if ( number_b === null ) { return null; }
					return new Date( date_a.getTime() - number_b );
				}

				// A date cannot be subtracted from a number.
				if ( date_b !== null )
				{
					throw new Error( `$subtract: cannot subtract a date from a number.` );
				}

				// Subtract two numbers.
				let number_a = arithmetic.AsOperandNumber( operands[ 0 ], '$subtract' );
				let number_b = arithmetic.AsOperandNumber( operands[ 1 ], '$subtract' );
				if ( ( number_a === null ) || ( number_b === null ) ) { return null; }
				return ( number_a - number_b );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$subtract: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
