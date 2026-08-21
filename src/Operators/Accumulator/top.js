'use strict';
/*md

## Operators > Accumulator > $top

Usage: `$top: { sortBy: specification, output: expression }`

Sorts the documents of a group by `sortBy` and returns the `output` expression of the first one.

***This carries its own sort***, so unlike [$first](#$first) it does not depend on a `$sort`
  earlier in the pipeline, and unlike [$max](#$max) it can ***sort by one field and answer with
  another***. That is the whole reason it exists.

`sortBy` names fields and gives each a direction of `1` or `-1`.
`output` is any expression, so it may gather several fields: `output: [ '$k', '$n' ]`.

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
				let read = accumulator.ReadRanked( Documents, Args, '$top', false, Scope );

				return read.Outputs[ 0 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$top: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
