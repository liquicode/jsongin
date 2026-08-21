'use strict';
/*md

## Operators > Expression > $setIntersection

Usage: `$setIntersection: [ array, array, ... ]`

Returns the elements which appear in every one of the sets given.

The result comes back in BSON order, as [$setUnion](#$setUnion) explains.
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
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let sets = set.ReadSets( Document, Args, '$setIntersection', 1, null, true, Scope );
				if ( sets === null ) { return null; }

				let common = set.AsSet( sets[ 0 ] );
				for ( let index = 1; index < sets.length; index++ )
				{
					let other = sets[ index ];
					let kept = [];
					for ( let position = 0; position < common.length; position++ )
					{
						if ( set.Holds( other, common[ position ] ) ) { kept.push( common[ position ] ); }
					}
					common = kept;
				}

				return common;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setIntersection: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
