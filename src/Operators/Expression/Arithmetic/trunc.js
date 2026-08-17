'use strict';
/*md

## Operators > Expression > $trunc

Usage: `$trunc: [ expression, place ]`
  or `$trunc: expression`

Truncates a number to a given decimal `place`, which defaults to `0`.
A ***negative*** place truncates to the left of the decimal point, so
  `{ $trunc: [ 1234, -2 ] }` gives `1200`.

***$trunc discards, it does not round***, and it discards toward zero.
`{ $trunc: [ -1.567, 1 ] }` gives `-1.5`, not `-1.6`.

A `null` or ***missing*** value or place gives `null`.
An operand which is present but is not a number is an error.

*/

module.exports = function ( jsongin )
{

	const rounding = require( './_rounding' )( jsongin );

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
				return rounding.ApplyAtPlace( Document, Args, '$trunc', rounding.TruncateTowardZero );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$trunc: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
