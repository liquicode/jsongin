# @liquicode/jsongin


# ResolveCandidates( Document, Path, ExpandArrays, Report )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                                    |
|---------------|:-----------------:|------------------------------------------------------------------------------------|
| Document      |       o, a        | The document to resolve the path within.                                            |
| Path          |       s, n        | The path to resolve.                                                                |
| ExpandArrays  |         b         | Whether an array also offers each of its elements. Defaults to `true`. Optional.    |
| Report        |         o         | Receives `Missing: true` when the path met a missing field. Optional.               |


## Description

Returns the ***list of values*** which `Path` can mean within `Document`, as an array.

This is what query operators use to decide a match. `GetValue` returns a single value, which
  cannot express a path that crosses an array: it gathers every element's value into one array,
  and that gathered array is indistinguishable from a field which genuinely holds an array.

```js
let gathered = jsongin.GetValue( { a: [ { x: 1 }, { x: 2 } ] }, 'a.x' );
// gathered is [ 1, 2 ]

let real = jsongin.GetValue( { a: [ { x: [ 1, 2 ] } ] }, 'a.x' );
// real is [ 1, 2 ] as well, and nothing downstream can tell the two apart
```

`ResolveCandidates` keeps them distinct:

```js
jsongin.ResolveCandidates( { a: [ { x: 1 }, { x: 2 } ] }, 'a.x' );
// [ 1, 2 ]           two elements, each contributing a value

jsongin.ResolveCandidates( { a: [ { x: [ 1, 2 ] } ] }, 'a.x' );
// [ [ 1, 2 ], 1, 2 ] one field holding an array, offered whole and by element
```

An operator matches when ***any*** candidate satisfies it.

An ***empty list*** means the path resolves to nothing. That is not the same as a path which
  resolves to `undefined`, which yields one candidate holding `undefined` - and it is not the
  same as a ***missing field***, which is what `Report` is for.


## A missing field

MongoDB matches `null` against a field which is not there, and "not there" has a precise
  meaning: a document which lacks the field, or a path which runs on below a scalar or a `null`
  it reached through a field name. A path which reaches nothing any other way is ***not*** a
  missing field: an array which offered no document to descend into, an index past the end of
  an array, or a path which runs on below an element reached by index.

The candidate list cannot carry that distinction on its own, because it can be empty either way,
  and it can be non-empty with the field missing as well. So the walk reports it apart, on the
  `Report` object when one is given:

```js
let report = { Missing: false };

jsongin.ResolveCandidates( { a: [ { c: 1 } ] }, 'a.b', true, report );
// [] and report.Missing is true: a document element lacks b

jsongin.ResolveCandidates( { a: [ { b: 1 }, { c: 1 } ] }, 'a.b', true, report );
// [ 1 ] and report.Missing is true: one element has b and one lacks it

jsongin.ResolveCandidates( { a: 5 }, 'a.b', true, report );
// [] and report.Missing is true: the path runs on below a scalar reached by field name

jsongin.ResolveCandidates( { a: [] }, 'a.b', true, report );
// [] and report.Missing is false: the array offered no document

jsongin.ResolveCandidates( { a: [ 1 ] }, 'a.0.b', true, report );
// [] and report.Missing is false: the element the index led to is a scalar
```

[`$eq`](../Operator-Reference.md), `$gte` and `$lte` are the operators which read it, and
  through them `$in`, `$ne`, `$nin` and the implicit form. `$exists` does not: it asks whether
  the list is empty, and a missing field and an empty array both leave it empty.


## Rules

These follow MongoDB.

***An array offers itself and each of its elements.***
This is how `{ tags: 'red' }` matches `{ tags: [ 'red', 'blue' ] }` while
  `{ tags: [ 'red' ] }` matches the whole array.

```js
jsongin.ResolveCandidates( { tags: [ 'red', 'blue' ] }, 'tags' );
// [ [ 'red', 'blue' ], 'red', 'blue' ]
```

***An array is expanded exactly one level.***
An element which is itself an array is a candidate as the array it is, and is not expanded
  again, which is why `{ tags: 'red' }` does not match `{ tags: [ [ 'red' ] ] }`.

***`ExpandArrays: false` turns that expansion off***, leaving only the values the path lands on:

```js
jsongin.ResolveCandidates( { tags: [ 'red', 'blue' ] }, 'tags', false );
// [ [ 'red', 'blue' ] ]
```

[`$elemMatch`](../Operator-Reference.md) is the operator which needs this.
It asks about the elements of the array itself, so an element which is another array is a value
  it tests rather than a third array to search.
Every other operator wants the expansion, because equality means "the field is this value, or is
  an array holding it".

***Traversal happens at every path element.***
A path crosses as many arrays as it meets.

```js
jsongin.ResolveCandidates( { a: [ { b: [ { c: 1 } ] } ] }, 'a.b.c' );
// [ 1 ]
```

***An array inside an array is not descended into without an index.***

```js
jsongin.ResolveCandidates( { a: [ [ { c: 1 } ] ] }, 'a.c' );
// []

jsongin.ResolveCandidates( { a: [ [ { c: 1 } ] ] }, 'a.0.0.c' );
// [ 1 ]
```

***A numeric key against an array is an index into it and a field name of each element.***
Both readings contribute. A negative number, or one past the end, indexes nothing, since there
  is no reverse indexing; it is still looked for as a field name of each element which is a
  document.

```js
jsongin.ResolveCandidates( { a: [ 'x', 'y' ] }, 'a.0' );
// [ 'x' ]

jsongin.ResolveCandidates( { a: [ 'y', { '0': 'x' } ] }, 'a.0' );
// [ 'x', 'y' ]        the field '0' of the document element, and the element at index 0

jsongin.ResolveCandidates( { a: [ 'x', 'y' ] }, 'a.-1' );
// []
```

***An empty path element names a field called `''`.***
`'a.'` is the field `''` inside `a`. An empty ***path*** is the document itself, so the field
  `''` at the top of a document is the one field no path can name.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md), which returns a single value
- [`SplitPath( Path )`](./SplitPath.md)
- [`Query( Document, Query )`](./Query.md)
- [`Sort( Documents, SortCriteria )`](./Sort.md), which builds sort keys from its own candidate
  walk for the same reason. It is deliberately not this function: sorting must not offer an
  array whole ***as well as*** by element, because the extra candidate would win a descending
  max and misplace the document, and it needs a `null` where this function reports nothing.


## Examples


### It returns the value at an ordinary path
```js
jsongin.ResolveCandidates( { a: { b: 2 } }, 'a.b' );
// [ 2 ]
```

### It returns nothing for a field which is not there
```js
jsongin.ResolveCandidates( { a: 1 }, 'nope' );
// []

jsongin.ResolveCandidates( { a: [ { y: 1 } ] }, 'a.x' );
// []
```

### It skips elements which cannot hold the field
```js
jsongin.ResolveCandidates( { a: [ 1, 'two', { x: 3 } ] }, 'a.x' );
// [ 3 ]
```

### An empty path means the document itself
```js
jsongin.ResolveCandidates( { a: 1 }, '' );
// [ { a: 1 } ]
```
