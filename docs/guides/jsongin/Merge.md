# @liquicode/jsongin


# Merge( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |        olu        | The document to merge into.              |
| DocumentB     |        olu        | The document to merge from. Its values win. |


## Description

Returns a new document with the fields of `DocumentB` merged into `DocumentA`.

- A field in only one of the documents is copied into the result.
- A field in both takes `DocumentB`'s value.
- When ***both*** hold an object in the same field, the two objects are merged the same way.

***Neither document is changed.***
The result is copied with [`SafeClone()`](./SafeClone.md), so dates stay dates and the result
  shares nothing with either document.

A `null` or `undefined` document counts as `{}`, so `Merge( DEFAULTS, options )` works when
  `options` was not given.
Any other type, such as an array, a number or a date, throws.


## Only Objects Are Merged

`Merge` only looks inside a field when both documents hold an object there.
Every other value in `DocumentB` ***replaces*** the value in `DocumentA`.

So an array replaces an array, rather than being combined with it:

```js
// jsongin.Merge( { tags: [ 'a', 'b', 'c' ] }, { tags: [ 'a' ] } ) returns { tags: [ 'a' ] }
// jsongin.Merge( { tags: [ 'a', 'b', 'c' ] }, { tags: [] } ) returns { tags: [] }
```

This lets an override make a list shorter, not only longer.
[`Diff()`](./Diff.md) and `$set` treat arrays the same way.

To combine two arrays, do it yourself:

```js
let defaults = { tags: [ 'a', 'b' ] };
let custom = { tags: [ 'c' ] };

jsongin.Merge( defaults, { tags: defaults.tags.concat( custom.tags ) } );
// returns { tags: [ 'a', 'b', 'c' ] }
```

Dates and regular expressions also replace rather than merge.


## null Is a Value

A field set to `null` in `DocumentB` becomes `null` in the result. It is ***not*** removed.

```js
// jsongin.Merge( { a: 1, b: 2 }, { a: null } ) returns { a: null, b: 2 }
```

***`Merge` adds and changes fields, but never removes one.***
To remove a field, use [`Update()`](./Update.md) with `$unset`, or
  [`DeleteValue()`](./DeleteValue.md).

A field holding `undefined` in `DocumentB` is skipped.


## Compared With JSON Merge Patch

`Merge` works like [RFC 7386, JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7386), except
  for `null`.
In a JSON Merge Patch, `null` removes a field. In `Merge`, `null` is an ordinary value.


## Defaults and Overrides

`Merge` is made for applying a full or partial set of overrides to a set of defaults:

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

The override changed `editor.wrap` without repeating `tabs`, and `GetSettings()` also works with
  no argument.

Merging the same overrides twice gives the same result as merging them once.


## See Also

- [`SafeClone( Document, Exceptions )`](./SafeClone.md)
- [`Update( Document, Updates )`](./Update.md), to remove fields or change arrays.
- [`Diff( Before, After )`](./Diff.md)


## Examples


### It accepts null or undefined documents
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, null );
// merged is a copy of doc

merged = jsongin.Merge( null, doc );
// merged is a copy of doc

merged = jsongin.Merge( doc, undefined );
// merged is a copy of doc
```


### It accepts empty objects
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, {} );
// merged is a copy of doc

merged = jsongin.Merge( {}, doc );
// merged is a copy of doc
```


### It adds new fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { x: 42 } );
// merged is { b: true, n: 3.14, s: 'abc', x: 42 }

merged = jsongin.Merge( { x: 42 }, doc );
// merged is { x: 42, b: true, n: 3.14, s: 'abc' }
```


### It changes existing fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { n: 42 } );
// merged is { b: true, n: 42, s: 'abc' }

merged = jsongin.Merge( { n: 42 }, doc );
// merged is { n: 3.14, b: true, s: 'abc' }
```


### It merges objects inside fields
```js
let merged = jsongin.Merge( { A: { B: 2 } }, { A: { C: 3 } } );
// merged is { A: { B: 2, C: 3 } }

merged = jsongin.Merge( { A: { C: 3 } }, { A: { B: 2 } } );
// merged is { A: { C: 3, B: 2 } }
```


### It replaces arrays
```js
// jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [ 9 ] } ) returns { a: [ 9 ] }
// jsongin.Merge( { a: [ 1, 2 ] }, { a: [ 3, 4, 5 ] } ) returns { a: [ 3, 4, 5 ] }
// jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [] } ) returns { a: [] }
```


### It throws for anything but an object
```js
jsongin.Merge( [ 1, 2 ], { a: 1 } )
// throws: DocumentA must be an object.

jsongin.Merge( { a: 1 }, [ 1, 2 ] )
// throws: DocumentB must be an object.
```
