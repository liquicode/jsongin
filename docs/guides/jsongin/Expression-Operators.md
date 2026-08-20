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
| Arithmetic      | [$add](#$add), [$subtract](#$subtract), [$multiply](#$multiply), [$divide](#$divide), [$mod](#$mod), [$abs](#$abs), [$sqrt](#$sqrt), [$pow](#$pow), [$exp](#$exp), [$ln](#$ln), [$log](#$log), [$log10](#$log10) |
| Rounding        | [$ceil](#$ceil), [$floor](#$floor), [$round](#$round), [$trunc](#$trunc)                                    |
| Comparison      | [$eq](#$eq), [$ne](#$ne), [$gt](#$gt), [$gte](#$gte), [$lt](#$lt), [$lte](#$lte), [$cmp](#$cmp)              |
| Smallest/Largest| [$min](#$min), [$max](#$max)                                                                                |
| Array           | [$size](#$size), [$arrayElemAt](#$arrayElemAt), [$concatArrays](#$concatArrays), [$in](#$in), [$isArray](#$isArray), [$reverseArray](#$reverseArray), [$range](#$range), [$indexOfArray](#$indexOfArray), [$slice](#$slice), [$sortArray](#$sortArray), [$zip](#$zip), [$arrayToObject](#$arrayToObject), [$first](#$first), [$last](#$last), [$firstN](#$firstN), [$lastN](#$lastN), [$minN](#$minN), [$maxN](#$maxN) |
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


<a id="$sqrt"></a>$sqrt
---------------------------------------------------------------------

**Usage** : `{ $sqrt: expression }`

The square root of a number.
The operand must be zero or greater.

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

**Usage** : `{ $pow: [ expression, exponent ] }`

Raises a number to a power.
A base of zero cannot carry a negative exponent, because the result is unbounded.

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

Raises Euler's number to the given power.
Every number is in the domain, so a large operand returns `Infinity` rather than throwing.

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

***The operand must be greater than zero, and zero itself throws.***
This is the one place in the arithmetic family where the operator is not simply the Javascript
  function underneath: `Math.log( 0 )` answers `-Infinity`, and both MongoDB and `jsongin`
  refuse it.

### Example
```js
jsongin.Evaluate( document, { $ln: 1 } );
// returns 0

jsongin.Evaluate( document, { $ln: 0 } );
// throws
```


<a id="$log"></a>$log
---------------------------------------------------------------------

**Usage** : `{ $log: [ expression, base ] }`

The logarithm of a number in the given base.
The number must be greater than zero, and the base must be greater than zero and not one.
A base of one has no logarithm, because raising one to any power gives one back.

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

The base 10 logarithm of a number.
The operand must be greater than zero, as in [$ln](#$ln).

### Example
```js
jsongin.Evaluate( document, { $log10: 1000 } );
// returns 3
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

***A missing operand ranks below a null and equals only another missing one.***
This is the one place these operators depart from `CompareValues()`, which ranks the two
  together, and it is worth stating because the neighbouring mechanisms disagree with it:

| **Mechanism** | **A missing value against a null** |
|---------------|-------------------------------------|
| an expression comparison, here | ***below*** it — `{ $cmp: [ '$nope', null ] }` is `-1` |
| a [query](./Query-Operators.md), `{ field: null }` | ***matches*** it |
| [`$sort`](./Stage-Operators.md#$sort) | sorts ***as*** it |

MongoDB is inconsistent between the three on purpose, and `jsongin` reproduces each rather than
  picking one. So `{ $eq: [ '$nope', null ] }` is `false` while a query for `{ nope: null }`
  matches, and both are correct.

```js
jsongin.Evaluate( {}, { $eq: [ '$nope', null ] } ) === false;
jsongin.Evaluate( {}, { $eq: [ '$nope', '$gone' ] } ) === true;
jsongin.Evaluate( {}, { $cmp: [ '$nope', null ] } ) === -1;
jsongin.Evaluate( { a: null }, { $eq: [ '$a', null ] } ) === true;
```


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


<a id="$isArray"></a>$isArray
---------------------------------------------------------------------

**Usage** : `{ $isArray: expression }`

Whether a value is an array.

***It answers rather than propagating***, so a null gives `false` and not `null`. It is the
  only operator in this family which does, because the question it asks has an answer for a
  null.

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

An array with its elements in reverse order.
The document's own array is left as it is.

### Example
```js
jsongin.Evaluate( document, { $reverseArray: '$scores' } );
// returns [ 30, 20, 10 ]
```


<a id="$range"></a>$range
---------------------------------------------------------------------

**Usage** : `{ $range: [ start, end ] }` or `{ $range: [ start, end, step ] }`

An array of numbers from `start` up to but not including `end`.

***The end is never reached***, and a range which runs the wrong way is empty rather than an
  error.
A step of zero would never end and is refused.

### Example
```js
jsongin.Evaluate( document, { $range: [ 0, 4 ] } );
// returns [ 0, 1, 2, 3 ]

jsongin.Evaluate( document, { $range: [ 0, 4, 2 ] } );
// returns [ 0, 2 ]

jsongin.Evaluate( document, { $range: [ 4, 0, -2 ] } );
// returns [ 4, 2 ]

// The default step of 1 never gets there.
jsongin.Evaluate( document, { $range: [ 4, 0 ] } );
// returns []
```


<a id="$indexOfArray"></a>$indexOfArray
---------------------------------------------------------------------

**Usage** : `{ $indexOfArray: [ array, value ] }`
  or `{ $indexOfArray: [ array, value, start ] }`
  or `{ $indexOfArray: [ array, value, start, end ] }`

The index of the first element which matches the value, or `-1` when none does.

Elements are compared by ***content***, so a document or an array can be searched for.
The search may be narrowed to a range, where `start` is included and `end` is not.

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

A subset of an array.

***The two forms read `n` differently:***

- With ***two*** operands, `n` is how many to take from the front, and a ***negative*** `n`
  takes them from the back instead.
- With ***three***, `position` is where to start — negative counts back from the end — and `n`
  is how many to take from there. A negative `n` is refused here, because the direction has
  already been said.

***There is also a projection operator called `$slice`***, which is a different operator with
  the same name. Which one applies is decided by where it is written: inside a
  [`Project()`](./Project.md) projection the name is the projection operator, and inside a
  `$project` ***stage*** it is this one. See the
  [Operator Reference](../Operator-Reference.md).

### Example
```js
jsongin.Evaluate( document, { $slice: [ '$scores', 2 ] } );
// returns [ 10, 20 ]

jsongin.Evaluate( document, { $slice: [ '$scores', -2 ] } );
// returns [ 20, 30 ]

jsongin.Evaluate( document, { $slice: [ '$scores', 1, 2 ] } );
// returns [ 20, 30 ]

// Asking for more than there is gives what there is.
jsongin.Evaluate( document, { $slice: [ '$scores', 99 ] } );
// returns [ 10, 20, 30 ]
```


<a id="$sortArray"></a>$sortArray
---------------------------------------------------------------------

**Usage** : `{ $sortArray: { input: expression, sortBy: 1 } }`
  or `{ $sortArray: { input: expression, sortBy: { field: 1, ... } } }`

Sorts the elements of an array.

`sortBy` is either `1` or `-1`, which sorts the elements themselves by BSON order, or a
  document naming fields, which sorts documents the way [`Sort()`](./Sort.md) does.

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

Merges arrays element by element, so the first elements of each become the first element of the
  result.

***The shortest input decides how many elements come out***, unless `useLongestLength` is true,
  in which case the longest does and the gaps are filled with `null` — or with the matching
  entry of `defaults` when one is given.
`defaults` without `useLongestLength` is refused rather than ignored.

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

Converts an array of key and value pairs into a document.

A pair is written either as a ***two element array***, `[ 'a', 1 ]`, or as a ***document***,
  `{ k: 'a', v: 1 }`.
***A repeated key keeps the last value.***
A key must be a string.

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

***There is also an accumulator called `$first`***, which is a different operator with the same
  name: that one takes the first document reaching a `$group`. Which one applies is decided by
  where it is written. See [Accumulator Operators](./Accumulator-Operators.md).

### Example
```js
jsongin.Evaluate( document, { $first: '$scores' } );
// returns 10
```


<a id="$last"></a>$last
---------------------------------------------------------------------

**Usage** : `{ $last: expression }`

The last element of an array.
As with [$first](#$first), there is an accumulator of the same name.

### Example
```js
jsongin.Evaluate( document, { $last: '$scores' } );
// returns 30
```


<a id="$firstN"></a>$firstN
---------------------------------------------------------------------

**Usage** : `{ $firstN: { input: expression, n: number } }`

The first `n` elements of an array, in the order they are in.

***Asking for more than there is is not an error***, and gives what there is.
`n` must be a whole number of one or more.

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

The last `n` elements of an array, in the order they are in.

### Example
```js
jsongin.Evaluate( document, { $lastN: { input: '$scores', n: 2 } } );
// returns [ 20, 30 ]
```


<a id="$minN"></a>$minN
---------------------------------------------------------------------

**Usage** : `{ $minN: { input: expression, n: number } }`

The `n` smallest values of an array, ***smallest first***.
The result is in BSON order rather than in the order the elements were written.

### Example
```js
jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $minN: { input: '$v', n: 2 } } );
// returns [ 1, 2 ]
```


<a id="$maxN"></a>$maxN
---------------------------------------------------------------------

**Usage** : `{ $maxN: { input: expression, n: number } }`

The `n` largest values of an array, ***largest first***.

### Example
```js
jsongin.Evaluate( { v: [ 3, 1, 2 ] }, { $maxN: { input: '$v', n: 2 } } );
// returns [ 3, 2 ]
```



# String Operators

Twenty operators, and what separates them is mostly their ***operand rules*** rather than the
  string function underneath. Three rules recur, and the family is not consistent about which it
  uses, so each operator below says which one it follows:

| **Rule**            | **A null or missing operand**              | **Operators**                                                   |
|---------------------|--------------------------------------------|-----------------------------------------------------------------|
| null propagates     | makes the whole result null                | `$concat`, `$split`, the three trims, the two index-ofs, the two replaces |
| null is empty       | is read as an empty string                 | `$toLower`, `$toUpper`, `$strcasecmp`, the three substrings      |
| null is refused     | is an error                                | `$strLenBytes`, `$strLenCP`                                      |

The dividing line is ***MongoDB 3.4***: the operators which predate it also render a number
  instead of refusing it, and everything added since refuses one. `jsongin` follows MongoDB here
  rather than making the family consistent, because a query written against one has to mean the
  same thing against the other.

***Six operators come in a byte form and a code point form.***
The byte forms count UTF-8 bytes and the code point forms count characters as a reader would.
They differ only where the text is not ASCII: `'héllo'` is five code points and six bytes,
  because the accented letter takes two.
Prefer the `CP` forms for text which may not be ASCII — a byte range which starts or ends inside
  a character is refused, since those bytes do not spell a string.


<a id="$concat"></a>$concat
---------------------------------------------------------------------

**Usage** : `{ $concat: [ expression, ... ] }`

Joins strings end to end.
***A null or missing operand makes the whole result null***, rather than contributing an empty
  string, and every other operand must be a string.

### Example
```js
jsongin.Evaluate( document, { $concat: [ 'Hello, ', '$name', '!' ] } );
// returns 'Hello, Alice!'

// One null operand makes the whole result null.
jsongin.Evaluate( document, { $concat: [ '$name', '$empty' ] } );
// returns null

// A number is refused rather than rendered.
jsongin.Evaluate( document, { $concat: [ '$name', '$a' ] } );   // throws
```


<a id="$split"></a>$split
---------------------------------------------------------------------

**Usage** : `{ $split: [ expression, delimiter ] }`

Cuts a string into an array wherever the delimiter occurs.
A delimiter which does not occur gives the whole string as a single element, and one at an end
  leaves an empty element there.
An empty delimiter is refused rather than cutting between every character.

### Example
```js
jsongin.Evaluate( document, { $split: [ 'a-b-c', '-' ] } );
// returns [ 'a', 'b', 'c' ]

// A delimiter which does not occur gives one element.
jsongin.Evaluate( document, { $split: [ '$name', '-' ] } );
// returns [ 'Alice' ]

// A delimiter at an end leaves an empty element there.
jsongin.Evaluate( document, { $split: [ '-a-', '-' ] } );
// returns [ '', 'a', '' ]
```


<a id="$toLower"></a>$toLower
---------------------------------------------------------------------

**Usage** : `{ $toLower: expression }`

Lowercases a string.
***A null or missing operand is an empty string here***, not a null result, and a number is
  rendered rather than refused.

### Example
```js
jsongin.Evaluate( document, { $toLower: '$name' } );
// returns 'alice'

// A missing field is an empty string, not a null.
jsongin.Evaluate( document, { $toLower: '$nope' } );
// returns ''
```


<a id="$toUpper"></a>$toUpper
---------------------------------------------------------------------

**Usage** : `{ $toUpper: expression }`

Uppercases a string. Reads a null the same way [$toLower](#$toLower) does.

### Example
```js
jsongin.Evaluate( document, { $toUpper: '$name' } );
// returns 'ALICE'
```


<a id="$strcasecmp"></a>$strcasecmp
---------------------------------------------------------------------

**Usage** : `{ $strcasecmp: [ expression, expression ] }`

Compares two strings without regard to case.
Returns `-1` when the first sorts before the second, `1` when it sorts after, and `0` when they
  are the same.

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

***`chars` is a set of characters***, each of which is removed in any order, rather than a
  sequence to match. Without it, whitespace is removed.
A null `input`, or a null `chars`, gives null rather than falling back to whitespace.

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $trim: { input: '$padded' } } );
// returns 'hi'

// chars is a set: every one of its characters is removed, in any order.
jsongin.Evaluate( document, { $trim: { input: 'xyhixy', chars: 'yx' } } );
// returns 'hi'

// A misspelled argument is refused rather than ignored.
jsongin.Evaluate( document, { $trim: { input: '$name', char: 'A' } } );   // throws
```


<a id="$ltrim"></a>$ltrim
---------------------------------------------------------------------

**Usage** : `{ $ltrim: { input: expression, chars: expression } }`

Removes characters from the left end of a string. See [$trim](#$trim).

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $ltrim: { input: '$padded' } } );
// returns 'hi  '
```


<a id="$rtrim"></a>$rtrim
---------------------------------------------------------------------

**Usage** : `{ $rtrim: { input: expression, chars: expression } }`

Removes characters from the right end of a string. See [$trim](#$trim).

### Example
```js
jsongin.Evaluate( { padded: '  hi  ' }, { $rtrim: { input: '$padded' } } );
// returns '  hi'
```


<a id="$substr"></a>$substr
---------------------------------------------------------------------

**Usage** : `{ $substr: [ expression, start, length ] }`

***Deprecated by MongoDB.***
This is another name for [$substrBytes](#$substrBytes) and behaves identically.
Use [$substrCP](#$substrCP) for text which is not ASCII.

### Example
```js
jsongin.Evaluate( document, { $substr: [ '$name', 0, 3 ] } );
// returns 'Ali'
```


<a id="$substrBytes"></a>$substrBytes
---------------------------------------------------------------------

**Usage** : `{ $substrBytes: [ expression, start, length ] }`

Part of a string, counted in ***UTF-8 bytes***.

A length below zero means "to the end", and a fractional position is truncated.
***A range which starts or ends inside a multi-byte character is refused***, because those bytes
  do not spell a string. That is the cost of counting bytes, and the reason
  [$substrCP](#$substrCP) exists.

### Example
```js
jsongin.Evaluate( document, { $substrBytes: [ '$name', 1, 3 ] } );
// returns 'lic'

// A length below zero means to the end.
jsongin.Evaluate( document, { $substrBytes: [ '$name', 3, -1 ] } );
// returns 'ce'

// The accented letter is two bytes, so this range ends inside it.
jsongin.Evaluate( { w: 'héllo' }, { $substrBytes: [ '$w', 1, 1 ] } );   // throws
```


<a id="$substrCP"></a>$substrCP
---------------------------------------------------------------------

**Usage** : `{ $substrCP: [ expression, start, length ] }`

Part of a string, counted in ***code points***.
This is the operator to reach for when the text may not be ASCII: it cannot split a character,
  because it never counts in bytes.

***It is stricter about its positions than [$substrBytes](#$substrBytes)***, which is MongoDB's
  behavior rather than a choice made here: a fractional position and a negative length are both
  refused, where the byte form truncates the one and reads the other as "to the end".

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $substrCP: [ '$w', 0, 2 ] } );
// returns 'hé'

// The same two units taken as bytes would split the accent.
jsongin.Evaluate( { w: 'héllo' }, { $substrCP: [ '$w', 1, 1 ] } );
// returns 'é'

// A fractional position is refused here and truncated by $substrBytes.
jsongin.Evaluate( document, { $substrCP: [ '$name', 1.5, 2 ] } );   // throws
```


<a id="$strLenBytes"></a>$strLenBytes
---------------------------------------------------------------------

**Usage** : `{ $strLenBytes: expression }`

The length of a string in ***UTF-8 bytes***.
***A null or missing operand is refused***, which is unlike the substring operators, where it is
  read as an empty string.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $strLenBytes: '$w' } );
// returns 6

// A null operand is refused here, unlike $substrBytes.
jsongin.Evaluate( document, { $strLenBytes: '$empty' } );   // throws
```


<a id="$strLenCP"></a>$strLenCP
---------------------------------------------------------------------

**Usage** : `{ $strLenCP: expression }`

The length of a string in ***code points*** — the count a reader would give.

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

**Usage** : `{ $indexOfBytes: [ expression, search, start, end ] }`

Where a substring first occurs, counted in ***UTF-8 bytes***, or `-1` when it does not.

`start` and `end` are optional and bound the search, and are counted in bytes too.
The whole of a match has to fall inside that window.

### Example
```js
jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'i' ] } );
// returns 2

jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'z' ] } );
// returns -1

// The window bounds the search, and a match must fall entirely inside it.
jsongin.Evaluate( document, { $indexOfBytes: [ '$name', 'i', 0, 2 ] } );
// returns -1
```


<a id="$indexOfCP"></a>$indexOfCP
---------------------------------------------------------------------

**Usage** : `{ $indexOfCP: [ expression, search, start, end ] }`

Where a substring first occurs, counted in ***code points***, or `-1` when it does not.
The same search as [$indexOfBytes](#$indexOfBytes), counted the way a reader counts.

### Example
```js
jsongin.Evaluate( { w: 'héllo' }, { $indexOfCP: [ '$w', 'l' ] } );
// returns 2

// The same search in bytes is moved along by the accent.
jsongin.Evaluate( { w: 'héllo' }, { $indexOfBytes: [ '$w', 'l' ] } );
// returns 3
```


<a id="$regexMatch"></a>$regexMatch
---------------------------------------------------------------------

**Usage** : `{ $regexMatch: { input: expression, regex: pattern, options: flags } }`

Whether a pattern matches a string.

`regex` is a pattern ***string*** rather than a Javascript `RegExp`, so that the same expression
  means the same thing in process and over the wire. A `RegExp` is accepted too.
`options` accepts the MongoDB flags `i`, `m`, `s`, and `x`, the last of which is applied to the
  pattern rather than passed along, exactly as the query
  [`$regex`](./Query-Operators.md#$regex) does.

***A null or missing input is `false`***, not null: this operator answers a question which has a
  false answer even when there is nothing to match.

### Example
```js
jsongin.Evaluate( document, { $regexMatch: { input: '$name', regex: '^A' } } );
// returns true

