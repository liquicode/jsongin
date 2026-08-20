'use strict';
/*md

## Operators > Expression > $tanh

Usage: `$tanh: expression`

Returns the hyperbolic tangent of a value.
The result always lies between -1 and 1, which is what makes [$atanh](#$atanh) refuse anything
  outside those bounds.

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
				return arithmetic.UnaryNumber( Document, Args, '$tanh',
					function ( Value )
					{
						return Math.tanh( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$tanh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
