# @liquicode/jsongin


# LooseEquals( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA     |       (any)       | The first value to compare.              |
| DocumentB     |       (any)       | The second value to compare.             |


## Description

Returns `true` if two values are ***loosely*** equal.

Loose means:

1. Numbers, strings and booleans are compared with Javascript's `==`, so `1` equals `'1'` and `0`
   equals `false`.
2. Fields and array elements can be in ***any order***.
3. `null` and `undefined` are equal, so a field holding `null` equals a missing field.

Dates are equal when they hold the same moment. Regular expressions are equal when their text and
  flags are the same.
Values of different kinds, such as a number and an array, are never equal.

The result is the same whichever value you pass first.

Use `LooseEquals` to compare documents by content without caring about order.
Use [`StrictEquals()`](./StrictEquals.md) when order and type matter.

The `$eqx` query operator, a `jsongin` extension, uses `LooseEquals` to compare values.
A query operator can also match one element of an array, which `LooseEquals` does not do:

```js
jsongin.QueryOperators.$eqx.Query( [ [ 1, 2 ] ], [ 1, 2 ] ) === true
jsongin.LooseEquals( [ [ 1, 2 ] ], [ 1, 2 ] ) === false
```


## See Also

- [`StrictEquals( DocumentA, DocumentB )`](./StrictEquals.md)
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md)
- [`Query()`](./Query.md) and its `$eqx` operator.
- [`Diff( Before, After )`](./Diff.md), which also compares content and ignores field order.


## Examples


### It converts types
```js
jsongin.LooseEquals( 1, '1' ) === true
jsongin.LooseEquals( 0, false ) === true
jsongin.LooseEquals( null, undefined ) === true
```


### Field order does not matter
```js
jsongin.LooseEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true

// StrictEquals says these are different:
jsongin.StrictEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false
```


### Element order does not matter
```js
jsongin.LooseEquals( [ 1, 2 ], [ 2, 1 ] ) === true
jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ) === false
```


### A null field equals a missing field
```js
jsongin.LooseEquals( { a: null }, {} ) === true
jsongin.StrictEquals( { a: null }, {} ) === false
```


### Dates compare by the moment they hold
```js
jsongin.LooseEquals( new Date( 1 ), new Date( 1 ) ) === true
jsongin.LooseEquals( new Date( 1 ), new Date( 2 ) ) === false
```
