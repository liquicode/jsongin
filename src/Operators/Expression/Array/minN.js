'use strict';
/*md

## Operators > Expression > $minN

Usage: `$minN: { input: expression, n: number }`

Returns the `n` smallest values of an array, ***smallest first***. The result is in BSON order rather than in the order the elements were written.

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
				let read = array.ReadInputN( Document, Args, '$minN' );
				return ( array.SortedValues( read.Values, false ).slice( 0, read.Count ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$minN: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
