'use strict';
/*md

## Operators > Expression > $toInt

Usage: `$toInt: expression`

Converts a value to a 32 bit integer. A fractional number is truncated rather than rounded, a string must read as a whole integer, and a value outside the int32 range throws. A date has no int reading and throws.

A null or missing operand makes the result null.
This is a shorthand for [$convert](#$convert), which adds `onError` and `onNull`.

*/

module.exports = function ( jsongin )
{

	const type = require( './_type' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				return type.ShorthandConversion( Document, Args, '$toInt', 'int', Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toInt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
