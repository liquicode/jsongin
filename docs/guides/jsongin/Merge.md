# @liquicode/jsongin


# Merge( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |         o         | The document to merge into.              |
| DocumentB     |         o         | The document to merge from. Values from DocumentB overwrite values in DocumentA. |


## Description

Merges two documents and returns the merged document.

Fields found in `DocumentB` overwrite the matching fields of `DocumentA`, and fields found in
  only one of them are carried through.
The merge is ***member-wise and recursive***: when both documents hold a sub-document at the
  same field, those sub-documents are merged into each other.

***Neither of the given documents is modified.***
`Merge` clones with [`SafeClone()`](./SafeClone.md), so dates and regular expressions survive
  into the result as themselves, and the result shares no structure with either input.

Both parameters must be objects.
A `null` or missing document is treated as an empty one, so that a call like
  `Merge( DEFAULTS, options )` still works when no options were supplied.
Any other type — an array, a number, a string, a date — throws.


## Only Sub-Documents are Merged

`Merge` descends into a field only when ***both*** documents hold a sub-document there.
Every other value in `DocumentB` ***replaces*** the value in `DocumentA`.

An array is a value, not a structure to descend into.
`DocumentB`'s array replaces `DocumentA`'s outright, rather than being combined with it:

```js
// jsongin.Merge( { tags: [ 'a', 'b', 'c' ] }, { tags: [ 'a' ] } ) returns { tags: [ 'a' ] }
// jsongin.Merge( { tags: [ 'a', 'b', 'c' ] }, { tags: [] } ) returns { tags: [] }
```

This is what allows an override to ***narrow*** a list and not only extend it, which is the
  behavior a defaults document needs.
It is also how [`Diff()`](./Diff.md) treats arrays, and what the `$set` update operator does.

To combine two arrays instead, do it explicitly:

```js
jsongin.Merge( defaults, { tags: defaults.tags.concat( custom.tags ) } )
```

Dates and regular expressions are values in the same way, and replace rather than merge.


## Null is a Value

A field set to `null` in `DocumentB` is set to `null` in the result.
It is ***not*** removed.

```js
// jsongin.Merge( { a: 1, b: 2 }, { a: null } ) returns { a: null, b: 2 }
```

***`Merge` adds and overwrites fields, but never removes one.***
Use [`Update()`](./Update.md) with `$unset`, or [`DeleteValue()`](./DeleteValue.md), to remove a
  field.

A field whose value is `undefined` in `DocumentB` is skipped rather than stored, since a key
  holding `undefined` is reported by `Object.keys()` but does not appear in the document's JSON.


## Relationship to RFC 7386

`Merge` follows [RFC 7386, JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7386), with
  ***one deliberate difference***.

The RFC spends `null` on deletion, because a JSON Merge Patch is a standalone document with no
  other way to express the removal of a field.
`jsongin` is not under that constraint — it has `$unset` and `DeleteValue` — so `null` keeps its
  ordinary meaning as a value.
This also keeps `Merge` consistent with `ShortType()`, which gives `null` its own type `l`, and
  with `Diff()`, which reports a change to `null` as `$set` rather than `$unset`.

Everything else matches: objects merge recursively, arrays and scalars replace, and a value
  which changes type simply takes on the new value.


## A Note on Defaults

`Merge` is designed for the case where a system defines a default document and accepts a
  complete or partial override of it:

```js
const DEFAULT_SETTINGS = {
	theme: 'light',
	scale: 1,
	editor: { tabs: 4, wrap: true },
	plugins: [ 'core', 'search' ],
};

function GetSettings( CustomSettings )
{
	return jsongin.Merge( DEFAULT_SETTINGS, CustomSettings );
}

// GetSettings( { scale: 2, editor: { wrap: false } } ) returns
// {
// 	theme: 'light',
// 	scale: 2,
// 	editor: { tabs: 4, wrap: false },
// 	plugins: [ 'core', 'search' ],
// }
```

Note that the override reached into `editor` without having to restate `tabs`, and that
  `GetSettings()` is safe to call with nothing at all.

`Merge` is ***idempotent***: applying the same overrides twice gives the same result as applying
  them once, so settings can be layered without the result depending on how many times a layer
  was applied.


## See Also

- [`SafeClone( Document, Exceptions )`](./SafeClone.md)
- [`Update( Document, Updates )`](./Update.md), for removing fields and for array operations.
- [`Diff( Before, After )`](./Diff.md)
- [`ShortType( Value )`](./ShortType.md)


## Examples


### It can merge with null or missing documents
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, null );
// merged matches doc (effectively, a clone)

merged = jsongin.Merge( null, doc );
// merged matches doc (effectively, a clone)

merged = jsongin.Merge( doc, undefined );
// merged matches doc (effectively, a clone)
```


### It can merge with empty objects
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, {} );
// merged matches doc (effectively, a clone)

merged = jsongin.Merge( {}, doc );
// merged matches doc (effectively, a clone)
```


### It can add new fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { x: 42 } );
// merged is { b: true, n: 3.14, s: 'abc', x: 42 } (new field x)

merged = jsongin.Merge( { x: 42 }, doc );
// merged is { b: true, n: 3.14, s: 'abc', x: 42 } (New fields b, n, and s)
```


### It can update existing fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { n: 42 } );
// merged is { b: true, n: 42, s: 'abc' } (new value for n)

merged = jsongin.Merge( { n: 42 }, doc );
// merged is { b: true, n: 3.14, s: 'abc' } (new value for n, new fields b and s)
```


### It can add new sub-fields
```js
let merged = jsongin.Merge( { A: { B: 2 } }, { A: { C: 3 } } );
// merged is { A: { B: 2, C: 3 } }

merged = jsongin.Merge( { A: { C: 3 } }, { A: { B: 2 } } );
// merged is { A: { B: 2, C: 3 } }
```


### It replaces arrays
```js
// jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [ 9 ] } ) returns { a: [ 9 ] }
// jsongin.Merge( { a: [ 1, 2 ] }, { a: [ 3, 4, 5 ] } ) returns { a: [ 3, 4, 5 ] }
// jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [] } ) returns { a: [] }
```


### It requires objects
```js
jsongin.Merge( [ 1, 2 ], { a: 1 } )
// throws: DocumentA must be an object.

jsongin.Merge( { a: 1 }, [ 1, 2 ] )
// throws: DocumentB must be an object.
```
