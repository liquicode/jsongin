'use strict';
/*md

## Operators > Update > $pullAll

Usage: `$pullAll: { field: value, ... }`

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
				if ( Engine.OpLog ) { Engine.OpLog( `$pullAll: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let array = Engine.GetValue( Document, field );
				if ( Engine.ShortType( array ) !== 'a' )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pullAll: The field [${field}] must be an array.` ); }
					continue;
				}
				let values = UpdateFields[ field ];
				if ( Engine.ShortType( values ) !== 'a' )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pullAll: The values to pull must be an array.` ); }
					continue;
				}
				for ( let index = ( array.length - 1 ); index >= 0; index-- )
				{
					if ( values.includes( array[ index ] ) )
					{
						array.splice( index, 1 );
					}
				}
				let result = Engine.SetValue( Document, field, array );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `$pullAll: Setting the field [${field}] failed.` ); }
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
