'use strict';
/*md

## Operators > Accumulator > $minN

Usage: `$minN: { input: expression, n: count }`

Returns the `n` smallest values of a group, in ascending order.

***This is comparative and not positional***, so the order the group arrived in does not
  matter, and ***a null or missing value is left out*** rather than reported — there is nothing
  to compare it with. [$firstN](#$firstN) does the opposite on both counts.

Values are compared the way [$min](#$min) and `Sort()` compare, so values of different types
  order by BSON type.
A group with fewer than `n` comparable values in it answers all of them.

***There is also an expression operator called `$minN`***, which takes the smallest elements
  of an array. See [Expression Operators](./Expression-Operators.md#$minN).

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
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let read = accumulator.ReadN( Documents, Args, '$minN', Scope );

				let sorted = accumulator.ComparableValues( read.Values );
				return sorted.slice( 0, read.N );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$minN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
