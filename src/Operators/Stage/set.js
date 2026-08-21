'use strict';
/*md

## Operators > Stage > $set

Usage: `$set: { field: expression, ... }`

An alias of the `$addFields` stage, exactly as it is in MongoDB.
See `$addFields` for the semantics.

Note that this is the aggregation stage `$set` and not the update operator `$set`.
The stage adds computed fields to every document in a pipeline.
The update operator modifies a single document.

*/

module.exports = function ( jsongin )
{

	const add_fields = require( './addFields' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		// An alias. The implementation is shared with $addFields rather than duplicated, but
		// this stage reports under its own name so that an error names the operator which was
		// actually written.
		Stage: function ( Documents, Args, Scope )
		{
			return add_fields.ApplyFields( Documents, Args, '$set', Scope );
		},

	};

	// Return the operator.
	return operator;
};