jsongin.Evaluate( document, { $regexMatch: { input: '$name', regex: 'alice', options: 'i' } } );
// returns true

// A missing input is false rather than null.
jsongin.Evaluate( document, { $regexMatch: { input: '$nope', regex: 'a' } } );
// returns false
```


<a id="$regexFind"></a>$regexFind
---------------------------------------------------------------------

**Usage** : `{ $regexFind: { input: expression, regex: pattern, options: flags } }`

The first match of a pattern, as `{ match, idx, captures }`, or null when there is none.

***`idx` is counted in code points***, not in bytes, so a match after an accented letter reports
  the offset a reader would give.
A capture group which did not participate is a `null` in `captures` rather than being left out.

### Example
```js
jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: 'l' } } );
// returns { match: 'l', idx: 1, captures: [] }

// The groups of the pattern are reported alongside the match.
jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: '(A)(l)' } } );
// returns { match: 'Al', idx: 0, captures: [ 'A', 'l' ] }

// No match is a null, where $regexFindAll gives an empty array.
jsongin.Evaluate( document, { $regexFind: { input: '$name', regex: 'zzz' } } );
// returns null
```


<a id="$regexFindAll"></a>$regexFindAll
---------------------------------------------------------------------

**Usage** : `{ $regexFindAll: { input: expression, regex: pattern, options: flags } }`

Every match of a pattern, as an array of `{ match, idx, captures }`.
***No match is an empty array***, where [$regexFind](#$regexFind) gives null for the same input.

### Example
```js
jsongin.Evaluate( { s: 'abab' }, { $regexFindAll: { input: '$s', regex: 'a' } } );
// returns [ { match: 'a', idx: 0, captures: [] }, { match: 'a', idx: 2, captures: [] } ]

