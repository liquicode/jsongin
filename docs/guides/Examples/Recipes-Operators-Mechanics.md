# @liquicode/jsongin


# Recipes: Operators & Mechanics

This page has two kinds of recipe. The first adds operators of your own to an engine. The second
works with documents directly: flattening, merging, reading and writing values by path, and
recording a change so it can be undone.


## Author a Custom Query Operator

The operator tables are plain objects, so you can add operators of your own. A query operator is
an object with a `Query` function. Here is a `$startsWith` operator as it would appear in its own
file:

```js
// docs-check: skip - an operator module, shown as it appears in its own file.
'use strict';
module.exports = function ( jsongin )
{
	return {
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 's',
		Query: function ( Document, MatchValue, Path = '' )
		{
			let candidates = jsongin.ResolveCandidates( Document, Path );
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

`ResolveCandidates` returns every value a path can refer to: the value itself and, for an array,
each element. That is how an array field matches when any element matches.
`ValueTypes: 's'` tells the engine the operator takes a string, so any other value is refused
before `Query` runs.

Add the operator to a new engine and use it:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();

const $startsWith = {
	Engine: engine,
	TopLevel: false,
	ValueTypes: 's',
	Query: function ( Document, MatchValue, Path = '' )
	{
		let candidates = engine.ResolveCandidates( Document, Path );
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

See [Operator Authoring](../Operator-Authoring.md) for the full rules, and the
[Operator Reference](../Operator-Reference.md) for the operators which come with the engine.


## Flatten a Document to Dot-Paths and `Expand` It Back

[`Flatten()`](../jsongin/Flatten.md) turns a nested document into a flat object of dot-paths.
Array elements get numbered paths:

```js
jsongin.Flatten( { a: { b: 1 }, c: [ 1, 2 ] } )
// returns { "a.b": 1, "c.0": 1, "c.1": 2 }
```

[`Expand()`](../jsongin/Expand.md) does the reverse. Numbered paths become an array:

```js
jsongin.Expand( { 'a.b': 1, 'c.0': 1, 'c.1': 2 } )
// returns { a: { b: 1 }, c: [ 1, 2 ] }
```


## Merge Two Documents

[`Merge()`](../jsongin/Merge.md) combines two documents. When both have a field, the second
wins, except that two objects are merged together:

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

[`SetValue()`](../jsongin/SetValue.md) writes a value at a dot-path, creating any missing objects
along the way. It changes the document in place and returns `true`:

```js
let doc = {};
jsongin.SetValue( doc, 'user.name', 'Alice' ) === true
JSON.stringify( doc ) === '{"user":{"name":"Alice"}}'
```


## Delete a Value by Path

[`DeleteValue()`](../jsongin/DeleteValue.md) removes the value at a dot-path. It changes the
document in place and returns `true`:

```js
let doc = { a: 1, b: 2 };
jsongin.DeleteValue( doc, 'a' ) === true
JSON.stringify( doc ) === '{"b":2}'
```


## Record a Change with `Diff` and Undo It with `Invert`

[`Diff( Before, After )`](../jsongin/Diff.md) describes the change from one document to another
as an update document, which [`Update()`](../jsongin/Update.md) can apply:

```js
let before = { _id: 1, name: 'Alice', age: 30, tags: [ 'a' ] };
let after = { _id: 1, name: 'Alice', age: 31, tags: [ 'a', 'b' ] };
let patch = jsongin.Diff( before, after ); // patch is { $set: { age: 31, tags: [ 'a', 'b' ] } }
let undo = jsongin.Invert( before, patch ); // undo is { $set: { age: 30, tags: [ 'a' ] } }
jsongin.Update( after, undo )
// returns { _id: 1, name: 'Alice', age: 30, tags: [ 'a' ] }
```

[`Invert( Before, Patch )`](../jsongin/Invert.md) returns the update document which undoes the
patch. Applying it to `after` gives back `before`.


## Author a Custom Expression Operator

An expression operator computes a value. It is an object with an `Evaluate` function, which
receives the document, the operator's argument, and the `Scope`.
Use [`Evaluate()`](../jsongin/Evaluate.md) to work out an argument such as a `$field` reference,
and ***always pass the `Scope` on***, so variables keep working inside your operator.

This `$double` operator doubles a number:

```js
const engine = require( '@liquicode/jsongin' ).NewJsongin();

const $double = {
	Engine: engine,
	ArgTypes: 'bnsdloaru',
	Evaluate: function ( Document, Args, Scope )
	{
		let value = engine.Evaluate( Document, Args, Scope );
		if ( typeof value !== 'number' ) { return null; }
		return value * 2;
	}
};
engine.ExpressionOperators.$double = $double;

