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
Returning it for a malformed query would leave a caller no way to tell a typo from an empty
  result: a misspelled operator reads as a field name, that field is never there, and the query
  reports, quietly, that nothing matched.
MongoDB refuses every one of these with an error.

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
|     [$eq](./Query-Operators.md#$eq), [$ne](./Query-Operators.md#$ne)     | [$and](./Query-Operators.md#$and) |  [$exists](./Query-Operators.md#$exists)    | [$elemMatch](./Query-Operators.md#$elemMatch) |     [$regex](./Query-Operators.md#$regex)     |
|    [$gt](./Query-Operators.md#$gt), [$gte](./Query-Operators.md#$gte)    |  [$or](./Query-Operators.md#$or)  |    [$type](./Query-Operators.md#$type)      |      [$size](./Query-Operators.md#$size)      |      [$expr](./Query-Operators.md#$expr)      |
|    [$lt](./Query-Operators.md#$lt), [$lte](./Query-Operators.md#$lte)    | [$nor](./Query-Operators.md#$nor) |                         |       [$all](./Query-Operators.md#$all)       |   [$exprx](./Query-Operators.md#$exprx) *     |
|    [$in](./Query-Operators.md#$in), [$nin](./Query-Operators.md#$nin)    | [$not](./Query-Operators.md#$not) |                         |                           |     [$noop](./Query-Operators.md#$noop) *     |
| [$eqx](./Query-Operators.md#$eqx) *, [$nex](./Query-Operators.md#$nex) * |               |                         |                           |                           |
|   [$ImplicitEq](./Query-Operators.md#$ImplicitEq) *  |               |                         |                           |                           |

`*` - Extension operator, not part of MongoDB.

Each operator is described in detail, with examples, in
  [Query Operators](./Query-Operators.md).

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
- [Query Operators](./Query-Operators.md)
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
