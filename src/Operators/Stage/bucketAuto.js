'use strict';
/*md

## Operators > Stage > $bucketAuto

Usage: `$bucketAuto: { groupBy: expression, buckets: count, output: { ... } }`

Groups the documents into a given number of buckets, choosing the boundaries so that each holds
  about the same number of documents.

***The `_id` of a bucket is a range***, `{ min, max }`, which is the visible difference from
  [$bucket](#$bucket). The `max` of one bucket is the `min` of the next, so the ranges are half
  open the same way — except the last, whose `max` is the largest value rather than one past it.

***An odd document goes to the earlier bucket.*** Five values across two buckets is three and
  then two.

***Fewer buckets than asked for may come back.*** Documents sharing a value cannot be split
  across a boundary, and there cannot be more buckets than there are documents.

`output` names the accumulators to reduce each bucket with, and replaces the default of
  `{ count: { $sum: 1 } }` entirely.

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
				let has_output = ( 'output' in Args );

				let allowed = [ 'groupBy', 'buckets' ];
				if ( has_output ) { allowed.push( 'output' ); }
				stage.ReadArgs( Args, '$bucketAuto', allowed );

				let count = Args.buckets;
				if ( ( jsongin.ShortType( count ) !== 'n' ) || !Number.isInteger( count ) || ( count < 1 ) )
				{
					throw new Error( `$bucketAuto: requires a whole [buckets] of one or more but found ${JSON.stringify( count )} instead.` );
				}

				let accumulators = { count: { $sum: 1 } };
				if ( has_output )
				{
					if ( jsongin.ShortType( Args.output ) !== 'o' )
					{
						throw new Error( `$bucketAuto: requires [output] to be a document of accumulators.` );
					}

					// ***An empty output counts, where $bucket's empty output does not.*** The
					// two stages disagree and this reproduces it rather than tidying it up:
					// MongoDB reads an empty output here as no output at all, and falls back
					// to the default, while $bucket takes the same thing literally.
					if ( Object.keys( Args.output ).length > 0 ) { accumulators = Args.output; }
				}

				if ( Documents.length === 0 ) { return []; }

				// Sorted by the grouped value, since the buckets are ranges of it.
				let sortable = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					sortable.push( {
						Value: jsongin.Evaluate( Documents[ index ], Args.groupBy, Scope ),
						Document: Documents[ index ],
					} );
				}
				sortable.sort( function ( A, B ) { return jsongin.CompareValues( A.Value, B.Value ); } );

				// ***Documents sharing a value cannot be split***, so a bucket takes its share
				// and then keeps taking while the next value is the same as its last. That is
				// what makes the result come back with fewer buckets than asked for sometimes,
				// and it is why the share is recomputed from what is left rather than fixed.
				let buckets = [];
				let position = 0;
				for ( let bucket = 0; bucket < count; bucket++ )
				{
					if ( position >= sortable.length ) { break; }

					let remaining_buckets = count - bucket;
					let remaining = sortable.length - position;
					let share = Math.ceil( remaining / remaining_buckets );

					let end = position + share;
					while ( ( end < sortable.length )
						&& ( jsongin.CompareValues( sortable[ end - 1 ].Value, sortable[ end ].Value ) === 0 ) )
					{
						end++;
					}

					let taken = [];
					for ( let index = position; index < end; index++ ) { taken.push( sortable[ index ].Document ); }

					// The upper edge is the first value of the next bucket, and for the last
					// bucket there is none, so its own largest value is used instead.
					let max = ( end < sortable.length ) ? sortable[ end ].Value : sortable[ end - 1 ].Value;

					buckets.push( {
						Key: { min: sortable[ position ].Value, max: max },
						Documents: taken,
					} );
					position = end;
				}

				return stage.ReduceBuckets( buckets, accumulators, '$bucketAuto', Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$bucketAuto: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
