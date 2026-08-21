'use strict';
/*md

## Operators > Expression > $degreesToRadians

Usage: `$degreesToRadians: expression`

Converts an angle from degrees to radians.
The trigonometric operators all take radians, so this is what feeds them an angle which was
  written in degrees.

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
				return arithmetic.UnaryNumber( Document, Args, '$degreesToRadians',
					function ( Value )
					{
						return ( Value * Math.PI / 180 );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$degreesToRadians: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
