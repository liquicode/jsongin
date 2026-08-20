'use strict';
/*md

## Operators > Expression > $cos

Usage: `$cos: expression`

Returns the cosine of an angle measured in ***radians***.
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
				return arithmetic.UnaryNumber( Document, Args, '$cos',
					function ( Value )
					{
						arithmetic.RequireFinite( Value, '$cos' );
						return Math.cos( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$cos: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
