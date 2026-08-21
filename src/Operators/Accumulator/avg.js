'use strict';
/*md

## Operators > Accumulator > $avg

Usage: `$avg: expression`

Returns the average of the numeric values in a group.
***Non-numeric values are ignored***, including null and missing values, and they do not
  count toward the divisor.
Returns `null` for an empty group and for a group in which nothing is numeric.

As with `$sum`, ignoring non-numeric values is deliberate and differs from the expression
  operators, which throw on a non-numeric operand.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let values = accumulator.Values( Documents, Args, Scope );

				let total = 0;
				let count = 0;
				for ( let index = 0; index < values.length; index++ )
				{
					// Non-numeric values are ignored, and are left out of the count as well as
					// the total, so the average is taken over the numbers alone.
					//
					// ***A NaN is a number and is not ignored.*** It is averaged like any
					// other double and takes the result with it, which is what MongoDB does.
					// Verified against MongoDB 6.0.1. See $sum for the same rule.
					if ( jsongin.ShortType( values[ index ] ) !== 'n' ) { continue; }
					total += values[ index ];
					count++;
				}

				if ( count === 0 ) { return null; }
				return ( total / count );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$avg: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
