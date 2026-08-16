'use strict';
/*md

## Operators > Update > $inc

Usage: `$inc: { field: value, ... }`

Adds a number to a field.

A field which is ***not there*** is treated as a zero, so `$inc` creates it and sets it to the
  increment. This is how a counter is started.

The stored value and the increment must both be ***numbers***. A field holding a string, a
  boolean, a date, or a null is refused rather than coerced, and so is a non numeric increment.
A refused update leaves the whole document untouched.

*/

module.exports = function ( jsongin )
{
	const arith = require( './_arith' )( jsongin );

	//---------------------------------------------------------------------
	// Adds the operand to the stored value.
	function add( Value, Operand )
	{
		return ( Value + Operand );
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
				// See _arith.js for the MongoDB semantics this follows.
				return arith.Apply( Document, UpdateFields, '$inc', add );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$inc: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
