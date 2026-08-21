'use strict';
/*md

## Operators > Accumulator > $lastN

Usage: `$lastN: { input: expression, n: count }`

Returns the last `n` values of a group, in the order the group arrived in.

***The values stay in group order***, so the last of them is last in the result rather than
  first.

***This is positional and not comparative***, so what it answers depends on a `$sort` earlier
  in the pipeline, and a missing value is reported as a null rather than being left out. See
  [$firstN](#$firstN) for the same rules from the other end.

A group with fewer than `n` values in it answers all of them.

***There is also an expression operator called `$lastN`***, which takes the last elements of
  an array. See [Expression Operators](./Expression-Operators.md#$lastN).

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
				let read = accumulator.ReadN( Documents, Args, '$lastN', Scope );

				let taken = read.Values.slice( Math.max( read.Values.length - read.N, 0 ) );
				return accumulator.AsReportedValues( taken );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$lastN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
