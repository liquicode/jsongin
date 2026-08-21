'use strict';
/*md

## Operators > Stage > $densify

Usage: `$densify: { field: 'name', partitionByFields: [ 'field', ... ], range: { step: number, unit: string, bounds: 'full' | 'partition' | [ lower, upper ] } }`

Adds documents to close the gaps in a sequence, so that the values of `field` step evenly.

***An added document holds the field and its partition, and nothing else.*** It stands for a
  point in the sequence which had no data, not for a document which was lost.

***Densifying only ever adds.*** A document whose value does not sit on the series is kept where
  it is rather than moved or removed, so a step which skips over existing values leaves them
  alone.

`bounds` says how far the series runs:

| **Written** | **Runs from** |
|-------------|----------------|
| `'full'` | the smallest value in the whole stream to the largest |
| `'partition'` | the smallest to the largest ***within each partition*** |
| `[ lower, upper ]` | the values given, with `upper` excluded |

***A date field needs a `unit`***, since a step of `1` says nothing on its own, and a numeric
  field must not have one.

*/

module.exports = function ( jsongin )
{

	const stage = require( './_stage' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				let plan = stage.ReadDensifyPlan( Args, Scope );

				let partitions = stage.Partitions( Documents, null, plan.PartitionFields, '$densify', Scope );

				// 'full' measures the range across everything, so it is found once rather than
				// once per partition.
				let full = null;
				if ( plan.Bounds === 'full' ) { full = stage.SeriesRange( Documents, plan.Field, '$densify' ); }

				let results = [];
				for ( let index = 0; index < partitions.length; index++ )
				{
					results = results.concat(
						stage.DensifyPartition( partitions[ index ], plan, full, '$densify', Scope ) );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$densify: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
