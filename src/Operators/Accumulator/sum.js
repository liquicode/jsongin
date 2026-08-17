'use strict';
/*md

## Operators > Accumulator > $sum

Usage: `$sum: expression`

Returns the sum of the numeric values in a group.
***Non-numeric values are ignored***, including null and missing values.
Returns `0` for an empty group and for a group in which nothing is numeric.

Use `$sum: 1` to count the documents in a group.

Note that this is the accumulator `$sum` and not the expression operator `$add`.
`$add` throws when an operand is not numeric, because an expression is authored against a
  single document and a type error there is an authoring mistake worth surfacing.
`$sum` runs across a whole group, where one malformed document should not abort the report.
The difference is deliberate and both behaviors are what MongoDB does.

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
				for ( let index = 0; index < values.length; index++ )
				{
					// Non-numeric values are ignored, which is MongoDB's rule for $sum: a
					// string or a document in the stream contributes nothing rather than
					// making the whole total an error.
					//
					// ***A NaN is a number and is not ignored.*** It accumulates like any
					// other double and takes the total with it, which is what MongoDB does.
					// It used to be skipped alongside the non-numeric values, which quietly
					// produced a total that looked sound.
					// Verified against MongoDB 6.0.1.
					if ( jsongin.ShortType( values[ index ] ) !== 'n' ) { continue; }
					total += values[ index ];
				}

				return total;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$sum: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