// No match is an empty array, not a null.
jsongin.Evaluate( document, { $regexFindAll: { input: '$name', regex: 'zzz' } } );
// returns []
```


<a id="$replaceOne"></a>$replaceOne
---------------------------------------------------------------------

**Usage** : `{ $replaceOne: { input: expression, find: expression, replacement: expression } }`

Replaces the first occurrence of a substring.

***`find` is literal text, not a pattern***, so a `.` is a full stop. Use
  [$regexFind](#$regexFind) to search by pattern.
A find which does not occur returns the input unchanged, and a null in any of the three
  arguments gives null.

### Example
```js
jsongin.Evaluate( { s: 'aa' }, { $replaceOne: { input: '$s', find: 'a', replacement: 'b' } } );
// returns 'ba'

// A find which does not occur returns the input unchanged.
jsongin.Evaluate( document, { $replaceOne: { input: '$name', find: 'z', replacement: 'Z' } } );
// returns 'Alice'
```


<a id="$replaceAll"></a>$replaceAll
---------------------------------------------------------------------

**Usage** : `{ $replaceAll: { input: expression, find: expression, replacement: expression } }`

Replaces every occurrence of a substring. See [$replaceOne](#$replaceOne).

### Example
```js
jsongin.Evaluate( { s: 'aa' }, { $replaceAll: { input: '$s', find: 'a', replacement: 'b' } } );
// returns 'bb'

// The find is literal text, so a '.' is a full stop rather than a pattern.
jsongin.Evaluate( { s: 'a.b' }, { $replaceAll: { input: '$s', find: '.', replacement: '-' } } );
// returns 'a-b'
```



# Trigonometry Operators


***Angles are measured in radians***, never in degrees.
Use [$degreesToRadians](#$degreesToRadians) to feed an angle written in degrees to any of these,
  and [$radiansToDegrees](#$radiansToDegrees) to read a result back as degrees.

Each operator has a ***domain***, and an operand outside it throws rather than returning a
  meaningless number:

| **Operator**                                              | **Domain**                                    |
|-----------------------------------------------------------|-----------------------------------------------|
| [$sin](#$sin), [$cos](#$cos), [$tan](#$tan)               | any finite number; an infinite angle throws   |
| [$asin](#$asin), [$acos](#$acos), [$atanh](#$atanh)       | -1 through 1                                  |
| [$acosh](#$acosh)                                         | 1 and above                                   |
| [$atan](#$atan), [$atan2](#$atan2), the hyperbolics       | any number at all                             |

A null or missing operand makes the result null, and an operand which is not a number throws.
Every one of them answers a `NaN` with a `NaN`.


<a id="$sin"></a>$sin
---------------------------------------------------------------------

**Usage** : `{ $sin: expression }`

The sine of an angle given in radians.

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

The cosine of an angle given in radians.

### Example
```js
jsongin.Evaluate( document, { $cos: 0 } );
// returns 1
```


<a id="$tan"></a>$tan
---------------------------------------------------------------------

**Usage** : `{ $tan: expression }`

The tangent of an angle given in radians.

### Example
```js
jsongin.Evaluate( document, { $tan: 0 } );
// returns 0
```


<a id="$asin"></a>$asin
---------------------------------------------------------------------

**Usage** : `{ $asin: expression }`

The inverse sine of a value, in radians.
The operand must lie between -1 and 1, because no angle has a sine beyond those bounds.

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

The inverse cosine of a value, in radians.
The operand must lie between -1 and 1.

### Example
```js
jsongin.Evaluate( document, { $acos: 1 } );
// returns 0
```


<a id="$atan"></a>$atan
---------------------------------------------------------------------

**Usage** : `{ $atan: expression }`

The inverse tangent of a value, in radians.
Every number is in the domain, unlike [$asin](#$asin) and [$acos](#$acos), because a tangent is
  unbounded.

### Example
```js
jsongin.Evaluate( document, { $atan: 1 } );
// returns 0.7853981633974483
```


<a id="$atan2"></a>$atan2
---------------------------------------------------------------------

**Usage** : `{ $atan2: [ y, x ] }`

The inverse tangent of a coordinate pair, in radians.

***The two operands are not the same as their ratio.***
Their signs name the quadrant, which a single divided value could not do.

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

The hyperbolic sine of a value.

### Example
```js
jsongin.Evaluate( document, { $sinh: 0 } );
// returns 0
```


<a id="$cosh"></a>$cosh
---------------------------------------------------------------------

**Usage** : `{ $cosh: expression }`

The hyperbolic cosine of a value.
It never falls below one, which is what makes [$acosh](#$acosh) refuse anything smaller.

### Example
```js
jsongin.Evaluate( document, { $cosh: 0 } );
// returns 1
```


<a id="$tanh"></a>$tanh
---------------------------------------------------------------------

**Usage** : `{ $tanh: expression }`

The hyperbolic tangent of a value.
The result always lies between -1 and 1.

### Example
```js
jsongin.Evaluate( document, { $tanh: 0 } );
// returns 0
```


<a id="$asinh"></a>$asinh
---------------------------------------------------------------------

**Usage** : `{ $asinh: expression }`

The inverse hyperbolic sine of a value.
Every number is in the domain; it is the only one of the three inverse hyperbolics for which
  that is true.

### Example
```js
jsongin.Evaluate( document, { $asinh: 0 } );
// returns 0
```


<a id="$acosh"></a>$acosh
---------------------------------------------------------------------

**Usage** : `{ $acosh: expression }`

The inverse hyperbolic cosine of a value.

***The domain begins at one, not at zero***, because a [$cosh](#$cosh) never returns anything
  smaller than one.

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

The inverse hyperbolic tangent of a value.
The operand must lie between -1 and 1, the bounds a [$tanh](#$tanh) result never leaves.

***The bounds themselves are answerable.***
-1 and 1 return `-Infinity` and `Infinity`, and only values beyond them throw.

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

Converts an angle from degrees to radians.
This is what feeds an angle written in degrees to the operators above, all of which expect
  radians.

### Example
```js
jsongin.Evaluate( document, { $degreesToRadians: 180 } );
// returns 3.141592653589793
```


<a id="$radiansToDegrees"></a>$radiansToDegrees
---------------------------------------------------------------------

**Usage** : `{ $radiansToDegrees: expression }`

Converts an angle from radians to degrees.
This is what makes the result of an inverse function readable as an angle.

### Example
```js
jsongin.Evaluate( document, { $radiansToDegrees: 3.141592653589793 } );
// returns 180