engine.Project( { _id: 1, x: 21 }, { doubled: { $double: '$x' } } )
// returns { _id: 1, doubled: 42 }
```

An expression operator you add works anywhere expressions do: in
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

An update operator is an object with an `Update` function. It receives the document and the
operator's fields, changes the document in place, and returns `true`, or `false` if it could not
be applied.
[`Update()`](../jsongin/Update.md) copies the document before calling your operator, so the
caller's document is never changed.

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
		return true;
	}
};
engine.UpdateOperators.$lowercase = $lowercase;

engine.Update( { _id: 1, name: 'Alice', role: 'ADMIN' }, { $lowercase: { name: '', role: '' } } )
// returns { _id: 1, name: 'alice', role: 'admin' }
```


## Author a Custom Stage Operator

A stage operator works on a whole array of documents. It is an object with a `Stage` function,
which receives the documents, the stage's argument, and the `Scope`, and returns the next array
of documents.

This `$stamp` stage copies each document and sets a field to `true`, so the input documents are
never changed:

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
	Stage: function ( Documents, Args, Scope )
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

A stage which evaluates expressions should make a scope for each document with
`Scope.ForDocument( document )` and pass it to `Evaluate()`.


## Author a Custom Accumulator Operator

An accumulator combines a group of documents into one value inside `$group`.
It is an object with an `Accumulate` function, which receives the group's documents, the
accumulator's argument, and the `Scope`, and returns the value.

This `$product` accumulator multiplies the numbers together. It makes a scope for each document
with `Scope.ForDocument()`, so `$$ROOT` is that document:

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
	Accumulate: function ( Documents, Args, Scope )
	{
		let product = 1;
		for ( let index = 0; index < Documents.length; index++ )
		{
			let document = Documents[ index ];
			let value = engine.Evaluate( document, Args, Scope.ForDocument( document ) );
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


## Store a Document in a Flat Store with `Hybridize`

[`Hybridize()`](../jsongin/Hybridize.md) turns each object, array, date and other complex value
in a document into a JSON string, leaving numbers, strings, booleans and `null` as they are. The
result has only simple values, which suits a key-value store or a table.
[`Unhybridize()`](../jsongin/Unhybridize.md) reverses it:

```js
let flat = jsongin.Hybridize( { a: { b: 1 }, c: [ 1, 2 ] } );
// flat is { a: '{"type":"o","value":{"b":1}}', c: '{"type":"a","value":[1,2]}' }
jsongin.Unhybridize( flat )
// returns { a: { b: 1 }, c: [ 1, 2 ] }
```


## Copy a Document with `SafeClone`

[`SafeClone( Document, Exceptions )`](../jsongin/SafeClone.md) returns a deep copy, so changing
the copy never changes the original. Dates are copied too:

```js
let src = { _id: 1, nested: { x: 1 }, tags: [ 'a', 'b' ] };
let copy = jsongin.SafeClone( src );
copy.nested.x = 99;
src.nested.x === 1
```

The second argument is a path, or an array of paths, to ***share*** with the original instead of
copying. This is useful when a field is large:

```js
let shared = { _id: 1, nested: { x: 1 }, tags: [ 'a', 'b' ] };
let view = jsongin.SafeClone( shared, 'tags' );
view.tags === shared.tags
```


## Split and Join Dot-Paths

[`SplitPath( Path )`](../jsongin/SplitPath.md) splits a dot-path into its parts.
[`JoinPaths( ...Paths )`](../jsongin/JoinPaths.md) joins parts into one path, skipping empty ones:

```js
jsongin.SplitPath( 'user.profile.name' )
// returns [ 'user', 'profile', 'name' ]
```

```js
jsongin.JoinPaths( 'user', 'profile' ) === 'user.profile'
jsongin.JoinPaths( 'user.profile', 'name' ) === 'user.profile.name'
jsongin.JoinPaths( '', 'user' ) === 'user'
```


## Read and Write an Array Element by Position

[`GetValue()`](../jsongin/GetValue.md) and [`SetValue()`](../jsongin/SetValue.md) treat a number
in a path as an array position, when the array exists:

```js
jsongin.GetValue( { tags: [ 'a', 'b' ] }, 'tags.1' ) === 'b'
```

```js
let doc = { tags: [ 'a', 'b' ] };
jsongin.SetValue( doc, 'tags.1', 'B' ) === true
JSON.stringify( doc ) === '{"tags":["a","B"]}'
```


## Match and Replace Text

The [`Text`](../Text/Compare.md) functions are an extra module on the engine.
`Compare` orders two strings, `Matches` does a wildcard match (`*` is any number of characters,
`?` is one character), and `SearchReplace` replaces text:

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

`FindBetween` returns the text between two markers:

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
