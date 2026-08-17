# @liquicode/jsongin


# Query( Document, Criteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Criteria      |         o         | The set of match criteria to compare against the document. |


## Description

`jsongin` supports the MongoDB query mechanic with the function `jsongin.Query( Document, Criteria )`.
This function will return `true` if the given `Document` matches all of the criteria specified in `Criteria`.

Match criteria is a Javascript object which specifies a document field, a query operator, and a value:
```
{ name: { $eq: 'Alice' }} // Does name === 'Alice'?
```
You can match against nested fields by using dot notation path:
```
{ 'user.name': { $eq: 'Alice' }}
```
You can match against an array element by referencing the element's index:
```
{ 'user.0.name': { $eq: 'Alice' }}
```
You can compose complex queries with logical operators:
```
{ $or: [
	{ star_count: { $gte: 100 } },      // Either has 100 stars
	{ follower_count: { $gte: 5000 } }, // or 5000 followers.
] }
```


## Refusing a Query

A criteria which ***cannot mean anything*** throws, rather than returning `false`:

```js
jsongin.Query( { a: 1 }, { $bogus: 1 } );            // throws: Unknown operator [$bogus]
jsongin.Query( { a: 1 }, { a: { $bogus: 1 } } );     // throws
jsongin.Query( { a: 1 }, { $not: { a: 2 } } );       // throws, $not is not a top level operator
jsongin.Query( { a: 1 }, { a: { $size: 'two' } } );  // throws, $size takes a number
jsongin.Query( { a: 1 }, { $and: [] } );             // throws, an empty list asks nothing
```

`false` means ***this document did not match***, which is a legitimate answer.
Returning it for a malformed query gave the caller no way to tell a typo from an empty result:
  a misspelled operator was read as a field name, that field was never there, and the query
  reported, quietly, that nothing matched.
MongoDB refuses every one of these with an error, verified against MongoDB 6.0.1.

A query which is well formed and simply matches nothing still returns `false`:

```js
jsongin.Query( { a: 1 }, { a: 99 } );            // false
jsongin.Query( { a: 1 }, { a: { $gt: null } } ); // false
```

A `Document` which is not an object also returns `false` rather than throwing, because that is
  a statement about the data being filtered and not about the query.


## Operator Summary

