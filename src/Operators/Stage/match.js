'use strict';
/*md

## Operators > Stage > $match

Usage: `$match: query`

Selects the documents which match the given query and discards the rest.

Every query operator works here, including `$expr` and `$exprx`.
This is a pass-through stage. The selected documents are the caller's own document objects,
  they are not cloned.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Stage',
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$match requires a query object.` ); }
				return jsongin.Filter( Documents, Args );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$match: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
