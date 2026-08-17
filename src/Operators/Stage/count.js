'use strict';
/*md

## Operators > Stage > $count

Usage: `$count: field-name`

Replaces the whole stream with a ***single document*** holding the number of documents which
  reached this stage, under the given field name.

***An empty stream produces no document at all***, rather than one holding a zero.

The field name must be a non-empty string, may not begin with `$`, and may not contain a `.`.

Note that this is the `$count` ***stage*** and not the `$count` accumulator.
The stage takes a field name and replaces the stream.
The accumulator takes `{}` and counts the documents within a `$group`.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 's',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 's' ) { throw new Error( `$count requires a string field name.` ); }
				if ( Args.length === 0 ) { throw new Error( `$count requires a field name which is not empty.` ); }
				if ( Args.startsWith( '$' ) ) { throw new Error( `$count field name [${Args}] cannot start with a '$'.` ); }
				if ( Args.includes( '.' ) ) { throw new Error( `$count field name [${Args}] cannot contain a '.'.` ); }

				// An empty stream counts nothing, and says so by emitting nothing. Verified
				// against MongoDB 6.0.1, where a $count after a $match which selected no
				// documents returns no documents rather than a zero.
				if ( Documents.length === 0 ) { return []; }

				let counted = {};
				counted[ Args ] = Documents.length;
				return [ counted ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$count: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