jsongin.Evaluate( document, { $radiansToDegrees: { $asin: 1 } } );
// returns 90
```



# Type Operators


[$convert](#$convert) is the operator these are built on, and the six `$toX` operators are
  shorthands for it.
Each converts a value to one type, returns null for a null or missing operand, and throws when
  the value has no reading in that type or has one which does not fit.
Only `$convert` can answer a failure with a value instead of throwing.

***Javascript's own conversions are not these conversions.***
Where the two disagree, `jsongin` follows MongoDB:

| **Expression**              | **Javascript** | **Here**                  |
|-----------------------------|----------------|---------------------------|
| `Number( ' 5' )`            | `5`            | throws; no whitespace is consumed |
| `Number( '' )`              | `0`            | throws                    |
| `Boolean( '' )`             | `false`        | `true`; every string is true |
| `Date.parse( '2020' )`      | a date         | throws                    |
| a date and time with no zone | read as local  | read as UTC              |

***One difference cannot be followed, and it is worth knowing before you rely on `$type`.***
MongoDB has `int`, `long`, and `double` as separate BSON types and tags a converted number with
  the one it was converted to, so `{ $type: { $toLong: 42 } }` is `'long'` there and `'int'`
  here. `jsongin` holds JSON, which has one number kind, and reports a number's type from its
  value. The converted ***values*** agree in every case; only what `$type` says about a number
  afterwards differs. `$toDecimal` and `$toObjectId` are absent for the same reason.


<a id="$type"></a>$type
---------------------------------------------------------------------

**Usage** : `{ $type: expression }`

The BSON type of a value, by name.

***A missing field has a type of its own, and it is not null.***
A field which is not there is `'missing'`, where a field holding a null is `'null'`.

A number is an `int` when it is whole and inside the 32 bit range, and a `double` otherwise -
  fractional, larger, `NaN`, or infinite.

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

Whether a value is a number.

***A null is answered rather than propagated.***
Most of this family returns null for a null operand; this one returns false, because the
  question it is asked has an answer.

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

Converts a value to a string.
A date becomes an ISO 8601 string. An array or an object throws.

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

***Every string is true, the empty one included***, and so is every array, object, and date.
Only the number zero and the boolean false are false, which makes this the one conversion with
  no failing case.

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
A number is read as milliseconds since the epoch, and a string is parsed.

***A string carrying no time zone is read as UTC***, so the same document means the same
  instant on every machine.

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

Converts a value to a 32 bit integer.

***A fractional number is truncated rather than rounded, and a fractional string is refused.***
A string is read as a whole integer or not at all.
A value outside the int32 range throws, and so do `NaN`, the infinities, and a date.

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

Converts a value to a 64 bit integer.

It differs from [$toInt](#$toInt) in two ways: the range is far wider, and a date reads as
  milliseconds since the epoch instead of throwing.

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

Converts a value to a double.

Unlike [$toInt](#$toInt) it does not truncate, it reads a fractional string, and it accepts
  `NaN` and the infinities, all of which a double can hold.

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

Converts a value to a given type.
`to` is a type name - `double`, `string`, `bool`, `date`, `int`, or `long` - or the BSON type
  number which stands for one.

***`onError` and `onNull` are what this operator has and the shorthands do not.***
They are not interchangeable, and a null input takes the `onNull` path even when an `onError`
  is also given:

- `onNull` answers a null or missing input. Without it, a null input gives null.
- `onError` answers a conversion which failed. Without it, the failure throws.

`onError` covers the conversion and nothing else.
A `to` which names no type is a malformed expression rather than a failed conversion, and
  throws whether or not an `onError` is given.

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


***These read an array as a set, and that changes what it means.***
Order stops mattering and repeats stop counting, so `[ 1, 1, 2 ]` and `[ 2, 1 ]` are the same
  set.

***A set is handed back in BSON order***, not in the order its elements were written.
A set has no order of its own, so sorting is the only choice which gives the same answer for
  the same set however it was written. Across types that order is: `null`, then numbers, then
  strings, then objects, then arrays, then booleans, then dates.

***Two elements are the same when their contents are.***
Documents and arrays compare by content, so `[ { a: 1 } ]` and `[ { a: 1 } ]` hold the same
  element. A number and the string of that number do not, and neither do `{ a: 1, b: 2 }` and
  `{ b: 2, a: 1 }` — a document is compared field by field in the order it holds them.

***The family disagrees with itself about a null operand***, and `jsongin` reproduces that
  rather than tidying it up, because an expression has to mean the same thing against both
  engines:

| **Operator** | **A null operand** |
|--------------|--------------------|
| [$setUnion](#$setUnion), [$setIntersection](#$setIntersection), [$setDifference](#$setDifference) | makes the result `null` |
| [$setEquals](#$setEquals), [$setIsSubset](#$setIsSubset), [$allElementsTrue](#$allElementsTrue), [$anyElementTrue](#$anyElementTrue) | is refused |


<a id="$setEquals"></a>$setEquals
---------------------------------------------------------------------

**Usage** : `{ $setEquals: [ array, array, ... ] }`

Whether every set given holds the same elements.
Two or more sets are required.

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

Whether every element of the first set appears in the second.
Exactly two sets are required.
The empty set is a subset of every set, including itself.

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

The elements which appear in any of the sets given.

### Example
```js
jsongin.Evaluate( document, { $setUnion: [ [ 1, 2 ], [ 2, 3 ] ] } );
// returns [ 1, 2, 3 ]

// The result is sorted, not left in the order it was written.
jsongin.Evaluate( document, { $setUnion: [ [ 3, 1, 2 ], [ 2 ] ] } );
// returns [ 1, 2, 3 ]
```


<a id="$setIntersection"></a>$setIntersection
---------------------------------------------------------------------

**Usage** : `{ $setIntersection: [ array, array, ... ] }`

The elements which appear in every one of the sets given.

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

The elements of the first set which are not in the second.
***Exactly two sets***, unlike [$setUnion](#$setUnion) and
  [$setIntersection](#$setIntersection), which take any number.

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

Whether every element of an array is true.

***Only `false`, zero, `null`, and a missing value count as false.***
An empty string and an empty array are true, which is not Javascript's rule for either.

***All of nothing is true***, so an empty array satisfies it.

### Example
```js
jsongin.Evaluate( document, { $allElementsTrue: [ [ true, 1, 'x' ] ] } );
// returns true

jsongin.Evaluate( document, { $allElementsTrue: [ [ true, 0 ] ] } );
// returns false

// An empty string is an element like any other, and it is true.
jsongin.Evaluate( document, { $allElementsTrue: [ [ '', [] ] ] } );
// returns true

