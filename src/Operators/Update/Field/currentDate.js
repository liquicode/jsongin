'use strict';
/*md

## Operators > Update > $currentDate

Usage: `$currentDate: { field: date-type, ... }`

*/

module.exports = function ( jsongin )
{
	let Engine = jsongin;

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Update',
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			let timestamp = new Date();

			if ( Engine.ShortType( UpdateFields ) !== 'o' )
			{
				if ( Engine.OpLog ) { Engine.OpLog( `$currentDate: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let date_spec = UpdateFields[ field ];
				let st_date_spec = Engine.ShortType( date_spec );
				let value = null;
				if ( st_date_spec === 'b' )
				{
					if ( date_spec === true )
					{
						value = timestamp.toISOString();
					}
				}
				else if ( st_date_spec === 'o' )
				{
					if ( typeof date_spec.$type === 'string' )
					{
						date_spec = date_spec.$type;
						if ( date_spec === 'timestamp' )
						{
							value = timestamp.getTime();
						}
						else if ( date_spec === 'date' )
						{
							value = timestamp.toDateString();
						}
						else
						{
							if ( Engine.OpLog ) { Engine.OpLog( `$currentDate: Unknown date dpecification [${date_spec}] for [${field}] is invalid.` ); }
							continue;
						}
					}
				}
				else
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$currentDate: The date dpecification of [${JSON.stringify( date_spec )}] for [${field}] is invalid.` ); }
					continue;
				}

				if ( value !== null )
				{
					let result = Engine.SetValue( Document, field, value );
					if ( result === false )
					{
						if ( Engine.OpLog ) { Engine.OpLog( `$currentDate: Setting the value of [${field}] to [${value}] failed.` ); }
						continue;
					}
				}

			}

			return true;
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			return Expression;
		},

		//---------------------------------------------------------------------
		ToSql: function ( Expression )
		{
			throw new Error( `ToSql() is not implemented.` );
		},

	};

	// Return the operator.
	return operator;
};
