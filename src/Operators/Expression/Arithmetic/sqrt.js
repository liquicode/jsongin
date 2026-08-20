'use strict';
/*md

## Operators > Expression > $sqrt

Usage: `$sqrt: expression`

Returns the square root of a number.
The operand must be zero or greater; a negative operand throws an error.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

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
				return arithmetic.UnaryNumber( Document, Args, '$sqrt',
					function ( Value )
					{
						// Math.sqrt answers NaN here. MongoDB refuses, so the domain is checked.
						if ( Value < 0 ) { throw new Error( `$sqrt: requires an operand of zero or greater but found ${Value} instead.` ); }
						return Math.sqrt( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$sqrt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
