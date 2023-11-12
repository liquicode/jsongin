'use strict';
/*md

## Operators > Comparison > $ImplicitEq

Usage: `field: { $ImplicitEq: value }`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnsloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );
			let match_is_query = this.Engine.IsQuery( match_value );

			// Compare
			let result = false;
			if ( 'bnslu'.includes( actual_type ) && 'bnslu'.includes( match_type ) )
			{
				// Primtive === Primitive
				result = this.Engine.Operators.$eq.Query( Document, match_value, Path );
				return result;
			}
			else if ( 'bnslu'.includes( actual_type ) && 'a'.includes( match_type ) )
			{
				// Primtive === Array
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `ImplicitEq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
				return false;
			}
			else if ( 'bnslu'.includes( actual_type ) && 'o'.includes( match_type ) )
			{
				// Primtive === Object
				if ( match_is_query )
				{
					result = this.Engine.Query( Document, match_value, Path );
					return result;
				}
				else
				{
					if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `ImplicitEq: requires query when comparing against [${actual_type}] type with [${actual_type}] type at [${Path}].` ); }
					return false;
				}
			}
			else if ( 'a'.includes( actual_type ) && 'bnslu'.includes( match_type ) )
			{
				// Array === Primitive
				// result = this.Engine.Operators.$in.Query( Document, match_value, Path );
				result = actual_value.includes( match_value );
				return result;
				// for ( let index = 0; index < actual_value.length; index++ )
				// {
				// 	let sub_path = this.Engine.JoinPaths( Path, index );
				// 	result = this.Engine.Operators.$eq.Query( Document, match_value, sub_path );
				// 	if ( result === false ) { return false; }
				// }
			}
			else if ( 'a'.includes( actual_type ) && 'o'.includes( match_type ) )
			{
				// Array === Object
				for ( let index = 0; index < actual_value.length; index++ )
				{
					let sub_path = this.Engine.JoinPaths( Path, index );
					if ( match_is_query )
					{
						result = this.Engine.Query( Document, match_value, sub_path );
					}
					else
					{
						result = this.Engine.Operators.$eq.Query( Document, match_value, sub_path );
					}
					if ( result === true ) { return true; }
				}
				return false;
			}
			else if ( 'a'.includes( actual_type ) && 'a'.includes( match_type ) )
			{
				// Array === Array
				result = this.Engine.Operators.$eq.Query( Document, match_value, Path );
				return result;
			}
			else if ( 'a'.includes( actual_type ) && 'r'.includes( match_type ) )
			{
				// Array === Regexp
				for ( let index = 0; index < actual_value.length; index++ )
				{
					let sub_path = this.Engine.JoinPaths( Path, index );
					result = this.Engine.Operators.$regex.Query( Document, match_value, sub_path );
					if ( result === false ) { return false; }
				}
				return true;
			}
			else if ( 'o'.includes( actual_type ) && 'o'.includes( match_type ) )
			{
				// Object === Object
				if ( match_is_query )
				{
					result = this.Engine.Query( Document, match_value, Path );
					return result;
				}
				else
				{
					result = this.Engine.Operators.$eq.Query( Document, match_value, Path );
					return result;
				}
			}
			else if ( 's'.includes( actual_type ) && 'r'.includes( match_type ) )
			{
				// String === Regexp
				result = this.Engine.Operators.$regex.Query( Document, match_value, Path );
				return result;
			}
			else
			{
				if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `ImplicitEq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
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
