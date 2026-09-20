'use strict';
/*md

## Operators > Expression > $stdDevPop

Usage: `$stdDevPop: expression` or `$stdDevPop: [ expression1, expression2, ... ]`

Returns the population standard deviation of the numeric values given to it.

***Population, not sample***: the squared deviations are divided by the count. Use
  [$stdDevSamp](#$stdDevSamp) when the values are a sample of something larger.

***Non-numeric values are ignored***, including null and missing values.
Returns `0` for a single value - one value is a population with no spread - and `null` when
  nothing given to it is numeric.

A single operand which is an array supplies the values.

This is the expression operator. The accumulator of the same name reads a field across a group
  of documents, and answers the same way.

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
				let values = expression_values.Operands( Document, Args, '$stdDevPop', Scope );
				let numbers = accumulator.OnlyNumbers( values );
				if ( numbers.length === 0 ) { return null; }

				return accumulator.StandardDeviation( numbers, numbers.length );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$stdDevPop: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
