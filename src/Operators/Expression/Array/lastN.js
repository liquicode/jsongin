'use strict';
/*md

## Operators > Expression > $lastN

Usage: `$lastN: { input: expression, n: number }`

Returns the last `n` elements of an array, in the order they are in.

***Asking for more elements than there are is not an error***, and gives what there is.
`n` must be a whole number of one or more.
A null or missing input makes the result null.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = array.ReadInputN( Document, Args, '$lastN', Scope );
				return ( read.Values.slice( Math.max( 0, read.Values.length - read.Count ) ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$lastN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
