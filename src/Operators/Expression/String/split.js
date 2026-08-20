'use strict';
/*md

## Operators > Expression > $split

Usage: `$split: [ expression, delimiter ]`

Cuts a string into an array wherever the delimiter occurs.

A delimiter which does not occur gives the whole string as a single element, and one at
  an end leaves an empty element there.
An empty delimiter is refused rather than cutting between every character.
A null or missing operand gives null.

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
				let operands = string.Operands( Document, Args, '$split', 2, 2 );

				let text = string.AsStringOrNull( operands[ 0 ], '$split' );
				let delimiter = string.AsStringOrNull( operands[ 1 ], '$split' );
				if ( ( text === null ) || ( delimiter === null ) ) { return null; }

				// An empty delimiter would cut between every character, which MongoDB refuses
				// rather than guessing at.
				if ( delimiter.length === 0 )
				{
					throw new Error( '$split: the delimiter cannot be an empty string.' );
				}

				return text.split( delimiter );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$split: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
