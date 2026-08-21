'use strict';
/*md

## Operators > Accumulator > $topN

Usage: `$topN: { n: count, sortBy: specification, output: expression }`

Sorts the documents of a group by `sortBy` and returns the `output` expression of the first
  `n` of them, in that sort order.

***This carries its own sort***, so unlike [$firstN](#$firstN) it does not depend on a `$sort`
  earlier in the pipeline, and unlike [$maxN](#$maxN) it can sort by one field and answer with
  another. See [$top](#$top), which is the same operator taking one value.

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
				let read = accumulator.ReadRanked( Documents, Args, '$topN', true, Scope );

				return read.Outputs.slice( 0, read.N );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$topN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
