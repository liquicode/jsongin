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
				// if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }
				if ( actual_type !== 'a' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$elemMatch: document requires an array but found type [${actual_type}] instead at [${Path}].` ); }
					return false;
				}

				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'o' ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$elemMatch: match requires an object but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// Process
				for ( let index = 0; index < actual_value.length; index++ )
				{
					let sub_path = jsongin.JoinPaths( Path, index );
					let result = jsongin.Query( Document, MatchValue, sub_path );
					if ( result === true ) { return true; }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$elemMatch: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};;
