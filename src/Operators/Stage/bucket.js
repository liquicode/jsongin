'use strict';
/*md

## Operators > Stage > $bucket

Usage: `$bucket: { groupBy: expression, boundaries: [ ... ], default: value, output: { ... } }`

Groups the documents into buckets whose edges are given, and reduces each bucket the way
  [$group](#$group) reduces a group.

***The ranges are half open.*** A value equal to a boundary belongs to the bucket ***above***
  it, so boundaries of `[ 0, 10, 20 ]` make the buckets `0 <= n < 10` and `10 <= n < 20`. The
  `_id` of a bucket is its lower boundary.

***A bucket nothing fell into is left out entirely***, rather than reported with a count of
  zero, and the same is true of the `default` bucket.

***A value outside every bucket needs a `default`***, and throws without one. Given a `default`,
  such values are gathered under it.

`output` names the accumulators to reduce each bucket with, and replaces the default of
  `{ count: { $sum: 1 } }` entirely rather than adding to it.

`boundaries` must hold at least two values, in ascending order.

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
		Stage: function ( Documents, Args )
		{
			try
			{
				let has_default = ( 'default' in Args );
				let has_output = ( 'output' in Args );

				let allowed = [ 'groupBy', 'boundaries' ];
				if ( has_default ) { allowed.push( 'default' ); }
				if ( has_output ) { allowed.push( 'output' ); }
				stage.ReadArgs( Args, '$bucket', allowed );

				let boundaries = Args.boundaries;
				if ( jsongin.ShortType( boundaries ) !== 'a' )
				{
					throw new Error( `$bucket: requires [boundaries] to be an array.` );
				}
				if ( boundaries.length < 2 )
				{
					throw new Error( `$bucket: requires at least two [boundaries] but found ${boundaries.length}.` );
				}
				for ( let index = 1; index < boundaries.length; index++ )
				{
					if ( jsongin.CompareValues( boundaries[ index - 1 ], boundaries[ index ] ) >= 0 )
					{
						throw new Error( `$bucket: requires [boundaries] in ascending order.` );
					}
				}

				// Each bucket collects its documents first, so that the accumulators run over a
				// whole bucket the way they run over a whole group.
				let buckets = [];
				for ( let index = 0; index < boundaries.length - 1; index++ )
				{
					buckets.push( { Key: boundaries[ index ], Documents: [] } );
				}
				let overflow = [];

				for ( let index = 0; index < Documents.length; index++ )
				{
					let value = jsongin.Evaluate( Documents[ index ], Args.groupBy );

					let placed = false;
					for ( let edge = 0; edge < buckets.length; edge++ )
					{
						// Half open: at or above this edge, below the next one.
						if ( jsongin.CompareValues( value, boundaries[ edge ] ) < 0 ) { continue; }
						if ( jsongin.CompareValues( value, boundaries[ edge + 1 ] ) >= 0 ) { continue; }
						buckets[ edge ].Documents.push( Documents[ index ] );
						placed = true;
						break;
					}

					if ( placed ) { continue; }
					if ( has_default === false )
					{
						throw new Error( `$bucket: ${JSON.stringify( value )} falls outside every bucket and no [default] was given.` );
					}
					overflow.push( Documents[ index ] );
				}

				if ( has_default && ( overflow.length > 0 ) )
				{
					buckets.push( { Key: Args.default, Documents: overflow } );
				}

				let accumulators = has_output ? Args.output : { count: { $sum: 1 } };
				return stage.ReduceBuckets( buckets, accumulators, '$bucket' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$bucket: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
