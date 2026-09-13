# @liquicode/jsongin


# StrictEquals( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |       (any)       | The first value to compare.              |
| DocumentB     |       (any)       | The second value to compare.             |


## Description

Returns `true` if two values are ***strictly*** equal.

Strict means:

1. There is no type conversion, so `1` does not equal `'1'`.
2. Fields and array elements must be in the ***same order***.

`StrictEquals( A, B )` is the same as `CompareValues( A, B ) === 0`.
See [`CompareValues()`](./CompareValues.md).

This is not quite Javascript's `===`:

- Two dates holding the same moment are equal.
- Two regular expressions with the same text and flags are equal.
- `null` and `undefined` are equal. A field holding `null` is not equal to a missing field,
  though, because the objects have different fields.

```js
let a = { hp: 10 };
let b = { hp: 10 };

jsongin.StrictEquals( a, b ) === true
( jsongin.CompareValues( a, b ) === 0 ) === true
```


## Not the Same as `$eq`

The `$eq` query operator can match one ***element*** of an array, so
  `{ tags: { $eq: [ 1, 2 ] } }` matches a document whose `tags` holds `[ [ 1, 2 ] ]`.
That is right for a query, but it is not equality.
`StrictEquals` does not do this, and gives the same result whichever value you pass first:

```js
jsongin.StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] ) === false
jsongin.StrictEquals( [ 1, 2 ], [ [ 1, 2 ] ] ) === false

// The query operator matches the element:
jsongin.Query( { tags: [ [ 1, 2 ] ] }, { tags: { $eq: [ 1, 2 ] } } ) === true
```


## See Also

- [`LooseEquals( DocumentA, DocumentB )`](./LooseEquals.md), which ignores order.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md)
- [`Query()`](./Query.md) and its `$eq` operator.


## Examples


### It does not convert types
```js
jsongin.StrictEquals( 1, 1 ) === true
jsongin.StrictEquals( 1, '1' ) === false
jsongin.StrictEquals( 0, false ) === false
```


### Field order matters
```js
jsongin.StrictEquals( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true
jsongin.StrictEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false
```


### Element order matters
```js
jsongin.StrictEquals( [ 1, 2 ], [ 1, 2 ] ) === true
jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ) === false
```


### Dates compare by the moment they hold
```js
jsongin.StrictEquals( new Date( 1 ), new Date( 1 ) ) === true
jsongin.StrictEquals( new Date( 1 ), new Date( 2 ) ) === false
```


### null and undefined are equal
```js
jsongin.StrictEquals( null, undefined ) === true
```
