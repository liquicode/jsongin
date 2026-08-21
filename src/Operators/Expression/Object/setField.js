'use strict';
/*md

## Operators > Expression > $setField

Usage: `$setField: { field: name, input: document, value: expression }`

Answers a copy of a document with one named field added or replaced.

***The input document is not modified.*** The operator hands back a new document, so the same
  field may be read again unchanged in the same stage.

***The name is a name and never a path***, and it must be a constant. Both rules are the same
  as [$getField](#$getField), and the reasons are given there.

***A replaced field keeps its position*** and a new one is appended after the fields already
  present, which matters because MongoDB compares documents field by field in the order they
  hold them.

A null or missing `input` makes the result null. Any other non-document throws, since there
  would be nothing to build a document from. A null `value` is written as a null rather than
  being ignored.

***Removing a field with `value: '$$REMOVE'` is not supported***, since jsongin has no
  expression variable scope. Use [$unsetField](#$unsetField) instead.

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
				let read = object.ReadArgs( Document, Args, '$setField', [ 'field', 'input', 'value' ], Scope );

				let input = object.AsInputDocument( read.Input, '$setField' );
				if ( input === null ) { return null; }

				let value = jsongin.Evaluate( Document, Args.value, Scope );

				let result = object.CopyDocument( input );
				result[ read.Name ] = jsongin.SafeClone( value );

				return result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$setField: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
