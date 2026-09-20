'use strict';
/*md

## Operators > Expression > $percentile

Usage: `$percentile: { input: expression, p: [ number, ... ], method: 'approximate' }`

Returns one value per `p`, in the order the `p` values were asked for.

***A percentile selects a value by rank and never interpolates.*** For values sorted from
  smallest to largest, the value answered for a given `p` is the one at `ceil( p * count ) - 1`,
  counting from zero.

`input` supplies the values: an array is the list, and anything else is a list of one, so
  `$percentile: { input: 5, p: [ 0.5 ], method: 'approximate' }` answers `[ 5 ]`.

***Non-numeric values are ignored***, including null and missing values, and so is a `NaN`,
  which cannot be put in rank order. An infinity is kept and sorts to its end.
Returns `null` for each `p` when nothing given to it is numeric.

`method` is required and `'approximate'` is the only value accepted.
`p` is required, and is an array of numbers from 0.0 through 1.0 which must be written
  literally rather than read from a field.
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
				let args = percentile_args.Read( Args, '$percentile', true );

				let value = jsongin.Evaluate( Document, args.Input, Scope );
				let values = value;
				if ( jsongin.ShortType( values ) !== 'a' ) { values = [ value ]; }

				return accumulator.Percentiles( values, args.P );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$percentile: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
