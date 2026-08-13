'use strict';
/*md

## Operators > Stage > $skip

Usage: `$skip: count`

Discards the first `count` documents and passes the rest along.
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
		OperatorType: 'Stage',
		ArgTypes: 'n',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'n' ) { throw new Error( `$skip requires a number.` ); }
				if ( Number.isInteger( Args ) === false ) { throw new Error( `$skip requires an integer.` ); }
				if ( Args < 0 ) { throw new Error( `$skip cannot be negative.` ); }
				return Documents.slice( Args );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$skip: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
