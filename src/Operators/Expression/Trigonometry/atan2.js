'use strict';
/*md

## Operators > Expression > $atan2

Usage: `$atan2: [ y, x ]`

Returns the inverse tangent of a coordinate pair, in radians.

***The two operands are not interchangeable with a single ratio.*** Their signs name the
  quadrant, so `$atan2: [ 0, -1 ]` is pi while `$atan2: [ 0, 1 ]` is zero, where dividing y by
  x would have given zero for both.

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
				return arithmetic.BinaryNumber( Document, Args, '$atan2',
					function ( ValueY, ValueX )
					{
						return Math.atan2( ValueY, ValueX );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$atan2: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
