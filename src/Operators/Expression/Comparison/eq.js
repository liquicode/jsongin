'use strict';
/*md

## Operators > Expression > $eq

Usage: `$eq: [ expression1, expression2 ]`

Returns true when the two values are equal.
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
				// See _compare.js for the argument handling and the comparison, including why
				// this is not jsongin.StrictEquals.
				return compare.Evaluate( Document, Args, '$eq',
					function ( Comparison ) { return ( Comparison === 0 ); }, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$eq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
