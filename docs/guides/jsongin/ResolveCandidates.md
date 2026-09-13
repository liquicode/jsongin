# @liquicode/jsongin


# ResolveCandidates( Document, Path, ExpandArrays, Report )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                                    |
|---------------|:-----------------:|------------------------------------------------------------------------------------|
| Document      |       (any)       | The document to read from.                                                          |
| Path          |       ulsn        | The path to read. An empty path means the document itself.                          |
| ExpandArrays  |         b         | Optional. Whether an array also offers each of its elements. Defaults to `true`.    |
| Report        |         o         | Optional. `Report.Missing` is set to `true` when the path meets a missing field.    |


## Description

Returns an array of every value `Path` could refer to in `Document`.
These are the ***candidates*** a query operator tests. The operator matches if ***any*** candidate
  matches.

`GetValue` cannot do this job. When a path goes through an array, `GetValue` collects the values
  into an array, and that looks the same as a field which really holds an array:

```js
let collected = jsongin.GetValue( { a: [ { x: 1 }, { x: 2 } ] }, 'a.x' );
// collected is [ 1, 2 ]

let real = jsongin.GetValue( { a: [ { x: [ 1, 2 ] } ] }, 'a.x' );
// real is also [ 1, 2 ]
```

`ResolveCandidates` keeps the two apart:

```js
jsongin.ResolveCandidates( { a: [ { x: 1 }, { x: 2 } ] }, 'a.x' );
// [ 1, 2 ]           two elements, one value each

jsongin.ResolveCandidates( { a: [ { x: [ 1, 2 ] } ] }, 'a.x' );
// [ [ 1, 2 ], 1, 2 ] one field holding an array: the array, then each element
```

An empty result means the path reached no value.
A path which reaches a field holding `undefined` gives one candidate, `undefined`.

`ResolveCandidates` throws when `Path` is not a string, number, `null` or `undefined`.


## Rules

These are MongoDB's rules for reading a query path.

***An array offers itself and each of its elements.***
That is why `{ tags: 'red' }` matches `{ tags: [ 'red', 'blue' ] }`, and `{ tags: [ 'red' ] }`
  matches the whole array.

```js
jsongin.ResolveCandidates( { tags: [ 'red', 'blue' ] }, 'tags' );
// [ [ 'red', 'blue' ], 'red', 'blue' ]
```

***Only one level is expanded.***
An element which is itself an array is offered as an array, and not taken apart again.
So `{ tags: 'red' }` does not match `{ tags: [ [ 'red' ] ] }`.

***`ExpandArrays: false` turns the expansion off***, leaving only the value the path reaches.
`$elemMatch` uses this.

```js
jsongin.ResolveCandidates( { tags: [ 'red', 'blue' ] }, 'tags', false );
// [ [ 'red', 'blue' ] ]
```

***A path goes through every array it meets.***

```js
jsongin.ResolveCandidates( { a: [ { b: [ { c: 1 } ] } ] }, 'a.b.c' );
// [ 1 ]
```

***A field name only looks inside elements which are objects.***
Numbers, strings, `null` and arrays inside the array are skipped.
To reach into an array inside an array, use an index.

```js
jsongin.ResolveCandidates( { a: [ [ { c: 1 } ] ] }, 'a.c' );
// []

jsongin.ResolveCandidates( { a: [ [ { c: 1 } ] ] }, 'a.0.0.c' );
// [ 1 ]
```

***A number against an array is both an index and a field name.***
It selects the element at that position, and it is also looked for as a field of each object
  element.
A negative number, or one past the end, selects no element.

```js
jsongin.ResolveCandidates( { a: [ 'x', 'y' ] }, 'a.0' );
// [ 'x' ]

jsongin.ResolveCandidates( { a: [ 'y', { '0': 'x' } ] }, 'a.0' );
// [ 'x', 'y' ]        the field '0' of the object, and the element at position 0

jsongin.ResolveCandidates( { a: [ 'x', 'y' ] }, 'a.-1' );
// []
```

***An empty path element is a field named `''`.***
`'a.'` is the field `''` inside `a`.
An empty ***path*** is the document itself, so a field named `''` at the top of a document cannot
  be reached.


## Missing Fields

In MongoDB, `{ field: null }` also matches documents where the field is ***missing***.
The candidate list cannot say whether that happened, so pass a `Report` object to find out.

`Report.Missing` becomes `true` when the path:

- names a field an object does not have, or
- continues past a number, string or `null` which it reached by a field name.

These do ***not*** count as missing: an array with no object elements to look in, an index past
  the end of an array, or continuing past a number, string or `null` reached by an index.

```js
let report = { Missing: false };
jsongin.ResolveCandidates( { a: [ { c: 1 } ] }, 'a.b', true, report );
// [] and report.Missing is true: an element has no b

report = { Missing: false };
jsongin.ResolveCandidates( { a: [ { b: 1 }, { c: 1 } ] }, 'a.b', true, report );
// [ 1 ] and report.Missing is true: one element has b, one does not

report = { Missing: false };
jsongin.ResolveCandidates( { a: 5 }, 'a.b', true, report );
// [] and report.Missing is true: the path continues past a number

report = { Missing: false };
jsongin.ResolveCandidates( { a: [] }, 'a.b', true, report );
// [] and report.Missing is false: the array has no elements to look in

report = { Missing: false };
jsongin.ResolveCandidates( { a: [ 1 ] }, 'a.0.b', true, report );
// [] and report.Missing is false: the index led to a number
```

`Report.Missing` is only ever set to `true`, so start each call with a fresh `Report`.

`$eq`, `$gte` and `$lte` read the report, and so do `$in`, `$ne`, `$nin` and a plain
  `{ field: value }` through them.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md), which returns a single value.
- [`SplitPath( Path )`](./SplitPath.md)
- [`Query( Document, Criteria )`](./Query.md)
- [`Sort( Documents, SortCriteria )`](./Sort.md), which reads array fields by different rules.


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

### It skips elements which cannot have the field
```js
jsongin.ResolveCandidates( { a: [ 1, 'two', { x: 3 } ] }, 'a.x' );
// [ 3 ]
```

### An empty path means the document itself
```js
jsongin.ResolveCandidates( { a: 1 }, '' );
// [ { a: 1 } ]
```
