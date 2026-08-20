'use strict';
/*md

## Operators > Expression > $mergeObjects

Usage: `$mergeObjects: [ document, document, ... ]`

Combines several documents into one. A later document wins a field the two share.

***The merge is one level deep.*** A shared field whose value is itself a document is
  replaced whole rather than merged into, so
  `{ $mergeObjects: [ { a: { x: 1 } }, { a: { y: 2 } } ] }` is `{ a: { y: 2 } }` and not
  `{ a: { x: 1, y: 2 } }`.

***A null or missing operand is ignored*** rather than making the result null, and an
  operator whose operands all vanish still answers an empty document. That is what makes this
  safe to fold over a list of documents which may not all be there.

***An overwritten field keeps its original position***, and a new one is appended after the
  fields already present. Field order is observable, since MongoDB compares documents field by
  field in the order they hold them.

A single document may be given without a list: `$mergeObjects: '$doc'`.

***There is also an accumulator called `$mergeObjects`***, which is a different operator with
  the same name: that one merges every document reaching a `$group`. Which one applies is
  decided by where it is written. See
  [Accumulator Operators](./Accumulator-Operators.md).

*/

module.exports = function ( jsongin )
{

	const object = require( './_object' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'oaslu',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = object.Operands( Document, Args, '$mergeObjects', 0, null );

				let merged = {};
				for ( let index = 0; index < operands.length; index++ )
				{
					let operand = operands[ index ];

					let short_type = jsongin.ShortType( operand );
					if ( 'lu'.includes( short_type ) ) { continue; }
					if ( short_type !== 'o' )
					{
						throw new Error( `$mergeObjects: requires documents but found a [${short_type}] instead.` );
					}

					let keys = Object.keys( operand );
					for ( let key_index = 0; key_index < keys.length; key_index++ )
					{
						merged[ keys[ key_index ] ] = jsongin.SafeClone( operand[ keys[ key_index ] ] );
					}
				}

				return merged;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$mergeObjects: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
