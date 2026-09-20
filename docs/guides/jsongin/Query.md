# @liquicode/jsongin


# Query( Document, Criteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                          |
|---------------|:-----------------:|----------------------------------------------------------|
| Document      |         o         | The document to test.                                    |
| Criteria      |         o         | The conditions the document must meet.                   |
| Path          |         s         | Optional. The field the criteria applies below.          |
| Options       |        ob         | Optional. `{ ExpandArrays, Scope }`. See below.          |


## Description

`jsongin.Query( Document, Criteria )` returns `true` if `Document` meets every condition in
  `Criteria`, the way a MongoDB query does.

A condition names a field, an operator, and a value:
```
{ name: { $eq: 'Alice' } } // Is name equal to 'Alice'?
```
Use dot notation to reach a nested field:
```
{ 'user.name': { $eq: 'Alice' } }
```
Use a number in the path to reach one element of an array:
```
{ 'user.0.name': { $eq: 'Alice' } }
```
Combine conditions with the logical operators:
```
{ $or: [
	{ star_count: { $gte: 100 } },      // Either 100 stars
	{ follower_count: { $gte: 5000 } }, // or 5000 followers.
] }
```

An empty criteria, `{}`, matches every document.


## Malformed Criteria Throw

`Query` throws when the criteria itself is wrong, instead of returning `false`:

```js
jsongin.Query( { a: 1 }, { $bogus: 1 } );            // throws: unknown operator
jsongin.Query( { a: 1 }, { a: { $bogus: 1 } } );     // throws: unknown operator
jsongin.Query( { a: 1 }, { $not: { a: 2 } } );       // throws: $not must be used under a field
jsongin.Query( { a: 1 }, { a: { $or: [] } } );       // throws: $or must be used at the top level
jsongin.Query( { a: 1 }, { a: { $size: 'two' } } );  // throws: $size takes a number
jsongin.Query( { a: 1 }, { $and: [] } );             // throws: $and needs at least one condition
jsongin.Query( { a: 1 }, 'a' );                      // throws: Criteria must be an object
```

`false` always means the document did not match.
If a typo returned `false` too, you could not tell a mistake from a query which simply matched
  nothing.
MongoDB rejects all of these as well.

A well-formed query which does not match returns `false`:

```js
jsongin.Query( { a: 1 }, { a: 99 } );            // false
jsongin.Query( { a: 1 }, { a: { $gt: null } } ); // false
```

If `Document` is not an object, `Query` returns `false` rather than throwing, because the problem
  is with the data and not with the query.

`Query` only finds a mistake when it gets to it, and it stops at the first condition which fails.
To check a whole criteria without a document, use [`ValidateQuery()`](./ValidateQuery.md).


## Options

`Options` is what a query carries besides the document and the criteria.
Every operator takes the same one, and it holds two things:

| **Field**    | **Default** | **What it does**                                               |
|--------------|:-----------:|-----------------------------------------------------------------|
| ExpandArrays |   `true`    | Whether an array field also offers each of its elements.         |
| Scope        |   `null`    | Variables the query may read. See [Scope](./Scope.md).           |

***They travel unchanged through the whole criteria.***
An operator hands them to another operator, and to any criteria it gives back to `Query()`,
  so a setting made at the top holds all the way down rather than evaporating one call later.

