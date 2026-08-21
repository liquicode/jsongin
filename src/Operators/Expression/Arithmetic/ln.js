'use strict';
/*md

## Operators > Expression > $ln

Usage: `$ln: expression`

Returns the natural logarithm of a number.
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
				return arithmetic.UnaryNumber( Document, Args, '$ln',
					function ( Value )
					{
						// Zero is outside the domain. Math.log answers -Infinity for it and
						// MongoDB refuses it, so this cannot be left to Javascript.
						if ( Value <= 0 ) { throw new Error( `$ln: requires an operand greater than zero but found ${Value} instead.` ); }
						return Math.log( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ln: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
