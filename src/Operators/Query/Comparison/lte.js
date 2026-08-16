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
		ValueTypes: 'bnsdluoa',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// See _range.js for the candidate handling and the type bracketing.
				// The true is what makes a null or missing field satisfy { $lte: null },
				// which $lt does not.
				return range.Query( Document, MatchValue, Path, '$lte',
					function ( Comparison ) { return ( Comparison <= 0 ); },
					true, ExpandArrays );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$lte: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
