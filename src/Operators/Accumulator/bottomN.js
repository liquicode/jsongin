'use strict';
/*md

## Operators > Accumulator > $bottomN

Usage: `$bottomN: { n: count, sortBy: specification, output: expression }`

Sorts the documents of a group by `sortBy` and returns the `output` expression of the last
  `n` of them, ***in that sort order*** rather than reversed.

So `$bottomN` with `n: 2` over a descending sort answers the two smallest values, smaller one
  last. See [$bottom](#$bottom), which is the same operator taking one value.

A group with fewer than `n` documents in it answers all of them.

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
				let read = accumulator.ReadRanked( Documents, Args, '$bottomN', true, Scope );

				return read.Outputs.slice( Math.max( read.Outputs.length - read.N, 0 ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$bottomN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
