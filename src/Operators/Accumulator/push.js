'use strict';
/*md

## Operators > Accumulator > $push

Usage: `$push: expression`

Returns an array of every value in a group, in group order.
Nulls and duplicates are kept. A document whose expression resolves to a ***missing*** field
  contributes nothing to the array, since there is no value to push.
Returns an empty array for an empty group.

Note that this is the accumulator `$push` and not the update operator `$push`.
The accumulator collects a value from every document in a group.
The update operator appends to an array field within a single document.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Accumulator',
		ArgTypes: 'bnsloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let values = accumulator.Values( Documents, Args );

				let pushed = [];
				for ( let index = 0; index < values.length; index++ )
				{
					// A missing value is not a value.
					if ( typeof values[ index ] === 'undefined' ) { continue; }
					pushed.push( values[ index ] );
				}

				return pushed;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$push: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
