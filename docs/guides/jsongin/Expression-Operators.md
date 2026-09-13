# @liquicode/jsongin


# Expression Operators

The operators used in aggregation expressions.
[`Evaluate()`](./Evaluate.md), the `$expr` and `$exprx` query operators, computed fields in
  [`Project()`](./Project.md), and the pipeline stages all use them.

An expression is one of these:

- A string starting with `$`, such as `'$user.name'`, is a ***field reference***.
- A string starting with `$$`, such as `'$$ROOT'`, is a ***variable***. See [Variables](#variables).
- An object with one key naming an operator, such as `{ $add: [ 1, 2 ] }`, is an ***operator***.
- Any other object is evaluated field by field.
- Anything else is a ***literal*** value.

| **Category**    | **Operators**                                                                                               |
|-----------------|-------------------------------------------------------------------------------------------------------------|
| Arithmetic      | [$add](#$add), [$subtract](#$subtract), [$multiply](#$multiply), [$divide](#$divide), [$mod](#$mod), [$abs](#$abs), [$sqrt](#$sqrt), [$pow](#$pow), [$exp](#$exp), [$ln](#$ln), [$log](#$log), [$log10](#$log10) |
| Rounding        | [$ceil](#$ceil), [$floor](#$floor), [$round](#$round), [$trunc](#$trunc)                                    |
| Comparison      | [$eq](#$eq), [$ne](#$ne), [$gt](#$gt), [$gte](#$gte), [$lt](#$lt), [$lte](#$lte), [$cmp](#$cmp)              |
| Smallest/Largest| [$min](#$min), [$max](#$max)                                                                                |
| Array           | [$size](#$size), [$arrayElemAt](#$arrayElemAt), [$concatArrays](#$concatArrays), [$in](#$in), [$isArray](#$isArray), [$reverseArray](#$reverseArray), [$range](#$range), [$indexOfArray](#$indexOfArray), [$slice](#$slice), [$sortArray](#$sortArray), [$zip](#$zip), [$arrayToObject](#$arrayToObject), [$first](#$first), [$last](#$last), [$firstN](#$firstN), [$lastN](#$lastN), [$minN](#$minN), [$maxN](#$maxN), [$map](#$map), [$filter](#$filter), [$reduce](#$reduce) |
| Variables       | [$let](#$let), and the [system variables](#variables) `$$ROOT`, `$$CURRENT`, `$$NOW`, `$$REMOVE` |
| String          | [$concat](#$concat), [$split](#$split), [$toLower](#$toLower), [$toUpper](#$toUpper), [$strcasecmp](#$strcasecmp), [$trim](#$trim), [$ltrim](#$ltrim), [$rtrim](#$rtrim), [$substr](#$substr), [$substrBytes](#$substrBytes), [$substrCP](#$substrCP), [$strLenBytes](#$strLenBytes), [$strLenCP](#$strLenCP), [$indexOfBytes](#$indexOfBytes), [$indexOfCP](#$indexOfCP), [$regexMatch](#$regexMatch), [$regexFind](#$regexFind), [$regexFindAll](#$regexFindAll), [$replaceOne](#$replaceOne), [$replaceAll](#$replaceAll) |
| Trigonometry    | [$sin](#$sin), [$cos](#$cos), [$tan](#$tan), [$asin](#$asin), [$acos](#$acos), [$atan](#$atan), [$atan2](#$atan2), [$sinh](#$sinh), [$cosh](#$cosh), [$tanh](#$tanh), [$asinh](#$asinh), [$acosh](#$acosh), [$atanh](#$atanh), [$degreesToRadians](#$degreesToRadians), [$radiansToDegrees](#$radiansToDegrees) |
| Type            | [$type](#$type), [$isNumber](#$isNumber), [$convert](#$convert), [$toString](#$toString), [$toBool](#$toBool), [$toDate](#$toDate), [$toInt](#$toInt), [$toLong](#$toLong), [$toDouble](#$toDouble) |
| Set             | [$setEquals](#$setEquals), [$setIsSubset](#$setIsSubset), [$setUnion](#$setUnion), [$setIntersection](#$setIntersection), [$setDifference](#$setDifference), [$allElementsTrue](#$allElementsTrue), [$anyElementTrue](#$anyElementTrue) |
| Object          | [$mergeObjects](#$mergeObjects), [$objectToArray](#$objectToArray), [$getField](#$getField), [$setField](#$setField), [$unsetField](#$unsetField) |
| Date            | [$year](#$year), [$month](#$month), [$dayOfMonth](#$dayOfMonth), [$dayOfWeek](#$dayOfWeek), [$dayOfYear](#$dayOfYear), [$hour](#$hour), [$minute](#$minute), [$second](#$second), [$millisecond](#$millisecond), [$week](#$week), [$isoWeek](#$isoWeek), [$isoDayOfWeek](#$isoDayOfWeek), [$isoWeekYear](#$isoWeekYear), [$dateToParts](#$dateToParts), [$dateFromParts](#$dateFromParts), [$dateToString](#$dateToString), [$dateFromString](#$dateFromString), [$dateAdd](#$dateAdd), [$dateSubtract](#$dateSubtract), [$dateDiff](#$dateDiff), [$dateTrunc](#$dateTrunc) |
| Data Size       | [$binarySize](#$binarySize), [$bsonSize](#$bsonSize)                                                        |
| Miscellaneous   | [$rand](#$rand)                                                                                             |
| Logical         | [$and](#$and), [$or](#$or), [$not](#$not)                                                                   |
| Conditional     | [$cond](#$cond), [$ifNull](#$ifNull), [$switch](#$switch)                                                   |
| Literal         | [$literal](#$literal)                                                                                       |

See [`Evaluate()`](./Evaluate.md) for how expressions are evaluated and how missing values are
  handled, and the [Operator Reference](../Operator-Reference.md) for which MongoDB operators are
  supported.

***An expression operator throws when an operand has the wrong type***, such as `$add` with a
  string.
[Accumulators](./Accumulator-Operators.md) are different: they skip values they cannot use.

Most examples below use this document:

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

A `null` or missing operand makes the result `null`.
An operand which is not a number throws.
Operators which take one operand accept it with or without an array around it: `{ $abs: -7 }` and
  `{ $abs: [ -7 ] }` are the same.


<a id="$add"></a>$add
---------------------------------------------------------------------

**Usage** : `{ $add: [ expression, ... ] }`

Adds numbers.
One operand can be a `Date`; the numbers are then added to it as milliseconds, and the result is a
  `Date`.

### Example
```js
jsongin.Evaluate( document, { $add: [ '$a', '$b', 1 ] } );
// returns 8

// Add milliseconds to a date.
jsongin.Evaluate( { d: new Date( '2024-01-02T03:04:05Z' ) }, { $add: [ '$d', 1000 ] } );
// returns new Date( '2024-01-02T03:04:06Z' )

// A string throws.
jsongin.Evaluate( document, { $add: [ '$a', '$name' ] } );   // throws
```


<a id="$subtract"></a>$subtract
---------------------------------------------------------------------

**Usage** : `{ $subtract: [ expression, expression ] }`

Subtracts the second operand from the first.
Two dates give the difference in milliseconds. A date minus a number gives a date.

### Example
```js
jsongin.Evaluate( document, { $subtract: [ '$a', '$b' ] } );
// returns 3

// Two dates give milliseconds.
jsongin.Evaluate( { d: new Date( '2024-01-02T03:04:05Z' ) }, { $subtract: [ '$d', '$d' ] } );
// returns 0
```


<a id="$multiply"></a>$multiply
---------------------------------------------------------------------

**Usage** : `{ $multiply: [ expression, ... ] }`

Multiplies numbers.

### Example
```js
jsongin.Evaluate( document, { $multiply: [ '$a', '$b' ] } );
// returns 10
```


<a id="$divide"></a>$divide
---------------------------------------------------------------------

**Usage** : `{ $divide: [ expression, expression ] }`

Divides the first operand by the second. Dividing by zero throws.

### Example
```js
jsongin.Evaluate( document, { $divide: [ '$a', '$b' ] } );
// returns 2.5

jsongin.Evaluate( document, { $divide: [ '$a', 0 ] } );   // throws
```


<a id="$mod"></a>$mod
---------------------------------------------------------------------

**Usage** : `{ $mod: [ expression, expression ] }`

The remainder after dividing the first operand by the second.

This is the ***expression*** `$mod`, which returns a remainder.
The [query `$mod`](./Query-Operators.md#$mod) tests a field for a remainder instead.

### Example
```js
jsongin.Evaluate( document, { $mod: [ '$a', '$b' ] } );
// returns 1
```


<a id="$abs"></a>$abs
---------------------------------------------------------------------

**Usage** : `{ $abs: expression }`

The absolute value of a number.

### Example
```js
jsongin.Evaluate( document, { $abs: -7 } );
// returns 7

jsongin.Evaluate( document, { $abs: [ -7 ] } );
// returns 7
```


<a id="$sqrt"></a>$sqrt
---------------------------------------------------------------------

**Usage** : `{ $sqrt: expression }`

The square root of a number. A negative number throws.

### Example
```js
jsongin.Evaluate( document, { $sqrt: 25 } );
// returns 5

jsongin.Evaluate( document, { $sqrt: { $add: [ '$a', 11 ] } } );
// returns 4

jsongin.Evaluate( document, { $sqrt: -1 } );
// throws
```


<a id="$pow"></a>$pow
---------------------------------------------------------------------

**Usage** : `{ $pow: [ number, exponent ] }`

Raises a number to a power. Zero to a negative power throws.

### Example
```js
jsongin.Evaluate( document, { $pow: [ '$a', 2 ] } );
// returns 25

jsongin.Evaluate( document, { $pow: [ 2, -1 ] } );
// returns 0.5

jsongin.Evaluate( document, { $pow: [ 0, -1 ] } );
// throws
```


<a id="$exp"></a>$exp
---------------------------------------------------------------------

**Usage** : `{ $exp: expression }`

Raises Euler's number, e, to a power.
Any number is accepted. A very large power gives `Infinity`.

### Example
```js
jsongin.Evaluate( document, { $exp: 0 } );
// returns 1

jsongin.Evaluate( document, { $exp: 1 } );
// returns 2.718281828459045
```


<a id="$ln"></a>$ln
---------------------------------------------------------------------

**Usage** : `{ $ln: expression }`

The natural logarithm of a number.
The number must be greater than zero. Zero throws, even though Javascript's `Math.log( 0 )` gives
  `-Infinity`.

### Example
```js
jsongin.Evaluate( document, { $ln: 1 } );
// returns 0

jsongin.Evaluate( document, { $ln: 0 } );
// throws
```


<a id="$log"></a>$log
---------------------------------------------------------------------

**Usage** : `{ $log: [ number, base ] }`

The logarithm of a number in the given base.
The number must be greater than zero. The base must be greater than zero and not `1`.

### Example
```js
jsongin.Evaluate( document, { $log: [ 8, '$b' ] } );
// returns 3

jsongin.Evaluate( document, { $log: [ 100, 10 ] } );
// returns 2

jsongin.Evaluate( document, { $log: [ 100, 1 ] } );
// throws
```


<a id="$log10"></a>$log10
---------------------------------------------------------------------

**Usage** : `{ $log10: expression }`

The base 10 logarithm of a number. The number must be greater than zero.

### Example
```js
jsongin.Evaluate( document, { $log10: 1000 } );
// returns 3
```


# Rounding Operators


<a id="$ceil"></a>$ceil
---------------------------------------------------------------------

**Usage** : `{ $ceil: expression }`

Rounds up to a whole number.

### Example
```js
jsongin.Evaluate( document, { $ceil: 2.1 } );
// returns 3
```


<a id="$floor"></a>$floor
---------------------------------------------------------------------

**Usage** : `{ $floor: expression }`

Rounds down to a whole number.

### Example
```js
jsongin.Evaluate( document, { $floor: 2.9 } );
// returns 2
```


<a id="$round"></a>$round
---------------------------------------------------------------------

**Usage** : `{ $round: [ number, place ] }`

Rounds a number to `place` decimal places, or to a whole number when `place` is left out.
A negative `place` rounds to the left of the decimal point, such as to the nearest ten.

***A number exactly halfway rounds to the even neighbor***, as MongoDB does.
So `2.5` rounds to `2` and `3.5` rounds to `4`. Javascript's `Math.round()` would give `3` and `4`.

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

**Usage** : `{ $trunc: [ number, place ] }`

Cuts a number off after `place` decimal places, without rounding.
`place` works as it does for [`$round`](#$round).

### Example
```js
jsongin.Evaluate( document, { $trunc: [ 2.9 ] } );
// returns 2

jsongin.Evaluate( document, { $trunc: [ 3.14159, 2 ] } );
// returns 3.14
```


# Comparison Operators

These compare two operands with [`CompareValues()`](./CompareValues.md), so values of different
  types can be compared, in MongoDB's type order.

***Here, a missing value is less than `null`, and only equals another missing value.***
Other parts of `jsongin` treat missing and `null` differently, following MongoDB:

| **Where**                                         | **A missing value compared with `null`**   |
|---------------------------------------------------|---------------------------------------------|
| these expression operators                        | is ***less*** — `{ $cmp: [ '$nope', null ] }` is `-1` |
| a [query](./Query-Operators.md), `{ field: null }` | ***matches***                              |
| [`$sort`](./Stage-Operators.md#$sort)             | sorts ***the same as*** `null`             |

```js
jsongin.Evaluate( {}, { $eq: [ '$nope', null ] } ) === false;
jsongin.Evaluate( {}, { $eq: [ '$nope', '$gone' ] } ) === true;
jsongin.Evaluate( {}, { $cmp: [ '$nope', null ] } ) === -1;
jsongin.Evaluate( { a: null }, { $eq: [ '$a', null ] } ) === true;
```

These are the ***expression*** operators, which take two operands.
The [query operators](./Query-Operators.md) of the same names test a field against a value.


<a id="$eq"></a>$eq
---------------------------------------------------------------------

**Usage** : `{ $eq: [ expression, expression ] }`

`true` when the two operands are equal.

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

Returns `-1` when the first operand is less, `0` when they are equal, and `1` when it is greater.

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

The smallest operand, compared with [`CompareValues()`](./CompareValues.md).
`null` and missing operands are skipped.
Values of different types can be compared, so a number is smaller than a string.

The [`$min` accumulator](./Accumulator-Operators.md#$min) finds the smallest value in a group.

### Example
```js
jsongin.Evaluate( document, { $min: [ 3, 1, 2 ] } );
// returns 1

// A number is smaller than a string.
jsongin.Evaluate( document, { $min: [ 'b', 1 ] } );
// returns 1
```


<a id="$max"></a>$max
---------------------------------------------------------------------

**Usage** : `{ $max: [ expression, ... ] }`

The largest operand. It works like [`$min`](#$min) in every other way.

### Example
```js
jsongin.Evaluate( document, { $max: [ 3, 1, 2 ] } );
// returns 3
```


# Array Operators


<a id="$size"></a>$size
---------------------------------------------------------------------

**Usage** : `{ $size: expression }`

The number of elements in an array. Anything else throws, including `null`.

This is the ***expression*** `$size`. The [query `$size`](./Query-Operators.md#$size) tests for a
  length instead.

### Example
```js
jsongin.Evaluate( document, { $size: '$scores' } );
// returns 3

jsongin.Evaluate( document, { $size: '$a' } );   // throws: $a is not an array
```


<a id="$arrayElemAt"></a>$arrayElemAt
---------------------------------------------------------------------

**Usage** : `{ $arrayElemAt: [ array, position ] }`

The element at a position in an array. A negative position counts back from the end.
A position outside the array gives nothing (`undefined`).

Use this to get an element by position.
A field reference such as `'$scores.2'` does not do that: it looks for a field named `2` in each
  element.

### Example
```js
jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', 1 ] } );
// returns 20

jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', -1 ] } );
// returns 30
```


<a id="$concatArrays"></a>$concatArrays
---------------------------------------------------------------------

**Usage** : `{ $concatArrays: [ array, ... ] }`

Joins arrays into one array.

### Example
```js
jsongin.Evaluate( document, { $concatArrays: [ [ 1, 2 ], [ 3 ] ] } );
// returns [ 1, 2, 3 ]
```


<a id="$in"></a>$in
---------------------------------------------------------------------

**Usage** : `{ $in: [ value, array ] }`

`true` when the array contains the value. Values are compared by content.

The value comes ***first*** and the array second.
This is the opposite of the [query `$in`](./Query-Operators.md#$in), where a field is tested
  against a list.

### Example
```js
jsongin.Evaluate( document, { $in: [ 20, '$scores' ] } );
// returns true

jsongin.Evaluate( document, { $in: [ 99, '$scores' ] } );
// returns false
```


<a id="$isArray"></a>$isArray
---------------------------------------------------------------------

**Usage** : `{ $isArray: expression }`

`true` when the value is an array. For `null`, it returns `false`, not `null`.

### Example
```js
jsongin.Evaluate( document, { $isArray: '$scores' } );
// returns true

jsongin.Evaluate( document, { $isArray: '$name' } );
// returns false

jsongin.Evaluate( document, { $isArray: '$empty' } );
// returns false
```


<a id="$reverseArray"></a>$reverseArray
---------------------------------------------------------------------

**Usage** : `{ $reverseArray: expression }`

A new array with the elements in reverse order. The original array is not changed.

### Example
```js
jsongin.Evaluate( document, { $reverseArray: '$scores' } );
// returns [ 30, 20, 10 ]
```


<a id="$range"></a>$range
---------------------------------------------------------------------

**Usage** : `{ $range: [ start, end ] }` or `{ $range: [ start, end, step ] }`

An array of numbers from `start` up to, but not including, `end`, counting by `step` (default `1`).

If `step` goes the wrong way to reach `end`, the result is empty. A `step` of `0` throws.

### Example
```js
jsongin.Evaluate( document, { $range: [ 0, 4 ] } );
// returns [ 0, 1, 2, 3 ]

jsongin.Evaluate( document, { $range: [ 0, 4, 2 ] } );
// returns [ 0, 2 ]

jsongin.Evaluate( document, { $range: [ 4, 0, -2 ] } );
// returns [ 4, 2 ]

// Counting up by 1 never reaches 0.
jsongin.Evaluate( document, { $range: [ 4, 0 ] } );
// returns []
```


<a id="$indexOfArray"></a>$indexOfArray
---------------------------------------------------------------------

**Usage** : `{ $indexOfArray: [ array, value ] }`
  or `{ $indexOfArray: [ array, value, start ] }`
  or `{ $indexOfArray: [ array, value, start, end ] }`

The position of the first element equal to `value`, or `-1` if there is none.
Elements are compared by content, so you can search for an object or an array.

`start` and `end` limit the search. `start` is included and `end` is not.

### Example
```js
jsongin.Evaluate( document, { $indexOfArray: [ '$scores', 20 ] } );
// returns 1

jsongin.Evaluate( document, { $indexOfArray: [ '$scores', 99 ] } );
// returns -1

jsongin.Evaluate( document, { $indexOfArray: [ '$scores', 10, 1 ] } );
// returns -1
```


<a id="$slice"></a>$slice
---------------------------------------------------------------------

**Usage** : `{ $slice: [ array, n ] }` or `{ $slice: [ array, position, n ] }`

Part of an array.

- With ***two*** operands, it takes `n` elements from the start, or from the end if `n` is
  negative.
- With ***three***, it starts at `position` (negative counts back from the end) and takes `n`
  elements. Here `n` cannot be negative.

Asking for more elements than there are gives all of them.

In a [`Project()`](./Project.md) projection, `$slice` is the
  [projection operator](./Projection-Operators.md#$slice) instead.

### Example
```js
jsongin.Evaluate( document, { $slice: [ '$scores', 2 ] } );
// returns [ 10, 20 ]

jsongin.Evaluate( document, { $slice: [ '$scores', -2 ] } );
// returns [ 20, 30 ]

jsongin.Evaluate( document, { $slice: [ '$scores', 1, 2 ] } );
// returns [ 20, 30 ]

jsongin.Evaluate( document, { $slice: [ '$scores', 99 ] } );
// returns [ 10, 20, 30 ]
```


<a id="$sortArray"></a>$sortArray
---------------------------------------------------------------------

**Usage** : `{ $sortArray: { input: expression, sortBy: 1 | -1 } }`
  or `{ $sortArray: { input: expression, sortBy: { field: 1 | -1, ... } } }`

Sorts an array.

- `sortBy: 1` or `-1` sorts the elements themselves, in MongoDB's type order.
- A `sortBy` object sorts an array of objects by their fields, as [`Sort()`](./Sort.md) does.

### Example
```js
jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $sortArray: { input: '$v', sortBy: 1 } } );
// returns [ 1, 2, 3 ]

jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $sortArray: { input: '$v', sortBy: -1 } } );
// returns [ 3, 2, 1 ]

let people = { p: [ { name: 'Carol' }, { name: 'Alice' } ] };
jsongin.Evaluate( people, { $sortArray: { input: '$p', sortBy: { name: 1 } } } );
// returns [ { name: 'Alice' }, { name: 'Carol' } ]
```


<a id="$zip"></a>$zip
---------------------------------------------------------------------

**Usage** : `{ $zip: { inputs: [ array, ... ], useLongestLength: boolean, defaults: [ value, ... ] } }`

Combines arrays element by element: the first element of each becomes the first element of the
  result, and so on.

- By default, the result is as long as the ***shortest*** array.
- With `useLongestLength: true`, it is as long as the longest, and missing values are `null`,
  or the matching entry of `defaults`.
- `defaults` without `useLongestLength: true` throws.

### Example
```js
jsongin.Evaluate( document, { $zip: { inputs: [ [ 1, 2 ], [ 'a', 'b' ] ] } } );
// returns [ [ 1, 'a' ], [ 2, 'b' ] ]

jsongin.Evaluate( document, { $zip: { inputs: [ [ 1, 2, 3 ], [ 'a' ] ] } } );
// returns [ [ 1, 'a' ] ]

jsongin.Evaluate( document, { $zip: { inputs: [ [ 1, 2 ], [ 'a' ] ], useLongestLength: true } } );
// returns [ [ 1, 'a' ], [ 2, null ] ]
```


<a id="$arrayToObject"></a>$arrayToObject
---------------------------------------------------------------------

**Usage** : `{ $arrayToObject: expression }`

Turns an array of key-value pairs into an object.
Each pair is either a two-element array, `[ 'a', 1 ]`, or an object, `{ k: 'a', v: 1 }`.
Keys must be strings. If a key appears twice, the last value wins.

Note that an array written directly in the expression needs an extra pair of brackets, so that it
  is not read as the operator's list of operands.

### Example
```js
jsongin.Evaluate( document, { $arrayToObject: [ [ [ 'a', 1 ], [ 'b', 2 ] ] ] } );
// returns { a: 1, b: 2 }

jsongin.Evaluate( document, { $arrayToObject: [ [ { k: 'a', v: 1 } ] ] } );
// returns { a: 1 }

jsongin.Evaluate( document, { $arrayToObject: [ [ [ 'a', 1 ], [ 'a', 2 ] ] ] } );
// returns { a: 2 }
```


<a id="$first"></a>$first
---------------------------------------------------------------------

**Usage** : `{ $first: expression }`

The first element of an array.
The [`$first` accumulator](./Accumulator-Operators.md#$first) is a different operator.

### Example
```js
jsongin.Evaluate( document, { $first: '$scores' } );
// returns 10
```


<a id="$last"></a>$last
---------------------------------------------------------------------

**Usage** : `{ $last: expression }`

The last element of an array.
The [`$last` accumulator](./Accumulator-Operators.md#$last) is a different operator.

### Example
```js
jsongin.Evaluate( document, { $last: '$scores' } );
// returns 30
```


<a id="$firstN"></a>$firstN
---------------------------------------------------------------------

**Usage** : `{ $firstN: { input: expression, n: number } }`

The first `n` elements of an array.
`n` must be a whole number, `1` or more. Asking for more than there are gives all of them.

### Example
```js
jsongin.Evaluate( document, { $firstN: { input: '$scores', n: 2 } } );
// returns [ 10, 20 ]

jsongin.Evaluate( document, { $firstN: { input: '$scores', n: 99 } } );
// returns [ 10, 20, 30 ]
```


<a id="$lastN"></a>$lastN
---------------------------------------------------------------------

**Usage** : `{ $lastN: { input: expression, n: number } }`

The last `n` elements of an array, in their original order.

### Example
```js
jsongin.Evaluate( document, { $lastN: { input: '$scores', n: 2 } } );
// returns [ 20, 30 ]
```


<a id="$minN"></a>$minN
---------------------------------------------------------------------

**Usage** : `{ $minN: { input: expression, n: number } }`

The `n` smallest elements of an array, ***smallest first***.

### Example
```js
jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $minN: { input: '$v', n: 2 } } );
// returns [ 1, 2 ]
```


<a id="$maxN"></a>$maxN
---------------------------------------------------------------------

**Usage** : `{ $maxN: { input: expression, n: number } }`

The `n` largest elements of an array, ***largest first***.

### Example
```js
jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $maxN: { input: '$v', n: 2 } } );
// returns [ 3, 2 ]
```


<a id="$map"></a>$map
---------------------------------------------------------------------

**Usage** : `{ $map: { input: array, as: name, in: expression } }`

Evaluates `in` for each element of an array, and returns an array of the results.

- The current element is `$$this`. With `as: 'item'`, it is `$$item` instead, and `$$this` is not
  available.
- ***A field reference in `in` still reads the document***, not the element. The element's `a`
  field is `'$$this.a'`, not `'$a'`.
- A `null` or missing `input` gives `null`. Any other `input` which is not an array throws.
- A result of nothing becomes `null`, so the array keeps its length.

See [Variables](#variables).

### Example
```js
jsongin.Evaluate( document, { $map: { input: '$scores', in: { $multiply: [ '$$this', 2 ] } } } );
// returns [ 20, 40, 60 ]

// `as` names the element.
jsongin.Evaluate( document, { $map: { input: '$scores', as: 'score', in: { $add: [ '$$score', 1 ] } } } );
// returns [ 11, 21, 31 ]

// '$a' reads the document, not the element.
jsongin.Evaluate( document, { $map: { input: '$scores', in: '$a' } } );
// returns [ 5, 5, 5 ]

// A null input gives null. A number throws.
jsongin.Evaluate( document, { $map: { input: '$empty', in: '$$this' } } ) === null
jsongin.Evaluate( document, { $map: { input: '$a', in: '$$this' } } );   // throws
```


<a id="$filter"></a>$filter
---------------------------------------------------------------------

**Usage** : `{ $filter: { input: array, as: name, cond: expression, limit: number } }`

Returns the elements of an array for which `cond` is true, in their original order.

- The current element is `$$this`, or the name given by `as`, as in [`$map`](#$map).
- `cond` is true unless it is `false`, `0`, `null` or missing. So `''` and `[]` are true.
- `limit` stops after that many elements have been kept. It can be an expression. It must be a
  whole number, `1` or more, or `null` for no limit.
- A `null` or missing `input` gives `null`. Any other `input` which is not an array throws.

### Example
```js
jsongin.Evaluate( document, { $filter: { input: '$scores', cond: { $gt: [ '$$this', 10 ] } } } );
// returns [ 20, 30 ]

// Keep at most two.
jsongin.Evaluate( document, { $filter: { input: '$scores', cond: true, limit: 2 } } );
// returns [ 10, 20 ]

// A null limit is no limit. Zero throws.
jsongin.Evaluate( document, { $filter: { input: '$scores', cond: true, limit: null } } );
// returns [ 10, 20, 30 ]
jsongin.Evaluate( document, { $filter: { input: '$scores', cond: true, limit: 0 } } );   // throws
```


<a id="$reduce"></a>$reduce
---------------------------------------------------------------------

**Usage** : `{ $reduce: { input: array, initialValue: expression, in: expression } }`

Combines an array into one value, one element at a time.

Inside `in`:

| **Variable** | **Holds**                                                    |
|--------------|--------------------------------------------------------------|
| `$$this`     | The current element.                                         |
| `$$value`    | The result so far. It starts as `initialValue`.              |

- The result is what `in` gives for the last element.
- The value can be anything, such as an array built with `$concatArrays`.
- `initialValue` is required. An empty array returns it unchanged.
- There is no `as`, so the variable names cannot be changed.
- A `null` or missing `input` gives `null`. Any other `input` which is not an array throws.

### Example
```js
jsongin.Evaluate( document,
	{ $reduce: { input: '$scores', initialValue: 0, in: { $add: [ '$$value', '$$this' ] } } } );
// returns 60

// Build an array.
jsongin.Evaluate( document, {
	$reduce: {
		input: '$scores',
		initialValue: [],
		in: { $concatArrays: [ '$$value', [ { $divide: [ '$$this', 10 ] } ] ] },
	}
} );
// returns [ 1, 2, 3 ]

// An empty array gives the initial value.
jsongin.Evaluate( { v: [] }, { $reduce: { input: '$v', initialValue: 'none', in: '$$value' } } ) === 'none'
```


# Variables

<a id="variables"></a>

A name starting with `$$` is a ***variable***. A name starting with one `$` is a field.
Fields come from the document. Variables come from the ***scope***: the variables available where
  the expression is evaluated. See [Scope](./Scope.md).

***A variable nobody defined throws.*** A missing field just gives nothing.
So a misspelled variable is caught, while a misspelled field is not.

```js
jsongin.Evaluate( document, '$naem' ) === undefined
jsongin.Evaluate( document, '$$totl' );   // throws
```


## The System Variables

These four are always available:

| **Variable**  | **Holds**                                                                  |
|---------------|------------------------------------------------------------------------------|
| `$$ROOT`      | The whole document the stage is working on.                                |
| `$$CURRENT`   | The document field references read from. `'$a'` is short for `'$$CURRENT.a'`. |
| `$$NOW`       | The time the pipeline started, as a `Date`.                                |
| `$$REMOVE`    | No value. Use it to leave a field out.                                     |

A variable can be followed by a path: `'$$ROOT.user.role'` is the same as `'$user.role'`.

```js
jsongin.Evaluate( document, '$$ROOT.user.role' ) === 'admin'
jsongin.Evaluate( document, '$$CURRENT.a' ) === 5
jsongin.Evaluate( document, '$a' ) === 5

let instant = jsongin.Evaluate( document, '$$NOW' );
instant instanceof Date === true
```

- `$$ROOT` is the document as the stage received it, after any earlier stages changed it.
- `$$CURRENT` is usually the same as `$$ROOT`. Inside [`$redact`](./Stage-Operators.md#$redact),
  it is the nested object being decided on.
- `$$NOW` is the same time for every document and stage in one pipeline run.

***`$$REMOVE` leaves a field out.***
A field computed as `$$REMOVE` is left out of an object, so one expression can keep a field in one
  document and drop it from another.
In an array, it becomes `null`, so the other elements keep their positions.

```js
jsongin.Evaluate( document, { keep: '$a', drop: '$$REMOVE' } );
// returns { keep: 5 }

jsongin.Evaluate( document, [ '$a', '$$REMOVE', '$b' ] );
// returns [ 5, null, 2 ]
```

System variables are in capitals. A lowercase name like `'$$now'` is not a system variable, so it
  throws unless you defined it.

```js
jsongin.Evaluate( document, '$$now' );    // throws
jsongin.Evaluate( document, '$$root' );   // throws
```


## Defining Variables

A variable you define must ***start with a lowercase letter***, and then use only letters, digits
  and underscores. So `a_b` is allowed and `_ab` is not.
This means your variables can never hide a system variable.

These operators define variables:

| **Operator**             | **Defines**                                  |
|--------------------------|------------------------------------------------|
| [$let](#$let)            | the names you choose                         |
| [$map](#$map)            | `$$this`, or the name given by `as`          |
| [$filter](#$filter)      | `$$this`, or the name given by `as`          |
| [$reduce](#$reduce)      | `$$this` and `$$value`                       |
| [$redact](./Stage-Operators.md#$redact) | `$$DESCEND`, `$$PRUNE`, `$$KEEP` |

A variable only exists inside the operator which defines it.

```js
jsongin.Evaluate( document, '$$this' );      // throws
jsongin.Evaluate( document, '$$DESCEND' );   // throws
```

You can also define variables from outside the expression with a [Scope](./Scope.md).


<a id="$let"></a>$let
---------------------------------------------------------------------

**Usage** : `{ $let: { vars: { name: expression, ... }, in: expression } }`

Defines variables, and evaluates `in` with them. Inside `in`, each is read as `$$name`.

- Field references inside `in` still read the document.
- The variables in one `vars` cannot use each other. Every value is evaluated first, then they are
  all defined together. To build one variable from another, nest a second `$let`.
- An inner `$let` can reuse a name. Inside its `in`, the inner value is used.
- A variable can hold nothing, such as a missing field. Reading it gives nothing, so a field
  computed from it is left out. Use [`$ifNull`](#$ifNull) for a default.

### Example
```js
jsongin.Evaluate( document,
	{ $let: { vars: { total: { $add: [ '$a', '$b' ] } }, in: { $multiply: [ '$$total', 10 ] } } } ) === 70

// A path into a variable.
jsongin.Evaluate( document, { $let: { vars: { u: '$user' }, in: '$$u.role' } } ) === 'admin'

// y cannot use x in the same vars.
jsongin.Evaluate( document, { $let: { vars: { x: 1, y: '$$x' }, in: '$$y' } } );   // throws

// Nest $let to build one variable from another.
jsongin.Evaluate( document, {
	$let: {
		vars: { half: { $divide: [ '$a', 2 ] } },
		in: { $let: { vars: { quarter: { $divide: [ '$$half', 2 ] } }, in: '$$quarter' } },
	}
} ) === 1.25

// The inner x is 10 inside its own in, and the outer x is still 1 outside it.
jsongin.Evaluate( document, {
	$let: {
		vars: { x: 1 },
		in: { $add: [ { $let: { vars: { x: 10 }, in: '$$x' } }, '$$x' ] },
	}
} ) === 11

// A variable holding nothing leaves the field out.
jsongin.Evaluate( document, { r: { $let: { vars: { m: '$nope' }, in: '$$m' } } } );
// returns { }
```


# String Operators

The string operators handle `null` in different ways, following MongoDB.
Each operator below says which:

| **For a `null` or missing operand** | **Operators**                                                   |
|-------------------------------------|-----------------------------------------------------------------|
| the result is `null`                | `$concat`, `$split`, `$trim`, `$ltrim`, `$rtrim`, `$indexOfBytes`, `$indexOfCP`, `$replaceOne`, `$replaceAll` |
| it is treated as `''`               | `$toLower`, `$toUpper`, `$strcasecmp`, `$substr`, `$substrBytes`, `$substrCP` |
| it throws                           | `$strLenBytes`, `$strLenCP`                                      |

***Bytes and code points.***
Some operators come in two forms. The `Bytes` forms count UTF-8 bytes. The `CP` forms count code
  points, which are characters as a person would count them.
They only differ for non-ASCII text: `'héllo'` is 5 code points but 6 bytes, because `é` is 2
  bytes.
Use the `CP` forms for text which may not be ASCII. A byte range which would cut a character in
  half throws.


<a id="$concat"></a>$concat
---------------------------------------------------------------------

**Usage** : `{ $concat: [ expression, ... ] }`

Joins strings.
If any operand is `null` or missing, the result is `null`. Every other operand must be a string.

### Example
```js
jsongin.Evaluate( document, { $concat: [ 'Hello, ', '$name', '!' ] } );
// returns 'Hello, Alice!'

// A null operand makes the result null.
jsongin.Evaluate( document, { $concat: [ '$name', '$empty' ] } );
// returns null

// A number throws.
jsongin.Evaluate( document, { $concat: [ '$name', '$a' ] } );   // throws
```


<a id="$split"></a>$split
---------------------------------------------------------------------

**Usage** : `{ $split: [ string, delimiter ] }`

Splits a string into an array at each delimiter.

- If the delimiter is not found, the result has one element, the whole string.
- A delimiter at either end gives an empty string there.
- An empty delimiter throws.

### Example
```js
jsongin.Evaluate( document, { $split: [ 'a-b-c', '-' ] } );
// returns [ 'a', 'b', 'c' ]

jsongin.Evaluate( document, { $split: [ '$name', '-' ] } );
// returns [ 'Alice' ]

jsongin.Evaluate( document, { $split: [ '-a-', '-' ] } );
// returns [ '', 'a', '' ]
```


<a id="$toLower"></a>$toLower
---------------------------------------------------------------------

**Usage** : `{ $toLower: expression }`

Converts a string to lowercase.
A `null` or missing operand gives `''`. A number is converted to a string.

### Example
```js
jsongin.Evaluate( document, { $toLower: '$name' } );
// returns 'alice'

jsongin.Evaluate( document, { $toLower: '$nope' } );
// returns ''
```


<a id="$toUpper"></a>$toUpper
---------------------------------------------------------------------

**Usage** : `{ $toUpper: expression }`

Converts a string to uppercase. It handles `null` like [`$toLower`](#$toLower).

### Example
```js
jsongin.Evaluate( document, { $toUpper: '$name' } );
// returns 'ALICE'
```


<a id="$strcasecmp"></a>$strcasecmp
---------------------------------------------------------------------

**Usage** : `{ $strcasecmp: [ string, string ] }`

Compares two strings, ignoring case.
Returns `-1` if the first comes before the second, `0` if they are the same, and `1` if it comes
  after.

### Example
```js
jsongin.Evaluate( document, { $strcasecmp: [ '$name', 'ALICE' ] } );
// returns 0

jsongin.Evaluate( document, { $strcasecmp: [ '$name', 'Bob' ] } );
// returns -1
```


<a id="$trim"></a>$trim
---------------------------------------------------------------------

**Usage** : `{ $trim: { input: expression, chars: expression } }`

Removes characters from both ends of a string.

- Without `chars`, whitespace is removed.
- `chars` is a ***set*** of characters: any of them are removed from the ends, in any order.
- A `null` `input` or `chars` gives `null`.
- An unknown argument name throws.

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $trim: { input: '$padded' } } );
// returns 'hi'

// x and y are removed from both ends.
jsongin.Evaluate( document, { $trim: { input: 'xyhixy', chars: 'yx' } } );
// returns 'hi'

// char is not an argument name.
jsongin.Evaluate( document, { $trim: { input: '$name', char: 'A' } } );   // throws
```


<a id="$ltrim"></a>$ltrim
---------------------------------------------------------------------

**Usage** : `{ $ltrim: { input: expression, chars: expression } }`

Like [`$trim`](#$trim), but only removes characters from the start.

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $ltrim: { input: '$padded' } } );
// returns 'hi  '
```


<a id="$rtrim"></a>$rtrim
---------------------------------------------------------------------

**Usage** : `{ $rtrim: { input: expression, chars: expression } }`

Like [`$trim`](#$trim), but only removes characters from the end.

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $rtrim: { input: '$padded' } } );
// returns '  hi'
```


<a id="$substr"></a>$substr
---------------------------------------------------------------------

**Usage** : `{ $substr: [ string, start, length ] }`

***Deprecated in MongoDB.*** The same as [`$substrBytes`](#$substrBytes).
Use [`$substrCP`](#$substrCP) for text which may not be ASCII.

### Example
```js
jsongin.Evaluate( document, { $substr: [ '$name', 0, 3 ] } );
// returns 'Ali'
```


<a id="$substrBytes"></a>$substrBytes
---------------------------------------------------------------------

**Usage** : `{ $substrBytes: [ string, start, length ] }`

Part of a string, with `start` and `length` counted in ***UTF-8 bytes***.

- A negative `length` means "to the end".
- A fractional `start` or `length` is rounded down.
- A range which starts or ends in the middle of a character throws.

### Example
```js
jsongin.Evaluate( document, { $substrBytes: [ '$name', 1, 3 ] } );
// returns 'lic'

// A negative length means to the end.
jsongin.Evaluate( document, { $substrBytes: [ '$name', 3, -1 ] } );
// returns 'ce'

// é is two bytes, so this range cuts it in half.
jsongin.Evaluate( { w: 'héllo' }, { $substrBytes: [ '$w', 1, 1 ] } );   // throws
```


<a id="$substrCP"></a>$substrCP
---------------------------------------------------------------------

**Usage** : `{ $substrCP: [ string, start, length ] }`

Part of a string, with `start` and `length` counted in ***code points***.
Use this for text which may not be ASCII: it never cuts a character in half.

It is stricter than `$substrBytes`, as in MongoDB: a fractional `start` and a negative `length`
  both throw.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $substrCP: [ '$w', 0, 2 ] } );
// returns 'hé'

jsongin.Evaluate( { w: 'héllo' }, { $substrCP: [ '$w', 1, 1 ] } );
// returns 'é'

// A fractional start throws.
jsongin.Evaluate( document, { $substrCP: [ '$name', 1.5, 2 ] } );   // throws
```


<a id="$strLenBytes"></a>$strLenBytes
---------------------------------------------------------------------

**Usage** : `{ $strLenBytes: expression }`

The length of a string in ***UTF-8 bytes***. A `null` or missing operand throws.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $strLenBytes: '$w' } );
// returns 6

jsongin.Evaluate( document, { $strLenBytes: '$empty' } );   // throws
```


<a id="$strLenCP"></a>$strLenCP
---------------------------------------------------------------------

**Usage** : `{ $strLenCP: expression }`

The length of a string in ***code points***: the number of characters. A `null` or missing operand
  throws.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $strLenCP: '$w' } );
// returns 5

// The same string in bytes.
jsongin.Evaluate( { w: 'héllo' }, { $strLenBytes: '$w' } );
// returns 6
```


<a id="$indexOfBytes"></a>$indexOfBytes
---------------------------------------------------------------------

**Usage** : `{ $indexOfBytes: [ string, search, start, end ] }`

The position of the first `search` in the string, counted in ***UTF-8 bytes***, or `-1` if it is
  not found.
`start` and `end` are optional, also in bytes, and limit the search. The whole match must be inside
  them.

### Example
```js
jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'i' ] } );
// returns 2

jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'z' ] } );
// returns -1

// 'i' is at 2, which is outside 0 to 2.
jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'i', 0, 2 ] } );
// returns -1
```


<a id="$indexOfCP"></a>$indexOfCP
---------------------------------------------------------------------

**Usage** : `{ $indexOfCP: [ string, search, start, end ] }`

Like [`$indexOfBytes`](#$indexOfBytes), but counted in ***code points***.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $indexOfCP: [ '$w', 'l' ] } );
// returns 2

// In bytes, é counts as two.
jsongin.Evaluate( { w: 'héllo' }, { $indexOfBytes: [ '$w', 'l' ] } );
// returns 3
```


<a id="$regexMatch"></a>$regexMatch
---------------------------------------------------------------------

**Usage** : `{ $regexMatch: { input: expression, regex: pattern, options: flags } }`

`true` when the regular expression matches the string.

- `regex` can be a string or a Javascript regular expression.
- `options` holds flags, such as `'i'`, including MongoDB's `x`, which ignores whitespace in the
  pattern. It works as the query [`$options`](./Query-Operators.md#$regex) does.
- A `null` or missing `input` gives `false`.

### Example
```js
jsongin.Evaluate( document, { $regexMatch: { input: '$name', regex: '^A' } } );
// returns true

jsongin.Evaluate( document, { $regexMatch: { input: '$name', regex: 'alice', options: 'i' } } );
// returns true

jsongin.Evaluate( document, { $regexMatch: { input: '$nope', regex: 'a' } } );
// returns false
```


<a id="$regexFind"></a>$regexFind
---------------------------------------------------------------------

**Usage** : `{ $regexFind: { input: expression, regex: pattern, options: flags } }`

The first match, as `{ match, idx, captures }`, or `null` if there is none.

- `match` is the matched text.
- `idx` is its position, counted in code points.
- `captures` holds the text of each group in the pattern. A group which did not match is `null`.

### Example
```js
jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: 'l' } } );
// returns { match: 'l', idx: 1, captures: [] }

jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: '(A)(l)' } } );
// returns { match: 'Al', idx: 0, captures: [ 'A', 'l' ] }

jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: 'zzz' } } );
// returns null
```


<a id="$regexFindAll"></a>$regexFindAll
---------------------------------------------------------------------

**Usage** : `{ $regexFindAll: { input: expression, regex: pattern, options: flags } }`

Every match, as an array of `{ match, idx, captures }`. With no match, the array is empty.

### Example
```js
jsongin.Evaluate( { s: 'abab' }, { $regexFindAll: { input: '$s', regex: 'a' } } );
// returns [ { match: 'a', idx: 0, captures: [] }, { match: 'a', idx: 2, captures: [] } ]

jsongin.Evaluate( document, { $regexFindAll: { input: '$name', regex: 'zzz' } } );
// returns []
```


<a id="$replaceOne"></a>$replaceOne
---------------------------------------------------------------------

**Usage** : `{ $replaceOne: { input: expression, find: expression, replacement: expression } }`

Replaces the first `find` in the string with `replacement`.

- `find` is plain text, not a pattern, so `.` means a full stop.
- If `find` is not there, the string is returned unchanged.
- A `null` in any of the three gives `null`.

### Example
```js
jsongin.Evaluate( { s: 'aa' }, { $replaceOne: { input: '$s', find: 'a', replacement: 'b' } } );
// returns 'ba'

jsongin.Evaluate( document, { $replaceOne: { input: '$name', find: 'z', replacement: 'Z' } } );
// returns 'Alice'
```


<a id="$replaceAll"></a>$replaceAll
---------------------------------------------------------------------

**Usage** : `{ $replaceAll: { input: expression, find: expression, replacement: expression } }`

Like [`$replaceOne`](#$replaceOne), but replaces every `find`.

### Example
```js
jsongin.Evaluate( { s: 'aa' }, { $replaceAll: { input: '$s', find: 'a', replacement: 'b' } } );
// returns 'bb'

// find is plain text, so '.' is a full stop.
jsongin.Evaluate( { s: 'a.b' }, { $replaceAll: { input: '$s', find: '.', replacement: '-' } } );
// returns 'a-b'
```


# Trigonometry Operators

***Angles are in radians.***
Use [`$degreesToRadians`](#$degreesToRadians) and [`$radiansToDegrees`](#$radiansToDegrees) to
  convert.

A value outside an operator's allowed range throws:

| **Operator**                                              | **Allowed values**                            |
|-----------------------------------------------------------|-----------------------------------------------|
| [$sin](#$sin), [$cos](#$cos), [$tan](#$tan)               | any finite number                             |
| [$asin](#$asin), [$acos](#$acos), [$atanh](#$atanh)       | -1 to 1                                       |
| [$acosh](#$acosh)                                         | 1 or more                                     |
| [$atan](#$atan), [$atan2](#$atan2), [$sinh](#$sinh), [$cosh](#$cosh), [$tanh](#$tanh), [$asinh](#$asinh) | any number |

A `null` or missing operand gives `null`. An operand which is not a number throws.
`NaN` gives `NaN`.


<a id="$sin"></a>$sin
---------------------------------------------------------------------

**Usage** : `{ $sin: expression }`

The sine of an angle.

### Example
```js
jsongin.Evaluate( document, { $sin: 0 } );
// returns 0

jsongin.Evaluate( document, { $sin: { $degreesToRadians: 90 } } );
// returns 1
```


<a id="$cos"></a>$cos
---------------------------------------------------------------------

**Usage** : `{ $cos: expression }`

The cosine of an angle.

### Example
```js
jsongin.Evaluate( document, { $cos: 0 } );
// returns 1
```


<a id="$tan"></a>$tan
---------------------------------------------------------------------

**Usage** : `{ $tan: expression }`

The tangent of an angle.

### Example
```js
jsongin.Evaluate( document, { $tan: 0 } );
// returns 0
```


<a id="$asin"></a>$asin
---------------------------------------------------------------------

**Usage** : `{ $asin: expression }`

The inverse sine, in radians. The value must be from -1 to 1.

### Example
```js
jsongin.Evaluate( document, { $asin: 1 } );
// returns 1.5707963267948966

jsongin.Evaluate( document, { $asin: 2 } );
// throws
```


<a id="$acos"></a>$acos
---------------------------------------------------------------------

**Usage** : `{ $acos: expression }`

The inverse cosine, in radians. The value must be from -1 to 1.

### Example
```js
jsongin.Evaluate( document, { $acos: 1 } );
// returns 0
```


<a id="$atan"></a>$atan
---------------------------------------------------------------------

**Usage** : `{ $atan: expression }`

The inverse tangent, in radians. Any number is allowed.

### Example
```js
jsongin.Evaluate( document, { $atan: 1 } );
// returns 0.7853981633974483
```


<a id="$atan2"></a>$atan2
---------------------------------------------------------------------

**Usage** : `{ $atan2: [ y, x ] }`

The angle, in radians, of the point `( x, y )`.
Unlike `$atan` of `y / x`, it uses the signs of both values, so it can tell which quarter of the
  circle the point is in.

### Example
```js
jsongin.Evaluate( document, { $atan2: [ 0, 1 ] } );
// returns 0

jsongin.Evaluate( document, { $atan2: [ 0, -1 ] } );
// returns 3.141592653589793
```


<a id="$sinh"></a>$sinh
---------------------------------------------------------------------

**Usage** : `{ $sinh: expression }`

The hyperbolic sine.

### Example
```js
jsongin.Evaluate( document, { $sinh: 0 } );
// returns 0
```


<a id="$cosh"></a>$cosh
---------------------------------------------------------------------

**Usage** : `{ $cosh: expression }`

The hyperbolic cosine. The result is always 1 or more.

### Example
```js
jsongin.Evaluate( document, { $cosh: 0 } );
// returns 1
```


<a id="$tanh"></a>$tanh
---------------------------------------------------------------------

**Usage** : `{ $tanh: expression }`

The hyperbolic tangent. The result is always between -1 and 1.

### Example
```js
jsongin.Evaluate( document, { $tanh: 0 } );
// returns 0
```


<a id="$asinh"></a>$asinh
---------------------------------------------------------------------

**Usage** : `{ $asinh: expression }`

The inverse hyperbolic sine. Any number is allowed.

### Example
```js
jsongin.Evaluate( document, { $asinh: 0 } );
// returns 0
```


<a id="$acosh"></a>$acosh
---------------------------------------------------------------------

**Usage** : `{ $acosh: expression }`

The inverse hyperbolic cosine. The value must be 1 or more.

### Example
```js
jsongin.Evaluate( document, { $acosh: 1 } );
// returns 0

jsongin.Evaluate( document, { $acosh: 0 } );
// throws
```


<a id="$atanh"></a>$atanh
---------------------------------------------------------------------

**Usage** : `{ $atanh: expression }`

The inverse hyperbolic tangent. The value must be from -1 to 1.
`-1` and `1` give `-Infinity` and `Infinity`.

### Example
```js
jsongin.Evaluate( document, { $atanh: 0 } );
// returns 0

jsongin.Evaluate( document, { $atanh: 2 } );
// throws
```


<a id="$degreesToRadians"></a>$degreesToRadians
---------------------------------------------------------------------

**Usage** : `{ $degreesToRadians: expression }`

Converts degrees to radians.

### Example
```js
jsongin.Evaluate( document, { $degreesToRadians: 180 } );
// returns 3.141592653589793
```


<a id="$radiansToDegrees"></a>$radiansToDegrees
---------------------------------------------------------------------

**Usage** : `{ $radiansToDegrees: expression }`

Converts radians to degrees.

### Example
```js
jsongin.Evaluate( document, { $radiansToDegrees: 3.141592653589793 } );
// returns 180

jsongin.Evaluate( document, { $radiansToDegrees: { $asin: 1 } } );
// returns 90
```


# Type Operators

[`$convert`](#$convert) converts a value to a type. The `$toX` operators are shortcuts for it.
Each returns `null` for a `null` or missing value, and throws when the value cannot be converted.
Only `$convert` can return a fallback value instead of throwing.

These conversions follow MongoDB, not Javascript:

| **Value**                   | **Javascript** | **Here**                  |
|-----------------------------|----------------|---------------------------|
| `Number( ' 5' )`            | `5`            | throws: spaces are not allowed |
| `Number( '' )`              | `0`            | throws                    |
| `Boolean( '' )`             | `false`        | `true`: every string is true |
| `Date.parse( '2020' )`      | a date         | throws                    |
| a date and time with no time zone | local time | UTC                   |

***One difference from MongoDB.***
MongoDB stores `int`, `long` and `double` as different types, and remembers which one a conversion
  produced. So in MongoDB, `{ $type: { $toLong: 42 } }` is `'long'`.
`jsongin` has only one kind of number, and `$type` works out a number's type from its value, so
  here it is `'int'`.
The converted value is the same either way.
`$toDecimal` and `$toObjectId` are not available, because `jsongin` has no such types.


<a id="$type"></a>$type
---------------------------------------------------------------------

**Usage** : `{ $type: expression }`

The BSON type name of a value.
A missing field is `'missing'`, and a field holding `null` is `'null'`.

A whole number from -2147483648 to 2147483647 is `'int'`. Every other number is `'double'`.
See [`BsonType()`](./BsonType.md).

### Example
```js
jsongin.Evaluate( document, { $type: '$a' } );
// returns 'int'

jsongin.Evaluate( document, { $type: '$name' } );
// returns 'string'

jsongin.Evaluate( document, { $type: '$scores' } );
// returns 'array'

jsongin.Evaluate( document, { $type: '$empty' } );
// returns 'null'

jsongin.Evaluate( document, { $type: '$nowhere' } );
// returns 'missing'
```


<a id="$isNumber"></a>$isNumber
---------------------------------------------------------------------

**Usage** : `{ $isNumber: expression }`

`true` when the value is a number. For `null`, it returns `false`, not `null`.

### Example
```js
jsongin.Evaluate( document, { $isNumber: '$a' } );
// returns true

jsongin.Evaluate( document, { $isNumber: '$name' } );
// returns false

jsongin.Evaluate( document, { $isNumber: '$empty' } );
// returns false
```


<a id="$toString"></a>$toString
---------------------------------------------------------------------

**Usage** : `{ $toString: expression }`

Converts a value to a string. A date becomes an ISO 8601 string. An array or object throws.

### Example
```js
jsongin.Evaluate( document, { $toString: '$a' } );
// returns '5'

jsongin.Evaluate( document, { $toString: true } );
// returns 'true'

jsongin.Evaluate( document, { $toString: '$scores' } );
// throws
```


<a id="$toBool"></a>$toBool
---------------------------------------------------------------------

**Usage** : `{ $toBool: expression }`

Converts a value to a boolean.
Only `0` and `false` become `false`. Every string (including `''`), array, object and date becomes
  `true`. It never throws.

### Example
```js
jsongin.Evaluate( document, { $toBool: '$a' } );
// returns true

jsongin.Evaluate( document, { $toBool: 0 } );
// returns false

jsongin.Evaluate( document, { $toBool: '' } );
// returns true
```


<a id="$toDate"></a>$toDate
---------------------------------------------------------------------

**Usage** : `{ $toDate: expression }`

Converts a value to a date.
A number is milliseconds since 1970. A string is read as a date; if it has no time zone, it is
  read as UTC.

### Example
```js
jsongin.Evaluate( document, { $toDate: 0 } );
// returns new Date( '1970-01-01T00:00:00.000Z' )

jsongin.Evaluate( document, { $toDate: '2020-01-02T03:04:05Z' } );
// returns new Date( '2020-01-02T03:04:05.000Z' )

jsongin.Evaluate( document, { $toDate: '$name' } );
// throws
```


<a id="$toInt"></a>$toInt
---------------------------------------------------------------------

**Usage** : `{ $toInt: expression }`

Converts a value to a 32-bit integer.

- A number with a fraction is cut down to a whole number, not rounded.
- A string must hold a whole number. `'3.9'` throws.
- A value outside -2147483648 to 2147483647 throws, as do `NaN`, `Infinity` and dates.

### Example
```js
jsongin.Evaluate( document, { $toInt: '42' } );
// returns 42

jsongin.Evaluate( document, { $toInt: 3.9 } );
// returns 3

jsongin.Evaluate( document, { $toInt: '3.9' } );
// throws

jsongin.Evaluate( document, { $toInt: 2147483648 } );
// throws
```


<a id="$toLong"></a>$toLong
---------------------------------------------------------------------

**Usage** : `{ $toLong: expression }`

Converts a value to a 64-bit integer.
Like [`$toInt`](#$toInt), but it allows much larger numbers, and converts a date to milliseconds
  since 1970.

### Example
```js
jsongin.Evaluate( document, { $toLong: 3000000000 } );
// returns 3000000000

jsongin.Evaluate( document, { $toLong: new Date( '2020-01-02T03:04:05.678Z' ) } );
// returns 1577934245678
```


<a id="$toDouble"></a>$toDouble
---------------------------------------------------------------------

**Usage** : `{ $toDouble: expression }`

Converts a value to a number.
Unlike [`$toInt`](#$toInt), it keeps fractions, reads strings like `'3.14'`, and allows `NaN` and
  `Infinity`.

### Example
```js
jsongin.Evaluate( document, { $toDouble: '3.14' } );
// returns 3.14

jsongin.Evaluate( document, { $toDouble: true } );
// returns 1
```


<a id="$convert"></a>$convert
---------------------------------------------------------------------

**Usage** : `{ $convert: { input: expression, to: type, onError: expression, onNull: expression } }`

Converts a value to the type named in `to`: `'double'`, `'string'`, `'bool'`, `'date'`, `'int'` or
  `'long'`, or the BSON type number for one of them.

- `onNull` is returned when `input` is `null` or missing. Without it, the result is `null`.
- `onError` is returned when the conversion fails. Without it, the failure throws.
- A `null` input uses `onNull`, even if only `onError` is given.
- An unknown `to` always throws, even with `onError`.

### Example
```js
jsongin.Evaluate( document, { $convert: { input: '$a', to: 'string' } } );
// returns '5'

jsongin.Evaluate( document, { $convert: { input: '$name', to: 'int', onError: -1 } } );
// returns -1

jsongin.Evaluate( document, { $convert: { input: '$empty', to: 'int', onNull: 0 } } );
// returns 0

jsongin.Evaluate( document, { $convert: { input: '$empty', to: 'int', onError: -1 } } );
// returns null
```


# Set Operators

These operators treat arrays as ***sets***: order does not matter and duplicates count once.
So `[ 1, 1, 2 ]` and `[ 2, 1 ]` are the same set.

- A set result is ***sorted***, in MongoDB's type order: `null`, numbers, strings, objects, arrays,
  booleans, dates.
- Only the outer array is a set. Each element is compared whole, with
  [`CompareValues()`](./CompareValues.md), so `[ [ 1, 2 ] ]` and `[ [ 2, 1 ] ]` are different sets.

They handle `null` in two ways, following MongoDB:

| **Operator** | **A `null` operand** |
|--------------|--------------------|
| [$setUnion](#$setUnion), [$setIntersection](#$setIntersection), [$setDifference](#$setDifference) | gives `null` |
| [$setEquals](#$setEquals), [$setIsSubset](#$setIsSubset), [$allElementsTrue](#$allElementsTrue), [$anyElementTrue](#$anyElementTrue) | throws |


<a id="$setEquals"></a>$setEquals
---------------------------------------------------------------------

**Usage** : `{ $setEquals: [ array, array, ... ] }`

`true` when all the sets hold the same elements. It needs two or more.

### Example
```js
jsongin.Evaluate( document, { $setEquals: [ [ 1, 2 ], [ 2, 1 ] ] } );
// returns true

jsongin.Evaluate( document, { $setEquals: [ [ 1, 1, 2 ], [ 1, 2 ] ] } );
// returns true

jsongin.Evaluate( document, { $setEquals: [ [ 1, 2 ], [ 1, 3 ] ] } );
// returns false
```


<a id="$setIsSubset"></a>$setIsSubset
---------------------------------------------------------------------

**Usage** : `{ $setIsSubset: [ array, array ] }`

`true` when every element of the first set is in the second. It needs exactly two.
An empty set is a subset of any set.

### Example
```js
jsongin.Evaluate( document, { $setIsSubset: [ [ 1, 2 ], [ 1, 2, 3 ] ] } );
// returns true

jsongin.Evaluate( document, { $setIsSubset: [ [ 1, 4 ], [ 1, 2, 3 ] ] } );
// returns false

jsongin.Evaluate( document, { $setIsSubset: [ [], [ 1 ] ] } );
// returns true
```


<a id="$setUnion"></a>$setUnion
---------------------------------------------------------------------

**Usage** : `{ $setUnion: [ array, array, ... ] }`

The elements which are in any of the sets.

### Example
```js
jsongin.Evaluate( document, { $setUnion: [ [ 1, 2 ], [ 2, 3 ] ] } );
// returns [ 1, 2, 3 ]

// The result is sorted.
jsongin.Evaluate( document, { $setUnion: [ [ 3, 1, 2 ], [ 2 ] ] } );
// returns [ 1, 2, 3 ]
```


<a id="$setIntersection"></a>$setIntersection
---------------------------------------------------------------------

**Usage** : `{ $setIntersection: [ array, array, ... ] }`

The elements which are in every set.

### Example
```js
jsongin.Evaluate( document, { $setIntersection: [ [ 3, 1, 2 ], [ 3, 4 ] ] } );
// returns [ 3 ]

jsongin.Evaluate( document, { $setIntersection: [ [ 1, 2 ], [ 3 ] ] } );
// returns []
```


<a id="$setDifference"></a>$setDifference
---------------------------------------------------------------------

**Usage** : `{ $setDifference: [ array, array ] }`

The elements of the first set which are not in the second. It needs exactly two sets.

### Example
```js
jsongin.Evaluate( document, { $setDifference: [ [ 3, 1, 2 ], [ 3, 4 ] ] } );
// returns [ 1, 2 ]

jsongin.Evaluate( document, { $setDifference: [ [ 1 ], [] ] } );
// returns [ 1 ]
```


<a id="$allElementsTrue"></a>$allElementsTrue
---------------------------------------------------------------------

**Usage** : `{ $allElementsTrue: [ array ] }`

`true` when every element is true.
Only `false`, `0`, `null` and missing are false, so `''` and `[]` are true.
An empty array gives `true`.

### Example
```js
jsongin.Evaluate( document, { $allElementsTrue: [ [ true, 1, 'x' ] ] } );
// returns true

jsongin.Evaluate( document, { $allElementsTrue: [ [ true, 0 ] ] } );
// returns false

jsongin.Evaluate( document, { $allElementsTrue: [ [ '', [] ] ] } );
// returns true

jsongin.Evaluate( document, { $allElementsTrue: [ [] ] } );
// returns true
```


<a id="$anyElementTrue"></a>$anyElementTrue
---------------------------------------------------------------------

**Usage** : `{ $anyElementTrue: [ array ] }`

`true` when at least one element is true. An empty array gives `false`.

### Example
```js
jsongin.Evaluate( document, { $anyElementTrue: [ [ false, 1 ] ] } );
// returns true

jsongin.Evaluate( document, { $anyElementTrue: [ [ false, 0, null ] ] } );
// returns false

jsongin.Evaluate( document, { $anyElementTrue: [ [] ] } );
// returns false
```


# Object Operators

`$getField`, `$setField` and `$unsetField` work on one field of an object, named by `field`.

- ***A dot in the name is part of the name.*** `field: 'a.b'` means a field called `a.b`, not `b`
  inside `a`. These operators are the only way to reach such a field.
- The name must be written as a plain string, or with [`$literal`](#$literal). A computed name
  throws.
- A name starting with `$` must use `$literal`: `{ field: { $literal: '$price' } }`.
  A plain `'$price'` would be a field reference.

They handle a missing or wrong-type `input` differently, following MongoDB:

| **Operator** | **`null` input** | **Missing input, or not an object** |
|--------------|------------------|-----------------------------------------------------|
| [$getField](#$getField) | `null` | nothing (the field is left out) |
| [$setField](#$setField), [$unsetField](#$unsetField) | `null` | `null` if missing; otherwise it throws |

***Shortcuts.*** `{ $getField: 'name' }` reads the field from `$$CURRENT`.
`{ $getField: { field: 'name' } }`, without `input`, throws.
To remove a field, you can use `$unsetField`, or `$setField` with `value: '$$REMOVE'`.


<a id="$mergeObjects"></a>$mergeObjects
---------------------------------------------------------------------

**Usage** : `{ $mergeObjects: [ object, object, ... ] }` or `{ $mergeObjects: object }`

Combines objects into one. When two have the same field, the later one wins.

- Only the top level is merged. A field holding an object is replaced whole.
- A replaced field keeps its position. New fields are added at the end.
- `null` and missing operands are skipped. No operands at all gives `{}`.

The [`$mergeObjects` accumulator](./Accumulator-Operators.md#$mergeObjects) merges objects across
  a group.

### Example
```js
jsongin.Evaluate( document, { $mergeObjects: [ { a: 1 }, { b: 2 } ] } );
// returns { a: 1, b: 2 }

jsongin.Evaluate( document, { $mergeObjects: [ { a: 1, b: 2 }, { a: 9 } ] } );
// returns { a: 9, b: 2 }

// A null operand is skipped.
jsongin.Evaluate( document, { $mergeObjects: [ '$user', '$empty' ] } );
// returns { role: 'admin' }

jsongin.Evaluate( document, { $mergeObjects: [] } );
// returns {}

// Nested objects are replaced, not merged.
jsongin.Evaluate( document, { $mergeObjects: [ { a: { x: 1 } }, { a: { y: 2 } } ] } );
// returns { a: { y: 2 } }
```


<a id="$objectToArray"></a>$objectToArray
---------------------------------------------------------------------

**Usage** : `{ $objectToArray: object }`

Turns an object into an array of `{ k: name, v: value }` pairs, in the object's field order.
[`$arrayToObject`](#$arrayToObject) does the reverse.

A `null` or missing operand gives `null`. Anything else which is not an object throws.

### Example
```js
jsongin.Evaluate( document, { $objectToArray: '$user' } );
// returns [ { k: 'role', v: 'admin' } ]

// Fields stay in their order.
jsongin.Evaluate( document, { $objectToArray: { z: 1, a: 2 } } );
// returns [ { k: 'z', v: 1 }, { k: 'a', v: 2 } ]

jsongin.Evaluate( document, { $objectToArray: '$empty' } );
// returns null

jsongin.Evaluate( document, { $objectToArray: '$scores' } );   // throws
```


<a id="$getField"></a>$getField
---------------------------------------------------------------------

**Usage** : `{ $getField: { field: name, input: object } }` or `{ $getField: name }`

Reads one field of an object.

A `null` input gives `null`. A missing input, or one which is not an object, gives nothing.

### Example
```js
jsongin.Evaluate( document, { $getField: { field: 'role', input: '$user' } } );
// returns 'admin'

// This reads the field named 'a.b', not b inside a.
jsongin.Evaluate( { d: { 'a.b': 1, a: { b: 2 } } }, { $getField: { field: 'a.b', input: '$d' } } );
// returns 1

// A name starting with $ uses $literal.
jsongin.Evaluate( document, { $getField: { field: { $literal: '$price' }, input: { $literal: { '$price': 5 } } } } );
// returns 5

jsongin.Evaluate( document, { $getField: { field: 'role', input: '$empty' } } );
// returns null

// A computed name throws.
jsongin.Evaluate( document, { $getField: { field: { $concat: [ 'role' ] }, input: '$user' } } );   // throws
```


<a id="$setField"></a>$setField
---------------------------------------------------------------------

**Usage** : `{ $setField: { field: name, input: object, value: expression } }`

Returns a copy of an object with one field added or replaced. The input object is not changed.

- A replaced field keeps its position. A new field is added at the end.
- A `null` `value` sets the field to `null`. `'$$REMOVE'` removes the field.
- A `null` or missing `input` gives `null`. Anything else which is not an object throws.

### Example
```js
jsongin.Evaluate( document, { $setField: { field: 'active', input: '$user', value: true } } );
// returns { role: 'admin', active: true }

jsongin.Evaluate( document, { $setField: { field: 'role', input: '$user', value: 'guest' } } );
// returns { role: 'guest' }

// A name with a dot is one field.
jsongin.Evaluate( document, { $setField: { field: 'a.b', input: {}, value: 1 } } );
// returns { 'a.b': 1 }

jsongin.Evaluate( document, { $setField: { field: 'active', input: '$empty', value: true } } );
// returns null

jsongin.Evaluate( document, { $setField: { field: 'active', input: '$scores', value: true } } );   // throws
```


<a id="$unsetField"></a>$unsetField
---------------------------------------------------------------------

**Usage** : `{ $unsetField: { field: name, input: object } }`

Returns a copy of an object with one field removed.
The other fields keep their order. If the field is not there, the copy is unchanged.

### Example
```js
jsongin.Evaluate( document, { $unsetField: { field: 'role', input: '$user' } } );
// returns {}

jsongin.Evaluate( document, { $unsetField: { field: 'nope', input: '$user' } } );
// returns { role: 'admin' }

// This removes the field named 'a.b', and leaves b inside a.
jsongin.Evaluate( { d: { 'a.b': 1, a: { b: 2 } } }, { $unsetField: { field: 'a.b', input: '$d' } } );
// returns { a: { b: 2 } }

jsongin.Evaluate( document, { $unsetField: { field: 'role', input: '$empty' } } );
// returns null
```


# Date Operators

***Dates are read in UTC unless you give a time zone.***
Javascript's `getFullYear()` and similar methods use the computer's own time zone, so the same
  date could give different answers on different machines. `jsongin` never does that.

A `timezone` is a zone name, such as `'America/New_York'`, or an offset, such as `'+05:30'`.
The operators which return one part of a date, such as `$hour`, accept it in their object form:

```js
let when = new Date( '2020-01-02T03:04:05.678Z' );
let doc = { when: when };

jsongin.Evaluate( doc, { $hour: '$when' } );
// returns 3

jsongin.Evaluate( doc, { $hour: { date: '$when', timezone: 'America/New_York' } } );
// returns 22

jsongin.Evaluate( doc, { $hour: { date: '$when', timezone: '+05:30' } } );
// returns 8
```

- A `null` or missing date gives `null`.
- A `timezone` of `null` also gives `null`. Leaving `timezone` out means UTC.
- A value which is not a date throws. A number is not converted; use [`$toDate`](#$toDate) for that.

***Two ways of counting weeks.***
[`$week`](#$week) starts weeks on Sunday, and the days before the year's first Sunday are week 0.
[`$isoWeek`](#$isoWeek) follows ISO 8601: weeks start on Monday, and a week belongs to the year
  its Thursday is in. So the first days of January can be in the ***previous*** year's last week:

```js
let turn = new Date( '2021-01-01T00:00:00.000Z' );

jsongin.Evaluate( { turn: turn }, { $year: '$turn' } );
// returns 2021

jsongin.Evaluate( { turn: turn }, { $isoWeekYear: '$turn' } );
// returns 2020

jsongin.Evaluate( { turn: turn }, { $isoWeek: '$turn' } );
// returns 53
```


<a id="$year"></a>$year
---------------------------------------------------------------------

**Usage** : `{ $year: date }` or `{ $year: { date: date, timezone: zone } }`

The year.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $year: '$when' } );
// returns 2020
```


<a id="$month"></a>$month
---------------------------------------------------------------------

**Usage** : `{ $month: date }` or `{ $month: { date: date, timezone: zone } }`

The month, from 1 to 12. (Javascript's `getUTCMonth()` counts from 0.)

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $month: '$when' } );
// returns 1
```


<a id="$dayOfMonth"></a>$dayOfMonth
---------------------------------------------------------------------

**Usage** : `{ $dayOfMonth: date }` or `{ $dayOfMonth: { date: date, timezone: zone } }`

The day of the month, from 1 to 31.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfMonth: '$when' } );
// returns 2
```


<a id="$dayOfWeek"></a>$dayOfWeek
---------------------------------------------------------------------

**Usage** : `{ $dayOfWeek: date }` or `{ $dayOfWeek: { date: date, timezone: zone } }`

The day of the week, from 1 to 7. ***Sunday is 1*** and Saturday is 7.
[`$isoDayOfWeek`](#$isoDayOfWeek) starts with Monday instead.

### Example
```js
// 2 January 2020 was a Thursday.
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfWeek: '$when' } );
// returns 5
```


<a id="$dayOfYear"></a>$dayOfYear
---------------------------------------------------------------------

**Usage** : `{ $dayOfYear: date }` or `{ $dayOfYear: { date: date, timezone: zone } }`

The day of the year, from 1 to 366.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfYear: '$when' } );
// returns 2
```


<a id="$hour"></a>$hour
---------------------------------------------------------------------

**Usage** : `{ $hour: date }` or `{ $hour: { date: date, timezone: zone } }`

The hour, from 0 to 23.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $hour: '$when' } );
// returns 3
```


<a id="$minute"></a>$minute
---------------------------------------------------------------------

**Usage** : `{ $minute: date }` or `{ $minute: { date: date, timezone: zone } }`

The minute, from 0 to 59.
A time zone which is not a whole number of hours from UTC changes the minute too.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $minute: '$when' } );
// returns 4

jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) },
	{ $minute: { date: '$when', timezone: '+05:30' } } );
// returns 34
```


<a id="$second"></a>$second
---------------------------------------------------------------------

**Usage** : `{ $second: date }` or `{ $second: { date: date, timezone: zone } }`

The second, from 0 to 59.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $second: '$when' } );
// returns 5
```


<a id="$millisecond"></a>$millisecond
---------------------------------------------------------------------

**Usage** : `{ $millisecond: date }` or `{ $millisecond: { date: date, timezone: zone } }`

The millisecond, from 0 to 999.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $millisecond: '$when' } );
// returns 678
```


<a id="$week"></a>$week
---------------------------------------------------------------------

**Usage** : `{ $week: date }` or `{ $week: { date: date, timezone: zone } }`

The week of the year, from 0 to 53.
Weeks start on Sunday. The days before the first Sunday of the year are week 0.

### Example
```js
// 2020 started on a Wednesday, so 2 January is in week 0.
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $week: '$when' } );
// returns 0
```


<a id="$isoWeek"></a>$isoWeek
---------------------------------------------------------------------

**Usage** : `{ $isoWeek: date }` or `{ $isoWeek: { date: date, timezone: zone } }`

The ISO 8601 week of the year, from 1 to 53.
Week 1 is the week holding the year's first Thursday.

### Example
```js
// 2 January 2020 is in week 0 by $week, but week 1 here.
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $isoWeek: '$when' } );
// returns 1

// 1 January 2021 is in the last week of 2020.
jsongin.Evaluate( { turn: new Date( '2021-01-01T00:00:00.000Z' ) }, { $isoWeek: '$turn' } );
// returns 53
```


<a id="$isoDayOfWeek"></a>$isoDayOfWeek
---------------------------------------------------------------------

**Usage** : `{ $isoDayOfWeek: date }` or `{ $isoDayOfWeek: { date: date, timezone: zone } }`

The ISO 8601 day of the week, from 1 to 7. ***Monday is 1*** and Sunday is 7.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $isoDayOfWeek: '$when' } );
// returns 4
```


<a id="$isoWeekYear"></a>$isoWeekYear
---------------------------------------------------------------------

**Usage** : `{ $isoWeekYear: date }` or `{ $isoWeekYear: { date: date, timezone: zone } }`

The year a date's ISO 8601 week belongs to.
This is not always the calendar year: 1 January 2021 is in the last week of 2020.

### Example
```js
jsongin.Evaluate( { turn: new Date( '2021-01-01T00:00:00.000Z' ) }, { $isoWeekYear: '$turn' } );
// returns 2020
```


<a id="$dateToParts"></a>$dateToParts
---------------------------------------------------------------------

**Usage** : `{ $dateToParts: { date: expression, timezone: zone, iso8601: boolean } }`

An object holding each part of a date.

With `iso8601: true`, the parts are `isoWeekYear`, `isoWeek` and `isoDayOfWeek` instead of
  `year`, `month` and `day`, followed by the time parts.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dateToParts: { date: '$when' } } );
// returns { year: 2020, month: 1, day: 2, hour: 3, minute: 4, second: 5, millisecond: 678 }
```


<a id="$dateFromParts"></a>$dateFromParts
---------------------------------------------------------------------

**Usage** : `{ $dateFromParts: { year, month, day, hour, minute, second, millisecond, timezone } }`
  or `{ $dateFromParts: { isoWeekYear, isoWeek, isoDayOfWeek, ... } }`

Builds a date from its parts.

- A part you leave out is the lowest value it can have, such as month `1`.
- A part too large for its range carries over, so month `13` is January of the next year.
- The parts are read in `timezone`, or in UTC.

### Example
```js
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 1, day: 2 } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )

// Month 13 of 2020 is January 2021.
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 13 } } );
// returns new Date( '2021-01-01T00:00:00.000Z' )

// 7pm in New York is midnight in UTC.
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 1, day: 1, hour: 19, timezone: 'America/New_York' } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )
```


<a id="$dateToString"></a>$dateToString
---------------------------------------------------------------------

**Usage** : `{ $dateToString: { date: expression, format: string, timezone: zone, onNull: expression } }`

Writes a date as a string, using `format`.
Without `format`, it writes the full ISO 8601 string.

| **Code** | **Writes** | **Code** | **Writes** |
|---------------|-----------|---------------|-----------|
| `%Y`          | year      | `%j`          | day of the year |
| `%m`          | month, `01` to `12` | `%w` | day of the week, Sunday is 1 |
| `%d`          | day of the month | `%U`   | week of the year |
| `%H`          | hour, `00` to `23` | `%G` | ISO 8601 week year |
| `%M`          | minute    | `%V`          | ISO 8601 week |
| `%S`          | second    | `%u`          | ISO 8601 day of the week |
| `%L`          | millisecond | `%z`        | time zone offset, as `+HHMM` |
| `%%`          | a `%` sign | `%Z`         | time zone offset, in minutes |

Numbers are padded with zeros to a fixed width, so 2 January is written `02`.
An unknown code throws.

### Example
```js
let day = { when: new Date( '2020-01-02T03:04:05.678Z' ) };

jsongin.Evaluate( day, { $dateToString: { date: '$when' } } );
// returns '2020-01-02T03:04:05.678Z'

jsongin.Evaluate( day, { $dateToString: { date: '$when', format: '%Y-%m-%d' } } );
// returns '2020-01-02'

jsongin.Evaluate( day, { $dateToString: { date: '$when', format: '%Y-%m-%d', timezone: 'America/New_York' } } );
// returns '2020-01-01'
```


<a id="$dateFromString"></a>$dateFromString
---------------------------------------------------------------------

**Usage** : `{ $dateFromString: { dateString: expression, format: string, timezone: zone, onError: expression, onNull: expression } }`

Reads a date from a string.

- Without `format`, the string is read as ISO 8601.
- With `format`, it can use the codes `%Y`, `%m`, `%d`, `%H`, `%M`, `%S` and `%L`.
- A string with no time zone is read in `timezone`, or in UTC.
- `onError` is returned instead of throwing when the string cannot be read. `onNull` is returned
  when it is `null` or missing.

### Example
```js
jsongin.Evaluate( {}, { $dateFromString: { dateString: '2020-01-02T03:04:05.678Z' } } );
// returns new Date( '2020-01-02T03:04:05.678Z' )

jsongin.Evaluate( {}, { $dateFromString: { dateString: '02/01/2020', format: '%d/%m/%Y' } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )

jsongin.Evaluate( {}, { $dateFromString: { dateString: 'not a date', onError: 'bad' } } );
// returns 'bad'
```


<a id="$dateAdd"></a>$dateAdd
---------------------------------------------------------------------

**Usage** : `{ $dateAdd: { startDate: expression, unit: string, amount: number, timezone: zone } }`

Adds an amount of time to a date.
`unit` is `'year'`, `'quarter'`, `'month'`, `'week'`, `'day'`, `'hour'`, `'minute'`, `'second'`
  or `'millisecond'`.

Months and years follow the calendar. If the day does not exist in the new month, the last day
  of that month is used.

### Example
```js
let day = { when: new Date( '2020-01-02T03:04:05.678Z' ) };

jsongin.Evaluate( day, { $dateAdd: { startDate: '$when', unit: 'day', amount: 1 } } );
// returns new Date( '2020-01-03T03:04:05.678Z' )

// 31 January plus one month is 29 February, the last day of that month.
jsongin.Evaluate( {}, { $dateAdd: { startDate: new Date( '2020-01-31T00:00:00Z' ), unit: 'month', amount: 1 } } );
// returns new Date( '2020-02-29T00:00:00.000Z' )
```


<a id="$dateSubtract"></a>$dateSubtract
---------------------------------------------------------------------

**Usage** : `{ $dateSubtract: { startDate: expression, unit: string, amount: number, timezone: zone } }`

Subtracts an amount of time from a date. It works like [`$dateAdd`](#$dateAdd).

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) },
	{ $dateSubtract: { startDate: '$when', unit: 'day', amount: 1 } } );
// returns new Date( '2020-01-01T03:04:05.678Z' )
```


<a id="$dateDiff"></a>$dateDiff
---------------------------------------------------------------------

**Usage** : `{ $dateDiff: { startDate: expression, endDate: expression, unit: string, timezone: zone, startOfWeek: string } }`

The number of `unit` boundaries between two dates.

***It counts boundaries crossed, not time passed.***
From one millisecond before midnight to midnight is 1 day, and 31 December to 1 January is
  1 year.

### Example
```js
// One millisecond apart, but a day boundary is crossed.
jsongin.Evaluate( {}, { $dateDiff: {
	startDate: new Date( '2020-01-01T23:59:59.999Z' ),
	endDate: new Date( '2020-01-02T00:00:00.000Z' ),
	unit: 'day' } } );
// returns 1
```


<a id="$dateTrunc"></a>$dateTrunc
---------------------------------------------------------------------

**Usage** : `{ $dateTrunc: { date: expression, unit: string, binSize: number, timezone: zone, startOfWeek: string } }`

Rounds a date down to the start of its `unit`, such as the start of its day.

`binSize` groups units together: `{ unit: 'hour', binSize: 2 }` rounds down to a two-hour step.
The steps are counted from a fixed starting point, not from each date, so every date lands on the
  same steps and can be grouped by them.

A week starts on Sunday unless `startOfWeek` says otherwise.

### Example
```js
let day = { when: new Date( '2020-01-02T03:04:05.678Z' ) };

jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'day' } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )

jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'hour', binSize: 2 } } );
// returns new Date( '2020-01-02T02:00:00.000Z' )

jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'week' } } );
// returns new Date( '2019-12-29T00:00:00.000Z' )
```


# Data Size Operators


<a id="$binarySize"></a>$binarySize
---------------------------------------------------------------------

**Usage** : `{ $binarySize: expression }`

The size of a string in UTF-8 bytes, the same count as [`$strLenBytes`](#$strLenBytes).
A `null` or missing operand gives `null`. Anything which is not a string throws.

### Example
```js
jsongin.Evaluate( document, { $binarySize: 'abc' } );
// returns 3

jsongin.Evaluate( document, { $binarySize: 'héllo' } );
// returns 6

jsongin.Evaluate( document, { $binarySize: '$a' } );
// throws
```


<a id="$bsonSize"></a>$bsonSize
---------------------------------------------------------------------

**Usage** : `{ $bsonSize: expression }`

The size in bytes of an object when stored as BSON, MongoDB's storage format.
A `null` or missing operand gives `null`. Anything which is not an object throws.

The size is:

- 4 bytes for the length, plus 1 byte at the end.
- For each field: 1 byte for the type, the field name plus 1 byte, and the value.
- A value takes 4 bytes as an `int`, 8 as a `double` or date, 1 as a boolean, 0 as `null`, and
  its length plus 5 as a string.
- An array is stored as an object with the fields `'0'`, `'1'`, and so on.

### Example
```js
// 4 + ( 1 + 2 + 4 ) + 1
jsongin.Evaluate( document, { $bsonSize: { $literal: { a: 1 } } } );
// returns 12

// A double takes 4 bytes more than an int.
jsongin.Evaluate( document, { $bsonSize: { $literal: { a: 3.14 } } } );
// returns 16

jsongin.Evaluate( document, { $bsonSize: { $literal: {} } } );
// returns 5

jsongin.Evaluate( document, { $bsonSize: '$name' } );
// throws
```


# Miscellaneous Operators


<a id="$rand"></a>$rand
---------------------------------------------------------------------

**Usage** : `{ $rand: {} }`

A random number from 0 up to, but not including, 1. It takes no operands.

To use it in a query, put it inside `$expr`:
  `{ $expr: { $lt: [ { $rand: {} }, 0.5 ] } }` matches about half of the documents.

### Example
```js
let draw = jsongin.Evaluate( document, { $rand: {} } );
( draw >= 0 ) === true
( draw < 1 ) === true

let selected = jsongin.Query( document, { $expr: { $lt: [ { $rand: {} }, 0.5 ] } } );
( typeof selected === 'boolean' ) === true
```


# Logical Operators

These treat a value as true unless it is `false`, `0`, `null` or missing.
See [`AsBoolean()`](./AsBoolean.md).


<a id="$and"></a>$and
---------------------------------------------------------------------

**Usage** : `{ $and: [ expression, ... ] }`

`true` when every operand is true.

### Example
```js
jsongin.Evaluate( document, { $and: [ true, true ] } );
// returns true

// 1 and 'x' both count as true.
jsongin.Evaluate( document, { $and: [ 1, 'x' ] } );
// returns true
```


<a id="$or"></a>$or
---------------------------------------------------------------------

**Usage** : `{ $or: [ expression, ... ] }`

`true` when at least one operand is true.

### Example
```js
jsongin.Evaluate( document, { $or: [ false, true ] } );
// returns true
```


<a id="$not"></a>$not
---------------------------------------------------------------------

**Usage** : `{ $not: expression }`

`true` when the operand is false, and `false` when it is true.

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

Returns `then` if `if` is true, and `else` otherwise.

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

Returns the first operand, unless it is `null` or missing, in which case it returns `replacement`.
Use it to give a field a default value.

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

Checks each branch's `case` in order, and returns the `then` of the first one which is true.
If none is true, it returns `default`. If there is no `default`, it throws.

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

Returns its value as it is, without evaluating it.
Use it for a string starting with `$`, or an object which looks like an operator.

### Example
```js
jsongin.Evaluate( document, { $literal: '$a' } );
// returns '$a'

jsongin.Evaluate( document, { $literal: { $add: [ 1, 2 ] } } );
// returns { $add: [ 1, 2 ] }
```


## See Also

- [`Evaluate( Document, Expression, Scope )`](./Evaluate.md)
- [`Project( Document, Projection )`](./Project.md)
- [`Aggregate( Documents, Pipeline, Scope )`](./Aggregate.md)
- [Accumulator Operators](./Accumulator-Operators.md)
- [Scope](./Scope.md)
- [Operator Reference](../Operator-Reference.md)
