'use strict';
/*md

## Operators > Expression > $getField

Usage: `$getField: { field: name, input: document }`

Reads one named field of a document.

***The name is a name and never a path.*** A dot in it is part of the name, so
  `{ field: 'a.b' }` reads a field literally called `a.b` and not the `b` of the `a`. That is
  the reason this operator exists: no dotted-path syntax can reach such a field.

***The name must be a constant***, written as a plain string or as a `$literal`. A computed
  name is refused however simple it is. A name beginning with a `$` has to be written
  `{ field: { $literal: '$price' } }`, since a bare `'$price'` is a field path.

***A null input and a missing one part company here***, which they do almost nowhere else in
  the expression language. A null input answers null; a missing one, an array, a number, or
  any other non-document answers ***no value at all***, the same nothing that reading an
  absent field gives, so the field is left out of the result rather than set to null.
  [$setField](#$setField) and [$unsetField](#$unsetField) do not make this distinction.

***The shorthand `{ $getField: 'name' }` is not supported.*** It reads the field from
  `$$CURRENT`, and jsongin has no expression variable scope. Write the `input` out instead.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let read = object.ReadArgs( Document, Args, '$getField', [ 'field', 'input' ] );

				let short_type = jsongin.ShortType( read.Input );
				if ( short_type === 'l' ) { return null; }

				// A missing input, and anything which is not a document, has no field of any
				// name. That is nothing rather than an error - see the note in _object.js.
				if ( short_type !== 'o' ) { return undefined; }
				if ( ( read.Name in read.Input ) === false ) { return undefined; }

				return jsongin.SafeClone( read.Input[ read.Name ] );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$getField: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
