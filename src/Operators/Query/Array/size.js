'use strict';
/*md

## Operators > Meta > $size

Usage: `$size: n`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Array',
		TopLevel: false,
		ValueTypes: 'n',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );
			// if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
			if ( actual_type !== 'a' ) 
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires an array but found type [${actual_type}] instead at [${Path}].` ); }
				return false;
			}

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'n' ) 
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires a number but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Process
			let result = ( actual_value.length === MatchValue );
			return result;
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
};;
