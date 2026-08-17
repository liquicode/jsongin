'use strict';
/*md

## Operators > Query > $nor

Usage: `$nor: [ query, ... ]`

Matches a document which satisfies ***none*** of the queries.

May be used at the top level of a query.
***An empty list is refused***, as MongoDB refuses it.

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
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$nor: requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// An empty array asks nothing. MongoDB refuses it, the same way it refuses an
				// empty $and or $or. Verified against MongoDB 6.0.1.
				if ( MatchValue.length === 0 )
				{
					throw new Error( `$nor: requires a non-empty array of criteria at [${Path}].` );
				}

				// Compare
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let result = jsongin.Query( Document, MatchValue[ index ], Path );
					if ( result === true ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$nor: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
