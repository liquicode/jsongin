'use strict';
/*md

## Operators > Expression > $setUnion

Usage: `$setUnion: [ array, array, ... ]`

Returns the elements which appear in any of the sets given.

***The result comes back in BSON order***, not in the order the elements were written. A set
  has no order of its own, so sorting is the only choice which gives the same answer for the
  same set however it was written.

***A null operand makes the result null***, where [$setIsSubset](#$setIsSubset) would have
  refused it.

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
				let sets = set.ReadSets( Document, Args, '$setUnion', 1, null, true, Scope );
				if ( sets === null ) { return null; }

				let all = [];
				for ( let index = 0; index < sets.length; index++ )
				{
					all = all.concat( sets[ index ] );
				}

				return set.AsSet( all );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setUnion: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
