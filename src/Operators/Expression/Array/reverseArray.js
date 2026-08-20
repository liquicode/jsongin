'use strict';
/*md

## Operators > Expression > $reverseArray

Usage: `$reverseArray: expression`

Returns an array with its elements in reverse order.
A null or missing operand makes the result null, and anything else which is not an array throws.

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
				let operands = array.Operands( Document, Args, '$reverseArray', 1, 1 );

				let values = array.AsArrayOrNull( operands[ 0 ], '$reverseArray' );
				if ( values === null ) { return null; }

				// slice() first, so the document's own array is not reordered in place.
				return values.slice().reverse();
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$reverseArray: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
