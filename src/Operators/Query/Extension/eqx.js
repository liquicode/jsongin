'use strict';
/*md

## Operators > Query > $eqx

Usage: `$eqx: value`

***A jsongin extension.*** MongoDB has no operator of this name.

Matches a field by ***loose*** equality, the way Javascript's `==` compares, where `$eq`
  compares strictly:

```js
jsongin.Query( { a: 1 }, { a: { $eqx: '1' } } );  // true
jsongin.Query( { a: 1 }, { a: { $eq: '1' } } );   // false
```

`1` equals `'1'`, `true` equals `1`, `false` equals `'0'`, and `null` equals a missing value.

Documents and arrays are compared member by member under the same loose rule, and must have the
  ***same members***: `{ a: 1 }` does not equal `{ a: 1, b: 2 }`. The comparison does not depend
  on the order of its two sides.

This is a ***field*** operator, written as `{ field: { $eqx: value } }`. It is not a top level
  operator.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		// The same set as $nex, which negates this.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		// $eqx is $eq with a loose comparison in place of the strict one. Everything else about
		// it is $eq: the path resolves to candidates the same way, so a match value equals a
		// field which holds it and also a field which holds an array containing it, and a path
		// which crosses an array asks whether any element satisfies it.
		//
		// The comparison itself is Engine.LooseEquals, which is to this operator what
		// CompareValues is to $eq. It used to live in this file, and Engine.LooseEquals was
		// this operator applied to two whole values, which made that function asymmetric.
		//
		// ExpandArrays is passed through to ResolveCandidates. It is false only when
		// $elemMatch is testing one element, where the element is a value rather than an
		// array to look inside. See ResolveCandidates.
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );

				// A path which resolves to nothing is still compared, so that { a: null }
				// matches a document which has no 'a'. MongoDB matches null against a missing
				// field, and $eq does the same thing here.
				if ( candidates.length === 0 ) { candidates = [ undefined ]; }

				for ( let index = 0; index < candidates.length; index++ )
				{
					if ( jsongin.LooseEquals( candidates[ index ], MatchValue ) === true ) { return true; }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$eqx: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
