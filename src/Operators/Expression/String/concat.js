'use strict';
/*md

## Operators > Expression > $concat

Usage: `$concat: [ expression, ... ]`

Joins strings end to end.

***A null or missing operand makes the whole result null***, rather than contributing an
  empty string. Every other operand must be a string: a number is refused rather than
  rendered.

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
				let operands = string.Operands( Document, Args, '$concat', 0, null );

				let parts = [];
				for ( let index = 0; index < operands.length; index++ )
				{
					let part = string.AsStringOrNull( operands[ index ], '$concat' );
					// One null operand makes the whole result null.
					if ( part === null ) { return null; }
					parts.push( part );
				}

				return parts.join( '' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$concat: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
