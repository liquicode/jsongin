'use strict';
/*md

## Operators > Expression > $round

Usage: `$round: [ expression, place ]`
  or `$round: expression`

Rounds a number to a given decimal `place`, which defaults to `0`.
A ***negative*** place rounds to the left of the decimal point, so `{ $round: [ 1234, -2 ] }`
  gives `1200`.

***A value exactly half way is rounded to the even neighbour***, which is what MongoDB does and
  is not what `Math.round()` does.
`{ $round: [ 2.5 ] }` gives `2` while `{ $round: [ 3.5 ] }` gives `4`.

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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				return rounding.ApplyAtPlace( Document, Args, '$round', rounding.RoundHalfToEven, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$round: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
