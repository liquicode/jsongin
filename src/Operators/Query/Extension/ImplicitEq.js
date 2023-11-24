'use strict';

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
			try
			{
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );

				// Validate Expression
				let match_value = MatchValue;
				let match_type = jsongin.ShortType( match_value );
				let match_is_query = jsongin.IsQuery( match_value );

				// Compare
				let result = false;
				if ( 'bnslu'.includes( actual_type ) && 'bnslu'.includes( match_type ) )
				{
					// Primtive === Primitive
					result = jsongin.QueryOperators.$eq.Query( Document, match_value, Path );
					return result;
				}
				else if ( 'bnslu'.includes( actual_type ) && 'a'.includes( match_type ) )
				{
					// Primtive === Array
					if ( jsongin.OpLog ) { jsongin.OpLog( `ImplicitEq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
					return false;
				}
				else if ( 'bnslu'.includes( actual_type ) && 'o'.includes( match_type ) )
				{
					// Primtive === Object
					if ( match_is_query )
					{
						result = jsongin.Query( Document, match_value, Path );
						return result;
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `ImplicitEq: requires query when comparing against [${actual_type}] type with [${actual_type}] type at [${Path}].` ); }
						return false;
					}
				}
				else if ( 'a'.includes( actual_type ) && 'bnslu'.includes( match_type ) )
				{
					// Array === Primitive
					// result = jsongin.QueryOperators.$in.Query( Document, match_value, Path );
					result = actual_value.includes( match_value );
					return result;
					// for ( let index = 0; index < actual_value.length; index++ )
					// {
					// 	let sub_path = jsongin.JoinPaths( Path, index );
					// 	result = jsongin.QueryOperators.$eq.Query( Document, match_value, sub_path );
					// 	if ( result === false ) { return false; }
					// }
				}
				else if ( 'a'.includes( actual_type ) && 'o'.includes( match_type ) )
				{
					// Array === Object
					for ( let index = 0; index < actual_value.length; index++ )
					{
						let sub_path = jsongin.JoinPaths( Path, index );
						if ( match_is_query )
						{
							result = jsongin.Query( Document, match_value, sub_path );
						}
						else
						{
							result = jsongin.QueryOperators.$eq.Query( Document, match_value, sub_path );
						}
						if ( result === true ) { return true; }
					}
					return false;
				}
				else if ( 'a'.includes( actual_type ) && 'a'.includes( match_type ) )
				{
					// Array === Array
					result = jsongin.QueryOperators.$eq.Query( Document, match_value, Path );
					return result;
				}
				else if ( 'a'.includes( actual_type ) && 'r'.includes( match_type ) )
				{
					// Array === Regexp
					for ( let index = 0; index < actual_value.length; index++ )
					{
						let sub_path = jsongin.JoinPaths( Path, index );
						result = jsongin.QueryOperators.$regex.Query( Document, match_value, sub_path );
						if ( result === false ) { return false; }
					}
					return true;
				}
				else if ( 'o'.includes( actual_type ) && 'o'.includes( match_type ) )
				{
					// Object === Object
					if ( match_is_query )
					{
						result = jsongin.Query( Document, match_value, Path );
						return result;
					}
					else
					{
						result = jsongin.QueryOperators.$eq.Query( Document, match_value, Path );
						return result;
					}
				}
				else if ( 's'.includes( actual_type ) && 'r'.includes( match_type ) )
				{
					// String === Regexp
					result = jsongin.QueryOperators.$regex.Query( Document, match_value, Path );
					return result;
				}
				else
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `ImplicitEq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
					return false;
				}

				return; // Inaccessible code.
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$ImplicitEq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
