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
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let values = accumulator.Values( Documents, Args );

				let total = 0;
				let count = 0;
				for ( let index = 0; index < values.length; index++ )
				{
					// Non-numeric values are ignored.
					if ( jsongin.ShortType( values[ index ] ) !== 'n' ) { continue; }
					if ( isNaN( values[ index ] ) ) { continue; }
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
