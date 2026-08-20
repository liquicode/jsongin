'use strict';
/*md

## Operators > Expression > $setEquals

Usage: `$setEquals: [ array, array, ... ]`

Returns true when every set given holds the same elements.

Order does not matter and repeats do not count, so `[ 1, 1, 2 ]` and `[ 2, 1 ]` are equal.
Two or more sets are required.

***A null operand is refused***, where [$setUnion](#$setUnion) would have answered null.
The family is inconsistent about this and `jsongin` reproduces it.

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
				let sets = set.ReadSets( Document, Args, '$setEquals', 2, null, false );

				let first = set.AsSet( sets[ 0 ] );
				for ( let index = 1; index < sets.length; index++ )
				{
					let other = set.AsSet( sets[ index ] );
					if ( first.length !== other.length ) { return false; }
					if ( !set.IsSubset( first, other ) ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setEquals: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
