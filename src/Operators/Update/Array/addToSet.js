'use strict';
/*md

## Operators > Update > $addToSet

Usage: `$addToSet: { array-field: value, ... }`
  or `$addToSet: { array-field: { $each: [ value, ... ] }, ... }`

Adds a value to an array field, but only when the array does not already contain it.

A document carrying `$each` adds every element of the `$each` array, each one subject to the
same test. Any other value, including a document with no `$each`, is added as a single value.

Values are compared by ***content***, using the same comparison as the query and expression
operators. A value which is an object, an array, or a date is therefore recognized as already
present, rather than being added again because it is a different instance.

Note that a value added within one `$each` is also tested against the ones added before it, so
a repeated value is added once.

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
					let array_type = jsongin.ShortType( array );
					if ( array_type === 'u' )
					{
						// A field which is not there is created as an array holding what is
						// added, and the path to it is created with it. Verified against
						// MongoDB 6.0.1. This used to refuse the update, the same way $push
						// did before it was fixed.
						array = [];
						array_type = 'a';
					}
					if ( array_type !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$addToSet: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}
					let value = UpdateFields[ field ];

					// A document carrying $each adds each of its elements. Anything else, an
					// object with no $each included, is a single value.
					let elements = [ value ];
					if ( ( jsongin.ShortType( value ) === 'o' ) && ( typeof value.$each !== 'undefined' ) )
					{
						if ( jsongin.ShortType( value.$each ) !== 'a' )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$addToSet: The $each of [${field}] must be an array.` ); }
							operation_result = false;
							continue;
						}
						elements = value.$each;
					}

					// Tested against the array as it grows, so a value repeated within one
					// $each is added once.
					for ( let index = 0; index < elements.length; index++ )
					{
						if ( set_contains( array, elements[ index ] ) ) { continue; }
						array.push( jsongin.SafeClone( elements[ index ] ) );
					}

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
