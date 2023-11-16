'use strict';
/*md

## Operators > Comparison > $nin

Usage: `field: { $nin: [ value1, value2, ... ] }`

*/

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
		Query: function ( Document, MatchValue, Path = '' )
		{
			return !this.Engine.QueryOperators.$in.Query( Document, MatchValue, Path );
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			return Expression;
		},

		//---------------------------------------------------------------------
		ToSql: function ( Expression )
		{
			throw new Error( `ToSql() is not implemented.` );
		},

	};

	// Return the operator.
	return operator;
};
