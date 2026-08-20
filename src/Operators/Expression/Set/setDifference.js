'use strict';
/*md

## Operators > Expression > $setDifference

Usage: `$setDifference: [ array, array ]`

Returns the elements of the first set which are not in the second.

***Exactly two sets***, unlike [$setUnion](#$setUnion) and
  [$setIntersection](#$setIntersection), which take any number.
The result comes back in BSON order.
***A null operand makes the result null.***

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
				let sets = set.ReadSets( Document, Args, '$setDifference', 2, 2, true );
				if ( sets === null ) { return null; }

				let left = set.AsSet( sets[ 0 ] );
				let kept = [];
				for ( let index = 0; index < left.length; index++ )
				{
					if ( !set.Holds( sets[ 1 ], left[ index ] ) ) { kept.push( left[ index ] ); }
				}

				return kept;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setDifference: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
