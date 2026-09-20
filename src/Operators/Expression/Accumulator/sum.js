'use strict';
/*md

## Operators > Expression > $sum

Usage: `$sum: expression` or `$sum: [ expression1, expression2, ... ]`

Returns the sum of the numeric values given to it.

***Non-numeric values are ignored***, including null and missing values. A `NaN` is a number
  and is not ignored - it takes the total with it.
***Returns `0` when there is nothing to add***, which is where this operator differs from the
  rest of its family: `$avg` and the two standard deviations answer `null` for the same input.

A single operand which is an array supplies the values, so `$sum: '$scores'` adds the numbers
  a field holds.

This is the expression operator. The accumulator of the same name adds a field across a group
  of documents, and follows the same rules about what it ignores.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( '../../Accumulator/_accumulator' )( jsongin );
	const expression_values = require( './_expression-values' )( jsongin );

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
				let values = expression_values.Operands( Document, Args, '$sum', Scope );

				return accumulator.Total( accumulator.OnlyNumbers( values ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$sum: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
