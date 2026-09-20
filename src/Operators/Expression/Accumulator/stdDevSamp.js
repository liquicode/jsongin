'use strict';
/*md

## Operators > Expression > $stdDevSamp

Usage: `$stdDevSamp: expression` or `$stdDevSamp: [ expression1, expression2, ... ]`

Returns the sample standard deviation of the numeric values given to it.

***Sample, not population***: the squared deviations are divided by one less than the count.
  Use [$stdDevPop](#$stdDevPop) when the values are the whole population.

***Fewer than two values answer `null`***, where [$stdDevPop](#$stdDevPop) answers `0` for a
  single value. That follows from the divisor: a sample of one cannot say what the spread is.

***Non-numeric values are ignored***, including null and missing values.

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
				let values = expression_values.Operands( Document, Args, '$stdDevSamp', Scope );
				let numbers = accumulator.OnlyNumbers( values );
				if ( numbers.length < 2 ) { return null; }

				return accumulator.StandardDeviation( numbers, numbers.length - 1 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$stdDevSamp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
