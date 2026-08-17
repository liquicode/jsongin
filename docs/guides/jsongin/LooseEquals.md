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

Use this when you want to compare two documents by ***content***, without caring how their keys
  happen to be ordered. Use [`StrictEquals()`](./StrictEquals.md) when order is part of what you
  are testing.

`LooseEquals` is ***symmetric***: it answers the same whichever value is named first. It is the
  loose counterpart of [`CompareValues()`](./CompareValues.md), and it is what the `$eqx` query
  operator compares with — the same relation `CompareValues` has to `$eq`. `$eqx` is a `jsongin`
  extension and is not part of MongoDB.

A query operator is ***not*** symmetric, which is why this is not one. Its first parameter is a
  document field and its second is a match value, and a match value is allowed to equal an
  element of an array the document holds:

```js
// The operator matches an array by one of its elements. LooseEquals does not.
jsongin.QueryOperators.$eqx.Query( [ [ 1, 2 ] ], [ 1, 2 ] ) === true
jsongin.LooseEquals( [ [ 1, 2 ] ], [ 1, 2 ] ) === false
```

A key which is not there reads as `undefined`, and `null` and `undefined` are equivalent, so a
  `null` member and a missing member are loosely equal. `StrictEquals` reports them as
  different.

```js
jsongin.LooseEquals( { a: null }, {} ) === true
jsongin.StrictEquals( { a: null }, {} ) === false
```

> ***Fixed in v0.1.0*** :
  `LooseEquals( dateA, dateB )` returned `true` for ***any*** two dates.
  A `Date` has no enumerable own properties, so comparing two of them member-wise found nothing
  to disagree about. Dates now compare by their time value.

> ***Fixed in v0.1.0*** :
  `LooseEquals( {}, { a: 1 } )` returned `true`, and so did every other subset comparison, while
  the same two values named in the other order returned `false`. This was `$eqx` applied to two
  whole values, and its object comparison walked the keys of the first value only, so a key
  which only the second one carried was never examined. Keys from both values are now compared.


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
