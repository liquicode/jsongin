'use strict';
/*md

## Operators > Expression > $multiply

Usage: `$multiply: [ expression1, expression2, ... ]`

Multiplies numbers together.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// A single argument may be given without the enclosing array, so any expression type.
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$multiply', 1, null );

				let has_null = false;
				let product = 1;
				for ( let index = 0; index < operands.length; index++ )
				{
					let number = arithmetic.AsOperandNumber( operands[ index ], '$multiply' );
					if ( number === null )
					{
						// Continue in order to validate the remaining operands.
						has_null = true;
						continue;
					}
					product *= number;
				}

				if ( has_null ) { return null; }
				return product;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$multiply: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
