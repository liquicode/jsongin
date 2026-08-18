# @liquicode/jsongin


# Recipes: Patterns

End-to-end workflows that combine several functions. Each recipe is self-contained.


## Filter, Sort, and Project a Collection

A read pipeline in three steps: [`Filter()`](../jsongin/Filter.md) selects,
[`Sort()`](../jsongin/Sort.md) orders, and [`Project()`](../jsongin/Project.md)
shapes each result. `Filter` returns a new array, so sorting it leaves the original
collection alone:

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', active: true, age: 30 },
	{ _id: 2, name: 'Bob', role: 'user', active: false, age: 25 },
	{ _id: 3, name: 'Eve', role: 'admin', active: true, age: 40 },
];
let result = jsongin.Sort( jsongin.Filter( users, { active: true } ), { age: -1 } );
let shaped = [];
for ( let i = 0; i < result.length; i++ )
{
	shaped.push( jsongin.Project( result[ i ], { _id: 0, name: 1, age: 1 } ) );
}
shaped
// returns [ { name: 'Eve', age: 40 }, { name: 'Alice', age: 30 } ]
```


## Update Every Matching Document

[`Update()`](../jsongin/Update.md) returns a copy and leaves the original untouched,
so a loop over a filtered collection produces a set of new documents without changing
the source. Stamp every active user `online`:

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', active: true, age: 30 },
	{ _id: 2, name: 'Bob', role: 'user', active: false, age: 25 },
	{ _id: 3, name: 'Eve', role: 'admin', active: true, age: 40 },
];
let matching = jsongin.Filter( users, { active: true } );
let updated = [];
for ( let i = 0; i < matching.length; i++ )
{
	updated.push( jsongin.Update( matching[ i ], { $set: { status: 'online' } } ) );
}
updated.length === 2
updated[ 0 ].status === 'online'
updated[ 1 ].status === 'online'
updated[ 0 ].name === 'Alice'
```


## Diff Two Versions of a Collection

Pair up old and new documents by `_id` and [`Diff()`](../jsongin/Diff.md) each pair.
An unchanged document produces an empty patch `{}`, so the list of patches shows
exactly what moved:

```js
let old_docs = [ { _id: 1, name: 'Alice', age: 30 }, { _id: 2, name: 'Bob', age: 25 } ];
let new_docs = [ { _id: 1, name: 'Alice', age: 31 }, { _id: 2, name: 'Bob', age: 25 } ];
let patches = [];
for ( let i = 0; i < old_docs.length; i++ )
{
	patches.push( jsongin.Diff( old_docs[ i ], new_docs[ i ] ) );
}
patches
// returns [ { $set: { age: 31 } }, {} ]
```

Each non-empty patch is an update document you could pass to
[`Update()`](../jsongin/Update.md), or invert with
[`Invert()`](../jsongin/Invert.md) to roll the change back.


## Merge Configuration Defaults

[`Merge()`](../jsongin/Merge.md) folds two objects together recursively, with the
second winning on conflict. Layer a user's overrides over a set of defaults:

```js
let defaults = { host: 'localhost', port: 27017, retries: 3, log: { level: 'info' } };
let overrides = { port: 5432, log: { file: 'app.log' } };
jsongin.Merge( defaults, overrides )
// returns { host: 'localhost', port: 5432, retries: 3, log: { level: 'info', file: 'app.log' } }
```

The nested `log` object is merged rather than replaced, so `level` survives while
`file` is added.


## Edit a Document by Dot-Path

[`Flatten()`](../jsongin/Flatten.md) turns a nested document into a flat map of
dot-paths, which is a convenient shape for editing one value at a time.
[`Expand()`](../jsongin/Expand.md) builds the hierarchy back:

```js
let flat = jsongin.Flatten( { server: { host: 'localhost', port: 27017 } } );
flat[ 'server.port' ] = 5432;
jsongin.Expand( flat )
// returns { server: { host: 'localhost', port: 5432 } }
```


## See Also

- [`Filter()`](../jsongin/Filter.md), [`Sort()`](../jsongin/Sort.md),
  [`Project()`](../jsongin/Project.md), [`Update()`](../jsongin/Update.md)
- [`Diff()`](../jsongin/Diff.md), [`Invert()`](../jsongin/Invert.md)
- [`Merge()`](../jsongin/Merge.md), [`Flatten()`](../jsongin/Flatten.md),
  [`Expand()`](../jsongin/Expand.md)
- [Getting Started](./Getting-Started.md)