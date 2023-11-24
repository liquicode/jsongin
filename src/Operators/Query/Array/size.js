'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Array',
		TopLevel: false,
		ValueTypes: 'n',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );
				// if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
				if ( actual_type !== 'a' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires an array but found type [${actual_type}] instead at [${Path}].` ); }
					return false;
				}

				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'n' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires a number but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// Process
				let result = ( actual_value.length === MatchValue );
				return result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$size: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};;
