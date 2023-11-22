'use strict';
/*md

## Operators > Update > $pop

Usage: `$pop: { field: -1|1, ... }`

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
				if ( Engine.OpLog ) { Engine.OpLog( `$pop: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let array = Engine.GetValue( Document, field );
				if ( Engine.ShortType( array ) !== 'a' )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pop: The field [${field}] must be an array.` ); }
					continue;
				}
				let direction = UpdateFields[ field ];
				if ( direction === -1 )
				{
					if ( array.length )
					{
						array.splice( 0, 1 );
					}
				}
				else if ( direction === 1 )
				{
					if ( array.length )
					{
						array.pop();
					}
				}
				else
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pop: Invalid direction value [${array}] for field [${field}], should be -1 or 1.` ); }
					continue;
				}
				let result = Engine.SetValue( Document, field, array );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pop: Setting the field [${field}] failed.` ); }
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
