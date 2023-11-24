'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Logical',
		TopLevel: true,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$nor: requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// Compare
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let result = jsongin.Query( Document, MatchValue[ index ], Path );
					if ( result === true ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$nor: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
