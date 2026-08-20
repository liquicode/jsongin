'use strict';
/*md

## Operators > Expression > $anyElementTrue

Usage: `$anyElementTrue: [ array ]`

Returns true when at least one element of an array is true.

***Only `false`, zero, `null`, and a missing value count as false.*** An empty string and an
  empty array are true, which is not Javascript's rule for either of them.

***Any of nothing is false***, where [$allElementsTrue](#$allElementsTrue) answers an empty array with true.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let sets = set.ReadSets( Document, Args, '$anyElementTrue', 1, 1, false );

				let values = sets[ 0 ];
				for ( let index = 0; index < values.length; index++ )
				{
					if ( set.IsTrue( values[ index ] ) ) { return true; }
				}

				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$anyElementTrue: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
