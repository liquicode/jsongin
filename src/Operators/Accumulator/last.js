'use strict';
/*md

## Operators > Accumulator > $last

Usage: `$last: expression`

Returns the value from the last document in a group.

The group order is the order in which the documents reached the `$group` stage, so a `$sort`
  placed before the grouping is what makes this meaningful.
When the last document's expression resolves to a missing field, the accumulated field is
  omitted from the group's output document.
Returns `null` for an empty group.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
				if ( Documents.length === 0 ) { return null; }

				let values = accumulator.Values( [ Documents[ Documents.length - 1 ] ], Args );
				return values[ 0 ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$last: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
