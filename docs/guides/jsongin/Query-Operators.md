# @liquicode/jsongin


# Query Operators

The operators used in a query criteria.
[`Query()`](./Query.md), [`Filter()`](./Filter.md), the `$match` stage, and anything else which
  takes a criteria all use them.

Each operator below has its usage, what it matches, and examples.
See [`Query()`](./Query.md) for the rules that apply to a whole criteria, and the
  [Operator Reference](../Operator-Reference.md) for which MongoDB operators are supported.

Operators marked `*` are `jsongin` extensions. MongoDB does not have them.

Most examples on this page use this document:

```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
```


# Comparison Operators

***Arrays*** :
When the field holds an array, a comparison operator matches if the ***whole array*** matches,
  or if ***any one element*** matches.

***Types*** :
`$gt`, `$gte`, `$lt` and `$lte` only match a value of the ***same type*** as the operand.
A number is never greater than a string, even though MongoDB's type order puts strings after
  numbers:

```js
jsongin.Query( { v: 5 }, { v: { $gt: 'abc' } } ) === false
jsongin.Query( { v: 'abc' }, { v: { $gt: 1 } } ) === false
```

Objects, arrays and dates can be compared too, against values of their own type, using
  [`CompareValues()`](./CompareValues.md):

```js
jsongin.Query( { v: { a: 2 } }, { v: { $gt: { a: 1 } } } ) === true
jsongin.Query( { v: [ 2 ] }, { v: { $gt: [ 1 ] } } ) === true
jsongin.Query( { v: { a: 1 } }, { v: { $gt: [ 1 ] } } ) === false   // an object and an array
```


<a id="$eq"></a>$eq
---------------------------------------------------------------------

**Usage** : `{ field: { $eq: value } }`

