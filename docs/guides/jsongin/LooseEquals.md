# @liquicode/jsongin


# LooseEquals( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |       (any)       | The first value to compare.              |
| DocumentB     |       (any)       | The second value to compare.             |


## Description

Performs a ***loose*** equality comparison between two values and returns `true` or `false`.

Loose means two things:

1. Primitive values match loosely, as Javascript's `==` does. Types are coerced.
2. Values may appear in ***any order*** within objects and arrays.

`LooseEquals` is the `$eqx` query operator applied to two whole values.
`$eqx` is a `jsongin` extension and is not part of MongoDB.

```js
jsongin.LooseEquals( DocumentA, DocumentB )
// is the same as
jsongin.QueryOperators.$eqx.Query( DocumentA, DocumentB )
```

Use this when you want to compare two documents by ***content***, without caring how their keys
  happen to be ordered. Use [`StrictEquals()`](./StrictEquals.md) when order is part of what you
  are testing.

> ***Fixed in v0.1.0*** :
  `LooseEquals( dateA, dateB )` returned `true` for ***any*** two dates.
  A `Date` has no enumerable own properties, so comparing two of them member-wise found nothing
  to disagree about. Dates now compare by their time value.


## See Also

- [`StrictEquals( DocumentA, DocumentB )`](./StrictEquals.md), the order-sensitive counterpart.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md), which orders values rather than
  testing them for equality.
- [`Query()`](./Query.md) and its `$eqx` operator.
- [`Diff( Before, After )`](./Diff.md), which also compares by content and ignores key order.


## Examples


### It coerces types
```js
jsongin.LooseEquals( 1, '1' ) === true
jsongin.LooseEquals( 0, false ) === true
jsongin.LooseEquals( null, undefined ) === true
```


### Field order does not matter
```js
jsongin.LooseEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true

// Compare with StrictEquals, which reports these as different:
jsongin.StrictEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false
```


### Element order does not matter
```js
jsongin.LooseEquals( [ 1, 2 ], [ 2, 1 ] ) === true
jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ) === false
```


### Dates compare by value
```js
jsongin.LooseEquals( new Date( 1 ), new Date( 1 ) ) === true
jsongin.LooseEquals( new Date( 1 ), new Date( 2 ) ) === false
```
