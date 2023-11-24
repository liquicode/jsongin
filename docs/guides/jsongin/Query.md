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

### Examples
```js
jsongin.Query( { user: { name: 'Alice' } }, { $eq: { 'user.name': 'Alice' } } ) === true
```


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

