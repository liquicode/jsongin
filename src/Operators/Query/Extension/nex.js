'use strict';
/*md

## Operators > Query > $nex

Usage: `$nex: value`

***A jsongin extension.*** MongoDB has no operator of this name.

The negation of `$eqx`: matches when the field is ***not*** loosely equal to the value.

```js
jsongin.Query( { a: 1 }, { a: { $nex: '1' } } );  // false, they are loosely equal
jsongin.Query( { a: 1 }, { a: { $ne: '1' } } );   // true, they are not strictly equal
```

This is a ***field*** operator, written as `{ field: { $nex: value } }`. It is not a top level
  operator.

*/

const LIB_QUERY_OPTIONS = require( '../../../QueryOptions' );

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		// The same set as $eqx, which this negates. The two cannot differ.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', Options )
		{
			let options = LIB_QUERY_OPTIONS.Normalize( Options );
			return !jsongin.QueryOperators.$eqx.Query( Document, MatchValue, Path, options );
		},

	};

	// Return the operator.
	return operator;
};