|          **Comparison**          |  **Logical**  |       **Element**       |         **Array**         |      **Evaluation**       |
|:--------------------------------:|:-------------:|:-----------------------:|:-------------------------:|:-------------------------:|
|     [$eq](#$eq), [$ne](#$ne)     | [$and](#$and) |  [$exists](#$exists)    | [$elemMatch](#$elemMatch) |     [$regex](#$regex)     |
|    [$gt](#$gt), [$gte](#$gte)    |  [$or](#$or)  |    [$type](#$type)      |      [$size](#$size)      |      [$expr](#$expr)      |
|    [$lt](#$lt), [$lte](#$lte)    | [$nor](#$nor) |                         |       [$all](#$all)       |   [$exprx](#$exprx) *     |
|    [$in](#$in), [$nin](#$nin)    | [$not](#$not) |                         |                           |     [$noop](#$noop) *     |
| [$eqx](#$eqx) *, [$nex](#$nex) * |               |                         |                           |                           |
|   [$ImplicitEq](#$ImplicitEq) *  |               |                         |                           |                           |

`*` - Extension operator, not part of MongoDB.

***Note on dates*** :
A `Date` has its own short type `d`, so the comparison operators handle dates directly.
`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, and `$nin` all compare dates by their time
  value, and `$type` selects them with either `'date'` or `9`.
A date is never equal to the string or number which represents it: `$eq` against an ISO string
  or a timestamp is `false`.
See [`ShortType()`](./ShortType.md) for why dates are treated as their own type.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- MongoDB Reference: [Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)


## Examples

```js
let document = {
	id: 101,
	user: {
		name: 'Alice',
		location: 'East',
		status: null,
	},
	profile: {
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
};

// You can do comparisons on document fields.
// Note that the field comes first and the operator is applied to it.
jsongin.Query( document, { id: 101 } ) === true
jsongin.Query( document, { id: { $gte: 100 } } ) === true
jsongin.Query( document, { 'user.name': { $eq: 'Alice' } } ) === true
jsongin.Query( document, { tags: { $in: [ 'Staff' ] } } ) === true

// If a comparison fails, then false is returned.
jsongin.Query( document, { id: { $lte: 100 } } ) === false
jsongin.Query( document, { Location: { $eq: 'East' } } ) === false

// Can combine criteria with logical operators.
jsongin.Query( document, {
	$and: [
		{ 'profile.role': 'admin' },
		{ tags: { $in: [ 'Staff' ] } }
	] } ) === true
```


# Comparison Operators


<a id="$eq"></a>$eq
---------------------------------------------------------------------

**Usage** : `{ field: { $eq: value }}`

The `$eq` operator compares two values and returns true if they are strictly (`===`) the same.

Performs a strict equals between values in the document and values in the query.
Returns `true` if both values are strictly equal to each other.
For primitive types, `$eq` performs the javascript `===` comparison.

If both `field` and `value` are of type `bnslru` and are of the same type,
  then they are compared to each other using a strict `===` comparison.

If both `field` and `value` are of type `lu`, then `true` is always returned.

If both `field` and `value` are of type `o`,
  then they are compared to each other using a strict `===` comparison.

If both `field` and `value` are of type `a`,
  then they are compared to each other using a strict `===` comparison.
If this comparison fails, a further check is performed to see if `value`
  can be matched to one of the elements in `field`.

Notes:
- The values `null` and `undefined` are considered equivalent (`null === undefined`)
- Returns `false` if the document value and the query value are of different types.
- Integers and doubles can be compared to each other (42 === 42.0).
- When comparing two objects, their fields must be in the same order.
- When comparing two arrays, their elements must be in the same order.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Can be used explicitely to compare.
jsongin.Query( document, { login_attempts: { $eq: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $eq: 10 } } ) === false
// Can be used implicitely.
jsongin.Query( document, { login_attempts: 7 } ) === true
// No type coercion takes place, field and value must be the same type.
jsongin.Query( document, { login_attempts: { $eq: "7" } } ) === false
// - Except that, null and undefined are always equal.
jsongin.Query( document, { password: { $eq: null } } ) === true
// You can reference a nested field by using dot notation.
jsongin.Query( document, { 'user.name': { $eq: 'Alice' } } ) === true
// And array elements by referencing the element's index.
jsongin.Query( document, { 'tags.0': { $eq: 'A' } } ) === true
// Returns true if two arrays match or if one is an element of another.
jsongin.Query( document, { tags: { $eq: [ 'A', 'C' ] } } ) === true
jsongin.Query( document, { tags: { $eq: [ 'C' ] } } ) === true
```


<a id="$ne"></a>$ne
---------------------------------------------------------------------

**Usage** : `{ field: { $ne: value }}`

The `$ne` operator compares two values and returns true if they are not strictly (`!==`) the same.

This operator essentially returns the not {`!`} of `$eq`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of $eq would return.
jsongin.Query( document, { login_attempts: { $ne: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $ne: 10 } } ) === true
```


<a id="$gt"></a>$gt
---------------------------------------------------------------------

**Usage** : `{ field: { $gt: value }}`

The `$gt` operator compares two values and returns true if the field's value is
  greater than (`>`) the specified value.

If both `field` and `value` are of type `bns` and are of the same type,
  then the operator returns `true` if `field > value`.

If `field` is an array,
  then the operator returns `true` if any element of `field` is `> value`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns true if the field value is > the provided value.
jsongin.Query( document, { login_attempts: { $gt: 3 } } ) === true
jsongin.Query( document, { login_attempts: { $gt: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $gt: 10 } } ) === false
// Returns true if any element of an array is > the provided value.
jsongin.Query( document, { tags: { $gt: 'B' } } ) === true
```


<a id="$gte"></a>$gte
---------------------------------------------------------------------

**Usage** : `{ field: { $gte: value }}`

The `$gte` operator compares two values and returns true if the field's value is
  greater than or equal to (`>=`) the specified value.

If both `field` and `value` are of type `bns` and are of the same type,
  then the operator returns `true` if `field >= value`.

If both `field` and `value` are of type `lu`, then `true` is always returned.

If `field` is an array,
  then the operator returns `true` if any element of `field` is `>= value`.

### Example
```js
// Returns true if the field value is >= the provided value.
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
jsongin.Query( document, { login_attempts: { $gte: 3 } } ) === true
jsongin.Query( document, { login_attempts: { $gte: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $gte: 10 } } ) === false
// Returns true if any element of an array is >= the provided value.
jsongin.Query( document, { tags: { $gte: 'C' } } ) === true
```


<a id="$lt"></a>$lt
---------------------------------------------------------------------

**Usage** : `{ field: { $lt: value }}`

The `$lt` operator compares two values and returns true if the field's value is
  less than (`<`) the specified value.

If both `field` and `value` are of type `bns` and are of the same type,
  then the operator returns `true` if `field < value`.

If `field` is an array,
  then the operator returns `true` if any element of `field` is `< value`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns true if the field value is < the provided value.
jsongin.Query( document, { login_attempts: { $lt: 3 } } ) === false
jsongin.Query( document, { login_attempts: { $lt: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $lt: 10 } } ) === true
// Returns true if any element of an array is < the provided value.
jsongin.Query( document, { tags: { $lt: 'B' } } ) === true
```


<a id="$lte"></a>$lte
---------------------------------------------------------------------

**Usage** : `{ field: { $lte: value }}`

The `$lte` operator compares two values and returns true if the field's value is
  less than or equal to (`<=`) the specified value.

If both `field` and `value` are of type `bns` and are of the same type,
  then the operator returns `true` if `field <= value`.

If both `field` and `value` are of type `lu`, then `true` is always returned.

If `field` is an array,
  then the operator returns `true` if any element of `field` is `<= value`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns true if the field value is <= the provided value.
jsongin.Query( document, { login_attempts: { $lte: 3 } } ) === false
jsongin.Query( document, { login_attempts: { $lte: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $lte: 10 } } ) === true
// Returns true if any element of an array is <= the provided value.
jsongin.Query( document, { tags: { $lte: 'A' } } ) === true
```


<a id="$in"></a>$in
---------------------------------------------------------------------

**Usage** : `{ field: { $in: [ value1, value2, ... ] }}`

The `$in` operator returns `true` when the `field` can be found within an array of values.

When `field` is of type `bnslou`,
  then the operator returns `true` if `field` is contained within the value array.

If `field` is also an array,
  then the operator returns `true` if any element within`field` is also contained within the value array.

The value array can contain regular expressions `r` to be matched against.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns true if the field value is contained within an array of values.
jsongin.Query( document, { login_attempts: { $in: [ 3, 5, 7 ] } } ) === true
jsongin.Query( document, { login_attempts: { $in: [ 1, 2, 3 ] } } ) === false
jsongin.Query( document, { 'user.role': { $in: [ 'admin', 'super' ] } } ) === true
// Returns true if any element of the field array is contained in the value array.
jsongin.Query( document, { tags: { $in: [ 'A', 'B' ] } } ) === true
// You can use regular expressions.
jsongin.Query( document, { tags: { $in: [ /A|B/ ] } } ) === true
```



<a id="$nin"></a>$nin
---------------------------------------------------------------------

**Usage** : `{ field: { $nin: [ value1, value2, ... ] }}`

The `$nin` operator returns `true` when the `field` cannot be found within an array of values.

This operator essentially returns the not {`!`} of `$in`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $in would return.
jsongin.Query( document, { login_attempts: { $nin: [ 3, 5, 7 ] } } ) === false
jsongin.Query( document, { login_attempts: { $nin: [ 1, 2, 3 ] } } ) === true
jsongin.Query( document, { 'user.role': { $nin: [ 'admin', 'super' ] } } ) === false
```


# Logical Operators


<a id="$and"></a>$and
---------------------------------------------------------------------

**Usage** : `{ $and: [ expr1, expr2, ... ] }`

The `$and` operator combines a number of other query expressions.
This operator will return `true` if **all** of those query expressions also return `true`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $in would return.
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

**Usage** : `{ $or: [ expr1, expr2, ... ] }`

The `$or` operator combines a number of other query expressions.
This operator will return `true` if **any** of those query expressions also return `true`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $in would return.
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

**Usage** : `{ $nor: [ expr1, expr2, ... ] }`

The `$nor` operator combines a number of other query expressions.
This operator will return `true` if **none** of those query expressions return `true`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $in would return.
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

**Usage** : `{ $not: { expression } }` or `{ field: { $not: /regexp/ } }`

The `$not` operator does a logical negation of another query operation.
The `$not` operator can also do a logical negation of a regular expression.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what another query operation would.
jsongin.Query( document, { $not: { login_attempts: { $eq: 0 } } } ) === true
jsongin.Query( document, { $not: { tags: { $eq: 'X' } } } ) === true
// Returns the opposite of what a regular expression would.
jsongin.Query( document, { tags: { $not: /X|Y|Z/ } } ) === true
```


# Element Operators


<a id="$exists"></a>$exists
---------------------------------------------------------------------

**Usage** : `{ field : { $exists: true|false } }`

The `$exists` operator tests for the presence of a field within the document.
You can test if a field exists `{$exists: true}` or if it does not exist `{$exists: false}`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Used to test for the presence of a field.
jsongin.Query( document, { user: { $exists: true } } ) === true
jsongin.Query( document, { 'user.name': { $exists: true } } ) === true
// Or the non-existence of a field.
jsongin.Query( document, { 'user.password': { $exists: false } } ) === true
```


<a id="$type"></a>$type
---------------------------------------------------------------------

**Usage** : `{ field : { $type: bson-type } }`

The `$type` operator tests if the `field`'s type is a specific BSON type.
You can specify a BSON type either numerically or by its alias.
See the table below for BSON type values and aliases.

BSON Types and `jsongin` Support

| **Type**                   | **Number** | **Alias**             | **Notes**                  | **Supported** |
|----------------------------|------------|-----------------------|----------------------------|---------------|
| Double                     | 1          | "double"              |                            | Yes           |
| String                     | 2          | "string"              |                            | Yes           |
| Object                     | 3          | "object"              |                            | Yes           |
| Array                      | 4          | "array"               |                            | Yes           |
| Binary data                | 5          | "binData"             |                            | -             |
| Undefined                  | 6          | "undefined"           | Deprecated.                | Yes           |
| ObjectId                   | 7          | "objectId"            |                            | -             |
| Boolean                    | 8          | "bool"                |                            | Yes           |
| Date                       | 9          | "date"                |                            | -             |
| Null                       | 10         | "null"                |                            | Yes           |
| Regular Expression         | 11         | "regex"               |                            | Yes           |
| DBPointer                  | 12         | "dbPointer"           | Deprecated.                | -             |
| JavaScript                 | 13         | "javascript"          |                            | -             |
| Symbol                     | 14         | "symbol"              | Deprecated.                | Yes           |
| JavaScript code with scope | 15         | "javascriptWithScope" | Deprecated in MongoDB 4.4. | -             |
| 32-bit integer             | 16         | "int"                 |                            | Yes           |
| Timestamp                  | 17         | "timestamp"           |                            | -             |
| 64-bit integer             | 18         | "long"                |                            | Yes           |
| Decimal128                 | 19         | "decimal"             |                            | -             |
| Min key                    | -1         | "minKey"              |                            | -             |
| Max key                    | 127        | "maxKey"              |                            | -             |

> MongoDB Reference: [BSON Types](https://www.mongodb.com/docs/manual/reference/bson-types)

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Used to test for a field type.
jsongin.Query( document, { user: { $type: 3 } } ) === true
jsongin.Query( document, { user: { $type: 'object' } } ) === true
jsongin.Query( document, { 'user.name': { $type: 'string' } } ) === true
jsongin.Query( document, { tags: { $type: 'array' } } ) === true
```


# Evaluation Operators


<a id="$regex"></a>$regex
---------------------------------------------------------------------

**Usage** : `{ field : { $regex: string|regexp } }`

The `$regex` operator does a regular expression comparison on a document field.
The regular expression can be expressed as a string or as a Javascript regular expression.

> [Regular Expression Reference](https://www.w3schools.com/jsref/jsref_obj_regexp.asp)

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Used to test for a field type.
jsongin.Query( document, { 'user.role': { $regex: /^admin/ } } ) === true
jsongin.Query( document, { 'user.role': { $regex: '^admin' } } ) === true
```

When the document field holds an ***array***, it matches if ***any one*** of its elements
  matches, which is how every other array comparison in `jsongin` behaves.

```js
jsongin.Query( { tags: [ 'staff', 'x' ] }, { tags: /^st/ } ) === true
```

> ***Breaking change in v0.1.0*** :
  a regular expression matched against an array field previously required ***every*** element
  to match. A single element array happened to work, so the defect only showed on arrays of two
  or more. Queries which relied on the old behavior will now match more documents.


<a id="$expr"></a>$expr
---------------------------------------------------------------------

**Usage** : `{ $expr: expression }`

The `$expr` operator evaluates an aggregation ***expression*** and matches the document when
  the result is true.

This is what lets a query compare one document field to ***another***.
Every other query operator compares a field to a constant you supply; `$expr` compares computed
  values, either of which can be read out of the document.

Within an expression, a string beginning with `$` is a reference to a document field
  (e.g. `'$user.name'`). Anything else is a literal value.

`$expr` is a ***top-level*** operator. It does not appear within a field.
Use [`$exprx`](#$exprx) for that.

The result is converted to a boolean using MongoDB's rules, where only `false`, `0`, `null`,
  and missing values are false. Note that the empty string `""` and the empty array `[]` are
  both true.

> See the [`Evaluate()`](./Evaluate.md) document for the full list of expression operators and
  how they are written.

### Example
```js
let document = { dmg: 12, armor: 5, stats: { hp: 20, max: 30 } };

// Compare two fields of the same document.
jsongin.Query( document, { $expr: { $gt: [ '$dmg', '$armor' ] } } ) === true
jsongin.Query( document, { $expr: { $lt: [ '$dmg', '$armor' ] } } ) === false

// Field references may use dot notation.
jsongin.Query( document, { $expr: { $lt: [ '$stats.hp', '$stats.max' ] } } ) === true

// Compute a value first, then compare it.
jsongin.Query( { a: 10, b: 3 }, { $expr: { $gt: [ { $subtract: [ '$a', '$b' ] }, 5 ] } } ) === true
```


# Array Operators


<a id="$elemMatch"></a>$elemMatch
---------------------------------------------------------------------

**Usage** : `{ field : { $elemMatch: { expr } } }`

The `$elemMatch` operator tests the elements of an array.
`field` is an array and `value` is a query expression used to test each element of `field`.

> MongoDB Reference: [Array Query Operator: $elemMatch](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)

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
```


<a id="$size"></a>$size
---------------------------------------------------------------------

**Usage** : `{ field : { $size: integer } }`

The `$size` operator tests the size of an array within the document.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Used to test for a field type.
jsongin.Query( document, { tags: { $size: 2 } } ) === true
```


<a id="$all"></a>$all
---------------------------------------------------------------------

**Usage** : `$all: { field: [ values ], ... }`


> MongoDB Reference: [Array Query Operator: $all](https://www.mongodb.com/docs/manual/reference/operator/query/all/)


# jsongin Extended Query Operators


<a id="$eqx"></a>$eqx
---------------------------------------------------------------------

**Usage** : `{ field: { $eqx: value }}`

Performs a match between values in the document and values in the query.
Returns `true` if both values are equal to each other.
This operator functions much in the same way as the `$eq` operator but provides a more relaxed comparison than `$eq` does.
For primitive types, `$eqx` performs the javascript `==` comparison.

Notes:
- The semantics of `null` and `undefined` are equivalent (`null == undefined`)
- Booleans can be expressed numerically (`false == 0` and `true == 1`),
- Booleans can be expressed as strings (`false == "0"` and `true == "1"`),
- Integers and doubles can be compared to each other (`42 == 42.0`).
- Numerics and strings can be compared to each other (`42 == "42.0"`).
- When comparing two objects, their fields can appear in any order.
  Every key of both objects is compared, so an object does not match one which carries more.
- When comparing two arrays, their elements can appear in any order.

The comparison is the only thing which differs from `$eq`.
A path resolves the same way it does for `$eq`, so a match value equals a field which holds it
  and also a field which holds an array containing it, and a path which crosses an array asks
  whether any element satisfies the comparison.
The comparison itself is available on its own as [`LooseEquals()`](./LooseEquals.md).

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Use a loose == equality check..
jsongin.Query( document, { login_attempts: { $eqx: 7 } } ) === true
jsongin.Query( document, { login_attempts: { $eqx: '7' } } ) === true

// An array field is matched by one of its elements, as it is with $eq.
jsongin.Query( document, { tags: { $eqx: 'A' } } ) === true

// Where $eq compares strictly, $eqx coerces.
jsongin.Query( { codes: [ '1', '2' ] }, { codes: { $eq: 1 } } ) === false
jsongin.Query( { codes: [ '1', '2' ] }, { codes: { $eqx: 1 } } ) === true
```


<a id="$nex"></a>$nex
---------------------------------------------------------------------

**Usage** : `{ field: { $nex: value }}`

The `$nex` operator compares two values and returns true if they are not loosely (`!=`) the same.

This operator essentially returns the not {`!`} of `$eqx`.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $eqx would.
jsongin.Query( document, { login_attempts: { $nex: 7 } } ) === false
jsongin.Query( document, { login_attempts: { $nex: '7' } } ) === false
```


<a id="$exprx"></a>$exprx
---------------------------------------------------------------------

**Usage** : `{ $exprx: expression }` or `{ field: { $exprx: expression }}`

The `$exprx` operator is a `jsongin` extension of [`$expr`](#$expr).

It does everything `$expr` does, and it can additionally appear ***within a field***, where it
  evaluates its expression against the sub-document found at that field.
Field references inside the expression are then relative to that sub-document rather than to
  the whole document.

This is what makes it possible to compare two fields of a sub-document without repeating the
  path to it.

The `$exprx` operator is a `jsongin` extension and does not appear in MongoDB.

### Example
```js
let document = { dmg: 12, armor: 5, stats: { hp: 20, max: 30 } };

// Within a field, the expression is evaluated against that sub-document.
jsongin.Query( document, { stats: { $exprx: { $lt: [ '$hp', '$max' ] } } } ) === true

// The same comparison written with $expr needs the full paths.
jsongin.Query( document, { $expr: { $lt: [ '$stats.hp', '$stats.max' ] } } ) === true

// At the top level, $exprx behaves exactly like $expr.
jsongin.Query( document, { $exprx: { $gt: [ '$dmg', '$armor' ] } } ) === true

// $expr does not work within a field. It finds no such fields and does not match.
jsongin.Query( document, { stats: { $expr: { $lt: [ '$hp', '$max' ] } } } ) === false
```


<a id="$noop"></a>$noop
---------------------------------------------------------------------

**Usage** : `{ $noop: any }` or `{ field: { $noop: any }}`

The `$noop` operator performs No Operation on its operand.
This can be used to disable (i.e. comment out) a portion of a query.

It matches everything, so renaming a clause's key to `$noop` disables that clause while leaving
  the rest of the query intact.
It can appear at the ***top level*** of a query or within a field.

The one value it does not accept is `undefined`, which `Query` rejects for every operator so
  that a missing variable is never silently ignored.

```js
// The b clause is disabled. The a clause still applies.
jsongin.Query( { a: 1, b: 2 }, { a: 1, $noop: { b: 999 } } ) === true
jsongin.Query( { a: 1, b: 2 }, { a: 9, $noop: { b: 999 } } ) === false
```

> ***Fixed in v0.1.0*** :
  `$noop` was marked as not allowed at the top level of a query, which is exactly where a
  commented out clause sits, so `Query( doc, { a: 1, $noop: { b: 2 } } )` returned `false`
  instead of ignoring the `$noop` clause.

### Example
```js
let document = {
	user: {
		name: 'Alice',
		role: 'admin',
	},
	login_attempts: 7,
	tags: [ 'A', 'C' ]
};
// Returns the opposite of what $in would return.
jsongin.Query( document,
{
	$and:
	[
		{ 'user.role': { $in: [ 'admin', 'super' ] } }, // true
		{ $noop: { login_attempts: { $gt: 10 } } },     // false
		{ login_attempts: { $lt: 10 } }                 // true
	]
} ) === true
```


<a id="$ImplicitEq"></a>$ImplicitEq
---------------------------------------------------------------------

**Usage** : `field: value`

An implicit `$eq` can be used when comparing against a simple scalar value:
  `{ foo: { $eq: 'baz' } }` can be represented as `{ foo: 'baz' }`.

An implicit `$eq ` will only be applied at the end of a nested structure,
  where a field represents a single `bnsl` type of value.

This query: `{ foo: { bar: 'baz' } }` would equate to
  `{ foo: { bar: { $eq: 'baz' } } }` rather than `{ foo: { $eq: { bar: 'baz' } } }`,

To make comparisons between objects (of type `oa`), then you must explicitly use the `$eq` operator.

The `$ImplicitEq` operator is a `jsongin` extension and does not appear in MongoDB.

### Examples
```js
jsongin.Query( { user: { name: 'Alice' } }, { 'user.name': 'Alice' } ) === true
```

