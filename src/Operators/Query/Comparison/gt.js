'use strict';

module.exports = function ( jsongin )
{
	const range = require( './_range' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		// null and undefined are accepted, and match nothing. They are listed so that
		// { $gt: null } is a query which selects no document, the way MongoDB treats it,
		// rather than a malformed query. Only $gte and $lte are satisfied by them.
		ValueTypes: 'bnsdoalu',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				return range.Query( Document, MatchValue, Path, '$gt',
					function ( Comparison ) { return ( Comparison > 0 ); },
					false, ExpandArrays );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$gt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
