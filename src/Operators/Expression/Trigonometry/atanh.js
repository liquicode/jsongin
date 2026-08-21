'use strict';
/*md

## Operators > Expression > $atanh

Usage: `$atanh: expression`

Returns the inverse hyperbolic tangent of a value.
The operand must lie between -1 and 1, since those are the bounds a
  [$tanh](#$tanh) result never leaves.
***The bounds themselves are answerable***: -1 and 1 return `-Infinity` and `Infinity` rather
  than throwing, and only values beyond them throw.

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
				return arithmetic.UnaryNumber( Document, Args, '$atanh',
					function ( Value )
					{
						if ( ( Value < -1 ) || ( Value > 1 ) ) { throw new Error( `$atanh: requires an operand between -1 and 1 but found ${Value} instead.` ); }
						return Math.atanh( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$atanh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
