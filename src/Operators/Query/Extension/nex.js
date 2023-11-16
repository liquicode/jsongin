'use strict';
/*md

## Operators > Comparison > $nex

Usage: `field: { $nex: value }`

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
			return !this.Engine.QueryOperators.$eqx.Query( Document, MatchValue, Path );
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			throw new Error( `ToMongoQuery() is not implemented.` );
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
