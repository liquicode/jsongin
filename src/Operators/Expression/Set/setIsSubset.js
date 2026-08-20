'use strict';
/*md

## Operators > Expression > $setIsSubset

Usage: `$setIsSubset: [ array, array ]`

Returns true when every element of the first set appears in the second.

Exactly two sets are required.
The empty set is a subset of every set, including itself.

***A null operand is refused***, in either position, where [$setUnion](#$setUnion) would have
  answered null.

*/

module.exports = function ( jsongin )
{

	const set = require( './_set' )( jsongin );

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
				let sets = set.ReadSets( Document, Args, '$setIsSubset', 2, 2, false );

				return set.IsSubset( sets[ 0 ], sets[ 1 ] );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setIsSubset: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
