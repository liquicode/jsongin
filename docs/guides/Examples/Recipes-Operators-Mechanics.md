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


## Author a Custom Expression Operator

An expression operator computes a value. It is an object with an `Evaluate`
function that receives the document and the operator's argument, and returns the
result. Use [`Evaluate()`](../jsongin/Evaluate.md) to resolve a sub-expression
argument such as a `$field` reference.

This `$double` operator doubles a number. Declare it, then register it on a fresh
instance's [`ExpressionOperators`](../Operator-Authoring.md) registry:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();

const $double = {
	Engine: engine,
	ArgTypes: 'bnsdloaru',
	Evaluate: function ( Document, Args )
	{
		let value = engine.Evaluate( Document, Args );
		if ( typeof value !== 'number' ) { return null; }
		return value * 2;
	}
};
engine.ExpressionOperators.$double = $double;

engine.Project( { _id: 1, x: 21 }, { doubled: { $double: '$x' } } )
// returns { _id: 1, doubled: 42 }
```

A registered expression operator is available wherever expressions are: in
[`Project()`](../jsongin/Project.md), in `$addFields`, and in `$expr`:

```js
engine.Aggregate( [ { _id: 1, x: 3 }, { _id: 2, x: 5 } ], [
	{ $addFields: { d: { $double: '$x' } } },
	{ $sort: { d: -1 } },
	{ $project: { _id: 0, x: 1, d: 1 } },
] )
// returns [ { x: 5, d: 10 }, { x: 3, d: 6 } ]
```


## Author a Custom Update Operator

An update operator is an object with a `Update` function that receives the
document and the operator's fields, mutates the document in place, and returns it.
The engine's [`Update()`](../jsongin/Update.md) clones the document before
calling your operator, so the caller's original is safe.

This `$lowercase` operator lowercases the string fields you name:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();

const $lowercase = {
	Engine: engine,
	TopLevel: true,
	ValueTypes: 'o',
	Update: function ( Document, UpdateFields )
	{
		for ( let field in UpdateFields )
		{
			let value = engine.GetValue( Document, field );
			if ( typeof value === 'string' )
			{
				engine.SetValue( Document, field, value.toLowerCase() );
			}
		}
		return Document;
	}
};
engine.UpdateOperators.$lowercase = $lowercase;

engine.Update( { _id: 1, name: 'Alice', role: 'ADMIN' }, { $lowercase: { name: '', role: '' } } )
// returns { _id: 1, name: 'alice', role: 'admin' }
```


## Author a Custom Stage Operator

A stage operator transforms a whole array of documents. It is an object with a
`Stage` function that receives the current documents and the stage's argument,
and returns the next array of documents. Register it on the
[`StageOperators`](../Operator-Authoring.md) registry.

This `$stamp` stage clones each document and sets a field to `true`, so the input
documents are never touched:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true },
];

const $stamp = {
	Engine: engine,
	ArgTypes: 's',
	Stage: function ( Documents, Args )
	{
		let out = [];
		for ( let index = 0; index < Documents.length; index++ )
		{
			let copy = engine.SafeClone( Documents[ index ] );
			engine.SetValue( copy, Args, true );
			out.push( copy );
		}
		return out;
	}
};
engine.StageOperators.$stamp = $stamp;

engine.Aggregate( players, [
	{ $stamp: 'processed' },
	{ $project: { _id: 0, name: 1, processed: 1 } },
] )
// returns [ { name: 'Alice', processed: true }, { name: 'Bob', processed: true }, { name: 'Mallory', processed: true } ]
```


## Author a Custom Accumulator Operator

An accumulator operator reduces a group of documents to one value inside `$group`.
It is an object with an `Accumulate` function that receives the group's documents
and the accumulator's expression argument, and returns the value. Register it on the
[`AccumulatorOperators`](../Operator-Authoring.md) registry.

This `$product` accumulator multiplies the numeric values together. Use
[`Evaluate()`](../jsongin/Evaluate.md) to resolve the expression against each
document in the group:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true },
	{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true },
];

const $product = {
	Engine: engine,
	ArgTypes: 'bnsdloaru',
	Accumulate: function ( Documents, Args )
	{
		let product = 1;
		for ( let index = 0; index < Documents.length; index++ )
		{
			let value = engine.Evaluate( Documents[ index ], Args );
			if ( engine.ShortType( value ) === 'n' ) { product = product * value; }
		}
		return product;
	}
};
engine.AccumulatorOperators.$product = $product;

engine.Aggregate( players, [
	{ $group: { _id: '$team', points: { $product: '$points' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', points: 9 }, { _id: 'red', points: 15 } ]
```


