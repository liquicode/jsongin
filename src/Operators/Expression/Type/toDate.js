'use strict';
/*md

## Operators > Expression > $toDate

Usage: `$toDate: expression`

Converts a value to a date. A number is read as milliseconds since the epoch, and a string is parsed. A string carrying no time zone is read as UTC.

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
				return type.ShorthandConversion( Document, Args, '$toDate', 'date', Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toDate: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
