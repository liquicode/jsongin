'use strict';
/*md

## Operators > Stage > $fill

Usage: `$fill: { partitionBy: expression, partitionByFields: [ 'field', ... ], sortBy: { field: 1 | -1 }, output: { field: { value: expression } | { method: 'locf' | 'linear' } } }`

Supplies a value for a field which has none.

***A null counts as having none***, which is unusual: almost everywhere else in this engine a
  null is a value and only a missing field is absent. `$fill` replaces both.

The three ways to fill a field:

| **Written** | **Fills with** |
|-------------|-----------------|
| `{ value: expression }` | the expression, evaluated against the document being filled |
| `{ method: 'locf' }` | the ***l***ast ***o***bserved ***c***arried ***f***orward — the previous value in order |
| `{ method: 'linear' }` | a value interpolated between the ones on either side, along the `sortBy` field |

***An output field naming neither fills nothing***, and is accepted. Naming ***both*** is
  refused, since they are two answers to the same question.

`sortBy` gives the order the methods work along. Without one they use the order the documents
  reached the stage in. `partitionBy` or `partitionByFields` splits the documents into separate
  series, so nothing carries from one to the next; `partitionBy` takes a document rather than a
  path, so a bare `'$k'` is refused and `{ k: '$k' }` is the way to write it.

***`linear` needs a number on both sides.*** A document before the first known value or after
  the last is left alone, since there is nothing to interpolate between.

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
				let plan = stage.ReadFillPlan( Args );

				let partitions = stage.Partitions( Documents, plan.PartitionBy, plan.PartitionFields, '$fill', Scope );

				let filled = [];
				for ( let index = 0; index < partitions.length; index++ )
				{
					let series = partitions[ index ].Documents.slice();
					if ( plan.SortBy !== null ) { series = jsongin.Sort( series, plan.SortBy ); }

					let results = [];
					for ( let position = 0; position < series.length; position++ )
					{
						results.push( jsongin.SafeClone( series[ position ] ) );
					}

					for ( let field = 0; field < plan.Outputs.length; field++ )
					{
						stage.FillSeries( results, plan.Outputs[ field ], plan.SortBy, '$fill', Scope );
					}

					filled = filled.concat( results );
				}

				return filled;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$fill: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
