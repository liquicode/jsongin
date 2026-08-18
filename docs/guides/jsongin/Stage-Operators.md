# @liquicode/jsongin


# Stage Operators

The stages of an aggregation pipeline, read by [`Aggregate()`](./Aggregate.md).
A pipeline is an array of stages, and each stage takes the stream of documents the previous one
  produced.

Each stage below gives its usage, what it does to the stream, and examples.
See [`Aggregate()`](./Aggregate.md) for the pipeline rules and
  [Accumulator Operators](./Accumulator-Operators.md) for what may appear inside a `$group`.

| **Stage**                          | **Usage**                                                            |
|------------------------------------|----------------------------------------------------------------------|
| [`$match`](#$match)                | `{ $match: query }`                                                  |
| [`$project`](#$project)            | `{ $project: { field: 1 \| 0, field: expression, ... } }`            |
| [`$addFields`](#$addFields)        | `{ $addFields: { field: expression, ... } }`                         |
| [`$set`](#$set)                    | `{ $set: { field: expression, ... } }`                               |
| [`$unwind`](#$unwind)              | `{ $unwind: '$path' }`                                               |
| [`$group`](#$group)                | `{ $group: { _id: expression, field: { accumulator: expression } } }` |
| [`$sort`](#$sort)                  | `{ $sort: { field: 1 \| -1, ... } }`                                 |
| [`$limit`](#$limit)                | `{ $limit: count }`                                                  |
| [`$skip`](#$skip)                  | `{ $skip: count }`                                                   |
| [`$count`](#$count)                | `{ $count: 'field_name' }`                                           |



These documents are used by the examples below:

```js
let players =
[
	{ team: 'red', name: 'Alice', points: 7, alive: true, dmg: 12, armor: 5 },
	{ team: 'red', name: 'Bob', points: 3, alive: true, dmg: 4, armor: 6 },
	{ team: 'blue', name: 'Carol', points: 9, alive: false, dmg: 9, armor: 2 },
];
```


<a id="$match"></a>$match
---------------------------------------------------------------------

Selects the documents which match the given query and discards the rest.
Every query operator works here, including `$expr` and `$exprx`.

```js
jsongin.Aggregate( players, [ { $match: { alive: true, points: { $gte: 3 } } } ] );
jsongin.Aggregate( players, [ { $match: { $expr: { $gt: [ '$dmg', '$armor' ] } } } ] );
```


<a id="$project"></a>$project
---------------------------------------------------------------------

Reshapes each document, including or excluding fields and defining new ones from expressions.
This is [`Project( Document, Projection )`](./Project.md) applied to every document.

A value of `1` or `true` includes a field, a value of `0` or `false` excludes it, and any other
  value is an expression which computes the field.
Inclusions and exclusions cannot be combined, with the exception of `_id`, which may be
  suppressed alongside an inclusion.
A computed field implies an inclusion projection.

```js
jsongin.Aggregate( players, [ { $project: { _id: 0, name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
```


<a id="$addFields"></a><a id="$set"></a>$addFields and $set
---------------------------------------------------------------------

Adds new fields to each document, leaving the existing fields in place.
A field which already exists is overwritten.
An expression which evaluates to a missing value does not add the field.

`$set` is an alias of `$addFields`, exactly as it is in MongoDB.

Each expression is evaluated against the ***original*** document, so a field added by the stage
  is not visible to the other expressions within the same stage.

```js
jsongin.Aggregate( [ { a: 1 } ], [ { $addFields: { b: '$a', c: '$b' } } ] );
// returns [ { a: 1, b: 1 } ]     the new b is not visible to c
```


<a id="$unwind"></a>$unwind
---------------------------------------------------------------------

Deconstructs an array field, emitting one document per element of the array.
The path must begin with a `$`.

```
{ $unwind: '$tags' }
{ $unwind: { path: '$tags', includeArrayIndex: 'position', preserveNullAndEmptyArrays: true } }
```

| **The field holds**            | **What is emitted**                                                     |
|--------------------------------|---------------------------------------------------------------------------|
| An array                       | One document per element, with the field set to that element.           |
| An empty array, `null`, missing | Nothing, unless `preserveNullAndEmptyArrays` is true.                  |
| Any other value                | The document once, unchanged. A non-array is a single element array.    |

When `preserveNullAndEmptyArrays` is true, a document whose field held an empty array is
  emitted with the field ***removed***, and a document whose field held `null` is emitted with
  the `null` left in place.

When `includeArrayIndex` is given, that field is set to the element's index, or to `null` for a
  document which was not unwound from an array.


<a id="$group"></a>$group
---------------------------------------------------------------------

Partitions the documents into groups and emits one document per group.

The `_id` expression computes the group key and is required.
A group key which evaluates to a missing value is treated as `null`, so the documents which lack
  the field are grouped together.
Use `_id: null` to gather every document into a single group.

Every other field names an accumulator which reduces the group's documents to a single value.
An accumulator whose value is missing omits its field from the group's output document.

Two values group together only when they are of the same type, so the number `5` and the string
  `'5'` produce two groups, as they do in MongoDB.

***Group order.***
Groups are emitted in the order in which they were first seen.
MongoDB does not guarantee an order here, so a pipeline which needs a specific one should end
  with a `$sort`. `jsongin`'s order is deterministic on purpose: it makes a pipeline result
  testable, and it makes replay deterministic.

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', score: { $sum: '$points' }, members: { $push: '$name' } } },
] );
```


<a id="$sort"></a>$sort
---------------------------------------------------------------------

Sorts the documents by one or more fields.
This is [`Sort( Documents, SortCriteria )`](./Sort.md) applied to a copy of the array, so the
  input array's ordering is left untouched.

Sorting follows MongoDB's rules: a document which is missing the sort field sorts as though the
  field held `null`, and values of different types are ordered by the BSON type order.

A sort field which holds an array is reduced to a single sort key first, taking the smallest of
  its elements when ascending and the largest when descending.
A sort path which crosses an array gathers a candidate from every element it crosses, so such a
  path can reduce through more than one array level.
[`Sort( Documents, SortCriteria )`](./Sort.md) carries the full rule, including empty arrays.

`jsongin` is ***more*** deterministic than MongoDB on ties, because Javascript's array sort is
  required to be stable while MongoDB's sort is not.


<a id="$limit"></a><a id="$skip"></a>$limit and $skip
---------------------------------------------------------------------

`$limit` passes the first `count` documents along, and `$skip` discards them.
Both require a non-negative integer.



<a id="$count"></a>$count
---------------------------------------------------------------------

**Usage** : `{ $count: 'field_name' }`

Replaces the whole stream with a single document holding the number of documents which reached
  this stage. The field name is given as a string and cannot be empty.

An ***empty*** stream produces no document at all, rather than one holding a zero.

This is the `$count` ***stage***. There is also a `$count`
  [accumulator](./Accumulator-Operators.md#$count), which takes `{}` and counts within a
  `$group`. Both are supported and they are not the same operator.

### Example
```js
jsongin.Aggregate( players, [ { $count: 'total' } ] );
// returns [ { total: 3 } ]

// Counting what survived an earlier stage is the common use.
jsongin.Aggregate( players, [ { $match: { alive: true } }, { $count: 'living' } ] );
// returns [ { living: 2 } ]

// An empty stream produces no document.
jsongin.Aggregate( players, [ { $match: { alive: 'nope' } }, { $count: 'n' } ] );
// returns []

jsongin.Aggregate( players, [ { $count: '' } ] );   // throws, the field name cannot be empty
jsongin.Aggregate( players, [ { $count: 5 } ] );    // throws, $count takes a string
```
