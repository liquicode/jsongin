'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Meta',
		TopLevel: false,
		ValueTypes: 'nsa',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );
				if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }

				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' ) { MatchValue = [ MatchValue ]; }

				// Compare
				for ( let match_index = 0; match_index < MatchValue.length; match_index++ )
				{
					let match_value = MatchValue[ match_index ];
					match_type = jsongin.ShortType( match_value );

					if ( match_type === 'n' )
					{
						for ( let actual_index = 0; actual_index < actual_value.length; actual_index++ )
						{
							let result = jsongin.BsonType( actual_value[ actual_index ], false );
							if ( match_value === result )
							{
								return true;
							}
						}
					}
					else if ( match_type === 's' )
					{
						for ( let actual_index = 0; actual_index < actual_value.length; actual_index++ )
						{
							let result = jsongin.BsonType( actual_value[ actual_index ], true );
							if ( match_value === result )
							{
								return true;
							}
							else if ( ( match_value === 'number' ) && [ 'int', 'long', 'double', 'decimal' ].includes( result ) )
							{
								return true;
							}
						}
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `$type: requires a number or string but found type [${match_type}] instead at [${Path}].` ); }
						return false;
					}
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$type: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
