'use strict';
/*md

## Operators > Expression > $acosh

Usage: `$acosh: expression`

Returns the inverse hyperbolic cosine of a value.
The operand must be 1 or greater; anything below throws.
***The domain begins at one, not at zero***, because a hyperbolic cosine never falls below one.

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
				return arithmetic.UnaryNumber( Document, Args, '$acosh',
					function ( Value )
					{
						if ( Value < 1 ) { throw new Error( `$acosh: requires an operand of one or greater but found ${Value} instead.` ); }
						return Math.acosh( Value );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$acosh: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
