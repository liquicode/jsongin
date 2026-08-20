'use strict';
/*md

## Operators > Expression > $strcasecmp

Usage: `$strcasecmp: [ expression, expression ]`

Compares two strings without regard to case.

Returns `-1` when the first sorts before the second, `1` when it sorts after, and `0`
  when they are the same.
A null or missing operand is read as an empty string.

*/

module.exports = function ( jsongin )
{

	const string = require( './_string' )( jsongin );

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
				let operands = string.Operands( Document, Args, '$strcasecmp', 2, 2 );

				let text_a = string.AsStringOrEmpty( operands[ 0 ], '$strcasecmp' ).toUpperCase();
				let text_b = string.AsStringOrEmpty( operands[ 1 ], '$strcasecmp' ).toUpperCase();

				if ( text_a < text_b ) { return -1; }
				if ( text_a > text_b ) { return 1; }
				return 0;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$strcasecmp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
