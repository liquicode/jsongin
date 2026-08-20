'use strict';
/*md

## Operators > Expression > $firstN

Usage: `$firstN: { input: expression, n: number }`

Returns the first `n` elements of an array, in the order they are in.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let read = array.ReadInputN( Document, Args, '$firstN' );
				return ( read.Values.slice( 0, read.Count ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$firstN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
