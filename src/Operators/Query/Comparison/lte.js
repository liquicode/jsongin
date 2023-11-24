'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnslu',

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
				if ( 'bns'.includes( match_type ) && ( match_type === actual_type ) ) 
				{
					return ( actual_value <= match_value ); // Comparison of primitive types.
				}
				else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) ) 
				{
					return true; // null and undefined are always equivalent.
				}
				else if ( 'a'.includes( actual_type ) )
				{
					let result = false;
					for ( let index = 0; index < actual_value.length; index++ )
					{
						result = ( actual_value[ index ] <= match_value );
						if ( result === true ) { return true; }
					}
					return false;
				}
				else
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$lte: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
					return false; // Unsupported type or equivalence.
				}

				return; // Inaccessible code.
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$lte: ${error.message}` ); }
				throw error;
			}

		},

	};

	// Return the operator.
	return operator;
};
