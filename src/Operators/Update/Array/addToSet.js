'use strict';
/*md

## Operators > Update > $addToSet

Usage: `$addToSet: { field: value, ... }`

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
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `$addToSet: The UpdateFields parameter must be an object.` ); }
				return false;
			}

			for ( let field in UpdateFields )
			{
				let array = Engine.GetValue( Document, field );
				if ( Engine.ShortType( array ) !== 'a' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `$addToSet: The field [${field}] must be an array.` ); }
					continue;
				}
				if ( array.includes( UpdateFields[ field ] ) ) { continue; }
				array.push( UpdateFields[ field ] );
				let result = Engine.SetValue( Document, field, array );
				if ( result === false )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `$addToSet: Setting the field [${field}] failed.` ); }
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
