'use strict';
/*md

## Operators > Stage > $replaceRoot

Usage: `$replaceRoot: { newRoot: expression }`

Replaces each document with the document the expression produces.

***The document is replaced rather than merged into***, so `_id` does not survive unless the
  new root carries one of its own.

***A new root which is missing or is not a document fails the pipeline***, rather than dropping
  that one document. Guard a field which may not be there with
  [$ifNull](./Expression-Operators.md#$ifNull):
  `{ $replaceWith: { $ifNull: [ '$sub', {} ] } }`.

[$replaceWith](#$replaceWith) is the same stage without the `newRoot` wrapper.

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
				stage.ReadArgs( Args, '$replaceRoot', [ 'newRoot' ] );

				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					results.push( stage.AsNewRoot( Documents[ index ], Args.newRoot, '$replaceRoot', Scope ) );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$replaceRoot: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
