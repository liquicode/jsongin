'use strict';
/*md

## Operators > Expression > $tan

Usage: `$tan: expression`

Returns the tangent of an angle measured in ***radians***.
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
		Evaluate: function ( Document, Args )
		{
			try
			{
				return arithmetic.UnaryNumber( Document, Args, '$tan',
					function ( Value )
					{
						arithmetic.RequireFinite( Value, '$tan' );
						return Math.tan( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$tan: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
