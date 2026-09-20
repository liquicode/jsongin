'use strict';
/*md

## Operators > Accumulator > $median

Usage: `$median: { input: expression, method: 'approximate' }`

Returns the middle value of the numeric values in a group.

***This is [$percentile](#$percentile) at `p` 0.5, and answers a single value rather than an
  array.*** Everything that operator does with the group applies here: the answer is one of the
  values rather than an average of two, non-numeric values and `NaN` are ignored, and an
  infinity is kept.

***An even count answers the lower of the two middle values***, which follows from selecting by
  rank: four values answer the second of them.
Returns `null` when nothing in the group is numeric.

`method` is required and `'approximate'` is the only value accepted.
`p` is not given here.
Any other field in the argument document is refused.

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
				let args = percentile_args.Read( Args, '$median', false );
				let values = accumulator.Values( Documents, args.Input, Scope );

				let answers = accumulator.Percentiles( values, args.P );
				return answers[ 0 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$median: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
