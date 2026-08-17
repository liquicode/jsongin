'use strict';
/*md

## Operators > Expression > $cmp

Usage: `$cmp: [ expression1, expression2 ]`

Compares two values and returns:
- `-1` when the first value is less than the second.
- `0` when the two values are equal.
- `1` when the first value is greater than the second.

*/

module.exports = function ( jsongin )
{
	const compare = require( './_compare' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'a',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				// See _compare.js for the argument handling and the comparison.
				// This is the one operator of the seven which returns the comparison itself
				// rather than a boolean made from it.
				return compare.Evaluate( Document, Args, '$cmp',
					function ( Comparison ) { return Comparison; } );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$cmp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
