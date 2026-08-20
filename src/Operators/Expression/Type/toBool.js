'use strict';
/*md

## Operators > Expression > $toBool

Usage: `$toBool: expression`

Converts a value to a boolean. ***Every string is true, the empty one included***, and so is every array, object, and date. Only the number zero and the boolean false are false.

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
				return type.ShorthandConversion( Document, Args, '$toBool', 'bool' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$toBool: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
