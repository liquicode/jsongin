'use strict';
/*md

## Operators > Comparison > $regex

Usage: `field: { $regex: regex }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'sr',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$regex: ${error.message}` ); }
				throw error;
			}

			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );

			// Compare
			if ( 'sr'.includes( match_type ) )
			{
				if ( match_type === 's' ) { match_value = new RegExp( match_value ); }
				let result = match_value.test( actual_value );
				return result;
			}
			else
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$regex: requires regexp or string but found [${match_type}] instead at [${Path}].` ); }
				return false;
			}
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
