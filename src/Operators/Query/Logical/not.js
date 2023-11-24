'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Logical',
		TopLevel: true,
		ValueTypes: 'or',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate Expression
				let match_value = MatchValue;
				let match_type = jsongin.ShortType( match_value );

				// Compare
				let result = false;
				if ( match_type === 'o' )
				{
					result = jsongin.Query( Document, match_value, Path );
				}
				else if ( match_type === 'r' )
				{
					result = jsongin.QueryOperators.$regex.Query( Document, match_value, Path );
				}
				else
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$not: requires an object or regexp but found type [${match_type}] instead at [${Path}].` ); }
				}

				return !result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$not: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
