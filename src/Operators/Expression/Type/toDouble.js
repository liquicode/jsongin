'use strict';
/*md

## Operators > Expression > $toDouble

Usage: `$toDouble: expression`

Converts a value to a double. Unlike [$toInt](#$toInt) it does not truncate, it reads a fractional string, and it accepts NaN and the infinities.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				return type.ShorthandConversion( Document, Args, '$toDouble', 'double' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toDouble: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
