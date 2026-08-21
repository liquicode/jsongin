'use strict';
/*md

## Operators > Expression > $toString

Usage: `$toString: expression`

Converts a value to a string. A date becomes an ISO 8601 string, and a number, boolean, or string is rendered as it reads. An array or an object throws.

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
				return type.ShorthandConversion( Document, Args, '$toString', 'string', Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toString: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