jsongin.Evaluate( document, { $allElementsTrue: [ [] ] } );
// returns true
```


<a id="$anyElementTrue"></a>$anyElementTrue
---------------------------------------------------------------------

**Usage** : `{ $anyElementTrue: [ array ] }`

Whether at least one element of an array is true.

***Any of nothing is false***, where [$allElementsTrue](#$allElementsTrue) answers an empty
  array with true.

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


***These operators work on field names, which is what makes them different from everything
  else here.*** [$getField](#$getField), [$setField](#$setField), and
  [$unsetField](#$unsetField) name one field of one document, and ***a dot in that name is
  part of the name***: `{ field: 'a.b' }` means a field literally called `a.b`, not the `b` of
  the `a`. That is the reason the three exist, because no dotted-path syntax can reach such a
  field at all.

***The name must be a constant***, written either as a plain string or as a
  [$literal](#$literal). A computed name is refused however simple it is, even one whose
  operands are all constants. A name which begins with a `$` has to be written
  `{ field: { $literal: '$price' } }`, since a bare `'$price'` is a field reference.

***The three disagree about an input which is not a document***, and `jsongin` reproduces that
  rather than tidying it up:

| **Operator** | **A null input** | **A missing input, or one which is not a document** |
|--------------|------------------|-----------------------------------------------------|
| [$getField](#$getField) | `null` | no value at all — the field is left out |
| [$setField](#$setField), [$unsetField](#$unsetField) | `null` | `null` for a missing input; anything else is refused |

***The shorthand forms are not supported.*** MongoDB lets `{ $getField: 'name' }` read the
  field from `$$CURRENT`, and `{ $setField: { ..., value: '$$REMOVE' } }` remove one, and both
  of those are system variables which `jsongin` has no expression variable scope for. Write
  the `input` out, and use [$unsetField](#$unsetField) to remove.


<a id="$mergeObjects"></a>$mergeObjects
---------------------------------------------------------------------

**Usage** : `{ $mergeObjects: [ document, document, ... ] }`

Combines several documents into one, where a later document wins a field the two share.
A single document may be given without a list.

***The merge is one level deep.*** A shared field whose value is itself a document is replaced
  whole rather than merged into.

***A null or missing operand is ignored*** rather than making the result null, which is what
  makes this safe to fold over documents which may not all be there.

### Example
```js
jsongin.Evaluate( document, { $mergeObjects: [ { a: 1 }, { b: 2 } ] } );
// returns { a: 1, b: 2 }

// A replaced field keeps its position and a new one is appended.
jsongin.Evaluate( document, { $mergeObjects: [ { a: 1, b: 2 }, { a: 9 } ] } );
// returns { a: 9, b: 2 }

// A null operand is ignored, and nothing at all is an empty document.
jsongin.Evaluate( document, { $mergeObjects: [ '$user', '$empty' ] } );
// returns { role: 'admin' }

jsongin.Evaluate( document, { $mergeObjects: [] } );
// returns {}

// The merge does not reach into a sub-document.
jsongin.Evaluate( document, { $mergeObjects: [ { a: { x: 1 } }, { a: { y: 2 } } ] } );
// returns { a: { y: 2 } }
```

***There is also an accumulator called `$mergeObjects`***, which is a different operator with
  the same name. See [Accumulator Operators](./Accumulator-Operators.md).


<a id="$objectToArray"></a>$objectToArray
---------------------------------------------------------------------

**Usage** : `{ $objectToArray: document }`

Turns a document into an array of `{ k: name, v: value }` pairs, one per field.

***The pairs come back in the order the document holds its fields***, not sorted, which is
  what makes this the inverse of [$arrayToObject](#$arrayToObject).

A null or missing operand makes the result `null`. Anything else which is not a document throws.

### Example
```js
jsongin.Evaluate( document, { $objectToArray: '$user' } );
// returns [ { k: 'role', v: 'admin' } ]

// The fields come back in the order they were written, not in sorted order.
jsongin.Evaluate( document, { $objectToArray: { z: 1, a: 2 } } );
// returns [ { k: 'z', v: 1 }, { k: 'a', v: 2 } ]

jsongin.Evaluate( document, { $objectToArray: '$empty' } );
// returns null

jsongin.Evaluate( document, { $objectToArray: '$scores' } );   // throws
```


<a id="$getField"></a>$getField
---------------------------------------------------------------------

**Usage** : `{ $getField: { field: name, input: document } }`

Reads one named field of a document.

***A null input and a missing one part company here***, which they do almost nowhere else in
  the expression language: a null input answers `null`, while a missing one — or an array, or
  a number, or anything else which is not a document — answers no value at all, the same
  nothing that reading an absent field gives.

### Example
```js
jsongin.Evaluate( document, { $getField: { field: 'role', input: '$user' } } );
// returns 'admin'

// The name is a name and not a path. This reads the field called 'a.b',
// leaving the b of the a alone.
jsongin.Evaluate( { d: { 'a.b': 1, a: { b: 2 } } }, { $getField: { field: 'a.b', input: '$d' } } );
// returns 1

// A name beginning with a '$' is written as a $literal.
jsongin.Evaluate( document, { $getField: { field: { $literal: '$price' }, input: { $literal: { '$price': 5 } } } } );
// returns 5

// A null input answers null.
jsongin.Evaluate( document, { $getField: { field: 'role', input: '$empty' } } );
// returns null

// A computed field name is refused, however simple it is.
jsongin.Evaluate( document, { $getField: { field: { $concat: [ 'role' ] }, input: '$user' } } );   // throws
```


<a id="$setField"></a>$setField
---------------------------------------------------------------------

**Usage** : `{ $setField: { field: name, input: document, value: expression } }`

Answers a copy of a document with one named field added or replaced.
***The input document is not modified.***

***A replaced field keeps its position*** and a new one is appended after the fields already
  present, which matters because a document is compared field by field in the order it holds
  them.

A null or missing `input` makes the result `null`; any other non-document throws.
A null `value` is written as a null rather than being ignored.

### Example
```js
jsongin.Evaluate( document, { $setField: { field: 'active', input: '$user', value: true } } );
// returns { role: 'admin', active: true }

// A field already there is replaced where it stands.
jsongin.Evaluate( document, { $setField: { field: 'role', input: '$user', value: 'guest' } } );
// returns { role: 'guest' }

// A field whose name contains a dot is written as one field, not as a path.
jsongin.Evaluate( document, { $setField: { field: 'a.b', input: {}, value: 1 } } );
// returns { 'a.b': 1 }

jsongin.Evaluate( document, { $setField: { field: 'active', input: '$empty', value: true } } );
// returns null

jsongin.Evaluate( document, { $setField: { field: 'active', input: '$scores', value: true } } );   // throws
```


<a id="$unsetField"></a>$unsetField
---------------------------------------------------------------------

**Usage** : `{ $unsetField: { field: name, input: document } }`

Answers a copy of a document with one named field removed.
The fields which remain keep their order, and a document which does not have the field is
  answered unchanged rather than refused.

### Example
```js
jsongin.Evaluate( document, { $unsetField: { field: 'role', input: '$user' } } );
// returns {}

jsongin.Evaluate( document, { $unsetField: { field: 'nope', input: '$user' } } );
// returns { role: 'admin' }

// Removing 'a.b' removes the field of that name and leaves the nested one alone.
jsongin.Evaluate( { d: { 'a.b': 1, a: { b: 2 } } }, { $unsetField: { field: 'a.b', input: '$d' } } );
// returns { a: { b: 2 } }

