'use strict';

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
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );

				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
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
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$exists: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
