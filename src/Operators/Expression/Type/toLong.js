'use strict';
/*md

## Operators > Expression > $toLong

Usage: `$toLong: expression`

Converts a value to a 64 bit integer. It differs from [$toInt](#$toInt) in two ways: the range is far wider, and a date reads as milliseconds since the epoch instead of throwing.

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
				return type.ShorthandConversion( Document, Args, '$toLong', 'long' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toLong: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
