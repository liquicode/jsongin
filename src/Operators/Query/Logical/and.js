'use strict';
/*md

## Operators > Query > $and

Usage: `$and: [ query, ... ]`

Matches a document which satisfies ***every*** one of the queries.

May be used at the top level of a query.
***An empty list is refused***, as MongoDB refuses it, rather than being read as a condition
  which every document satisfies.

Note that a query document already means `$and` between its fields, so `$and` is only needed
  when the same field carries two conditions which cannot share one object.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$and: requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// An empty array asks nothing. MongoDB refuses it rather than treating it as
				// a condition which everything satisfies, verified against MongoDB 6.0.1, and
				// a query which cannot mean anything is refused rather than answered.
				if ( MatchValue.length === 0 )
				{
					throw new Error( `$and: requires a non-empty array of criteria at [${Path}].` );
				}

				// Compare
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					if ( jsongin.Query( Document, MatchValue[ index ], Path ) === false ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$and: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
