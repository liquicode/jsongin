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
| Array           | [$size](#$size), [$arrayElemAt](#$arrayElemAt), [$concatArrays](#$concatArrays), [$in](#$in)                 |
| String          | [$concat](#$concat), [$split](#$split), [$toLower](#$toLower), [$toUpper](#$toUpper), [$strcasecmp](#$strcasecmp), [$trim](#$trim), [$ltrim](#$ltrim), [$rtrim](#$rtrim), [$substr](#$substr), [$substrBytes](#$substrBytes), [$substrCP](#$substrCP), [$strLenBytes](#$strLenBytes), [$strLenCP](#$strLenCP), [$indexOfBytes](#$indexOfBytes), [$indexOfCP](#$indexOfCP), [$regexMatch](#$regexMatch), [$regexFind](#$regexFind), [$regexFindAll](#$regexFindAll), [$replaceOne](#$replaceOne), [$replaceAll](#$replaceAll) |
| Trigonometry    | [$sin](#$sin), [$cos](#$cos), [$tan](#$tan), [$asin](#$asin), [$acos](#$acos), [$atan](#$atan), [$atan2](#$atan2), [$sinh](#$sinh), [$cosh](#$cosh), [$tanh](#$tanh), [$asinh](#$asinh), [$acosh](#$acosh), [$atanh](#$atanh), [$degreesToRadians](#$degreesToRadians), [$radiansToDegrees](#$radiansToDegrees) |
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
