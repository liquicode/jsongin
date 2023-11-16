'use strict';
/*md

## Operators > Meta > $all

Usage: `$all: Query`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Array',
		TopLevel: false,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );
			if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
			if ( actual_type !== 'a' ) 
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$all: document requires an array but found type [${actual_type}] instead at [${Path}].` ); }
				return false;
			}

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'a' ) 
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$all: match requires an array but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Process
			for ( let index = 0; index < MatchValue.length; index++ )
			{
				let result = false;
				let match_sub_type = this.Engine.ShortType( MatchValue[ index ] );
				if ( 'bnsl'.includes( match_sub_type ) )
				{
					result = actual_value.includes( MatchValue[ index ] );
				}
				else if ( match_sub_type === 'o' )
				{
					result = this.Engine.Query( Document, MatchValue[ index ], Path );
				}
				else
				{
					if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$all: sub-match requires "bnslo" but found type [${match_type}] instead at [${Path}].` ); }
				}
				if ( result === false )
				{
					return false;
				}
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
};;
