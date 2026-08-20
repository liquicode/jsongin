'use strict';
/*md

## Operators > Accumulator > $maxN

Usage: `$maxN: { input: expression, n: count }`

Returns the `n` largest values of a group, in ***descending*** order.

***The largest value comes first***, which is the mirror of [$minN](#$minN) rather than a
  sorted list of the same values: `$minN` counts up from the smallest and `$maxN` counts down
  from the largest, so the first element of either is the most extreme one.

***This is comparative and not positional***, so the order the group arrived in does not
  matter, and a null or missing value is left out rather than reported.

A group with fewer than `n` comparable values in it answers all of them.

***There is also an expression operator called `$maxN`***, which takes the largest elements of
  an array. See [Expression Operators](./Expression-Operators.md#$maxN).

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let read = accumulator.ReadN( Documents, Args, '$maxN' );

				let sorted = accumulator.ComparableValues( read.Values );
				sorted.reverse();
				return sorted.slice( 0, read.N );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$maxN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
