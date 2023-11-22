'use strict';
/*md

## Operators > Update > $rename

Usage: `$rename: { field: "new-name", ... }`

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
				if ( Engine.OpLog ) { Engine.OpLog( `$rename: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let new_name = UpdateFields[ field ];
				let value = Engine.GetValue( Document, field );
				let result = null;
				result = Engine.SetValue( Document, field, undefined );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$rename: Unsetting the value of [${field}] failed.` ); }
					continue;
				}
				result = Engine.SetValue( Document, new_name, value );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$rename: Setting the value of [${new_name}] to [${value}] failed.` ); }
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
