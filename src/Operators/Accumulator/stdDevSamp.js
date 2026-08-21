'use strict';
/*md

## Operators > Accumulator > $stdDevSamp

Usage: `$stdDevSamp: expression`

Returns the sample standard deviation of the numeric values in a group.

***Sample, not population***: the squared deviations are divided by one less than the count.
  Use [$stdDevPop](#$stdDevPop) when the group is the whole population.

***A single value answers `null`*** rather than `0`, where [$stdDevPop](#$stdDevPop) answers
  `0`. That follows from the divisor: a population of one has no spread, and a sample of one
  cannot say what the spread is.

***Non-numeric values are ignored***, including null and missing values.
Returns `null` for a group in which nothing is numeric.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let numbers = accumulator.NumericValues( Documents, Args, Scope );
				if ( numbers.length < 2 ) { return null; }

				return accumulator.StandardDeviation( numbers, numbers.length - 1 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$stdDevSamp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
