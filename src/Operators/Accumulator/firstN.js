'use strict';
/*md

## Operators > Accumulator > $firstN

Usage: `$firstN: { input: expression, n: count }`

Returns the first `n` values of a group, in the order the group arrived in.

***This is positional and not comparative***, so what it answers depends on a `$sort` earlier
  in the pipeline, and ***a missing value is reported as a null*** rather than being left out.
  [$minN](#$minN) does the opposite on both counts.

A group with fewer than `n` values in it answers all of them.
`n` must be a whole number of one or more, and is evaluated without a document, so it cannot
  vary from one document of the group to the next.

***There is also an expression operator called `$firstN`***, which takes the first elements of
  an array. See [Expression Operators](./Expression-Operators.md#$firstN).

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args, Scope )
		{
			try
			{
				let read = accumulator.ReadN( Documents, Args, '$firstN', Scope );

				return accumulator.AsReportedValues( read.Values.slice( 0, read.N ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$firstN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
