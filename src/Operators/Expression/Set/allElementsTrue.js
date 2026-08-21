'use strict';
/*md

## Operators > Expression > $allElementsTrue

Usage: `$allElementsTrue: [ array ]`

Returns true when every element of an array is true.

***Only `false`, zero, `null`, and a missing value count as false.*** An empty string and an
  empty array are true, which is not Javascript's rule for either of them.

***All of nothing is true***, so an empty array satisfies it.

***A null operand is refused***, where [$setUnion](#$setUnion) would have answered null.

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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let sets = set.ReadSets( Document, Args, '$allElementsTrue', 1, 1, false, Scope );

				let values = sets[ 0 ];
				for ( let index = 0; index < values.length; index++ )
				{
					if ( !set.IsTrue( values[ index ] ) ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$allElementsTrue: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
