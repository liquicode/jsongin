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

`StrictEquals` is the `$eq` query operator applied to two whole values, so it is the same
  comparison a query performs on a field.

```js
jsongin.StrictEquals( DocumentA, DocumentB )
// is the same as
jsongin.QueryOperators.$eq.Query( DocumentA, DocumentB )
```

Dates are compared by their time value, so two distinct `Date` objects holding the same instant
  are equal.

`null` and a missing value are equal to each other.


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
