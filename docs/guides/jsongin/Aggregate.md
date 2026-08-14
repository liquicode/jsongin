# @liquicode/jsongin


# Aggregate( Documents, Pipeline )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                        |
|---------------|:-----------------:|----------------------------------------------------------|
| Documents     |       array       | The array of documents to aggregate.                   |
| Pipeline      |       array       | The array of aggregation stages to run them through.   |


## Description

Runs an array of documents through a MongoDB aggregation `Pipeline` and returns the resulting
  array of documents.

A pipeline is an array of ***stages***.
Each stage is an object with exactly one field, whose name is a stage operator and whose value
  is that operator's argument.
Each stage receives the array of documents produced by the stage before it, so a pipeline reads
  top to bottom.

```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] );
```

Wherever a stage computes a value, it uses the same expression language that
  [`Evaluate( Document, Expression )`](./Evaluate.md) implements.
Wherever a stage matches documents, it uses the same query language that
  [`Query( Document, Criteria )`](./Query.md) implements.


## Aggregate Never Modifies Its Input

`Documents`, and the documents within it, are treated as read-only.

- ***Pass-through stages*** — `$match`, `$sort`, `$limit`, and `$skip` — select and reorder
  documents. They return the caller's own document objects and clone nothing, which is what
  [`Filter()`](./Filter.md) already does.
- ***Document-producing stages*** — `$project`, `$addFields`, `$set`, `$unwind`, and `$group` —
  clone every document they emit, with [`SafeClone()`](./SafeClone.md), before writing into it.

So a pipeline made only of pass-through stages hands back the original documents, and the moment
  a stage changes anything it is working on a copy.
Cloning on write rather than cloning the input up front matters: a `$match` which selects ten
  documents out of a hundred thousand does not clone a hundred thousand documents first.

Dates survive a pipeline as dates, because `SafeClone` clones a `Date` by value.


## Stages

| **Stage**    | **Usage**                                                        |
|--------------|--------------------------------------------------------------------|
| `$match`     | `{ $match: query }`                                              |
| `$project`   | `{ $project: { field: 1 \| 0, field: expression, ... } }`        |
| `$addFields` | `{ $addFields: { field: expression, ... } }`                     |
| `$set`       | `{ $set: { field: expression, ... } }`                           |
| `$unwind`    | `{ $unwind: '$path' }`                                           |
| `$group`     | `{ $group: { _id: expression, field: { accumulator: expression } } }` |
| `$sort`      | `{ $sort: { field: 1 \| -1, ... } }`                             |
| `$limit`     | `{ $limit: count }`                                              |
| `$skip`      | `{ $skip: count }`                                               |


### $match

Selects the documents which match the given query and discards the rest.
Every query operator works here, including `$expr` and `$exprx`.

```js
jsongin.Aggregate( players, [ { $match: { alive: true, points: { $gte: 3 } } } ] );
jsongin.Aggregate( players, [ { $match: { $expr: { $gt: [ '$dmg', '$armor' ] } } } ] );
```


### $project

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


### $addFields and $set

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


### $unwind

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


### $group

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


### $sort

Sorts the documents by one or more fields.
This is [`Sort( Documents, SortCriteria )`](./Sort.md) applied to a copy of the array, so the
  input array's ordering is left untouched.

Sorting follows MongoDB's rules: a document which is missing the sort field sorts as though the
  field held `null`, values of different types are ordered by the BSON type order, and a field
  holding an array is reduced to its smallest element when ascending and its largest element
  when descending.

`jsongin` is ***more*** deterministic than MongoDB on ties, because Javascript's array sort is
  required to be stable while MongoDB's sort is not.


### $limit and $skip

`$limit` passes the first `count` documents along, and `$skip` discards them.
Both require a non-negative integer.


## Accumulators

An accumulator reduces the documents of one group to a single value.
It is only meaningful inside `$group` and cannot be used with `Evaluate` or `$expr`.

| **Accumulator** | **Behavior**                                                                    |
|-----------------|-----------------------------------------------------------------------------------|
| `$sum`          | Sums the numeric values. Non-numeric values are ignored. Returns `0` when nothing is numeric. |
| `$avg`          | Averages the numeric values, ignoring non-numeric ones. Returns `null` when nothing is numeric. |
| `$min`          | The smallest value, ignoring null and missing. `null` when there is no value.   |
| `$max`          | The largest value, ignoring null and missing. `null` when there is no value.    |
| `$count`        | The number of documents in the group. Takes `{}` as its argument.               |
| `$push`         | Every value, in group order, keeping nulls and duplicates.                      |
| `$first`        | The value from the first document in the group.                                 |
| `$last`         | The value from the last document in the group.                                  |

