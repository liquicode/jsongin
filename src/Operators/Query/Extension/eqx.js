'use strict';

module.exports = module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		// No regex branch below, unlike $eq. The same set as $nex, which negates this.
		ValueTypes: 'bnsdloau',

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

				if ( 'bns'.includes( match_type ) && 'bns'.includes( actual_type ) ) 
				{
					return ( actual_value == match_value ); // Equivalence of primitive types.
				}
				else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) )
				{
					return true; // null and undefined are always equivalent.
				}
				else if ( ( match_type === 'd' ) && ( actual_type === 'd' ) )
				{
					// Two Date objects are never == to each other, so compare their time values.
					// Without this, dates would fall into the member-wise object comparison below,
					// where a Date presents no members and every pair of dates matches.
					return ( actual_value.getTime() === match_value.getTime() );
				}
				else if ( ( match_type === 'd' ) || ( actual_type === 'd' ) )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Query.$eqx: cannot compare a date to a non-date at [${Path}].` ); }
					return false;
				}
				else if ( 'bnslu'.includes( match_type ) || 'bnslu'.includes( actual_type ) ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Query.$eqx: cannot compare primitive types to non-primitive types at [${Path}].` ); }
					return false; // Cannot compare primitive types to non-primitive types.
				}
				else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) )
				{
					// Objects can match loosely, regardless of key order.
					for ( let key in actual_value )
					{
						if ( operator.Query( actual_value[ key ], match_value[ key ], '' ) === false )
						{
							return false;
						}
					}
					return true;
				}
				else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) ) 
				{
					if ( match_value.length !== actual_value.length ) { return false; }
					let working = [ ...actual_value ];
					for ( let match_index = 0; match_index < match_value.length; match_index++ )
					{
						let matched = false;
						for ( let working_index = 0; working_index < working.length; working_index++ )
						{
							// if ( match_value[ match_index ] == working[ working_index ] )
							if ( operator.Query( match_value[ match_index ], working[ working_index ], '' ) )
							{
								matched = true;
								working.splice( working_index, 1 );
								break;
							}
						}
						if ( matched === false ) { return false; }
					}
					return true;
				}
				// Unsupported type or equivalence.
				if ( jsongin.OpLog ) { jsongin.OpLog( `Query.$eqx: cannot compare [${match_type}] type with [${value_type}] type at [${Path}].` ); }
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$eqx: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