[`$elemMatch`](./Query-Operators.md#$elemMatch) is the one exception, and it only narrows:
  it turns `ExpandArrays` off for the criteria it applies to an element, because there an
  element which is itself an array is a value rather than a container.
Ordinary semantics resume below that element.


### Lending a Query Some Variables

A query has no variables of its own, the way MongoDB gives a query none.
A caller can lend it some, and the expression operators
  [`$expr`](./Query-Operators.md#$expr) and [`$exprx`](./Query-Operators.md#$exprx) can then read them:

```js
let scope = jsongin.Scope.NewPipeline().Child( { Left: { Dome: 'A' } } );
jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', { Scope: scope } ); // returns true
jsongin.Query( { DomeId: 'B' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', { Scope: scope } ); // returns false
```

`$field` still means a field of the document being tested, and `$$ROOT` still means that document.
This is what lets a criteria compare two documents, and it is how [`Join()`](./Join.md) lends
  the document it is matching from as `$$Left`.

***Lend a frame which descends from a pipeline frame***, as above.
`$$NOW` and `$$REMOVE` are bound there, so a bare `Scope.New()` frame leaves them undefined:

```js
let bare = jsongin.Scope.New( { Left: { Dome: 'A' } } );
jsongin.Query( { a: 1 }, { $expr: { $eq: [ '$$Left.Dome', 'A' ] } }, '', { Scope: bare } ); // returns true
jsongin.Query( { a: 1 }, { $expr: { $lt: [ '$$NOW', 0 ] } }, '', { Scope: bare } );         // throws: $$NOW is not defined
```

A scope passed on its own, where the options go, is refused rather than quietly ignored.


### Matching Without Array Expansion

By default a path which reaches an array also offers each of its elements, which is what makes
  `{ Domes: 'A' }` match `{ Domes: [ 'A', 'B' ] }`.
That is MongoDB's rule.
***`ExpandArrays: false` turns it off for the whole criteria***, so a path means only what it
  lands on:

```js
let document = { Domes: [ 'A', 'B' ] };
jsongin.Query( document, { Domes: 'A' } );                              // returns true
jsongin.Query( document, { Domes: 'A' }, '', { ExpandArrays: false } ); // returns false

// The array is still the value the path lands on.
jsongin.Query( document, { Domes: [ 'A', 'B' ] }, '', { ExpandArrays: false } ); // returns true
```

***This is a `jsongin` extension.*** MongoDB has no such setting, so a query which uses it is
  not a query a server would answer the same way.
It is useful for strict matching, where a field holding a list should not be mistaken for one
  of its members.

The same field is accepted by [`ResolveCandidates()`](./ResolveCandidates.md), which is where
  the expansion actually happens.


## Operator Summary

|          **Comparison**          |  **Logical**  |       **Element**       |         **Array**         |      **Evaluation**       |      **Bitwise**      |     **Miscellaneous**     |
|:--------------------------------:|:-------------:|:-----------------------:|:-------------------------:|:-------------------------:|:---------------------:|:-------------------------:|
|     [$eq](./Query-Operators.md#$eq), [$ne](./Query-Operators.md#$ne)     | [$and](./Query-Operators.md#$and) |  [$exists](./Query-Operators.md#$exists)    | [$elemMatch](./Query-Operators.md#$elemMatch) |     [$regex](./Query-Operators.md#$regex)     | [$bitsAllSet](./Query-Operators.md#$bitsAllSet) | [$comment](./Query-Operators.md#$comment) |
|    [$gt](./Query-Operators.md#$gt), [$gte](./Query-Operators.md#$gte)    |  [$or](./Query-Operators.md#$or)  |    [$type](./Query-Operators.md#$type)      |      [$size](./Query-Operators.md#$size)      |      [$expr](./Query-Operators.md#$expr)      | [$bitsAllClear](./Query-Operators.md#$bitsAllClear) | [$sampleRate](./Query-Operators.md#$sampleRate) |
|    [$lt](./Query-Operators.md#$lt), [$lte](./Query-Operators.md#$lte)    | [$nor](./Query-Operators.md#$nor) |                         |       [$all](./Query-Operators.md#$all)       |      [$mod](./Query-Operators.md#$mod)      | [$bitsAnySet](./Query-Operators.md#$bitsAnySet) | [$noop](./Query-Operators.md#$noop) * |
|    [$in](./Query-Operators.md#$in), [$nin](./Query-Operators.md#$nin)    | [$not](./Query-Operators.md#$not) |                         |                           | [$jsonSchema](./Query-Operators.md#$jsonSchema) | [$bitsAnyClear](./Query-Operators.md#$bitsAnyClear) |                           |
| [$eqx](./Query-Operators.md#$eqx) *, [$nex](./Query-Operators.md#$nex) * |               |                         |                           |   [$exprx](./Query-Operators.md#$exprx) *     |                       |                           |
|   [$ImplicitEq](./Query-Operators.md#$ImplicitEq) *  |               |                         |                           |                           |                       |                           |

`*` - An extension. MongoDB does not have this operator.

[Query Operators](./Query-Operators.md) describes each operator, with examples.

***Dates*** :
A `Date` is its own type (short type `d`), and the comparison operators compare two dates by the
  moment they hold.
`$type` selects dates with `'date'` or with the BSON type number `9`.
A date never equals the string or number which represents it, so `$eq` against an ISO string or
  a timestamp is `false`.
See [`ShortType()`](./ShortType.md).


## See Also

- [`ValidateQuery( Criteria )`](./ValidateQuery.md)
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

// Compare a field with a value.
// The field comes first, and the operator is applied to it.
jsongin.Query( document, { id: 101 } ) === true
jsongin.Query( document, { id: { $gte: 100 } } ) === true
jsongin.Query( document, { 'user.name': { $eq: 'Alice' } } ) === true
jsongin.Query( document, { tags: { $in: [ 'Staff' ] } } ) === true

// A condition which is not met returns false.
jsongin.Query( document, { id: { $lte: 100 } } ) === false
jsongin.Query( document, { Location: { $eq: 'East' } } ) === false

// Combine conditions with a logical operator.
jsongin.Query( document, {
	$and: [
		{ 'profile.role': 'admin' },
		{ tags: { $in: [ 'Staff' ] } }
	] } ) === true
```
