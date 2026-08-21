'use strict';
/*md

## Operators > Expression > $strLenCP

Usage: `$strLenCP: expression`

The length of a string in ***code points***.

This is the count a reader would give. `'héllo'` is five code points and six bytes, so
  this returns 5 where [$strLenBytes](#$strLenBytes) returns 6.
A null or missing operand is refused.

*/

module.exports = function ( jsongin )
{

	const string = require( './_string' )( jsongin );

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
				let operands = string.Operands( Document, Args, '$strLenCP', 1, 1, Scope );

				// Null is refused here, unlike the substring operators which read it as empty.
				let text = string.AsRequiredString( operands[ 0 ], '$strLenCP' );

				return string.CodePoints( text ).length;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$strLenCP: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
