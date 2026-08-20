'use strict';
/*md

## Operators > Expression > $isNumber

Usage: `$isNumber: expression`

Returns true when a value is a number.

***A null is answered rather than propagated.*** Most of this family returns null for a null
  operand; this one returns false, because the question it is asked has an answer.

*/

module.exports = function ( jsongin )
{

	const type = require( './_type' )( jsongin );

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
				let operands = type.Operands( Document, Args, '$isNumber', 1, 1 );

				return ( jsongin.ShortType( operands[ 0 ] ) === 'n' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$isNumber: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
