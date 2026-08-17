'use strict';
/*md

## Operators > Query > $gte

Usage: `$gte: value`

Matches a field which is greater than or equal to the value.

***Comparison is bracketed by type***, the same way `$gt` is: a field only matches when it is
  the same BSON type as the value.

Unlike `$gt`, a null or ***missing*** field satisfies `{ $gte: null }`.

*/

module.exports = function ( jsongin )
{
	const range = require( './_range' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'bnsdluoa',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				// The true is what makes a null or missing field satisfy { $gte: null },
				// which $gt does not.
				return range.Query( Document, MatchValue, Path, '$gte',
					function ( Comparison ) { return ( Comparison >= 0 ); },
					true, ExpandArrays );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$gte: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
