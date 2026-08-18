# @liquicode/jsongin


# Recipes: Operators & Mechanics

Two kinds of recipe live on this page. The first authors a custom query operator
and registers it on an instance. The second works with documents directly:
flattening, merging, reading and writing values by path, and snapshotting a
change so it can be reverted.


## Author a Custom Query Operator

`jsongin`'s operator registries are plain objects, so you can add an operator of
your own. A query operator is a module that returns an object with a `Query`
function. Here is a `$startsWith` operator as it would appear in its own file:

```js
// docs-check: skip - an operator module, shown as it appears in its own file.
'use strict';
module.exports = function ( jsongin )
{
	return {
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 's',
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
			if ( candidates.length === 0 ) { candidates = [ undefined ]; }
			for ( let index = 0; index < candidates.length; index++ )
			{
				let value = candidates[ index ];
				if ( ( typeof value === 'string' ) && value.startsWith( MatchValue ) ) { return true; }
			}
			return false;
		}
	};
};
```

`ResolveCandidates` returns every value a path can mean — the value itself, and
for an array each of its elements — which is how a field that holds an array is
matched when any element matches. `ValueTypes: 's'` tells the engine this
operator takes a string, so a non-string value is refused before `Query` runs.

Register the operator on a fresh instance and use it:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();

const $startsWith = {
	Engine: engine,
	TopLevel: false,
	ValueTypes: 's',
	Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
	{
		let candidates = engine.ResolveCandidates( Document, Path, ExpandArrays );
		if ( candidates.length === 0 ) { candidates = [ undefined ]; }
		for ( let index = 0; index < candidates.length; index++ )
		{
			let value = candidates[ index ];
			if ( ( typeof value === 'string' ) && value.startsWith( MatchValue ) ) { return true; }
		}
		return false;
	}
};
engine.QueryOperators.$startsWith = $startsWith;

engine.Query( { name: 'Alice' }, { name: { $startsWith: 'Al' } } ) === true
engine.Query( { name: 'Bob' }, { name: { $startsWith: 'Al' } } ) === false
engine.Filter( [ { name: 'Alice' }, { name: 'Bob' }, { name: 'Arthur' } ], { name: { $startsWith: 'A' } } )
// returns [ { name: 'Alice' }, { name: 'Arthur' } ]
```

See [Operator Authoring](../Operator-Authoring.md) for the full contract, and
[Operator Reference](../Operator-Reference.md) for the operators that ship with
the engine.


## Flatten a Document to Dot-Paths and `Expand` It Back

[`Flatten()`](../jsongin/Flatten.md) turns a nested document into a flat map of
dot-paths to values. Arrays become indexed paths:

```js
jsongin.Flatten( { a: { b: 1 }, c: [ 1, 2 ] } )
// returns { "a.b": 1, "c.0": 1, "c.1": 2 }
```

[`Expand()`](../jsongin/Expand.md) is the inverse — it rebuilds the hierarchy,
and consecutive numeric keys become an array:

```js
jsongin.Expand( { 'a.b': 1, 'c.0': 1, 'c.1': 2 } )
// returns { a: { b: 1 }, c: [ 1, 2 ] }
```


## Merge Two Documents

[`Merge()`](../jsongin/Merge.md) combines two documents recursively. Where both
hold the same key, the second wins; where both hold an object, they are merged
rather than replaced:

```js
jsongin.Merge( { a: 1, b: 2 }, { b: 3, c: 4 } )
// returns { a: 1, b: 3, c: 4 }
```

```js
jsongin.Merge( { user: { name: 'Alice', age: 30 } }, { user: { age: 31, city: 'East' } } )
// returns { user: { name: 'Alice', age: 31, city: 'East' } }
```


## Read and Write Nested Values by Path

[`GetValue()`](../jsongin/GetValue.md) reads a value at a dot-path:

```js
jsongin.GetValue( { user: { name: 'Alice' } }, 'user.name' ) === 'Alice'
```

[`SetValue()`](../jsongin/SetValue.md) writes a value at a dot-path, creating
the intermediate objects as it goes. It mutates the document in place and returns
`true`:

```js
let doc = {};
jsongin.SetValue( doc, 'user.name', 'Alice' ) === true
JSON.stringify( doc ) === '{"user":{"name":"Alice"}}'
```


## Delete a Value by Path

[`DeleteValue()`](../jsongin/DeleteValue.md) removes a value at a dot-path. It
mutates the document in place and returns `true`:

```js
let doc = { a: 1, b: 2 };
jsongin.DeleteValue( doc, 'a' ) === true
JSON.stringify( doc ) === '{"b":2}'
```


## Snapshot a Change with `Diff` and Revert with `Invert`

[`Diff( Before, After )`](../jsongin/Diff.md) describes the change from one
document to another as an update document you could pass to
[`Update()`](../jsongin/Update.md):

```js
let before = { _id: 1, name: 'Alice', age: 30, tags: [ 'a' ] };
let after = { _id: 1, name: 'Alice', age: 31, tags: [ 'a', 'b' ] };
let patch = jsongin.Diff( before, after ); // patch is { $set: { age: 31, tags: [ 'a', 'b' ] } }
let undo = jsongin.Invert( before, patch ); // undo is { $set: { age: 30, tags: [ 'a' ] } }
jsongin.Update( after, undo )
// returns { _id: 1, name: 'Alice', age: 30, tags: [ 'a' ] }
```

[`Invert( Before, Patch )`](../jsongin/Invert.md) returns the update document that
undoes the patch. Applying it to `after` reproduces `before`, which is how you
revert a change after the fact.


## See Also

- [Operator Authoring](../Operator-Authoring.md)
- [Operator Reference](../Operator-Reference.md)
- [`Flatten()`](../jsongin/Flatten.md), [`Expand()`](../jsongin/Expand.md),
  [`Merge()`](../jsongin/Merge.md)
- [`GetValue()`](../jsongin/GetValue.md), [`SetValue()`](../jsongin/SetValue.md),
  [`DeleteValue()`](../jsongin/DeleteValue.md)
- [`Diff()`](../jsongin/Diff.md), [`Invert()`](../jsongin/Invert.md)