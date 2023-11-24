'use strict';
/*md

## Operators > Meta > $exists

Usage: `$exists: true | false`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Meta',
		TopLevel: false,
		ValueTypes: 'b',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$exists: ${error.message}` ); }
				throw error;
			}

			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'b' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$exists: requires a boolean but found type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			// Evaluate
			if ( MatchValue === true )
			{
				if ( actual_type !== 'u' ) { return true; }
			}
			else
			{
				if ( actual_type === 'u' ) { return true; }
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
};
