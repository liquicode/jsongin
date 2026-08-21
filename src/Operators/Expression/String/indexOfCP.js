'use strict';
/*md

## Operators > Expression > $indexOfCP

Usage: `$indexOfCP: [ expression, search, start, end ]`

Where a substring first occurs, counted in ***code points***, or `-1` when it does not.

The same search as [$indexOfBytes](#$indexOfBytes), counted the way a reader counts.
For `'héllo'` the letter `l` is at 2 here and at 3 there, because the accent is two bytes.

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
				let operands = string.Operands( Document, Args, '$indexOfCP', 2, 4, Scope );

				let text = string.AsStringOrNull( operands[ 0 ], '$indexOfCP' );
				if ( text === null ) { return null; }
				let search = string.AsRequiredString( operands[ 1 ], '$indexOfCP' );

				let units = string.CodePoints( text );
				let needle = string.CodePoints( search );

				let start = 0;
				if ( operands.length > 2 )
				{
					start = string.AsPosition( operands[ 2 ], '$indexOfCP', 'the starting position', false, false );
				}

				let end = units.length;
				if ( operands.length > 3 )
				{
					end = string.AsPosition( operands[ 3 ], '$indexOfCP', 'the ending position', false, false );
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
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$indexOfCP: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
