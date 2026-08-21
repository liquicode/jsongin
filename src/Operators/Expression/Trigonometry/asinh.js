'use strict';
/*md

## Operators > Expression > $asinh

Usage: `$asinh: expression`

Returns the inverse hyperbolic sine of a value.
Every number is in the domain; it is the only one of the three inverse hyperbolics for which
  that is true.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

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
				return arithmetic.UnaryNumber( Document, Args, '$asinh',
					function ( Value )
					{
						return Math.asinh( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$asinh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
