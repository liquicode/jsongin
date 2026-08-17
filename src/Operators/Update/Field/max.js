'use strict';
/*md

## Operators > Update > $max

Usage: `$max: { field: value, ... }`

Raises a field to the value, but only when the value is ***larger*** than what is stored.

***Comparison is by the BSON ordering***, not numeric, the same way `$min` compares. A field
  which is ***not there*** is set to the value.

*/

module.exports = function ( jsongin )
{
	const minmax = require( './_minmax' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			try
			{
				// 1 keeps the larger of the two values.
				// See _minmax.js for the MongoDB semantics this follows.
				return minmax.Apply( Document, UpdateFields, '$max', 1 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$max: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
