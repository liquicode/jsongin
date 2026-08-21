'use strict';
/*md

## Operators > Expression > $strLenBytes

Usage: `$strLenBytes: expression`

The length of a string in ***UTF-8 bytes***.

***A null or missing operand is refused***, which is unlike the substring operators, where
  it is read as an empty string.

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
				let operands = string.Operands( Document, Args, '$strLenBytes', 1, 1, Scope );

				// Null is refused here, unlike the substring operators which read it as empty.
				let text = string.AsRequiredString( operands[ 0 ], '$strLenBytes' );

				return string.ToBytes( text ).length;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$strLenBytes: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
