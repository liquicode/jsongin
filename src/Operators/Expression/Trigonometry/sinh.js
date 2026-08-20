'use strict';
/*md

## Operators > Expression > $sinh

Usage: `$sinh: expression`

Returns the hyperbolic sine of a value.
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
		Evaluate: function ( Document, Args )
		{
			try
			{
				return arithmetic.UnaryNumber( Document, Args, '$sinh',
					function ( Value )
					{
						return Math.sinh( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$sinh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
