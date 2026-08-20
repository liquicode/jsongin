'use strict';
/*md

## Operators > Expression > $indexOfBytes

Usage: `$indexOfBytes: [ expression, search, start, end ]`

Where a substring first occurs, counted in ***UTF-8 bytes***, or `-1` when it does not.

`start` and `end` are optional and bound the search, and are counted in bytes too.
The whole of a match has to fall inside that window.
A null or missing input gives null.

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
				let operands = string.Operands( Document, Args, '$indexOfBytes', 2, 4 );

				let text = string.AsStringOrNull( operands[ 0 ], '$indexOfBytes' );
				if ( text === null ) { return null; }
				let search = string.AsRequiredString( operands[ 1 ], '$indexOfBytes' );

				let units = string.ToBytes( text );
				let needle = string.ToBytes( search );

				let start = 0;
				if ( operands.length > 2 )
				{
					start = string.AsPosition( operands[ 2 ], '$indexOfBytes', 'the starting position', false, false );
				}

				let end = units.length;
				if ( operands.length > 3 )
				{
					end = string.AsPosition( operands[ 3 ], '$indexOfBytes', 'the ending position', false, false );
				}

				// The whole of a match has to fall inside the window, so a window which ends
				// before it began, or begins past the end, finds nothing rather than throwing.
				if ( start > units.length ) { return -1; }
				if ( end > units.length ) { end = units.length; }
				if ( end < start ) { return -1; }

				return string.IndexOf( units, needle, start, end );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$indexOfBytes: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
