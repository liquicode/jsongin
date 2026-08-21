'use strict';
/*md

## Operators > Expression > $indexOfArray

Usage: `$indexOfArray: [ array, value ]`
  or `$indexOfArray: [ array, value, start ]`
  or `$indexOfArray: [ array, value, start, end ]`

Returns the index of the first element which matches the value, or `-1` when none does.

Elements are compared by ***content***, the same way [$eq](#$eq) compares, so a document or an
  array can be searched for.
The search may be narrowed to a range, where `start` is included and `end` is not.
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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = array.Operands( Document, Args, '$indexOfArray', 2, 4, Scope );

				let values = array.AsArrayOrNull( operands[ 0 ], '$indexOfArray' );
				if ( values === null ) { return null; }

				let wanted = operands[ 1 ];

				let start = 0;
				if ( operands.length >= 3 )
				{
					start = array.AsWholeNumber( operands[ 2 ], '$indexOfArray', 'start' );
					if ( start < 0 ) { throw new Error( `$indexOfArray: requires a start of zero or more.` ); }
				}

				let end = values.length;
				if ( operands.length === 4 )
				{
					end = array.AsWholeNumber( operands[ 3 ], '$indexOfArray', 'end' );
					if ( end < 0 ) { throw new Error( `$indexOfArray: requires an end of zero or more.` ); }
					if ( end > values.length ) { end = values.length; }
				}

				for ( let index = start; index < end; index++ )
				{
					if ( jsongin.CompareValues( values[ index ], wanted ) === 0 ) { return index; }
				}

				return -1;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$indexOfArray: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
