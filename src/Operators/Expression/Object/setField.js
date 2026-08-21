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

***A `value` of `'$$REMOVE'` removes the field***, and is the only way to add, replace, or
  remove a field with one operator. [$unsetField](#$unsetField) is the other way to remove
  one, and takes no value at all. Any expression which produces nothing removes the field the
  same way, so a `value` of a missing field path does too.

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

				// ***A value of nothing removes the field***, which is how '$$REMOVE' unsets.
				// A null is a value and is written as one, so the two have to be told apart
				// here rather than lumped together as "no value".
				if ( typeof value === 'undefined' )
				{
					delete result[ read.Name ];
					return result;
				}

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
