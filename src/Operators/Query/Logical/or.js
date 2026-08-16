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
					if ( jsongin.OpLog ) { jsongin.OpLog( `$or: requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// An empty array asks nothing. MongoDB refuses it rather than treating it as a
				// condition nothing satisfies. Verified against MongoDB 6.0.1.
				if ( MatchValue.length === 0 )
				{
					throw new Error( `$or: requires a non-empty array of criteria at [${Path}].` );
				}

				// Compare
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					if ( jsongin.Query( Document, MatchValue[ index ], Path ) === true ) { return true; }
				}

				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$or: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
