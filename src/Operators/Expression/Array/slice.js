'use strict';
/*md

## Operators > Expression > $slice

Usage: `$slice: [ array, n ]`
  or `$slice: [ array, position, n ]`

Returns a subset of an array.

***The two forms read `n` differently, which is the thing to be careful of:***

- With ***two*** operands, `n` is how many elements to take from the front, and a ***negative***
  `n` takes them from the back instead.
- With ***three***, `position` is where to start — negative counts back from the end — and `n`
  is how many to take from there. Here a negative `n` is refused, because the direction has
  already been said.

Asking for more elements than there are gives what there is.
A null or missing array makes the result null.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'a',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = array.Operands( Document, Args, '$slice', 2, 3 );

				let values = array.AsArrayOrNull( operands[ 0 ], '$slice' );
				if ( values === null ) { return null; }

				if ( operands.length === 2 )
				{
					let count = array.AsWholeNumber( operands[ 1 ], '$slice', 'count' );
					if ( count < 0 ) { return values.slice( count ); }
					return values.slice( 0, count );
				}

				let position = array.AsWholeNumber( operands[ 1 ], '$slice', 'position' );
				let count = array.AsWholeNumber( operands[ 2 ], '$slice', 'count' );
				if ( count < 0 )
				{
					throw new Error( `$slice: requires a count of zero or more when a position is given.` );
				}

				let start = position;
				if ( start < 0 )
				{
					start = values.length + start;
					// A position reaching back past the front starts at the front.
					if ( start < 0 ) { start = 0; }
				}

				return values.slice( start, start + count );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$slice: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
