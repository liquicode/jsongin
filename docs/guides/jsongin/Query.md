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
```js
{ name: { eq$: 'Alice' }} // Does name === 'Alice'?
```
You can match against nested fields by using dot notation path:
```js
{ 'user.name': { eq$: 'Alice' }}
```
You can match against an array element by referencing the element's index:
```js
{ 'user.0.name': { eq$: 'Alice' }}
```
You can compose complex queries with logical operators:
```js
{ $or: [
	{ star_count { $gte: 100 } },      // Either has 100 stars
	{ follower_count { $gte: 5000 } }, // or 5000 followers.
] }
```

## Operator Summary

|          **Comparison**          |  **Logical**  |         **Other**         |
|:--------------------------------:|:-------------:|:-------------------------:|
|     [$eq](#$eq), [$ne](#$ne)     | [$and](#$and) |    [$exists](#$exists)    |
|    [$gt](#$gt), [$gte](#$gte)    |  [$or](#$or)  |     [$regex](#$regex)     |
|    [$lt](#$lt), [$lte](#$lte)    | [$nor](#$nor) | [$elemMatch](#$elemMatch) |
|    [$in](#$in), [$nin](#$nin)    | [$not](#$not) |       [$all](#$all)       |
| [$eqx](#$eqx) *, [$nex](#$nex) * |               |     [$noop](#$noop) *     |
|   [$ImplicitEq](#$ImplicitEq) *  |               |                           |

`*` - Extension operator, not part of MongoDB.


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
jsongin.Query( document, { id: 101 } ) === true
jsongin.Query( document, { $gte: { id: 100 } } ) === true
jsongin.Query( document, { $eq: { 'user.name': 'Alice' } } ) === true
jsongin.Query( document, { $in: { tags: [ 'Staff' ] } } ) === true

// If a comparison fails, then false is returned.
jsongin.Query( document, { $lte: { id: 100 } } ) === false
jsongin.Query( document, { $eq: { Location: 'East' } } ) === false

// Can combine criteria with logical operators.
jsongin.Query( document, {
	$and: [
		{ 'profile.role': 'admin' },
		{ $in: { tags: [ 'Staff' ] } }
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


# Array Operators


<a id="$elemMatch"></a>$elemMatch
---------------------------------------------------------------------

**Usage** : `{ field : { $elemMatch: { expr } } }`

The `$elemMatch` operator tests the elements of an array.
`field` is an array and `value` is a query expression used to test each element of `field`.

> MongoDB Reference: [Array Query Operator: $elemMatch](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)

### Example
```js
let product_results = {
	{ _id: 1, results: [ { product: 'abc', score: 10 }, { product: 'xyz', score: 5 } ] },
	{ _id: 2, results: [ { product: 'abc', score: 8 }, { product: 'xyz', score: 7 } ] },
	{ _id: 3, results: [ { product: 'abc', score: 7 }, { product: 'xyz', score: 8 } ] },
	{ _id: 4, results: [ { product: 'abc', score: 7 }, { product: 'def', score: 8 } ] }
}

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
- When comparing two arrays, their elements can appear in any order.

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


<a id="$noop"></a>$noop
---------------------------------------------------------------------

**Usage** : `{ field: { $noop: any }}`

The `$noop` operator performs No Operation on its operand.
This can be used to disable (i.e. comment out) a portion of a query.

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

