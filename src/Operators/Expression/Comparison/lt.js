'use strict';
/*md

## Operators > Expression > $lt

Usage: `$lt: [ expression1, expression2 ]`

Returns true when the first value is less than the second.

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
				return compare.Evaluate( Document, Args, '$lt',
					function ( Comparison ) { return ( Comparison < 0 ); }, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$lt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
