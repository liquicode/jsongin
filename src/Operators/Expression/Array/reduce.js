'use strict';
/*md

## Operators > Expression > $reduce

Usage: `$reduce: { input: array, initialValue: expression, in: expression }`

Folds an array into a single value by applying an expression to each element in turn.

Two variables are bound within `in`:

| **Variable** | **Description**                                                          |
|--------------|----------------------------------------------------------------------------|
| `$$this`     | The element being folded in.                                             |
| `$$value`    | What the fold has accumulated so far, starting at `initialValue`.        |

The answer is whatever `in` produced for the last element. ***`$reduce` has no `as`***, so
  these two names cannot be renamed.

```js
const total = { $reduce: { input: '$scores', initialValue: 0, in: { $add: [ '$$value', '$$this' ] } } };
```

***The accumulated value may be of any shape***, which is what makes this more than a sum: an
  array built up with [$concatArrays](#$concatArrays) or a document built up with
  [$mergeObjects](./Expression-Operators.md#$mergeObjects) is accumulated the same way a
  number is.

```js
const tenfold = {
	$reduce: {
		input: '$scores',
		initialValue: [],
		in: { $concatArrays: [ '$$value', [ { $multiply: [ '$$this', 10 ] } ] ] },
	}
};
```

***`initialValue` is required***, and is evaluated once, in the scope around the operator. An
  empty array answers it untouched, which is the only case where `in` never runs.

A null `input`, or one which is missing, answers `null`. An `input` which is present and is
  not an array throws.

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
				let read = array.ReadBindingArgs( Document, Args, '$reduce',
					[ 'input', 'initialValue', 'in' ], [ 'input', 'initialValue', 'in' ], Scope );
				if ( read.Values === null ) { return null; }

				// Evaluated in the scope around the operator, before anything is bound, which
				// is the same rule $let follows for the values in its `vars`.
				let accumulated = jsongin.Evaluate( Document, Args.initialValue, Scope );

				for ( let index = 0; index < read.Values.length; index++ )
				{
					let bindings = {
						value: accumulated,
						this: read.Values[ index ],
					};
					accumulated = jsongin.Evaluate( Document, Args.in, Scope.Child( bindings ) );
				}

				return accumulated;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$reduce: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
