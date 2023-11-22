'use strict';
/*md

## Operators > Update > $inc

Usage: `$inc: { field: value, ... }`

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
				if ( Engine.OpLog ) { Engine.OpLog( `$inc: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let value = Engine.GetValue( Document, field );
				let inc = Engine.AsNumber( UpdateFields[ field ] );
				if ( inc === null )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$inc: This operator requires a numeric value but found [${UpdateFields[ field ]}] instead at [${field}].` ); }
					continue;
				}
				value += inc;
				let result = Engine.SetValue( Document, field, value );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$inc: Setting the value of [${field}] to [${value}] failed.` ); }
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
