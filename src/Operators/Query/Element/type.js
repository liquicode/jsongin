'use strict';
/*md

## Operators > Meta > $type

Usage: `$type: any`

*/

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
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$type: ${error.message}` ); }
				throw error;
			}

			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );
			if ( actual_type !== 'a' ) { actual_value = [ actual_value ]; }

			// Validate Expression
			let match_type = this.Engine.ShortType( MatchValue );
			if ( match_type !== 'a' ) { MatchValue = [ MatchValue ]; }

			// Compare
			for ( let match_index = 0; match_index < MatchValue.length; match_index++ )
			{
				let match_value = MatchValue[ match_index ];
				match_type = this.Engine.ShortType( match_value );

				if ( match_type === 'n' )
				{
					for ( let actual_index = 0; actual_index < actual_value.length; actual_index++ )
					{
						let result = this.Engine.BsonType( actual_value[ actual_index ], false );
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
						let result = this.Engine.BsonType( actual_value[ actual_index ], true );
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
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			return;
		},

		//---------------------------------------------------------------------
		ToSql: function ( Expression )
		{
			return '';
		},

	};

	// Return the operator.
	return operator;
};
