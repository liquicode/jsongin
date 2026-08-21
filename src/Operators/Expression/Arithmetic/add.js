'use strict';
/*md

## Operators > Expression > $add

Usage: `$add: [ expression1, expression2, ... ]`

Adds numbers together.
If one of the operands is a date, then the other operands are treated as a number of
  milliseconds and a date is returned.

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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$add', 1, null, Scope );

				let date_operand = null;
				let has_null = false;
				let sum = 0;
				for ( let index = 0; index < operands.length; index++ )
				{
					let date = arithmetic.AsOperandDate( operands[ index ] );
					if ( date !== null )
					{
						if ( date_operand !== null ) { throw new Error( `$add: only one date operand is allowed.` ); }
						date_operand = date;
						continue;
					}
					let number = arithmetic.AsOperandNumber( operands[ index ], '$add' );
					if ( number === null )
					{
						// Continue in order to validate the remaining operands.
						has_null = true;
						continue;
					}
					sum += number;
				}

				if ( has_null ) { return null; }
				if ( date_operand !== null ) { return new Date( date_operand.getTime() + sum ); }
				return sum;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$add: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
