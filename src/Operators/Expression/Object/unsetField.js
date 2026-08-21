'use strict';
/*md

## Operators > Expression > $unsetField

Usage: `$unsetField: { field: name, input: document }`

Answers a copy of a document with one named field removed.

***The input document is not modified***, and the fields which remain keep their order.

***The name is a name and never a path***, and it must be a constant. Both rules are the same
  as [$getField](#$getField), and the reasons are given there. Removing `'a.b'` removes a
  field literally called `a.b` and leaves a nested `a.b` alone.

A document which does not have the field is answered unchanged rather than refused.

A null or missing `input` makes the result null. Any other non-document throws, since there
  would be nothing to build a document from.

*/

module.exports = function ( jsongin )
{

	const object = require( './_object' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'os',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = object.ReadArgs( Document, Args, '$unsetField', [ 'field', 'input' ], Scope );

				let input = object.AsInputDocument( read.Input, '$unsetField' );
				if ( input === null ) { return null; }

				let result = object.CopyDocument( input );
				delete result[ read.Name ];

				return result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$unsetField: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
