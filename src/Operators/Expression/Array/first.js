'use strict';
/*md

## Operators > Expression > $first

Usage: `$first: expression`

Returns the first element of an array.

A null or missing operand makes the result null, and anything else which is not an array throws.

***There is also an accumulator called `$first`***, which is a different operator with the
  same name: that one takes the the first element of an array reaching a `$group`. Which one applies is decided by
  where it is written. See
  [Accumulator Operators](./Accumulator-Operators.md).

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

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
				let operands = array.Operands( Document, Args, '$first', 1, 1 );

				let values = array.AsArrayOrNull( operands[ 0 ], '$first' );
				if ( values === null ) { return null; }
				if ( values.length === 0 ) { return undefined; }

				return values[ 0 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$first: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
