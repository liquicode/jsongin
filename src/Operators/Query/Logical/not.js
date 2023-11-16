'use strict';
/*md

## Operators > Logical > $not

Usage: `$not: { query }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Logical',
		TopLevel: true,
		ValueTypes: 'or',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );

			// Compare
			let result = false;
			if ( match_type === 'o' )
			{
				result = this.Engine.Query( Document, match_value, Path );
			}
			else if ( match_type === 'r' )
			{
				result = this.Engine.QueryOperators.$regex.Query( Document, match_value, Path );
			}
			else
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$not: requires an object or regexp but found type [${match_type}] instead at [${Path}].` ); }
			}
			return !result;
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
