'use strict';
/*md

## Operators > Update > $max

Usage: `$max: { field: value, ... }`

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
			if ( Engine.ShortType( UpdateFields ) !== 'o' )
			{
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `$max: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let value = Engine.GetValue( Document, field );
				let max = Engine.AsNumber( UpdateFields[ field ] );
				if ( max === null )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `$max: This operator requires a numeric value but found [${UpdateFields[ field ]}] instead at [${field}].` ); }
					continue;
				}
				if ( max > value )
				{
					let result = Engine.SetValue( Document, field, max );
					if ( result === false )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `$max: Setting the value of [${field}] to [${value}] failed.` ); }
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