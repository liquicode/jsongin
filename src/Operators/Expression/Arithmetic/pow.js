'use strict';
/*md

## Operators > Expression > $pow

Usage: `$pow: [ expression, exponent ]`

Raises a number to the given power.
A base of zero cannot carry a negative exponent, because the result is unbounded; that throws.

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
				return arithmetic.BinaryNumber( Document, Args, '$pow',
					function ( Value, Exponent )
					{
						// Math.pow answers Infinity here and MongoDB refuses.
						if ( ( Value === 0 ) && ( Exponent < 0 ) ) { throw new Error( `$pow: cannot raise zero to a negative exponent.` ); }
						return Math.pow( Value, Exponent );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$pow: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
