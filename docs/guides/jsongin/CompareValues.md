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
|     `0`     | The two values are equal.          |
|     `1`     | `ValueA` sorts after `ValueB`.     |

This is MongoDB's way of comparing values, not Javascript's.
[`Sort()`](./Sort.md), the expression comparison operators (`$eq`, `$gt`, `$lt`, `$cmp` and the
  rest), and the `$min` and `$max` operators all use it.

Unlike Javascript's `<` and `>`, it always gives an answer, so it is safe to use as a sort
  function.

`CompareValues` throws for a value it has no order for, such as a function or an `Error`.


## Type Order

Values of different types are never equal. They are ordered by type:

    null < numbers < strings < objects < arrays < booleans < dates < regular expressions

`null` and `undefined` are equal.

```js
jsongin.CompareValues( null, undefined ) === 0
jsongin.CompareValues( null, 1 ) === -1
jsongin.CompareValues( 'a', 1 ) === 1
jsongin.CompareValues( [ 1 ], { a: 1 } ) === 1
jsongin.CompareValues( true, [ 1 ] ) === 1
jsongin.CompareValues( new Date(), true ) === 1
```


## Values of the Same Type

- ***Numbers*** and ***strings*** compare by value. `false` is less than `true`.
- ***Dates*** compare by the moment they hold.
- ***Regular expressions*** compare by their text.
- ***Arrays*** compare element by element, in order. If one array runs out first, it is the
  smaller.
- ***Objects*** compare field by field, in order: first the field names, then the values. If one
  object runs out of fields first, it is the smaller.

```js
jsongin.CompareValues( 1, 2 ) === -1
jsongin.CompareValues( 'a', 'b' ) === -1
jsongin.CompareValues( [ 1, 2 ], [ 1, 3 ] ) === -1
jsongin.CompareValues( new Date( 1 ), new Date( 2 ) ) === -1
jsongin.CompareValues( { a: 1 }, { a: 1, b: 1 } ) === -1
```

`NaN` sorts ***below every other number***, and is equal to itself, as in MongoDB.

```js
jsongin.CompareValues( NaN, NaN ) === 0
jsongin.CompareValues( NaN, 1 ) === -1
jsongin.CompareValues( 1, NaN ) === 1
jsongin.CompareValues( NaN, null ) === 1
```


## Arrays in `Sort()`

`CompareValues` compares two arrays element by element.

[`Sort()`](./Sort.md) does not. When a document's sort field holds an array, `Sort` uses the
  array's smallest element when sorting ascending, and its largest when sorting descending.
MongoDB does the same.

So an empty array is ordered differently by the two:

```js
// Compared as a value, an empty array has the array type's place in the order:
jsongin.CompareValues( [], null ) === 1

// In Sort(), an empty array has no elements to use, and sorts below every other value,
// including null.
```


## See Also

- [`Sort( Documents, SortCriteria )`](./Sort.md)
- [`LooseEquals( ValueA, ValueB )`](./LooseEquals.md)
- [`StrictEquals( ValueA, ValueB )`](./StrictEquals.md)
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
