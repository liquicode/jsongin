'use strict';
/*md

## Operators > Accumulator > $count

Usage: `$count: {}`

Returns the number of documents in a group.
The argument must be an empty object, which is how MongoDB spells it.

`$sum: 1` counts a group in exactly the same way and works in older MongoDB versions.

Note that MongoDB also has a `$count` ***stage***, which jsongin does not implement.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Accumulator',
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$count requires an empty object.` ); }
				if ( Object.keys( Args ).length > 0 ) { throw new Error( `$count requires an empty object.` ); }

				return Documents.length;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$count: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
