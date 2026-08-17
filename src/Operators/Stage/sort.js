'use strict';
/*md

## Operators > Stage > $sort

Usage: `$sort: { field: 1 | -1, ... }`

Sorts the documents by one or more fields.
A value of `1` sorts the field ascending and a value of `-1` sorts it descending.

Sorting follows MongoDB's rules: a document which is missing the sort field sorts as though
  the field held `null`, and values of different types are ordered by the BSON type order.

A sort field which holds an array is reduced to a single sort key first, by taking the
  smallest of its elements when ascending and the largest when descending.
When the sort path crosses an array, every element of that array contributes to the same
  candidate set, so a path can reduce through more than one array level.
See the `Sort()` guide for the full rule, including how empty arrays are handled.

This is a pass-through stage. The documents are the caller's own document objects, they are
  not cloned, and the input array's ordering is left untouched because a copy is sorted.

*/

module.exports = function ( jsongin )
{

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
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$sort requires a sort criteria object.` ); }
				return jsongin.Sort( Documents.slice(), Args );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$sort: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
