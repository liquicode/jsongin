'use strict';
/*md

## Operators > Update > $pullAll

Usage: `$pullAll: { array-field: [ value, ... ], ... }`

Removes every instance of the given values from an array field.

Values are matched by ***content***, using the same comparison as the query and expression
operators. A value which is an object, an array, or a date is therefore removed by writing an
equal value, rather than only by writing the very instance which is in the array.

A value which is not in the array is not an error; nothing is removed for it.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns true when Values contains Value.
	// Compares by content rather than by reference. Javascript's Array.includes() compares with
	// SameValueZero, which is a reference comparison for objects, arrays, and dates, so using it
	// here made $pullAll work on primitives only. This is what $addToSet does.
	function contains_value( Values, Value )
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
					if ( jsongin.ShortType( array ) === 'u' )
					{
						// A field which is not there has nothing to pull from, and MongoDB
						// reports a successful update with modifiedCount 0 rather than an
						// error. Verified against MongoDB 6.0.1. This is a no-op and not a
						// refusal: the two used to share a branch, so once Update() began
						// raising a refusal, pulling from a field which was not there raised
						// too.
						continue;
					}
					if ( jsongin.ShortType( array ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pullAll: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}
					let values = UpdateFields[ field ];
					if ( jsongin.ShortType( values ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pullAll: The values to pull must be an array.` ); }
						operation_result = false;
						continue;
					}
					// Walked backwards so that removing an element does not shift the ones which
					// have not been examined yet.
					for ( let index = ( array.length - 1 ); index >= 0; index-- )
					{
						if ( contains_value( values, array[ index ] ) )
						{
							array.splice( index, 1 );
						}
					}
					let result = jsongin.SetValue( Document, field, array );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pullAll: Setting the value of [${field}] to [${JSON.stringify( array )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$pullAll: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
