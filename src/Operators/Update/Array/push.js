'use strict';
/*md

## Operators > Update > $push

Usage: `$push: { field: value, ... }`

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
				if ( Engine.OpLog ) { Engine.OpLog( `$push: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let array = Engine.GetValue( Document, field );
				if ( Engine.ShortType( array ) !== 'a' )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$push: The field [${field}] must be an array.` ); }
					continue;
				}
				let value = UpdateFields[ field ];
				array.push( value );
				let result = Engine.SetValue( Document, field, array );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$push: Setting the field [${field}] failed.` ); }
					continue;
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
