'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			return !jsongin.QueryOperators.$in.Query( Document, MatchValue, Path, ExpandArrays );
		},

	};

	// Return the operator.
	return operator;
};
