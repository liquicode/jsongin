'use strict';
/*md

## Operators > Expression > $map

Usage: `$map: { input: array, as: name, in: expression }`

Applies an expression to each element of an array and answers the array of results.

The element being worked on is bound to `$$this`, or to the name given by `as`.

***`as` renames the binding rather than adding one.*** Given `as: 'item'` the element is
  `$$item` and `$$this` is not bound at all, so an `in` written against `$$this` stops working
  the moment an `as` is added.

***A field path inside `in` reads the document, not the element.*** This is the single most
  common way to get `$map` wrong: `'$price'` is the `price` of the document being aggregated,
  and the `price` of the element is `'$$this.price'`.

```js
const doubled = { $map: { input: '$scores', in: { $multiply: [ '$$this', 2 ] } } };
const names = { $map: { input: '$people', as: 'person', in: '$$person.name' } };
```

A null `input`, or one which is missing, answers `null`. An `input` which is present and is
  not an array throws. An empty array answers an empty array.

A result which is nothing takes its position as a `null`, because an array cannot leave a
  position out without moving every element after it.

The variable is bound for the length of `in` and no longer. An inner `$map` may bind the same
  name, and the outer binding is unchanged once the inner one finishes.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = array.ReadBindingArgs( Document, Args, '$map',
					[ 'input', 'as', 'in' ], [ 'input', 'in' ], Scope );
				if ( read.Values === null ) { return null; }

				let results = [];
				for ( let index = 0; index < read.Values.length; index++ )
				{
					// One frame per element. The frame is the whole of what the element
					// binding is: nothing is pushed or popped, so the scope the caller handed
					// in is the same object it always was once this returns.
					let bindings = {};
					bindings[ read.Name ] = read.Values[ index ];

					let value = jsongin.Evaluate( Document, Args.in, Scope.Child( bindings ) );
					if ( typeof value === 'undefined' ) { value = null; }
					results.push( value );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$map: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
