'use strict';
/*md

## Operators > Expression > $atan

Usage: `$atan: expression`

Returns the inverse tangent of a value, in radians.
Every number is in the domain, unlike [$asin](#$asin) and [$acos](#$acos), because a tangent
  is unbounded.

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
				return arithmetic.UnaryNumber( Document, Args, '$atan',
					function ( Value )
					{
						return Math.atan( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$atan: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
