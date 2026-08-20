'use strict';
/*md

## Operators > Accumulator > $bottom

Usage: `$bottom: { sortBy: specification, output: expression }`

Sorts the documents of a group by `sortBy` and returns the `output` expression of the last one.

***The sort is not reversed*** — this reads the far end of the same order [$top](#$top) reads
  the near end of, so `$top` and `$bottom` with the same `sortBy` answer opposite documents.

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
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let read = accumulator.ReadRanked( Documents, Args, '$bottom', false );

				return read.Outputs[ read.Outputs.length - 1 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$bottom: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
