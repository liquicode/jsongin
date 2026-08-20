'use strict';
/*md

## Operators > Expression > $last

Usage: `$last: expression`

Returns the last element of an array.

A null or missing operand makes the result null, and anything else which is not an array throws.

***There is also an accumulator called `$last`***, which is a different operator with the
  same name: that one takes the the last element of an array reaching a `$group`. Which one applies is decided by
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
				let operands = array.Operands( Document, Args, '$last', 1, 1 );

				let values = array.AsArrayOrNull( operands[ 0 ], '$last' );
				if ( values === null ) { return null; }
				if ( values.length === 0 ) { return undefined; }

				return values[ values.length - 1 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$last: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
