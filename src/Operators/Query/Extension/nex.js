'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		// The same set as $eqx, which this negates. The two cannot differ.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			return !jsongin.QueryOperators.$eqx.Query( Document, MatchValue, Path );
		},

	};

	// Return the operator.
	return operator;
};
