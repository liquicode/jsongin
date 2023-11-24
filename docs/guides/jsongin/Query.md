# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin)


# Query( Document, Criteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Criteria      |         o         | The set of match criteria to compare against the document. |


## Description

`jsongin` supports the MongoDB query mechanic with the function `jsongin.Query( Document, Criteria )`.
This function will return `true` if the given `Document` matches all of the criteria specified in `Criteria`.

Match criteria are specified by one more query operators (see below).
Each operator will be followed by a number of `field: value` arguments which specify which document fields
  to test and the value to match them to.


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


 $eq
---------------------------------------------------------------------

**Usage** : `$eq: { field: value, field: value, ... }`

The `$eq` operator compares two values and returns true if they are strictly (===) the same.

Performs a strict equals between values in the document and values in the query.
Returns `true` if both values are strictly equal to each other.
For primitive types, `$eq` performs the javascript `===` comparison.

Notes:
- The values `null` and `undefined` are considered equivalent (`null === undefined`)
- Returns `false` if the document value and the query value are of different types.
- Integers and doubles can be compared to each other (42 === 42.0).
- When comparing two objects, their fields must be in the same order.
- When comparing two arrays, their elements must be in the same order.

### Examples
```js
jsongin.Query( { user: { name: 'Alice' } }, { $eq: { 'user.name': 'Alice' } } ) === true
```


 $ne
---------------------------------------------------------------------

**Usage** : `$ne: { expression }`


 $gt
---------------------------------------------------------------------

**Usage** : `$gt: { field: value, field: value, ... }`


 $gte
---------------------------------------------------------------------

**Usage** : `$gte: { field: value, field: value, ... }`


 $lt
---------------------------------------------------------------------

**Usage** : `$lt: { field: value, field: value, ... }`


 $lte
---------------------------------------------------------------------

**Usage** : `$lte: { field: value, field: value, ... }`


 $in
---------------------------------------------------------------------

**Usage** : `$in: [ element, ... ]`


 $nin
---------------------------------------------------------------------

**Usage** : `$nin: [ element, ... ]`


# Logical Operators


 $and
---------------------------------------------------------------------

**Usage** : `$and: [ expression, ... ]`


 $or
---------------------------------------------------------------------

**Usage** : `$or: [ expression, ... ]`


 $nor
---------------------------------------------------------------------

**Usage** : `$nor: [ expression, ... ]`


 $not
---------------------------------------------------------------------

**Usage** : `$not: { expression }`


# Element Operators


 $exists
---------------------------------------------------------------------

**Usage** : `$exists: { field: boolean, ... }`


 $type
---------------------------------------------------------------------

**Usage** : `$type: { field: bson-type, ... }`


# Evaluation Operators


 $regex
---------------------------------------------------------------------

**Usage** : `$regex: { field: regexp, ... }`


# Array Operators


 $elemMatch
---------------------------------------------------------------------

**Usage** : `$elemMatch: { field: value, ... }`


 $size
---------------------------------------------------------------------

**Usage** : `$size: { field: integer, ... }`


 $all
---------------------------------------------------------------------

**Usage** : `$all: { field: [ values ], ... }`


# jsongin Extended Query Operators


 $eqx
---------------------------------------------------------------------

**Usage** : `$eqx: { field: value, ... }`

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


 $nex
---------------------------------------------------------------------

**Usage** : `$nex: { field: value, ... }`


 $noop
---------------------------------------------------------------------

**Usage** : `$noop: <any>`


 $ImplicitEq
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

