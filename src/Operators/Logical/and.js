'use strict';
/*md

## Operators > Logical > $and

Usage: `$and: [ value1, value2, ... ]`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Logical',
		TopLevel: true,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path )
		{
			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'a' )
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$and: requires an array but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Compare
			for ( let index = 0; index < MatchValue.length; index++ )
			{
				if ( this.Engine.Query( Document, MatchValue[ index ], Path ) === false ) { return false; }
			}
			return true;
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
