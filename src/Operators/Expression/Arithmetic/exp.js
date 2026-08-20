'use strict';
/*md

## Operators > Expression > $exp

Usage: `$exp: expression`

Raises Euler's number to the given power.
Every number is in the domain, so a large operand returns `Infinity` rather than throwing.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

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
				return arithmetic.UnaryNumber( Document, Args, '$exp',
					function ( Value )
					{
						return Math.exp( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$exp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
