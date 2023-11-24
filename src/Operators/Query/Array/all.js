'use strict';

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
			try
			{
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );
				if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
				if ( actual_type !== 'a' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$all: document requires an array but found type [${actual_type}] instead at [${Path}].` ); }
					return false;
				}

				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$all: match requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// Process
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let result = false;
					let match_sub_type = jsongin.ShortType( MatchValue[ index ] );
					if ( 'bnsl'.includes( match_sub_type ) )
					{
						result = actual_value.includes( MatchValue[ index ] );
					}
					else if ( match_sub_type === 'o' )
					{
						result = jsongin.Query( Document, MatchValue[ index ], Path );
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `$all: sub-match requires "bnslo" but found type [${match_type}] instead at [${Path}].` ); }
					}
					if ( result === false )
					{
						return false;
					}
				}
				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$all: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};;
