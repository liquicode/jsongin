'use strict';
/*md

## Operators > Logical > $nor

Usage: `$nor: [ value1, value2, ... ]`

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
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$nor: ${error.message}` ); }
				throw error;
			}

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'a' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$nor: requires an array but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Compare
			for ( let index = 0; index < MatchValue.length; index++ )
			{
				let result = this.Engine.Query( Document, MatchValue[ index ], Path );
				if ( result === true ) { return false; }
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
