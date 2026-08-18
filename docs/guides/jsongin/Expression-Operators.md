# @liquicode/jsongin


# Expression Operators

The operators of the aggregation expression language.
They are read by [`Evaluate()`](./Evaluate.md), by the `$expr` and `$exprx` query operators, by
  computed fields in [`Project()`](./Project.md), and by every aggregation stage which computes
  a value.

An expression is a document, an array, or a scalar:

- A string beginning with `$` is a ***field reference***, resolved by dot notation path.
- Any other value is a ***literal***.
- A document whose single key is an operator name is an ***operator call***.
- A document of other keys is an ***expression object***, evaluated field by field.

| **Category**    | **Operators**                                                                                               |
|-----------------|-------------------------------------------------------------------------------------------------------------|
| Arithmetic      | [$add](#$add), [$subtract](#$subtract), [$multiply](#$multiply), [$divide](#$divide), [$mod](#$mod), [$abs](#$abs) |
| Rounding        | [$ceil](#$ceil), [$floor](#$floor), [$round](#$round), [$trunc](#$trunc)                                    |
| Comparison      | [$eq](#$eq), [$ne](#$ne), [$gt](#$gt), [$gte](#$gte), [$lt](#$lt), [$lte](#$lte), [$cmp](#$cmp)              |
| Smallest/Largest| [$min](#$min), [$max](#$max)                                                                                |
| Array           | [$size](#$size), [$arrayElemAt](#$arrayElemAt), [$concatArrays](#$concatArrays), [$in](#$in)                 |
| Logical         | [$and](#$and), [$or](#$or), [$not](#$not)                                                                   |
| Conditional     | [$cond](#$cond), [$ifNull](#$ifNull), [$switch](#$switch)                                                   |
| Literal         | [$literal](#$literal)                                                                                       |

See [`Evaluate()`](./Evaluate.md) for how an expression is resolved and what happens to missing
  values, and the [Operator Reference](../Operator-Reference.md) for which MongoDB expression
  operators are implemented.

***An expression operator throws on an operand of the wrong type.***
This is deliberate and unlike the accumulators: an expression is authored against a single
  document, so a type error there is an authoring mistake worth surfacing. See
  [Accumulator Operators](./Accumulator-Operators.md) for the other side of that choice.

This document is used by the examples below:

```js
let document =
{
	a: 5,
	b: 2,
	name: 'Alice',
	scores: [ 10, 20, 30 ],
	empty: null,
	user: { role: 'admin' },
};
```


# Arithmetic Operators


<a id="$add"></a>$add
---------------------------------------------------------------------

**Usage** : `{ $add: [ expression, ... ] }`

Adds numbers together.
A `Date` may be one operand, in which case the numbers are added to it as milliseconds and the
  result is a `Date`.

### Example
```js
jsongin.Evaluate( document, { $add: [ '$a', '$b', 1 ] } );
// returns 8

// Adding milliseconds to a date gives a date.
jsongin.Evaluate( { d: new Date( '2024-01-02T03:04:05Z' ) }, { $add: [ '$d', 1000 ] } );
// returns new Date( '2024-01-02T03:04:06Z' )

// A non-numeric operand is refused.
jsongin.Evaluate( document, { $add: [ '$a', '$name' ] } );   // throws
```


<a id="$subtract"></a>$subtract
---------------------------------------------------------------------

**Usage** : `{ $subtract: [ expression, expression ] }`

Subtracts the second operand from the first.
Subtracting one `Date` from another gives the difference in milliseconds, and subtracting a
  number from a `Date` gives a `Date`.

### Example
```js
jsongin.Evaluate( document, { $subtract: [ '$a', '$b' ] } );
// returns 3

// The difference between two dates is a number of milliseconds.
jsongin.Evaluate( { d: new Date( '2024-01-02T03:04:05Z' ) }, { $subtract: [ '$d', '$d' ] } );
// returns 0
```


<a id="$multiply"></a>$multiply
---------------------------------------------------------------------

**Usage** : `{ $multiply: [ expression, ... ] }`

Multiplies numbers together.

### Example
```js
jsongin.Evaluate( document, { $multiply: [ '$a', '$b' ] } );
// returns 10
```


<a id="$divide"></a>$divide
---------------------------------------------------------------------

**Usage** : `{ $divide: [ expression, expression ] }`

Divides the first operand by the second.
Dividing by zero ***throws*** rather than returning `Infinity`, because `Infinity` is not
  representable in JSON.

### Example
```js
jsongin.Evaluate( document, { $divide: [ '$a', '$b' ] } );
// returns 2.5

jsongin.Evaluate( document, { $divide: [ '$a', 0 ] } );   // throws
```


<a id="$mod"></a>$mod
---------------------------------------------------------------------

**Usage** : `{ $mod: [ expression, expression ] }`

The remainder of dividing the first operand by the second.

Note that this is the ***expression*** `$mod`, which returns the remainder.
The ***query*** `$mod` takes `[ divisor, remainder ]` and matches; it is not implemented.

### Example
```js
jsongin.Evaluate( document, { $mod: [ '$a', '$b' ] } );
// returns 1
```


<a id="$abs"></a>$abs
---------------------------------------------------------------------

**Usage** : `{ $abs: expression }`

The absolute value of a number.
Like the other single-operand arithmetic operators, it accepts its operand with or without the
  enclosing array.

### Example
```js
jsongin.Evaluate( document, { $abs: -7 } );
// returns 7

jsongin.Evaluate( document, { $abs: [ -7 ] } );
// returns 7
```


# Rounding Operators


<a id="$ceil"></a>$ceil
---------------------------------------------------------------------

**Usage** : `{ $ceil: expression }`

The smallest integer greater than or equal to the operand.

### Example
```js
jsongin.Evaluate( document, { $ceil: 2.1 } );
// returns 3
```


<a id="$floor"></a>$floor
---------------------------------------------------------------------

**Usage** : `{ $floor: expression }`

The largest integer less than or equal to the operand.

### Example
```js
jsongin.Evaluate( document, { $floor: 2.9 } );
// returns 2
```


<a id="$round"></a>$round
---------------------------------------------------------------------

**Usage** : `{ $round: [ expression, place ] }`

Rounds a number, optionally to a given decimal `place`.

***`$round` rounds half to even***, which is what MongoDB does and is not what
  `Math.round()` does: `2.5` rounds to `2` while `3.5` rounds to `4`.

The `place` may be negative, which rounds to the left of the decimal point.
The shift to that place is done through the number's decimal text rather than by multiplying by
  a power of ten, because multiplying introduces the very error the rounding is meant to remove.

### Example
```js
jsongin.Evaluate( document, { $round: [ 2.5 ] } );
// returns 2

jsongin.Evaluate( document, { $round: [ 3.5 ] } );
// returns 4

jsongin.Evaluate( document, { $round: [ 3.14159, 2 ] } );
// returns 3.14

jsongin.Evaluate( document, { $round: [ 1234, -1 ] } );
// returns 1230
```


<a id="$trunc"></a>$trunc
---------------------------------------------------------------------

**Usage** : `{ $trunc: [ expression, place ] }`

Discards the digits past the given decimal `place`, without rounding.
It takes the same optional, possibly negative, `place` that [`$round`](#$round) takes.

### Example
```js
jsongin.Evaluate( document, { $trunc: [ 2.9 ] } );
// returns 2

jsongin.Evaluate( document, { $trunc: [ 3.14159, 2 ] } );
// returns 3.14
```


# Comparison Operators

Each of these compares two operands with [`CompareValues()`](./CompareValues.md), which follows
  MongoDB's BSON type order, so values of different types still compare.
All seven share one implementation and differ only in what they make of the comparison.


<a id="$eq"></a>$eq
---------------------------------------------------------------------

**Usage** : `{ $eq: [ expression, expression ] }`

`true` when the two operands are equal.

Note that this is the ***expression*** `$eq`, which takes two operands.
The ***query*** [`$eq`](./Query-Operators.md#$eq) takes a match value and applies it to a field.

### Example
```js
jsongin.Evaluate( document, { $eq: [ '$a', 5 ] } );
// returns true
```


<a id="$ne"></a>$ne
---------------------------------------------------------------------

**Usage** : `{ $ne: [ expression, expression ] }`

`true` when the two operands are not equal.

### Example
```js
jsongin.Evaluate( document, { $ne: [ '$a', 5 ] } );
// returns false
```


<a id="$gt"></a>$gt
---------------------------------------------------------------------

**Usage** : `{ $gt: [ expression, expression ] }`

`true` when the first operand is greater than the second.

### Example
```js
jsongin.Evaluate( document, { $gt: [ '$a', '$b' ] } );
// returns true
```


<a id="$gte"></a>$gte
---------------------------------------------------------------------

**Usage** : `{ $gte: [ expression, expression ] }`

`true` when the first operand is greater than or equal to the second.

### Example
```js
jsongin.Evaluate( document, { $gte: [ '$a', 5 ] } );
// returns true
```


<a id="$lt"></a>$lt
---------------------------------------------------------------------

**Usage** : `{ $lt: [ expression, expression ] }`

`true` when the first operand is less than the second.

### Example
```js
jsongin.Evaluate( document, { $lt: [ '$a', '$b' ] } );
// returns false
```


<a id="$lte"></a>$lte
---------------------------------------------------------------------

**Usage** : `{ $lte: [ expression, expression ] }`

`true` when the first operand is less than or equal to the second.

### Example
```js
jsongin.Evaluate( document, { $lte: [ '$b', 2 ] } );
// returns true
```


<a id="$cmp"></a>$cmp
---------------------------------------------------------------------

**Usage** : `{ $cmp: [ expression, expression ] }`

Returns the comparison itself rather than a boolean: `-1`, `0`, or `1`.

### Example
```js
jsongin.Evaluate( document, { $cmp: [ 1, 2 ] } );
// returns -1

jsongin.Evaluate( document, { $cmp: [ 2, 2 ] } );
// returns 0

jsongin.Evaluate( document, { $cmp: [ 3, 2 ] } );
// returns 1
```


# Smallest and Largest


<a id="$min"></a>$min
---------------------------------------------------------------------

**Usage** : `{ $min: [ expression, ... ] }`

The smallest of the operands, ordered by [`CompareValues()`](./CompareValues.md).
Because the ordering is the BSON type order rather than a numeric one, operands of different
  types still have a smallest.

This is the ***expression*** `$min`, which compares the operands given to it.
The ***accumulator*** [`$min`](./Accumulator-Operators.md#$min) reduces a whole group.

### Example
```js
jsongin.Evaluate( document, { $min: [ 3, 1, 2 ] } );
// returns 1

// Numbers order before strings.
jsongin.Evaluate( document, { $min: [ 'b', 1 ] } );
// returns 1
```


<a id="$max"></a>$max
---------------------------------------------------------------------

**Usage** : `{ $max: [ expression, ... ] }`

The largest of the operands, and the mirror of [`$min`](#$min).

### Example
```js
jsongin.Evaluate( document, { $max: [ 3, 1, 2 ] } );
// returns 3
```


# Array Operators


<a id="$size"></a>$size
---------------------------------------------------------------------

**Usage** : `{ $size: expression }`

The number of elements in an array.
An operand which is not an array ***throws***.

Note that this is the ***expression*** `$size`, which returns the length.
The ***query*** [`$size`](./Query-Operators.md#$size) takes a length and matches.

### Example
```js
jsongin.Evaluate( document, { $size: '$scores' } );
// returns 3

jsongin.Evaluate( document, { $size: '$a' } );   // throws, $a is not an array
```


<a id="$arrayElemAt"></a>$arrayElemAt
---------------------------------------------------------------------

**Usage** : `{ $arrayElemAt: [ array, position ] }`

The element at a position in an array.

***This is the only way to index an array in an expression.***
A field path such as `'$scores.2'` does not index: it applies the key `2` to each element.
A negative position counts back from the end here, because it is an operand rather than a path
  element.

A position outside the array gives a missing value.

### Example
```js
jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', 1 ] } );
// returns 20

// A negative position counts back from the end.
jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', -1 ] } );
// returns 30
```


<a id="$concatArrays"></a>$concatArrays
---------------------------------------------------------------------

**Usage** : `{ $concatArrays: [ array, ... ] }`

Joins arrays end to end into one array.

### Example
```js
jsongin.Evaluate( document, { $concatArrays: [ [ 1, 2 ], [ 3 ] ] } );
// returns [ 1, 2, 3 ]
```


<a id="$in"></a>$in
---------------------------------------------------------------------

**Usage** : `{ $in: [ value, array ] }`

`true` when the array holds the value, compared by content.

***The operand order is the reverse of the query operator of the same name.***
The expression `$in` takes the value first and the array second; the
  [query `$in`](./Query-Operators.md#$in) takes the array as its match value and applies it to a
  field.

### Example
```js
jsongin.Evaluate( document, { $in: [ 20, '$scores' ] } );
// returns true

jsongin.Evaluate( document, { $in: [ 99, '$scores' ] } );
// returns false
```


# Logical Operators


<a id="$and"></a>$and
---------------------------------------------------------------------

**Usage** : `{ $and: [ expression, ... ] }`

`true` when every operand is truthy.

### Example
```js
jsongin.Evaluate( document, { $and: [ true, true ] } );
// returns true

// Operands are tested for truthiness, not for being booleans.
jsongin.Evaluate( document, { $and: [ 1, 'x' ] } );
// returns true
```


<a id="$or"></a>$or
---------------------------------------------------------------------

**Usage** : `{ $or: [ expression, ... ] }`

`true` when any operand is truthy.

### Example
```js
jsongin.Evaluate( document, { $or: [ false, true ] } );
// returns true
```


<a id="$not"></a>$not
---------------------------------------------------------------------

**Usage** : `{ $not: expression }`

The negation of the operand's truthiness.

### Example
```js
jsongin.Evaluate( document, { $not: true } );
// returns false

jsongin.Evaluate( document, { $not: 0 } );
// returns true
```


# Conditional Operators


<a id="$cond"></a>$cond
---------------------------------------------------------------------

**Usage** : `{ $cond: [ if, then, else ] }` or `{ $cond: { if: ..., then: ..., else: ... } }`

Chooses between two expressions on a condition.
Both the array form and the named form are accepted, as in MongoDB.

### Example
```js
jsongin.Evaluate( document, { $cond: [ { $gt: [ '$a', 1 ] }, 'big', 'small' ] } );
// returns 'big'

jsongin.Evaluate( document, { $cond: { if: { $gt: [ '$a', 1 ] }, then: 'big', else: 'small' } } );
// returns 'big'
```


<a id="$ifNull"></a>$ifNull
---------------------------------------------------------------------

**Usage** : `{ $ifNull: [ expression, replacement ] }`

The first operand, unless it is `null` or missing, in which case the replacement.
It is the idiom for giving a default to a field which may not be there.

### Example
```js
jsongin.Evaluate( document, { $ifNull: [ '$missing', 'fallback' ] } );
// returns 'fallback'

jsongin.Evaluate( document, { $ifNull: [ '$a', 'fallback' ] } );
// returns 5
```


<a id="$switch"></a>$switch
---------------------------------------------------------------------

**Usage** : `{ $switch: { branches: [ { case: ..., then: ... }, ... ], default: ... } }`

Evaluates each branch's `case` in order and returns the `then` of the first one which is truthy.
When none is, the `default` is returned.

### Example
```js
jsongin.Evaluate( document, { $switch: {
	branches: [
		{ case: { $gt: [ '$a', 10 ] }, then: 'high' },
		{ case: { $gt: [ '$a', 1 ] }, then: 'mid' },
	],
	default: 'low',
} } );
// returns 'mid'

jsongin.Evaluate( document, { $switch: {
	branches: [ { case: false, then: 'x' } ],
	default: 'fallback',
} } );
// returns 'fallback'
```


# Literal


<a id="$literal"></a>$literal
---------------------------------------------------------------------

**Usage** : `{ $literal: value }`

Returns its value without evaluating it.
This is how a string which begins with `$` is used as text rather than as a field reference, and
  how a document which looks like an operator call is used as data.

### Example
```js
jsongin.Evaluate( document, { $literal: '$a' } );
// returns '$a'

jsongin.Evaluate( document, { $literal: { $add: [ 1, 2 ] } } );
// returns { $add: [ 1, 2 ] }
```
