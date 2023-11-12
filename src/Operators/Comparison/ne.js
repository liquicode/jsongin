'use strict';
/*md

## Operators > Comparison > $ne

Usage: `field: { $ne: value }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnsloau',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			return !this.Engine.Operators.$eq.Query( Document, MatchValue, Path );
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
