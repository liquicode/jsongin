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

				// Compare
				if ( 'bnslru'.includes( match_type ) && ( match_type === actual_type ) ) 
				{
					// Primitive types must match exactly.
					return ( actual_value === match_value ); // Equivalence of primitive types.
				}
				else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) ) 
				{
					return true; // null and undefined are always equivalent.
				}
				else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) ) 
				{
					// Objects must match exactly, including the key order.
					let result = ( JSON.stringify( match_value ) === JSON.stringify( actual_value ) );
					if ( result === true ) { return true; }
					return false;
				}
				else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) ) 
				{
					// Arrays must match exactly, including the value order.
					let match_json = JSON.stringify( match_value );
					let result = ( match_json === JSON.stringify( actual_value ) );
					if ( result === true ) { return true; }
					// Or, the match array must exactly match an element of the document array.
					for ( let index = 0; index < actual_value.length; index++ )
					{
						result = ( match_json === JSON.stringify( actual_value[ index ] ) );
						if ( result === true ) { break; }
					}
					if ( result === true ) { return true; }
					return false;
				}
				if ( jsongin.OpLog ) { jsongin.OpLog( `$eq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
				return false; // Unsupported type or equivalence.
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$eq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