jsongin.Evaluate( document, { $unsetField: { field: 'role', input: '$empty' } } );
// returns null
```


# Date Operators


***Every operator here reads a date in UTC unless it is given a time zone.***
This is worth knowing before anything else, because Javascript does the opposite: `getFullYear()`
  and its relatives read a date in whatever zone the machine happens to be in, so the same
  document would answer differently on a laptop in New York than on a server in London.
Nothing in `jsongin` reads a date that way.

A `timezone` is either an IANA zone name such as `'America/New_York'` or an offset such as
  `'+05:30'`. Each of the part operators takes one in its object form:

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

A null or missing date makes the result null, and so does a `timezone` which is null.
***A null timezone is not the same as no timezone***: leaving it out means UTC, and writing
  `null` makes the whole result null.
An operand which is not a date throws — a number is not converted for these, even though
  [$toDate](#$toDate) would read one.

***Three of them exist because ISO 8601 counts weeks differently***, and the difference is not
  small. [$week](#$week) begins its weeks on Sunday and calls the days before the year's first
  Sunday week 0. [$isoWeek](#$isoWeek) begins on Monday and puts a week entirely in the year
  holding its Thursday, so the first days of January can belong to the ***previous*** year:

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

**Usage** : `{ $year: expression }` or `{ $year: { date: expression, timezone: string } }`

The year of a date.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $year: '$when' } );
// returns 2020
```


<a id="$month"></a>$month
---------------------------------------------------------------------

**Usage** : `{ $month: expression }` or `{ $month: { date: expression, timezone: string } }`

The month of a date, from 1 to 12.
***Months count from 1***, unlike Javascript's own `getUTCMonth()`.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $month: '$when' } );
// returns 1
```


<a id="$dayOfMonth"></a>$dayOfMonth
---------------------------------------------------------------------

**Usage** : `{ $dayOfMonth: expression }` or the object form.

The day of the month, from 1 to 31.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfMonth: '$when' } );
// returns 2
```


<a id="$dayOfWeek"></a>$dayOfWeek
---------------------------------------------------------------------

**Usage** : `{ $dayOfWeek: expression }` or the object form.

The day of the week, from 1 to 7.
***Sunday is 1 and Saturday is 7.***
See [$isoDayOfWeek](#$isoDayOfWeek), which starts its week on Monday instead.

### Example
```js
// The 2nd of January 2020 was a Thursday.
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfWeek: '$when' } );
// returns 5
```


<a id="$dayOfYear"></a>$dayOfYear
---------------------------------------------------------------------

**Usage** : `{ $dayOfYear: expression }` or the object form.

The day of the year, from 1 to 366.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dayOfYear: '$when' } );
// returns 2
```


<a id="$hour"></a>$hour
---------------------------------------------------------------------

**Usage** : `{ $hour: expression }` or the object form.

The hour of a date, from 0 to 23.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $hour: '$when' } );
// returns 3
```


<a id="$minute"></a>$minute
---------------------------------------------------------------------

**Usage** : `{ $minute: expression }` or the object form.

The minute of a date, from 0 to 59.
A zone whose offset is not a whole hour moves this too.

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

**Usage** : `{ $second: expression }` or the object form.

The seconds of a date, from 0 to 59.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $second: '$when' } );
// returns 5
```


<a id="$millisecond"></a>$millisecond
---------------------------------------------------------------------

**Usage** : `{ $millisecond: expression }` or the object form.

The milliseconds of a date, from 0 to 999.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $millisecond: '$when' } );
// returns 678
```


<a id="$week"></a>$week
---------------------------------------------------------------------

**Usage** : `{ $week: expression }` or the object form.

The week of the year, from 0 to 53.

***Weeks begin on Sunday, and the days before the first Sunday of the year are week 0.***
See [$isoWeek](#$isoWeek) for the ISO 8601 reckoning, which differs.

### Example
```js
// 2020 opened on a Wednesday, so the 2nd is still week 0.
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $week: '$when' } );
// returns 0
```


<a id="$isoWeek"></a>$isoWeek
---------------------------------------------------------------------

**Usage** : `{ $isoWeek: expression }` or the object form.

The ISO 8601 week of the year, from 1 to 53.
Week 1 is the week holding the year's first Thursday.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $isoWeek: '$when' } );
// returns 1

// The same date is week 0 by the $week reckoning and week 1 by this one.
jsongin.Evaluate( { turn: new Date( '2021-01-01T00:00:00.000Z' ) }, { $isoWeek: '$turn' } );
// returns 53
```


<a id="$isoDayOfWeek"></a>$isoDayOfWeek
---------------------------------------------------------------------

**Usage** : `{ $isoDayOfWeek: expression }` or the object form.

The ISO 8601 day of the week, from 1 to 7.
***Monday is 1 and Sunday is 7***, where [$dayOfWeek](#$dayOfWeek) starts at Sunday.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $isoDayOfWeek: '$when' } );
// returns 4
```


<a id="$isoWeekYear"></a>$isoWeekYear
---------------------------------------------------------------------

**Usage** : `{ $isoWeekYear: expression }` or the object form.

The ISO 8601 year a date's week belongs to.

***This is not always the calendar year.***
ISO 8601 puts a week entirely in the year holding its Thursday, so the 1st of January 2021
  belongs to 2020.

### Example
```js
jsongin.Evaluate( { turn: new Date( '2021-01-01T00:00:00.000Z' ) }, { $isoWeekYear: '$turn' } );
// returns 2020
```


<a id="$dateToParts"></a>$dateToParts
---------------------------------------------------------------------

**Usage** : `{ $dateToParts: { date: expression, timezone: string, iso8601: boolean } }`

A document holding the individual parts of a date.

***The ISO form answers with different fields***, not merely different values: an ISO 8601 week
  date has a week year, a week, and a day of the week, and no month or day of the month at all.

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) }, { $dateToParts: { date: '$when' } } );
// returns { year: 2020, month: 1, day: 2, hour: 3, minute: 4, second: 5, millisecond: 678 }
```


<a id="$dateFromParts"></a>$dateFromParts
---------------------------------------------------------------------

**Usage** : `{ $dateFromParts: { year, month, day, hour, minute, second, millisecond, timezone } }`
  or `{ $dateFromParts: { isoWeekYear, isoWeek, isoDayOfWeek, ... } }`

Constructs a date from its individual parts.
A part left out defaults to the start of its range.

***A part outside its range rolls over*** rather than being refused.

### Example
```js
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 1, day: 2 } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )

// Month 13 of 2020 is January of 2021.
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 13 } } );
// returns new Date( '2021-01-01T00:00:00.000Z' )

