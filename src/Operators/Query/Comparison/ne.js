'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnsdloau',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			return !jsongin.QueryOperators.$eq.Query( Document, MatchValue, Path );
		},

	};

	// Return the operator.
	return operator;
};
