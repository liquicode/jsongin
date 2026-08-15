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
		ValueTypes: 'bnsd',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				return range.Query( Document, MatchValue, Path, '$lt',
					function ( ActualValue, CompareValue ) { return ( ActualValue < CompareValue ); },
					false );
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
