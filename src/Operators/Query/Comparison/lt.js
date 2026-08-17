'use strict';
/*md

## Operators > Query > $lt

Usage: `$lt: value`

Matches a field which is less than the value.

***Comparison is bracketed by type***, the same way `$gt` is: a field only matches when it is
  the same BSON type as the value.

Through an array, the field matches when ***any*** element is less than the value.

*/

module.exports = function ( jsongin )
{
	const range = require( './_range' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		// null and undefined are accepted, and match nothing. See the note in gt.js.
		ValueTypes: 'bnsdoalu',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				return range.Query( Document, MatchValue, Path, '$lt',
					function ( Comparison ) { return ( Comparison < 0 ); },
					false, ExpandArrays );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$lt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
