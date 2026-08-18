# @liquicode/jsongin


# ResolveCandidates( Document, Path, ExpandArrays )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                                    |
|---------------|:-----------------:|------------------------------------------------------------------------------------|
| Document      |       o, a        | The document to resolve the path within.                                            |
| Path          |       s, n        | The path to resolve.                                                                |
| ExpandArrays  |         b         | Whether an array also offers each of its elements. Defaults to `true`. Optional.    |


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

An ***empty list*** means the path resolves to nothing, which is how a missing field is
  reported. That is not the same as a path which resolves to `undefined`, which yields one
  candidate holding `undefined`.


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

***A numeric key indexes an array***, counting from the end when negative, exactly as
  [`GetValue`](./GetValue.md) does.


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
