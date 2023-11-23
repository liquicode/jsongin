'use strict';
/*md

## Operators > Comparison > $gt

Usage: `field: { $gt: value }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bns',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );

			// Compare
			if ( 'bns'.includes( match_type ) && ( match_type === actual_type ) ) 
			{
				return ( actual_value > match_value ); // Comparison of primitive types.
			}
			else if ( 'a'.includes( actual_type ) )
			{
				let result = false;
				for ( let index = 0; index < actual_value.length; index++ )
				{
					result = ( actual_value[ index ] > match_value );
					if ( result === true ) { return true; }
				}
				return false;
			}
			else
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$gt: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
				return false;
			}

			return;
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
