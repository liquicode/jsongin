'use strict';
/*md

## Operators > Expression > $median

Usage: `$median: { input: expression, method: 'approximate' }`

Returns the middle value of the numeric values given to it.

***This is [$percentile](#$percentile) at `p` 0.5, and answers a single value rather than an
  array.*** Everything that operator does applies here: the answer is one of the values rather
  than an average of two, non-numeric values and `NaN` are ignored, and an infinity is kept.

***An even count answers the lower of the two middle values***, which follows from selecting by
  rank: four values answer the second of them.

`input` supplies the values: an array is the list, and anything else is a list of one.
Returns `null` when nothing given to it is numeric.

`method` is required and `'approximate'` is the only value accepted.
`p` is not given here.
Any other field in the argument document is refused.

This is the expression operator. The accumulator of the same name reads a field across a group
  of documents, and answers the same way.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( '../../Accumulator/_accumulator' )( jsongin );
	const percentile_args = require( '../../Accumulator/_percentile-args' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// The argument is always a document, which ShortType answers 'o' for.
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let args = percentile_args.Read( Args, '$median', false );

				let value = jsongin.Evaluate( Document, args.Input, Scope );
				let values = value;
				if ( jsongin.ShortType( values ) !== 'a' ) { values = [ value ]; }

				let answers = accumulator.Percentiles( values, args.P );
				return answers[ 0 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$median: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
