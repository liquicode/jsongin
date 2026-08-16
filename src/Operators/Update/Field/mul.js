'use strict';
/*md

## Operators > Update > $mul

Usage: `$mul: { field: value, ... }`

Multiplies a field by a number.

A field which is ***not there*** is treated as a zero, so `$mul` creates it and sets it to `0`,
  whatever the multiplier is.

The stored value and the multiplier must both be ***numbers***. A field holding a string, a
  boolean, a date, or a null is refused rather than coerced, and so is a non numeric multiplier.
A refused update leaves the whole document untouched.

*/

module.exports = function ( jsongin )
{
	const arith = require( './_arith' )( jsongin );

	//---------------------------------------------------------------------
	// Multiplies the stored value by the operand.
	function multiply( Value, Operand )
	{
		return ( Value * Operand );
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
				return arith.Apply( Document, UpdateFields, '$mul', multiply );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$mul: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
