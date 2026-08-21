'use strict';
/*md

## Operators > Expression > $acos

Usage: `$acos: expression`

Returns the inverse cosine of a value, in radians.
The operand must lie between -1 and 1; anything outside that throws, because no angle has a
  cosine beyond those bounds.

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
				return arithmetic.UnaryNumber( Document, Args, '$acos',
					function ( Value )
					{
						if ( ( Value < -1 ) || ( Value > 1 ) ) { throw new Error( `$acos: requires an operand between -1 and 1 but found ${Value} instead.` ); }
						return Math.acos( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$acos: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
