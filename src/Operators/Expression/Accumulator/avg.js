'use strict';
/*md

## Operators > Expression > $avg

Usage: `$avg: expression` or `$avg: [ expression1, expression2, ... ]`

Returns the average of the numeric values given to it.

***Non-numeric values are ignored***, including null and missing values, and they are left out
  of the divisor as well as the total. A `NaN` is a number and takes the result with it.
Returns `null` when nothing given to it is numeric, where [$sum](#$sum) answers `0`.

A single operand which is an array supplies the values, so `$avg: '$scores'` averages the
  numbers a field holds.

This is the expression operator. The accumulator of the same name averages a field across a
  group of documents, and follows the same rules about what it ignores.

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
				let values = expression_values.Operands( Document, Args, '$avg', Scope );

				return accumulator.Average( accumulator.OnlyNumbers( values ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$avg: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
