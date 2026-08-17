'use strict';
/*md

## Operators > Update > $min

Usage: `$min: { field: value, ... }`

Lowers a field to the value, but only when the value is ***smaller*** than what is stored.

***Comparison is by the BSON ordering***, not numeric, so strings, dates, booleans, and
  comparisons between different types all work. A field which is ***not there*** is set to the
  value, since there is nothing to compare against. A field holding `null` is compared rather
  than treated as missing.

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
				// -1 keeps the smaller of the two values.
				// See _minmax.js for the MongoDB semantics this follows.
				return minmax.Apply( Document, UpdateFields, '$min', -1 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$min: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
