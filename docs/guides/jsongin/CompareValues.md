# @liquicode/jsongin


# CompareValues( ValueA, ValueB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| ValueA        |       (any)       | The first value to compare.              |
| ValueB        |       (any)       | The second value to compare.             |


## Description

Compares two values and returns a number:

| **Returns** | **Meaning**                        |
|:-----------:|------------------------------------|
|     `-1`    | `ValueA` sorts before `ValueB`.    |
|     `0`     | The two values are equivalent.     |
|     `1`     | `ValueA` sorts after `ValueB`.     |

This is MongoDB's comparison, not Javascript's.
It is the comparison used by the expression comparison operators (`$eq`, `$gt`, `$lt`, `$cmp`,
  and the rest) and by [`Sort()`](./Sort.md).

Javascript's own `>` and `<` report every comparison against a missing value as `false`, which
  makes a sort containing one inconsistent. `CompareValues` always returns a definite ordering.


## Type Order

Values of different types are never equal. They are ordered by their type:

    null < numbers < strings < objects < arrays < booleans < dates < regular expressions

`null` and missing values are ***equivalent***, so comparing `null` to `undefined` returns `0`.

```js
jsongin.CompareValues( null, undefined ) === 0
jsongin.CompareValues( null, 1 ) === -1
jsongin.CompareValues( 'a', 1 ) === 1
jsongin.CompareValues( [ 1 ], { a: 1 } ) === 1
jsongin.CompareValues( true, [ 1 ] ) === 1
jsongin.CompareValues( new Date(), true ) === 1
```


## Comparing Two Values of the Same Type

- ***Numbers*** and ***strings*** compare by value.
- ***Dates*** compare by their time value.
- ***Regular expressions*** compare by their text.
- ***Arrays*** compare element by element, in order.
- ***Objects*** compare field by field.

`NaN` is a number which is neither less than, equal to, nor greater than anything, including
  itself. It sorts ***below every other number***, which is where MongoDB places it, and equal
  to itself. Without a rule of its own it would compare equal to every number, which would make
  the ordering inconsistent and a sort of those values arbitrary.

```js
jsongin.CompareValues( NaN, NaN ) === 0
jsongin.CompareValues( NaN, 1 ) === -1
jsongin.CompareValues( 1, NaN ) === 1
jsongin.CompareValues( NaN, null ) === 1
```

> ***Fixed in v0.1.0*** : `CompareValues` compared numbers with `<` and `>` and fell through to
  reporting them equal. Every comparison against `NaN` is false, so `NaN` was reported equal to
  every number, and a single `NaN` was enough to make `Sort()` return an arbitrary order.

```js
jsongin.CompareValues( 1, 2 ) === -1
jsongin.CompareValues( 'a', 'b' ) === -1
jsongin.CompareValues( [ 1, 2 ], [ 1, 3 ] ) === -1
jsongin.CompareValues( new Date( 1 ), new Date( 2 ) ) === -1
```


## A Note on Arrays and `Sort()`

`CompareValues` compares two arrays ***element by element***.

[`Sort()`](./Sort.md) does something different: it reduces an array field to a single sort key
  first, using the array's smallest element when ascending and its largest when descending.

Both rules are MongoDB's. Which one applies depends on whether you are sorting documents or
  comparing two values directly.
The most visible consequence is the empty array:

```js
// As a value, an empty array carries the array type rank:
jsongin.CompareValues( [], null ) === 1

// As a sort key, an empty array sorts below every other value, including null.
```


## See Also

- [`Sort( Documents, SortCriteria )`](./Sort.md)
- [`LooseEquals( DocumentA, DocumentB )`](./LooseEquals.md)
- [`StrictEquals( DocumentA, DocumentB )`](./StrictEquals.md)
- [`Evaluate( Document, Expression )`](./Evaluate.md) and its comparison operators.
- [`ShortType( Value )`](./ShortType.md)


## Examples


### It compares values of the same type
```js
jsongin.CompareValues( 1, 2 ) === -1
jsongin.CompareValues( 2, 1 ) === 1
jsongin.CompareValues( 1, 1 ) === 0
```


### It orders values of different types
```js
let values = [ true, 'abc', 5, null, new Date() ];
values.sort( jsongin.CompareValues );
// => [ null, 5, 'abc', true, Date ]
```
