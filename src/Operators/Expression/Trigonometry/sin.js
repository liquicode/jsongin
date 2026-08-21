'use strict';
/*md

## Operators > Expression > $sin

Usage: `$sin: expression`

Returns the sine of an angle measured in ***radians***.
Use [$degreesToRadians](#$degreesToRadians) when the angle is in degrees.

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
				return arithmetic.UnaryNumber( Document, Args, '$sin',
					function ( Value )
					{
						arithmetic.RequireFinite( Value, '$sin' );
						return Math.sin( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$sin: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
