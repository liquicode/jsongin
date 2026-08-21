'use strict';
/*md

## Operators > Expression > $log10

Usage: `$log10: expression`

Returns the base 10 logarithm of a number.
The operand must be greater than zero; zero and negative operands throw an error.

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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				return arithmetic.UnaryNumber( Document, Args, '$log10',
					function ( Value )
					{
						if ( Value <= 0 ) { throw new Error( `$log10: requires an operand greater than zero but found ${Value} instead.` ); }
						return Math.log10( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$log10: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
