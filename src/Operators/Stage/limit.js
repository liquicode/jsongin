'use strict';
/*md

## Operators > Stage > $limit

Usage: `$limit: count`

Passes the first `count` documents along and discards the rest.
The count must be a non-negative integer.

This is a pass-through stage. The documents are the caller's own document objects, they are
  not cloned.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'n',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'n' ) { throw new Error( `$limit requires a number.` ); }
				if ( Number.isInteger( Args ) === false ) { throw new Error( `$limit requires an integer.` ); }
				if ( Args < 0 ) { throw new Error( `$limit cannot be negative.` ); }
				return Documents.slice( 0, Args );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$limit: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