// The parts are read in the zone given.
jsongin.Evaluate( {}, { $dateFromParts: { year: 2020, month: 1, day: 1, hour: 19, timezone: 'America/New_York' } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )
```


<a id="$dateToString"></a>$dateToString
---------------------------------------------------------------------

**Usage** : `{ $dateToString: { date: expression, format: string, timezone: string, onNull: expression } }`

Writes a date as a string through a format.
With no `format`, the whole ISO 8601 string.

| **Specifier** | **Means** | **Specifier** | **Means** |
|---------------|-----------|---------------|-----------|
| `%Y`          | year      | `%j`          | day of the year |
| `%m`          | month, from 01 | `%w`     | day of the week, Sunday is 1 |
| `%d`          | day of the month | `%U`   | week of the year |
| `%H`          | hour, 00 to 23 | `%G`     | ISO 8601 week year |
| `%M`          | minute    | `%V`          | ISO 8601 week |
| `%S`          | second    | `%u`          | ISO 8601 day of the week |
| `%L`          | millisecond | `%z`        | zone offset, as `+HHMM` |
| `%%`          | a literal `%` | `%Z`      | zone offset, in minutes |

***Every field is padded to its width***, which is why the second of January is written `02`.
A specifier which is not in the table throws.

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

**Usage** : `{ $dateFromString: { dateString: expression, format: string, timezone: string, onError: expression, onNull: expression } }`

Reads a date from a string.
With no `format`, the string is read as ISO 8601; with one, through the numeric specifiers
  `%Y`, `%m`, `%d`, `%H`, `%M`, `%S`, and `%L`.

***A string carrying no zone is read in the `timezone` given***, and in UTC when none was.

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

**Usage** : `{ $dateAdd: { startDate: expression, unit: string, amount: number, timezone: string } }`

Adds a number of time units to a date.
A `unit` is one of `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`, or
  `millisecond`.

***The calendar units are added to the calendar, not as a length of time.***
A day of the month which the target month does not have is pulled back to the last day it does.

### Example
```js
let day = { when: new Date( '2020-01-02T03:04:05.678Z' ) };

jsongin.Evaluate( day, { $dateAdd: { startDate: '$when', unit: 'day', amount: 1 } } );
// returns new Date( '2020-01-03T03:04:05.678Z' )

// The 31st of January plus one month is not the 2nd of March.
jsongin.Evaluate( {}, { $dateAdd: { startDate: new Date( '2020-01-31T00:00:00Z' ), unit: 'month', amount: 1 } } );
// returns new Date( '2020-02-29T00:00:00.000Z' )
```


<a id="$dateSubtract"></a>$dateSubtract
---------------------------------------------------------------------

**Usage** : `{ $dateSubtract: { startDate: expression, unit: string, amount: number, timezone: string } }`

Subtracts a number of time units from a date, by the same rules as [$dateAdd](#$dateAdd).

### Example
```js
jsongin.Evaluate( { when: new Date( '2020-01-02T03:04:05.678Z' ) },
	{ $dateSubtract: { startDate: '$when', unit: 'day', amount: 1 } } );
// returns new Date( '2020-01-01T03:04:05.678Z' )
```


<a id="$dateDiff"></a>$dateDiff
---------------------------------------------------------------------

**Usage** : `{ $dateDiff: { startDate: expression, endDate: expression, unit: string, timezone: string, startOfWeek: string } }`

The difference between two dates, in a given time unit.

***This counts boundaries crossed, not elapsed time.***
One second before midnight to one second after is one day, and two dates eleven months apart
  can be one year apart. That is what makes it useful for grouping and surprising for measuring.

### Example
```js
// One millisecond apart, and one day apart.
jsongin.Evaluate( {}, { $dateDiff: {
	startDate: new Date( '2020-01-01T23:59:59.999Z' ),
	endDate: new Date( '2020-01-02T00:00:00.000Z' ),
	unit: 'day' } } );
// returns 1
```


<a id="$dateTrunc"></a>$dateTrunc
---------------------------------------------------------------------

**Usage** : `{ $dateTrunc: { date: expression, unit: string, binSize: number, timezone: string, startOfWeek: string } }`

Truncates a date to the start of the unit it falls in.

`binSize` groups several units into one bin, so `{ unit: 'hour', binSize: 2 }` truncates to even
  hours. ***The bins are counted from a fixed reference instant***, not from the date itself, so
  every date in a collection falls into the same bins and can be grouped by them.

### Example
```js
let day = { when: new Date( '2020-01-02T03:04:05.678Z' ) };

jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'day' } } );
// returns new Date( '2020-01-02T00:00:00.000Z' )

jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'hour', binSize: 2 } } );
// returns new Date( '2020-01-02T02:00:00.000Z' )

// A week is truncated to its start day, which defaults to Sunday.
jsongin.Evaluate( day, { $dateTrunc: { date: '$when', unit: 'week' } } );
// returns new Date( '2019-12-29T00:00:00.000Z' )
```


# Data Size Operators


<a id="$binarySize"></a>$binarySize
---------------------------------------------------------------------

**Usage** : `{ $binarySize: expression }`

The number of bytes a string occupies.

***A string is measured in bytes, not in characters.***
The accented letter of `'héllo'` is two bytes, so its binary size is 6 where its length is 5.
This is the same counting [$strLenBytes](#$strLenBytes) does.

A null or missing operand makes the result null.
Anything which is not a string has no binary size and throws.

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

The number of bytes a document occupies once encoded as BSON.

The count is the encoding's own arithmetic: 4 bytes for the document's length, then each
  element as one type byte plus its field name plus a terminating zero plus its value, then 1
  byte to close the document.
A value costs 4 bytes as an `int`, 8 as a `double` or a date, 1 as a boolean, nothing as a
  null, and its length plus 5 as a string.

***An array is encoded as a document whose keys are `'0'`, `'1'`, and so on***, which is why an
  array of two numbers costs more than the two numbers do.

A null or missing operand makes the result null.
Anything which is not a document throws.

### Example
```js
// 4 for the length + [ 1 type + 2 for 'a\0' + 4 for the int ] + 1.
jsongin.Evaluate( document, { $bsonSize: { $literal: { a: 1 } } } );
// returns 12

// A double costs four bytes more than an int.
jsongin.Evaluate( document, { $bsonSize: { $literal: { a: 3.14 } } } );
// returns 16

// An empty document is its own length and its terminator.
jsongin.Evaluate( document, { $bsonSize: { $literal: {} } } );
// returns 5

jsongin.Evaluate( document, { $bsonSize: '$name' } );
// throws
```


# Miscellaneous Operators


<a id="$rand"></a>$rand
---------------------------------------------------------------------

**Usage** : `{ $rand: {} }`

Returns a random float from 0 up to but not including 1.
It takes no operands, and the empty document is how it says so.

***A query reaches it through [$expr](./Query-Operators.md#$expr)***, never on its own.
`$rand` is not a query operator and cannot stand as one, so
  `{ $expr: { $lt: [ { $rand: {} }, 0.5 ] } }` is how a criteria selects about half the
  documents it sees.

### Example
```js
// There is no fixed value to show. What holds of every draw is its range.
let draw = jsongin.Evaluate( document, { $rand: {} } );
( draw >= 0 ) === true
( draw < 1 ) === true

// Two draws are two values.
let selected = jsongin.Query( document, { $expr: { $lt: [ { $rand: {} }, 0.5 ] } } );
( typeof selected === 'boolean' ) === true
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


## See Also

- [`Evaluate( Document, Expression )`](./Evaluate.md), which evaluates these operators.
- [`Project( Document, Projection )`](./Project.md), whose computed fields are expressions.
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md), whose computing stages use them.
- [Accumulator Operators](./Accumulator-Operators.md), which reduce a group rather than a document.
- [Operator Reference](../Operator-Reference.md), for which MongoDB operators are implemented.
