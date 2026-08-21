'use strict';
/*md

## Operators > Expression > $substrCP

Usage: `$substrCP: [ expression, start, length ]`

Part of a string, counted in ***code points***.

This is the operator to reach for when the text may not be ASCII: it cannot split a
  character, because it never counts in bytes.

***It is stricter about its position operands than [$substrBytes](#$substrBytes)***, which
  is MongoDB's behavior rather than a choice made here: a fractional position and a
  negative length are both refused, where the byte form truncates the one and reads the
  other as "to the end".

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
				let operands = string.Operands( Document, Args, '$substrCP', 3, 3, Scope );

				let text = string.AsStringOrEmpty( operands[ 0 ], '$substrCP' );

				// Stricter than $substrBytes on purpose: a fractional position and a negative
				// length are both refused here and both accepted there.
				let start = string.AsPosition( operands[ 1 ], '$substrCP', 'the starting position', false, false );
				let length = string.AsPosition( operands[ 2 ], '$substrCP', 'the length', false, false );

				let code_points = string.CodePoints( text );
				return string.Substring( code_points, start, length,
					function ( Slice ) { return Slice.join( '' ); } );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$substrCP: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
