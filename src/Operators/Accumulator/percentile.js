'use strict';
/*md

## Operators > Accumulator > $percentile

Usage: `$percentile: { input: expression, p: [ number, ... ], method: 'approximate' }`

Returns one value per `p`, in the order the `p` values were asked for.

***A percentile selects a value by rank and never interpolates.*** The answer is always one of
  the values in the group. For values sorted from smallest to largest, the value answered for a
  given `p` is the one at `ceil( p * count ) - 1`, counting from zero.

***Non-numeric values are ignored***, including null and missing values, the same rule `$sum`
  and `$avg` follow. A `NaN` is ignored as well, because it cannot be put in rank order, where
  an infinity is kept and sorts to its end.
Returns `null` for each `p` when nothing in the group is numeric.

`method` is required and `'approximate'` is the only value accepted.
`p` is required, and is an array of numbers from 0.0 through 1.0 which must be written
  literally rather than read from a field.
Any other field in the argument document is refused.

See [$median](#$median) for the same operator at `p` 0.5.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );
	const percentile_args = require( './_percentile-args' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// The argument is always a document, which ShortType answers 'o' for.
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let args = percentile_args.Read( Args, '$percentile', true );
				let values = accumulator.Values( Documents, args.Input, Scope );

				return accumulator.Percentiles( values, args.P );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$percentile: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