## Serialize a Document for a Flat Store with `Hybridize`

[`Hybridize()`](../jsongin/Hybridize.md) turns every structured value in a
document into a JSON string, so the whole document becomes a flat map of strings
to strings — the shape a key-value store holds. [`Unhybridize()`](../jsongin/Unhybridize.md)
reverses it:

```js
let flat = jsongin.Hybridize( { a: { b: 1 }, c: [ 1, 2 ] } );
// flat is { a: '{"type":"o","value":{"b":1}}', c: '{"type":"a","value":[1,2]}' }
jsongin.Unhybridize( flat )
// returns { a: { b: 1 }, c: [ 1, 2 ] }
```


## Clone a Document with `SafeClone`

[`SafeClone( Document, Exceptions )`](../jsongin/SafeClone.md) returns a deep copy,
so changing the copy never reaches the original. It clones dates by value too:

```js
let src = { _id: 1, nested: { x: 1 }, tags: [ 'a', 'b' ] };
let copy = jsongin.SafeClone( src );
copy.nested.x = 99;
src.nested.x === 1
```

The second argument is a path, or array of paths, to leave ***aliased*** rather
than cloned — useful when one field is large and you want to share it:

```js
let shared = { _id: 1, nested: { x: 1 }, tags: [ 'a', 'b' ] };
let view = jsongin.SafeClone( shared, 'tags' );
view.tags === shared.tags
```


## Split and Join Dot-Paths

[`SplitPath( Path )`](../jsongin/SplitPath.md) breaks a dot-path into segments;
[`JoinPaths( ...Paths )`](../jsongin/JoinPaths.md) joins segments back into one
path, skipping empty parts:

```js
jsongin.SplitPath( 'user.profile.name' )
// returns [ 'user', 'profile', 'name' ]
```

```js
jsongin.JoinPaths( 'user', 'profile' ) === 'user.profile'
jsongin.JoinPaths( 'user.profile', 'name' ) === 'user.profile.name'
jsongin.JoinPaths( '', 'user' ) === 'user'
```


## Read and Write an Array Element by Index

[`GetValue()`](../jsongin/GetValue.md) and [`SetValue()`](../jsongin/SetValue.md)
follow a numeric path segment as an array index when the array is already there:

```js
jsongin.GetValue( { tags: [ 'a', 'b' ] }, 'tags.1' ) === 'b'
```

```js
let doc = { tags: [ 'a', 'b' ] };
jsongin.SetValue( doc, 'tags.1', 'B' ) === true
JSON.stringify( doc ) === '{"tags":["a","B"]}'
```


## Match and Replace Text

The [`Text`](../Text/Compare.md) helpers are a bonus module on the
engine. `Compare` orders two strings, `Matches` does a wildcard match (`*` is any
run, `?` is one character), and `SearchReplace` swaps one substring for another:

```js
jsongin.Text.Compare( 'a', 'b' ) === -1
jsongin.Text.Compare( 'a', 'a' ) === 0
jsongin.Text.Matches( 'hello', 'hel*' ) === true
jsongin.Text.Matches( 'hello', 'hel' ) === false
```

```js
jsongin.Text.SearchReplace( 'hello world', 'world', 'there' )
// returns 'hello there'
```

`FindBetween` returns the substring between two markers:

```js
jsongin.Text.FindBetween( 'a[b]c', '[', ']' )
// returns 'b'
```


## See Also

- [Operator Authoring](../Operator-Authoring.md)
- [Operator Reference](../Operator-Reference.md)
- [`Flatten()`](../jsongin/Flatten.md), [`Expand()`](../jsongin/Expand.md),
  [`Merge()`](../jsongin/Merge.md)
- [`Hybridize()`](../jsongin/Hybridize.md), [`Unhybridize()`](../jsongin/Unhybridize.md),
  [`SafeClone()`](../jsongin/SafeClone.md)
- [`SplitPath()`](../jsongin/SplitPath.md), [`JoinPaths()`](../jsongin/JoinPaths.md)
- [`GetValue()`](../jsongin/GetValue.md), [`SetValue()`](../jsongin/SetValue.md),
  [`DeleteValue()`](../jsongin/DeleteValue.md)
- [`Diff()`](../jsongin/Diff.md), [`Invert()`](../jsongin/Invert.md)
- [`Text.Compare()`](../Text/Compare.md), [`Text.Matches()`](../Text/Matches.md),
  [`Text.SearchReplace()`](../Text/SearchReplace.md)