'use strict';
/*md

## Operators > Accumulator > $stdDevPop

Usage: `$stdDevPop: expression`

Returns the population standard deviation of the numeric values in a group.

***Population, not sample***: the squared deviations are divided by the count. Use
  [$stdDevSamp](#$stdDevSamp) when the group is a sample of something larger.

***Non-numeric values are ignored***, including null and missing values, the same rule
  `$sum` and `$avg` follow.
Returns `null` for a group in which nothing is numeric, and `0` for a single value — one
  value is a population with no spread.

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
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let numbers = accumulator.NumericValues( Documents, Args );
				if ( numbers.length === 0 ) { return null; }

				return accumulator.StandardDeviation( numbers, numbers.length );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$stdDevPop: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
