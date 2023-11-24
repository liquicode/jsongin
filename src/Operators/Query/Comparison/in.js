'use strict';
/*md

## Operators > Comparison > $in

Usage: `field: { $in: [ value1, value2, ... ] }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$in: ${error.message}` ); }
				throw error;
			}

			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );
			if ( match_type !== 'a' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$in: expected an array but found a type [${match_type}] instead at [${Path}].` ); }
				return false;
			}

			function array_includes_value( engine, array, value )
			{
				if ( engine.ShortType( value ) === 'r' )
				{
					for ( let index = 0; index < array.length; index++ )
					{
						if ( value.test( array[ index ] ) ) { return true; }
					}
				}
				else
				{
					if ( array.includes( value ) ) { return true; }
				}
				return false;
			}

			// Compare
			if ( actual_type === 'a' ) 
			{
				// Match against an array of values.
				for ( let index = 0; index < match_value.length; index++ )
				{
					if ( array_includes_value( this.Engine, actual_value, match_value[ index ] ) ) { return true; }
					// if ( actual_value.includes( match_value[ index ] ) ) { return true; }
				}
			}
			else if ( 'bnslou'.includes( actual_type ) )
			{
				// Match against a single value.
				if ( array_includes_value( this.Engine, match_value, actual_value ) ) { return true; }
				// return match_value.includes( actual_value );
			}
			if ( jsongin.OpLog ) { jsongin.OpLog( `$in: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
			return false; // Unsupported type or equivalence.
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
