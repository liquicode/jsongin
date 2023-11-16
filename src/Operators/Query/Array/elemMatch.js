'use strict';
/*md

## Operators > Meta > $elemMatch

Usage: `$elemMatch: Query`

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
			// if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
			if ( actual_type !== 'a' ) 
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$elemMatch: document requires an array but found type [${actual_type}] instead at [${Path}].` ); }
				return false;
			}

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'o' ) 
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$elemMatch: match requires an object but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Process
			for ( let index = 0; index < actual_value.length; index++ )
			{
				let sub_path = this.Engine.JoinPaths( Path, index );
				let result = this.Engine.Query( Document, MatchValue, sub_path );
				if ( result === true ) { return true; }
			}
			return false;
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
