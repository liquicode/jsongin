# @liquicode/jsongin


# StrictEquals( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |       (any)       | The first value to compare.              |
| DocumentB     |       (any)       | The second value to compare.             |


## Description

Performs a ***strict*** equality comparison between two values and returns `true` or `false`.

Strict means two things:

1. Values must match exactly, as Javascript's `===` does. No type coercion is applied.
2. Values must appear in the ***same order*** within objects and arrays.

`StrictEquals` is [`CompareValues()`](./CompareValues.md) asked whether its result is zero.

```js
jsongin.StrictEquals( DocumentA, DocumentB )
// is the same as
( jsongin.CompareValues( DocumentA, DocumentB ) === 0 )
```

Dates are compared by their time value, so two distinct `Date` objects holding the same instant
  are equal. Regular expressions are compared by their text, for the same reason.

`null` and a missing value are equal to each other.


## Not the Same as the `$eq` Query Operator

`StrictEquals` is ***not*** the `$eq` query operator applied to two values, and the difference
  is worth knowing if you are comparing the two.

A query operator's parameters are not peers. The first is a document field and the second is a
  match value, and `$eq` lets a match value equal an ***element*** of a document array — which
  is what MongoDB does, and is why `{ tags: [ 'A', 'B' ] }` matches a document whose `tags`
  field holds `[ [ 'A', 'B' ], 'x' ]`.

That rule is correct for querying and wrong for equality, because it is not symmetric.
`StrictEquals` therefore uses `CompareValues`, which is.

```js
jsongin.StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] ) === false
jsongin.StrictEquals( [ 1, 2 ], [ [ 1, 2 ] ] ) === false

// The query operator answers the other question, and answers it correctly:
jsongin.Query( { tags: [ [ 1, 2 ] ] }, { tags: { $eq: [ 1, 2 ] } } ) === true
```

> ***Fixed in v0.1.0*** : `StrictEquals` called `$eq` and so inherited that asymmetry.
  `StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] )` returned `true` while the reverse returned `false`.
  This also caused `Diff()` to miss a change between those two values and report an empty patch.


## See Also

- [`LooseEquals( DocumentA, DocumentB )`](./LooseEquals.md), the order-insensitive counterpart.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md), which orders values rather than
  testing them for equality.
- [`Query()`](./Query.md) and its `$eq` operator.


## Examples


### It does not coerce types
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


### Dates compare by value
```js
jsongin.StrictEquals( new Date( 1 ), new Date( 1 ) ) === true
jsongin.StrictEquals( new Date( 1 ), new Date( 2 ) ) === false
```


### Null and missing are equal
```js
jsongin.StrictEquals( null, undefined ) === true
```
