'use strict';
/*md

## Operators > Stage > $replaceWith

Usage: `$replaceWith: expression`

Replaces each document with the document the expression produces.

***An alias of [$replaceRoot](#$replaceRoot)***, without the `newRoot` wrapper. Everything that
  stage says applies here: `_id` does not survive, and a new root which is missing or is not a
  document fails the pipeline rather than dropping the document.

*/

module.exports = function ( jsongin )
{

	const stage = require( './_stage' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					results.push( stage.AsNewRoot( Documents[ index ], Args, '$replaceWith', Scope ) );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$replaceWith: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
