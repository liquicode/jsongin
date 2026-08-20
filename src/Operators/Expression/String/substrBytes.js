'use strict';
/*md

## Operators > Expression > $substrBytes

Usage: `$substrBytes: [ expression, start, length ]`

Part of a string, counted in ***UTF-8 bytes***.

A length below zero means "to the end", and a fractional position is truncated.
***A range which starts or ends inside a multi-byte character is refused***, because
  those bytes do not spell a string. That is the cost of counting bytes, and the reason
  [$substrCP](#$substrCP) exists.
A null or missing operand is read as an empty string.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = string.Operands( Document, Args, '$substrBytes', 3, 3 );

				let text = string.AsStringOrEmpty( operands[ 0 ], '$substrBytes' );

				// A fractional position is truncated here and refused by $substrCP, and a
				// negative length means "to the end" here and is refused there. The two forms
				// really do disagree; see the String Operator Tests.
				let start = string.AsPosition( operands[ 1 ], '$substrBytes', 'the starting position', true, false );
				let length = string.AsPosition( operands[ 2 ], '$substrBytes', 'the length', true, true );

				let bytes = string.ToBytes( text );
				return string.Substring( bytes, start, length,
					function ( Slice ) { return string.FromBytes( Slice, '$substrBytes' ); } );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$substrBytes: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