Matches a field equal to `value`.
Writing `{ field: value }` does the same thing; see [`$ImplicitEq`](#$ImplicitEq).

Values are compared by ***content*** with [`CompareValues()`](./CompareValues.md), so two dates
  for the same moment are equal, and objects and arrays are equal when they hold the same things.

- There is no type conversion, so `7` does not equal `'7'`, and a date does not equal its ISO
  string.
- `null` matches a field which is `null` or missing.
- Two objects must have their fields in the same order, and two arrays their elements.
- When the field is an array, `value` can match the whole array or any one element.

### Example
```js
jsongin.Query( document, { login_attempts: { $eq: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $eq: 10 } } ) === false
// The same as { $eq: 7 }.
jsongin.Query( document, { login_attempts: 7 } ) === true
// No type conversion.
jsongin.Query( document, { login_attempts: { $eq: "7" } } ) === false
// null matches a missing field.
jsongin.Query( document, { password: { $eq: null } } ) === true
// A nested field, with dot notation.
jsongin.Query( document, { 'user.name': { $eq: 'Alice' } } ) === true
// An array element, by position.
jsongin.Query( document, { 'tags.0': { $eq: 'A' } } ) === true
// The whole array.
jsongin.Query( document, { tags: { $eq: [ 'A', 'C' ] } } ) === true
// One element of the array.
jsongin.Query( document, { tags: { $eq: 'C' } } ) === true
// A different array does not match.
jsongin.Query( document, { tags: { $eq: [ 'C' ] } } ) === false
```


<a id="$ne"></a>$ne
---------------------------------------------------------------------

**Usage** : `{ field: { $ne: value } }`

Matches when [`$eq`](#$eq) would not.
For an array field, that means neither the whole array nor any element equals `value`.

### Example
```js
jsongin.Query( document, { login_attempts: { $ne: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $ne: 10 } } ) === true
```


<a id="$gt"></a>$gt
---------------------------------------------------------------------

**Usage** : `{ field: { $gt: value } }`

Matches a field greater than `value`, of the same type.
For an array field, it matches if any element is greater.

### Example
```js
jsongin.Query( document, { login_attempts: { $gt: 3 } } ) === true
jsongin.Query( document, { login_attempts: { $gt: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $gt: 10 } } ) === false
// Any element of an array.
jsongin.Query( document, { tags: { $gt: 'B' } } ) === true
```


<a id="$gte"></a>$gte
---------------------------------------------------------------------

**Usage** : `{ field: { $gte: value } }`

Matches a field greater than or equal to `value`, of the same type.
For an array field, it matches if any element is.
`{ $gte: null }` matches a field which is `null` or missing.

### Example
```js
jsongin.Query( document, { login_attempts: { $gte: 3 } } ) === true
jsongin.Query( document, { login_attempts: { $gte: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $gte: 10 } } ) === false
// Any element of an array.
jsongin.Query( document, { tags: { $gte: 'C' } } ) === true
```


<a id="$lt"></a>$lt
---------------------------------------------------------------------

**Usage** : `{ field: { $lt: value } }`

Matches a field less than `value`, of the same type.
For an array field, it matches if any element is less.

### Example
```js
jsongin.Query( document, { login_attempts: { $lt: 3 } } ) === false
jsongin.Query( document, { login_attempts: { $lt: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $lt: 10 } } ) === true
// Any element of an array.
jsongin.Query( document, { tags: { $lt: 'B' } } ) === true
```


<a id="$lte"></a>$lte
---------------------------------------------------------------------

**Usage** : `{ field: { $lte: value } }`

Matches a field less than or equal to `value`, of the same type.
For an array field, it matches if any element is.
`{ $lte: null }` matches a field which is `null` or missing.

### Example
```js
jsongin.Query( document, { login_attempts: { $lte: 3 } } ) === false
jsongin.Query( document, { login_attempts: { $lte: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $lte: 10 } } ) === true
// Any element of an array.
jsongin.Query( document, { tags: { $lte: 'A' } } ) === true
```


<a id="$in"></a>$in
---------------------------------------------------------------------

**Usage** : `{ field: { $in: [ value1, value2, ... ] } }`

Matches a field equal to any value in the list, using the rules of [`$eq`](#$eq).
For an array field, it matches if any element is in the list.

A regular expression in the list matches strings it fits.
The operand must be an array.

### Example
```js
jsongin.Query( document, { login_attempts: { $in: [ 3, 5, 7 ] } } ) === true
jsongin.Query( document, { login_attempts: { $in: [ 1, 2, 3 ] } } ) === false
jsongin.Query( document, { 'user.role': { $in: [ 'admin', 'super' ] } } ) === true
// Any element of an array field.
jsongin.Query( document, { tags: { $in: [ 'A', 'B' ] } } ) === true
// A regular expression.
jsongin.Query( document, { tags: { $in: [ /A|B/ ] } } ) === true
```


<a id="$nin"></a>$nin
---------------------------------------------------------------------

**Usage** : `{ field: { $nin: [ value1, value2, ... ] } }`

Matches when [`$in`](#$in) would not.

### Example
```js
jsongin.Query( document, { login_attempts: { $nin: [ 3, 5, 7 ] } } ) === false
jsongin.Query( document, { login_attempts: { $nin: [ 1, 2, 3 ] } } ) === true
jsongin.Query( document, { 'user.role': { $nin: [ 'admin', 'super' ] } } ) === false
```


# Logical Operators

`$and`, `$or` and `$nor` are used at the top level of a criteria, or inside each other.
Each takes a non-empty array of criteria.
`$not` is different: it is used under a field.


<a id="$and"></a>$and
---------------------------------------------------------------------

**Usage** : `{ $and: [ criteria1, criteria2, ... ] }`

Matches when ***every*** criteria in the list matches.

A criteria with several fields already means "and", so `$and` is only needed to test the same
  field twice or to combine `$or` clauses.

### Example
```js
jsongin.Query( document,
{
	$and:
	[
		{ 'user.role': { $in: [ 'admin', 'super' ] } }, // true
		{ login_attempts: { $gt: 3 } }                  // true
	]
} ) === true
```


<a id="$or"></a>$or
---------------------------------------------------------------------

**Usage** : `{ $or: [ criteria1, criteria2, ... ] }`

Matches when ***at least one*** criteria in the list matches.

### Example
```js
jsongin.Query( document,
{
	$or:
	[
		{ 'user.role': { $in: [ 'admin', 'super' ] } }, // true
		{ login_attempts: { $gt: 10 } }                 // false
	]
} ) === true
```


<a id="$nor"></a>$nor
---------------------------------------------------------------------

**Usage** : `{ $nor: [ criteria1, criteria2, ... ] }`

Matches when ***none*** of the criteria in the list match.

### Example
```js
jsongin.Query( document,
{
	$nor:
	[
		{ 'user.role': { $eq: 'user' } }, // false
		{ tags: { $eq: 'X' } }            // false
	]
} ) === true
```


<a id="$not"></a>$not
---------------------------------------------------------------------

**Usage** : `{ field: { $not: { operator: value } } }` or `{ field: { $not: /regexp/ } }`

Matches when the operators, or the regular expression, inside it would not match the field.

`$not` is used ***under a field*** only. It throws at the top level of a criteria.
To negate a whole criteria, use [`$nor`](#$nor).

### Example
```js
jsongin.Query( document, { login_attempts: { $not: { $eq: 0 } } } ) === true
jsongin.Query( document, { tags: { $not: { $eq: 'X' } } } ) === true
// A regular expression.
jsongin.Query( document, { tags: { $not: /X|Y|Z/ } } ) === true

// $not cannot be used at the top level.
jsongin.Query( document, { $not: { login_attempts: { $eq: 0 } } } );   // throws
// Use $nor instead.
jsongin.Query( document, { $nor: [ { login_attempts: { $eq: 0 } } ] } ) === true
```


# Element Operators


<a id="$exists"></a>$exists
---------------------------------------------------------------------

**Usage** : `{ field: { $exists: true | false } }`

`{ $exists: true }` matches when the field is present, even if it holds `null`.
`{ $exists: false }` matches when it is not.

A path through an array exists if any element has the field.

### Example
```js
jsongin.Query( document, { user: { $exists: true } } ) === true
jsongin.Query( document, { 'user.name': { $exists: true } } ) === true
jsongin.Query( document, { 'user.password': { $exists: false } } ) === true
// A field holding null exists.
jsongin.Query( { a: null }, { a: { $exists: true } } ) === true
```


<a id="$type"></a>$type
---------------------------------------------------------------------

**Usage** : `{ field: { $type: bson-type } }` or `{ field: { $type: [ bson-type, ... ] } }`

Matches a field of the given BSON type.
Give the type as its number or its name, from the table below.
`'number'` matches every numeric type.
For an array field, `$type` matches the array itself, or any element of that type.

See [`BsonType()`](./BsonType.md) for how a Javascript value gets its BSON type.

| **Type**                   | **Number** | **Name**              | **Notes**                  | **Supported** |
|----------------------------|------------|-----------------------|----------------------------|---------------|
| Double                     | 1          | "double"              | Numbers with a fraction, or outside the int32 range. | Yes           |
| String                     | 2          | "string"              |                            | Yes           |
| Object                     | 3          | "object"              |                            | Yes           |
| Array                      | 4          | "array"               |                            | Yes           |
| Binary data                | 5          | "binData"             |                            | -             |
| Undefined                  | 6          | "undefined"           | Deprecated.                | Yes           |
| ObjectId                   | 7          | "objectId"            |                            | -             |
| Boolean                    | 8          | "bool"                |                            | Yes           |
| Date                       | 9          | "date"                |                            | Yes           |
| Null                       | 10         | "null"                |                            | Yes           |
| Regular Expression         | 11         | "regex"               |                            | Yes           |
| DBPointer                  | 12         | "dbPointer"           | Deprecated.                | -             |
| JavaScript                 | 13         | "javascript"          |                            | -             |
| Symbol                     | 14         | "symbol"              | Deprecated.                | Yes           |
| JavaScript code with scope | 15         | "javascriptWithScope" | Deprecated in MongoDB 4.4. | -             |
| 32-bit integer             | 16         | "int"                 | A whole number in the int32 range. | Yes           |
| Timestamp                  | 17         | "timestamp"           |                            | -             |
| 64-bit integer             | 18         | "long"                | A Javascript number is never a long. | -             |
| Decimal128                 | 19         | "decimal"             |                            | -             |
| Min key                    | -1         | "minKey"              |                            | -             |
| Max key                    | 127        | "maxKey"              |                            | -             |

> MongoDB Reference: [BSON Types](https://www.mongodb.com/docs/manual/reference/bson-types)

### Example
```js
jsongin.Query( document, { user: { $type: 3 } } ) === true
jsongin.Query( document, { user: { $type: 'object' } } ) === true
jsongin.Query( document, { 'user.name': { $type: 'string' } } ) === true
jsongin.Query( document, { tags: { $type: 'array' } } ) === true
// A date, by name or number.
jsongin.Query( { when: new Date( 123 ) }, { when: { $type: 'date' } } ) === true
jsongin.Query( { when: new Date( 123 ) }, { when: { $type: 9 } } ) === true
// A whole number in the int32 range is an int, not a double.
jsongin.Query( { n: 42 }, { n: { $type: 'int' } } ) === true
jsongin.Query( { n: 42 }, { n: { $type: 'double' } } ) === false
jsongin.Query( { n: 3.14 }, { n: { $type: 'double' } } ) === true
// 'number' matches every numeric type.
jsongin.Query( { n: 42 }, { n: { $type: 'number' } } ) === true
```


# Evaluation Operators


<a id="$regex"></a>$regex
---------------------------------------------------------------------

**Usage** : `{ field: { $regex: /pattern/flags } }` or `{ field: { $regex: 'pattern', $options: 'flags' } }`

Matches a string field against a regular expression.
The pattern can be a Javascript regular expression or a string.

`$options` sets the flags when the pattern is a string.
It can hold any Javascript flag, such as `i` or `m`, and MongoDB's `x`, which ignores whitespace
  in the pattern.
Giving `$options` beside a regular expression which already has flags throws.

A regular expression can also be used on its own as the value: `{ field: /pattern/ }`.

For an array field, it matches if any element matches.

> [Regular Expression Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)

### Example
```js
jsongin.Query( document, { 'user.role': { $regex: /^admin/ } } ) === true
jsongin.Query( document, { 'user.role': { $regex: '^admin' } } ) === true
jsongin.Query( { role: 'ADMIN' }, { role: { $regex: '^admin', $options: 'i' } } ) === true
// Any element of an array.
jsongin.Query( { tags: [ 'staff', 'x' ] }, { tags: /^st/ } ) === true
```


<a id="$expr"></a>$expr
---------------------------------------------------------------------

**Usage** : `{ $expr: expression }`

Evaluates an aggregation ***expression*** and matches when the result is true.

Use it to compare one field of a document with ***another***, or with a computed value.
Every other query operator compares a field with a value you write.

Inside the expression, a string starting with `$`, such as `'$user.name'`, refers to a field.

The result is converted to a boolean with MongoDB's rules: only `false`, `0`, `null` and
  `undefined` are false, so `''` and `[]` are true. See [`AsBoolean()`](./AsBoolean.md).

`$expr` is used at the ***top level*** only. It throws under a field.
To use an expression under a field, use [`$exprx`](#$exprx).

See [Expression Operators](./Expression-Operators.md) for what an expression can contain.

### Example
```js
let game_document = { dmg: 12, armor: 5, stats: { hp: 20, max: 30 } };

// Compare two fields.
jsongin.Query( game_document, { $expr: { $gt: [ '$dmg', '$armor' ] } } ) === true
jsongin.Query( game_document, { $expr: { $lt: [ '$dmg', '$armor' ] } } ) === false

// Fields can use dot notation.
jsongin.Query( game_document, { $expr: { $lt: [ '$stats.hp', '$stats.max' ] } } ) === true

// Compute a value, then compare it.
jsongin.Query( { a: 10, b: 3 }, { $expr: { $gt: [ { $subtract: [ '$a', '$b' ] }, 5 ] } } ) === true
```


<a id="$jsonSchema"></a>$jsonSchema
---------------------------------------------------------------------

**Usage** : `{ $jsonSchema: schema }`

Matches a document which is valid against a JSON Schema, read the way MongoDB reads one:
  ***draft 4***, with `bsonType` as well as `type`.

`$jsonSchema` is used at the ***top level***, or inside `$and`, `$or`, `$nor` or `$elemMatch`.
Inside `$elemMatch`, only an element which is an object can match.
It throws under a field or inside `$not`.

It differs from the JSON Schema specification in the same ways MongoDB does:

- A date is a `date` and a regular expression is a `regex`. Neither is a `string`. Use
  `bsonType` for them.
- `type` has no `integer`. Use `bsonType: 'int'` or `bsonType: 'double'`, or `'number'` for
  both.
- A dotted name in `required` or `properties` is a path into the document, and goes through
  arrays like any query path.

A schema MongoDB would reject throws: an unknown keyword, a keyword from a later draft such as
  `const` or `if`, a `$ref`, an empty `required` or `enum`, or a limit which is not a number.

To check a document against any draft, and to see ***why*** it failed, use
  [`ValidateDocument()`](./ValidateDocument.md).
See the [JSON Schema guide](../JSON-Schema.md).

### Example
```js
let person = { name: 'Alice', age: 30, tags: [ 'a', 'b' ], joined: new Date( 1700000000000 ) };

jsongin.Query( person, { $jsonSchema: { required: [ 'name', 'age' ], properties: { age: { bsonType: 'int', minimum: 18 } } } } ) === true
jsongin.Query( person, { $jsonSchema: { properties: { tags: { items: { bsonType: 'string' }, maxItems: 1 } } } } ) === false

// A date is a date, not a string.
jsongin.Query( person, { $jsonSchema: { properties: { joined: { bsonType: 'date' } } } } ) === true
jsongin.Query( person, { $jsonSchema: { properties: { joined: { type: 'string' } } } } ) === false

// Keywords MongoDB does not support throw.
jsongin.Query( person, { $jsonSchema: { properties: { age: { type: 'integer' } } } } );   // throws
jsongin.Query( person, { $jsonSchema: { properties: { age: { const: 30 } } } } );         // throws
```


<a id="$mod"></a>$mod
---------------------------------------------------------------------

**Usage** : `{ field: { $mod: [ divisor, remainder ] } }`

Matches when the field divided by `divisor` leaves `remainder`.

This is not the [`$mod` expression operator](./Expression-Operators.md#$mod), which returns a
  remainder instead of testing for one.

- A field with a fraction is cut down to a whole number first, so `10.5` is treated as `10`.
- A negative field gives a negative remainder, so `-11` divided by `5` leaves `-1`.
- A field which is not a number does not match.
- The array must hold exactly two numbers. A divisor of `0` throws.

### Example
```js
let amounts = { count: 10, price: 10.5, owed: -11, name: 'Alice' };

jsongin.Query( amounts, { count: { $mod: [ 5, 0 ] } } ) === true
jsongin.Query( amounts, { count: { $mod: [ 3, 1 ] } } ) === true

// 10.5 is treated as 10.
jsongin.Query( amounts, { price: { $mod: [ 5, 0 ] } } ) === true

// A negative field gives a negative remainder.
jsongin.Query( amounts, { owed: { $mod: [ 5, -1 ] } } ) === true

// A string never matches.
jsongin.Query( amounts, { name: { $mod: [ 5, 0 ] } } ) === false
```


# Array Operators


<a id="$elemMatch"></a>$elemMatch
---------------------------------------------------------------------

**Usage** : `{ field: { $elemMatch: criteria } }`

Matches an array field when ***at least one element*** meets every condition in `criteria`.
A field which is not an array does not match.

For an array of objects, `criteria` names fields of the element.
For an array of simple values, `criteria` holds operators which apply to the element itself.

Without `$elemMatch`, each condition could be met by a different element.

> MongoDB Reference: [$elemMatch](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)

### Example
```js
let product_results = [
	{ _id: 1, results: [ { product: 'abc', score: 10 }, { product: 'xyz', score: 5 } ] },
	{ _id: 2, results: [ { product: 'abc', score: 8 }, { product: 'xyz', score: 7 } ] },
	{ _id: 3, results: [ { product: 'abc', score: 7 }, { product: 'xyz', score: 8 } ] },
	{ _id: 4, results: [ { product: 'abc', score: 7 }, { product: 'def', score: 8 } ] }
]

let query = {
	results:
	{
		$elemMatch:
		{
			product: "xyz",
			score: { $gte: 8 }
		}
	}
};

jsongin.Query( product_results[ 0 ], query ) === false
jsongin.Query( product_results[ 1 ], query ) === false
jsongin.Query( product_results[ 2 ], query ) === true
jsongin.Query( product_results[ 3 ], query ) === false

// An array of numbers: one element must be both >= 80 and < 85.
jsongin.Query( { scores: [ 70, 82 ] }, { scores: { $elemMatch: { $gte: 80, $lt: 85 } } } ) === true
jsongin.Query( { scores: [ 70, 90 ] }, { scores: { $elemMatch: { $gte: 80, $lt: 85 } } } ) === false
```


<a id="$size"></a>$size
---------------------------------------------------------------------

**Usage** : `{ field: { $size: count } }`

Matches an array field with exactly `count` elements.
`count` must be a whole number, `0` or more.
A field which is not an array, or is missing, does not match.

### Example
```js
jsongin.Query( document, { tags: { $size: 2 } } ) === true
jsongin.Query( document, { tags: { $size: 3 } } ) === false
```


<a id="$all"></a>$all
---------------------------------------------------------------------

**Usage** : `{ field: { $all: [ value, ... ] } }`

Matches a field which contains ***every*** value in the list.
Each value is tested with [`$eq`](#$eq), so it can be an object, an array or a date.
It is like `$in`, but every value must match instead of any one.

An entry can also be an `$elemMatch`, such as `{ $elemMatch: { x: 1 } }`, which must be met by some
  element.

- An empty list matches nothing.
- The field does not have to be an array: `{ qty: { $all: [ 50 ] } }` matches `qty: 50`.

> MongoDB Reference: [$all](https://www.mongodb.com/docs/manual/reference/operator/query/all/)

### Example
```js
let tagged = { login_attempts: 7, tags: [ 'A', 'B', 'C' ] };

jsongin.Query( tagged, { tags: { $all: [ 'A', 'B' ] } } ) === true
jsongin.Query( tagged, { tags: { $all: [ 'A', 'X' ] } } ) === false
// A field which is not an array.
jsongin.Query( tagged, { login_attempts: { $all: [ 7 ] } } ) === true
// An empty list matches nothing.
jsongin.Query( tagged, { tags: { $all: [] } } ) === false
```


# Bitwise Operators

These four test the bits of a whole-number field.

Name the bits in either of two ways:

- a ***bitmask***: a number whose set bits are the bits to test.
- an array of ***bit positions***, where position `0` is the lowest bit.
  `[ 2, 4 ]` and the mask `20` name the same two bits.

- A field which is not a whole number does not match.
- A negative field is read as two's complement, so every bit above its highest bit is set.
- A negative or fractional mask or position throws.
- An empty array matches for `$bitsAllSet` and `$bitsAllClear`, and does not match for
  `$bitsAnySet` and `$bitsAnyClear`.


<a id="$bitsAllSet"></a>$bitsAllSet
---------------------------------------------------------------------

**Usage** : `{ field: { $bitsAllSet: bitmask } }` or `{ field: { $bitsAllSet: [ position, ... ] } }`

Matches when ***every*** named bit is set.

### Example
```js
// 20 is binary 10100, so bits 2 and 4 are set.
let flags_document = { flags: 20 };

jsongin.Query( flags_document, { flags: { $bitsAllSet: [ 2, 4 ] } } ) === true
jsongin.Query( flags_document, { flags: { $bitsAllSet: [ 2, 3 ] } } ) === false

// The same, as a bitmask.
jsongin.Query( flags_document, { flags: { $bitsAllSet: 20 } } ) === true
jsongin.Query( flags_document, { flags: { $bitsAllSet: 21 } } ) === false

// An empty list matches.
jsongin.Query( flags_document, { flags: { $bitsAllSet: [] } } ) === true
```


<a id="$bitsAllClear"></a>$bitsAllClear
---------------------------------------------------------------------

**Usage** : `{ field: { $bitsAllClear: bitmask } }` or `{ field: { $bitsAllClear: [ position, ... ] } }`

Matches when ***every*** named bit is clear.

### Example
```js
let flags_document = { flags: 20 };

jsongin.Query( flags_document, { flags: { $bitsAllClear: [ 0, 1, 3 ] } } ) === true
jsongin.Query( flags_document, { flags: { $bitsAllClear: [ 0, 2 ] } } ) === false
jsongin.Query( flags_document, { flags: { $bitsAllClear: 11 } } ) === true
```


<a id="$bitsAnySet"></a>$bitsAnySet
---------------------------------------------------------------------

**Usage** : `{ field: { $bitsAnySet: bitmask } }` or `{ field: { $bitsAnySet: [ position, ... ] } }`

Matches when ***at least one*** named bit is set.

### Example
```js
let flags_document = { flags: 20 };

jsongin.Query( flags_document, { flags: { $bitsAnySet: [ 2, 3 ] } } ) === true
jsongin.Query( flags_document, { flags: { $bitsAnySet: [ 0, 1, 3 ] } } ) === false

// An empty list does not match.
jsongin.Query( flags_document, { flags: { $bitsAnySet: [] } } ) === false
```


<a id="$bitsAnyClear"></a>$bitsAnyClear
---------------------------------------------------------------------

**Usage** : `{ field: { $bitsAnyClear: bitmask } }` or `{ field: { $bitsAnyClear: [ position, ... ] } }`

Matches when ***at least one*** named bit is clear.

### Example
```js
let flags_document = { flags: 20 };

jsongin.Query( flags_document, { flags: { $bitsAnyClear: [ 0, 2 ] } } ) === true
jsongin.Query( flags_document, { flags: { $bitsAnyClear: [ 2, 4 ] } } ) === false
jsongin.Query( flags_document, { flags: { $bitsAnyClear: 21 } } ) === true
```


# Miscellaneous Operators


<a id="$comment"></a>$comment
---------------------------------------------------------------------

**Usage** : `{ $comment: text }`

Adds a note to a query. It matches every document, so it never changes the result.
Use it to explain a query which shows up in a log.

`$comment` is used at the top level only.

### Example
```js
let account = { name: 'Alice', role: 'admin' };

jsongin.Query( account, { $comment: 'the admin audit' } ) === true

// It does not change the rest of the criteria.
jsongin.Query( account, { role: 'admin', $comment: 'still matches' } ) === true
jsongin.Query( account, { role: 'user', $comment: 'still does not' } ) === false
```


<a id="$sampleRate"></a>$sampleRate
---------------------------------------------------------------------

**Usage** : `{ $sampleRate: rate }`

Matches a random share of documents. `rate` is a number from `0` to `1`.

Each document is decided at random, so the result changes from run to run, and a rate of `0.5`
  over a hundred documents matches ***about*** fifty.
A rate of `0` matches nothing and a rate of `1` matches everything.
A rate outside `0` to `1` throws.

### Example
```js
let account = { name: 'Alice' };

jsongin.Query( account, { $sampleRate: 1 } ) === true
jsongin.Query( account, { $sampleRate: 0 } ) === false
```


# jsongin Extension Operators


<a id="$eqx"></a>$eqx
---------------------------------------------------------------------

**Usage** : `{ field: { $eqx: value } }`  `*`

Like [`$eq`](#$eq), but compares loosely with [`LooseEquals()`](./LooseEquals.md):

- Numbers, strings and booleans are compared with `==`, so `42` equals `'42.0'`, and `false`
  equals `0` and `'0'`.
- `null` equals `undefined`.
- Objects can have their fields in any order, but must have the same fields.
- Arrays can have their elements in any order.

Everything else works as it does for `$eq`: an array field matches the whole array or any
  element.

### Example
```js
jsongin.Query( document, { login_attempts: { $eqx: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $eqx: '7' } } ) === true

// An element of an array field.
jsongin.Query( document, { tags: { $eqx: 'A' } } ) === true

// $eq does not convert types. $eqx does.
jsongin.Query( { codes: [ '1', '2' ] }, { codes: { $eq: 1 } } ) === false
jsongin.Query( { codes: [ '1', '2' ] }, { codes: { $eqx: 1 } } ) === true
```


<a id="$nex"></a>$nex
---------------------------------------------------------------------

**Usage** : `{ field: { $nex: value } }`  `*`

Matches when [`$eqx`](#$eqx) would not.

### Example
```js
jsongin.Query( document, { login_attempts: { $nex: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $nex: '7' } } ) === false
```


<a id="$exprx"></a>$exprx
---------------------------------------------------------------------

**Usage** : `{ $exprx: expression }` or `{ field: { $exprx: expression } }`  `*`

Like [`$expr`](#$expr), but can also be used ***under a field***.
There, the expression is evaluated against the value of that field, so `'$hp'` means the `hp`
  field inside it.
At the top level, it works exactly like `$expr`.

### Example
```js
let game_document = { dmg: 12, armor: 5, stats: { hp: 20, max: 30 } };

// Under a field, field references are inside that field.
jsongin.Query( game_document, { stats: { $exprx: { $lt: [ '$hp', '$max' ] } } } ) === true

// The same test with $expr needs the full paths.
jsongin.Query( game_document, { $expr: { $lt: [ '$stats.hp', '$stats.max' ] } } ) === true

// At the top level, $exprx is the same as $expr.
jsongin.Query( game_document, { $exprx: { $gt: [ '$dmg', '$armor' ] } } ) === true

// $expr throws under a field, as it does in MongoDB.
jsongin.Query( game_document, { stats: { $expr: { $lt: [ '$hp', '$max' ] } } } ) // throws
```


<a id="$noop"></a>$noop
---------------------------------------------------------------------

**Usage** : `{ $noop: anything }` or `{ field: { $noop: anything } }`  `*`

Matches everything and ignores its value.
Use it to switch off part of a query: rename a clause's key to `$noop`, and the rest of the query
  still applies.

It can be used at the top level or under a field.
Its value can be anything except `undefined`, which throws, as it does for every operator.

### Example
```js
// The b clause is switched off. The a clause still applies.
jsongin.Query( { a: 1, b: 2 }, { a: 1, $noop: { b: 999 } } ) === true
jsongin.Query( { a: 1, b: 2 }, { a: 9, $noop: { b: 999 } } ) === false

// Inside $and.
jsongin.Query( document,
{
	$and:
	[
		{ 'user.role': { $in: [ 'admin', 'super' ] } }, // true
		{ $noop: { login_attempts: { $gt: 10 } } },     // switched off
		{ login_attempts: { $lt: 10 } }                 // true
	]
} ) === true
```


<a id="$ImplicitEq"></a>$ImplicitEq
---------------------------------------------------------------------

**Usage** : `{ field: value }`  `*`

`{ field: value }` is short for `{ field: { $eq: value } }`, whenever `value` is not an object
  with an operator key.
`$ImplicitEq` is the name `jsongin` uses for this internally. You never write it.

When `value` is an object, the field must equal that ***whole object***, with the same fields in
  the same order.
To test one field inside an object, use dot notation:

```js
jsongin.Query( { user: { name: 'Alice', role: 'admin' } }, { user: { name: 'Alice' } } ) === false
jsongin.Query( { user: { name: 'Alice', role: 'admin' } }, { 'user.name': 'Alice' } ) === true
```

`value` cannot be `undefined`. Use [`$exists`](#$exists) to test whether a field is there.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`Filter( Documents, QueryCriteria )`](./Filter.md)
- [`$match`](./Stage-Operators.md#$match), the pipeline stage which takes a criteria.
- [Expression Operators](./Expression-Operators.md), for `$expr`.
- [Operator Reference](../Operator-Reference.md)
