'use strict';
/*md

## Operators > Expression > $radiansToDegrees

Usage: `$radiansToDegrees: expression`

Converts an angle from radians to degrees.
This is what makes the result of [$asin](#$asin), [$acos](#$acos), or [$atan2](#$atan2)
  readable as an angle.

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
				return arithmetic.UnaryNumber( Document, Args, '$radiansToDegrees',
					function ( Value )
					{
						return ( Value * 180 / Math.PI );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$radiansToDegrees: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
