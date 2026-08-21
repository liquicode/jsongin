'use strict';
/*md

## Operators > Expression > $cosh

Usage: `$cosh: expression`

Returns the hyperbolic cosine of a value.
Every number is in the domain, so a large operand returns `Infinity` rather than throwing.

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
				return arithmetic.UnaryNumber( Document, Args, '$cosh',
					function ( Value )
					{
						return Math.cosh( Value );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$cosh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