`$sum: 1` counts the documents in a group, the same way `$count: {}` does.

***`$sum` and `$avg` ignore what the expression operators throw on, and this is deliberate.***
The expression operator `$add` throws when an operand is not numeric, because an expression is
  authored against a single document and a type error there is an authoring mistake worth
  surfacing.
The accumulator `$sum` runs across a whole group, where one malformed document should not abort
  the report. Both behaviors are what MongoDB does.

`$min` and `$max` order values with `CompareValues()`, which follows MongoDB's BSON type order,
  so a group holding values of several types still has a well defined smallest and largest.


## Errors

`Aggregate` throws when the pipeline is malformed:

- `Documents` or `Pipeline` is not an array.
- A stage is not an object, or does not have exactly one key. A stage object holding two keys is
  the most common pipeline authoring mistake, so the error quotes the stage's index.
- A stage operator or an accumulator is not recognized.
- A stage's argument is of the wrong type, or a `$group` has no `_id`.

Malformed expressions throw for the same reasons they throw in
  [`Evaluate()`](./Evaluate.md).
Missing and `null` values are not errors anywhere in a pipeline.


## What Is Not Implemented

The stages `$lookup`, `$graphLookup`, and `$unionWith` need a second collection and are out of
  scope for a library which operates on one array of documents at a time.

The stages `$bucket`, `$facet`, `$sortByCount`, `$count`, `$replaceRoot`, `$sample`, `$unset`,
  `$out`, `$merge`, and `$setWindowFields` are not implemented.
Neither are the accumulators `$addToSet`, `$stdDevPop`, `$stdDevSamp`, `$mergeObjects`, `$top`,
  `$bottom`, `$percentile`, and the `N` variants.

See the [Operator Reference](../Operator-Reference.md) for the full list.


## See Also

- [`Evaluate( Document, Expression )`](./Evaluate.md), the expression engine every computing stage uses.
- [`Query( Document, Criteria )`](./Query.md) and [`Filter( Documents, QueryCriteria )`](./Filter.md), which `$match` uses.
- [`Project( Document, Projection )`](./Project.md), which `$project` uses.
- [`Sort( Documents, SortCriteria )`](./Sort.md), which `$sort` uses.
- [`SafeClone( Document )`](./SafeClone.md), which the document-producing stages clone with.
- [Operator Reference](../Operator-Reference.md)


## Examples

Given this array of documents:

```js
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true, tags: [ 'melee', 'tank' ] },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true, tags: [ 'ranged' ] },
	{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false, tags: [ 'ranged', 'tank' ] },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true, tags: [] },
];
```

### It scores the living players by team
```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] );
// returns [ { _id: 'red', score: 8, top: 5 }, { _id: 'blue', score: 1, top: 1 } ]
```

### It builds a leaderboard
```js
jsongin.Aggregate( players, [
	{ $addFields: { bonus: { $multiply: [ '$points', 2 ] } } },
	{ $sort: { bonus: -1 } },
	{ $limit: 2 },
	{ $project: { _id: 0, name: 1, bonus: 1 } },
] );
// returns [ { name: 'Eve', bonus: 18 }, { name: 'Bob', bonus: 10 } ]
```

### It tallies the tags
```js
jsongin.Aggregate( players, [
	{ $unwind: '$tags' },
	{ $group: { _id: '$tags', count: { $sum: 1 } } },
	{ $sort: { count: -1, _id: 1 } },
] );
// returns [ { _id: 'ranged', count: 2 }, { _id: 'tank', count: 2 }, { _id: 'melee', count: 1 } ]
```

### It summarizes everything in a single group
```js
jsongin.Aggregate( players, [
	{
		$group: {
			_id: null,
			count: { $count: {} },
			total: { $sum: '$points' },
			average: { $avg: '$points' },
		}
	},
] );
// returns [ { _id: null, count: 4, total: 18, average: 4.5 } ]
```

### It lists the members of each team
```js
jsongin.Aggregate( players, [
	{ $sort: { name: 1 } },
	{ $group: { _id: '$team', members: { $push: '$name' } } },
	{ $sort: { _id: 1 } },
] );
// returns [ { _id: 'blue', members: [ 'Eve', 'Mallory' ] }, { _id: 'red', members: [ 'Alice', 'Bob' ] } ]
```

### It pages through the documents
```js
jsongin.Aggregate( players, [
	{ $sort: { _id: 1 } },
	{ $skip: 1 },
	{ $limit: 2 },
] );
// returns the documents for Bob and Eve
```
