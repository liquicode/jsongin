'use strict';
/*md

## Operators > Expression > $ne

Usage: `$ne: [ expression1, expression2 ]`

Returns true when the two values are not equal.
Null and missing values are equivalent.

*/

module.exports = function ( jsongin )
{
	const compare = require( './_compare' )( jsongin );

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
				// See _compare.js for the argument handling and the comparison.
				return compare.Evaluate( Document, Args, '$ne',
					function ( Comparison ) { return ( Comparison !== 0 ); }, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ne: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
