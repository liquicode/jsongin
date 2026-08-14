'use strict';
/*md

## Operators > Update > $addToSet

Usage: `$addToSet: { array-field: value, ... }`

Adds a value to an array field, but only when the array does not already contain it.

Values are compared by ***content***, using the same comparison as the query and expression
operators. A value which is an object, an array, or a date is therefore recognized as already
present, rather than being added again because it is a different instance.

Note that `$each` is not implemented, so one value is added per field.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns true when Values already contains Value.
	// Compares by content rather than by reference. Javascript's Array.includes() compares
	// with SameValueZero, which is a reference comparison for objects, arrays, and dates, so
	// using it here made $addToSet a set operation for primitives only.
	function set_contains( Values, Value )
	{
		for ( let index = 0; index < Values.length; index++ )
		{
			if ( jsongin.CompareValues( Values[ index ], Value ) === 0 ) { return true; }
		}
		return false;
	}


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
			try
			{
				if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

				let operation_result = true;
				for ( let field in UpdateFields )
				{
					let array = jsongin.GetValue( Document, field );
					if ( jsongin.ShortType( array ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$addToSet: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}
					let value = UpdateFields[ field ];
					if ( set_contains( array, value ) ) { continue; }
					array.push( jsongin.SafeClone( value ) );
					let result = jsongin.SetValue( Document, field, array );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$addToSet: Setting the value of [${field}] to [${JSON.stringify( array )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$addToSet: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
