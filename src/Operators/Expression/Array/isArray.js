'use strict';
/*md

## Operators > Expression > $isArray

Usage: `$isArray: expression`

Returns true when a value is an array.

***It answers rather than propagating***, so a null operand gives `false` and not `null`. It is
  the only operator in this family which does, because the question it asks has an answer for
  a null.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

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
				let operands = array.Operands( Document, Args, '$isArray', 1, 1, Scope );

				return ( jsongin.ShortType( operands[ 0 ] ) === 'a' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$isArray: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
