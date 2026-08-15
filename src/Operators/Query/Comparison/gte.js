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
		ValueTypes: 'bnsdlu',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				// The trailing true is what makes a null or missing field satisfy
				// { $gte: null }, which $gt does not.
				return range.Query( Document, MatchValue, Path, '$gte',
					function ( ActualValue, CompareValue ) { return ( ActualValue >= CompareValue ); },
					true );
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
