'use strict';
/*md

## Operators > Accumulator > $mergeObjects

Usage: `$mergeObjects: expression`

Merges every document in a group into one, where a later document wins a field the two share.

***"Later" is the order the group arrived in***, so what wins depends on a `$sort` earlier in
  the pipeline. An overwritten field keeps its original position and a new one is appended.

***A null or missing value is ignored*** rather than making the result null, and a group with
  nothing in it to merge answers an empty document. Any other non-document value throws.

***There is also an expression operator called `$mergeObjects`***, which is a different
  operator with the same name: that one merges the documents given to it, within a single
  document. Which one applies is decided by where it is written. See
  [Expression Operators](./Expression-Operators.md#$mergeObjects).

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let values = accumulator.Values( Documents, Args, Scope );

				let merged = {};
				for ( let index = 0; index < values.length; index++ )
				{
					let value = values[ index ];

					let short_type = jsongin.ShortType( value );
					if ( 'lu'.includes( short_type ) ) { continue; }
					if ( short_type !== 'o' )
					{
						throw new Error( `$mergeObjects: requires documents but found a [${short_type}] instead.` );
					}

					let keys = Object.keys( value );
					for ( let key_index = 0; key_index < keys.length; key_index++ )
					{
						merged[ keys[ key_index ] ] = jsongin.SafeClone( value[ keys[ key_index ] ] );
					}
				}

				return merged;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$mergeObjects: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
