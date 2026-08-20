'use strict';
/*md

## Operators > Expression > $substr

Usage: `$substr: [ expression, start, length ]`

***Deprecated by MongoDB.*** This is another name for [$substrBytes](#$substrBytes) and
  behaves identically. Use [$substrCP](#$substrCP) for text which is not ASCII.

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
				let operands = string.Operands( Document, Args, '$substr', 3, 3 );

				let text = string.AsStringOrEmpty( operands[ 0 ], '$substr' );

				// A fractional position is truncated here and refused by $substrCP, and a
				// negative length means "to the end" here and is refused there. The two forms
				// really do disagree; see the String Operator Tests.
				let start = string.AsPosition( operands[ 1 ], '$substr', 'the starting position', true, false );
				let length = string.AsPosition( operands[ 2 ], '$substr', 'the length', true, true );

				let bytes = string.ToBytes( text );
				return string.Substring( bytes, start, length,
					function ( Slice ) { return string.FromBytes( Slice, '$substr' ); } );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$substr: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
