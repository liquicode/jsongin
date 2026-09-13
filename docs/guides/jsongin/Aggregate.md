# @liquicode/jsongin


# Aggregate( Documents, Pipeline, Scope )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                        |
|---------------|:-----------------:|----------------------------------------------------------|
| Documents     |         a         | The documents to run through the pipeline.             |
| Pipeline      |         a         | The stages to run them through, in order.              |
| Scope         |         o         | Optional. The variables in effect. See [Scope](./Scope.md). |


## Description

Runs an array of documents through a MongoDB aggregation `Pipeline`, and returns the resulting
  array of documents.

A pipeline is an array of ***stages***.
Each stage is an object with exactly one key: the stage operator, such as `$match`, and its
  argument.
Each stage works on the documents the previous stage returned.

The examples on this page use these documents:

```js
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true, tags: [ 'melee', 'tank' ] },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true, tags: [ 'ranged' ] },
	{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false, tags: [ 'ranged', 'tank' ] },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true, tags: [] },
];
```

```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] );
```

A stage which computes values uses the same expressions as [`Evaluate()`](./Evaluate.md).
A stage which matches documents uses the same queries as [`Query()`](./Query.md).

Every stage in one run sees the same `$$NOW`.


## Aggregate Never Changes Its Input

`Documents` and the documents in it are never changed.

- `$match`, `$sort`, `$limit`, `$skip` and `$sample` only select or reorder documents.
  They return ***your own document objects***, not copies, the same as [`Filter()`](./Filter.md).
- Every stage which changes a document, such as `$project`, `$addFields` or `$unwind`, copies it
  first with [`SafeClone()`](./SafeClone.md).

So a pipeline of only `$match`, `$sort`, `$limit`, `$skip` and `$sample` gives back the original
  objects. If you change them, you change your input.

Dates stay dates.


## Stages

[Stage Operators](./Stage-Operators.md) describes each stage, with examples.

| **Stage**                                              | **Usage**                                                            |
|--------------------------------------------------------|----------------------------------------------------------------------|
| [`$match`](./Stage-Operators.md#$match)                | `{ $match: query }`                                                  |
| [`$project`](./Stage-Operators.md#$project)            | `{ $project: { field: 1 \| 0, field: expression, ... } }`            |
| [`$addFields`](./Stage-Operators.md#$addFields)        | `{ $addFields: { field: expression, ... } }`                         |
| [`$set`](./Stage-Operators.md#$set)                    | `{ $set: { field: expression, ... } }`                               |
| [`$unset`](./Stage-Operators.md#$unset)                | `{ $unset: 'field' }` or `{ $unset: [ 'field', ... ] }`              |
| [`$replaceRoot`](./Stage-Operators.md#$replaceRoot)    | `{ $replaceRoot: { newRoot: expression } }`                          |
| [`$replaceWith`](./Stage-Operators.md#$replaceWith)    | `{ $replaceWith: expression }`                                       |
| [`$unwind`](./Stage-Operators.md#$unwind)              | `{ $unwind: '$path' }`                                               |
| [`$group`](./Stage-Operators.md#$group)                | `{ $group: { _id: expression, field: { accumulator: expression } } }` |
| [`$bucket`](./Stage-Operators.md#$bucket)              | `{ $bucket: { groupBy: expression, boundaries: [ ... ] } }`          |
| [`$bucketAuto`](./Stage-Operators.md#$bucketAuto)      | `{ $bucketAuto: { groupBy: expression, buckets: count } }`           |
| [`$sortByCount`](./Stage-Operators.md#$sortByCount)    | `{ $sortByCount: expression }`                                       |
| [`$count`](./Stage-Operators.md#$count)                | `{ $count: 'field_name' }`                                           |
| [`$sort`](./Stage-Operators.md#$sort)                  | `{ $sort: { field: 1 \| -1, ... } }`                                 |
| [`$limit`](./Stage-Operators.md#$limit)                | `{ $limit: count }`                                                  |
| [`$skip`](./Stage-Operators.md#$skip)                  | `{ $skip: count }`                                                   |
| [`$sample`](./Stage-Operators.md#$sample)              | `{ $sample: { size: count } }`                                       |
| [`$facet`](./Stage-Operators.md#$facet)                | `{ $facet: { name: [ stage, ... ], ... } }`                          |
| [`$fill`](./Stage-Operators.md#$fill)                  | `{ $fill: { output: { field: { value: expression } } } }`            |
| [`$densify`](./Stage-Operators.md#$densify)            | `{ $densify: { field: 'field', range: { step: 1, bounds: 'full' } } }` |
| [`$redact`](./Stage-Operators.md#$redact)              | `{ $redact: expression }`                                            |

***Accumulators*** are used inside `$group` and the other grouping stages.
[Accumulator Operators](./Accumulator-Operators.md) describes each one.

| [`$sum`](./Accumulator-Operators.md#$sum) | [`$avg`](./Accumulator-Operators.md#$avg) | [`$min`](./Accumulator-Operators.md#$min) | [`$max`](./Accumulator-Operators.md#$max) | [`$count`](./Accumulator-Operators.md#$count) |
|:---:|:---:|:---:|:---:|:---:|
| [`$push`](./Accumulator-Operators.md#$push) | [`$addToSet`](./Accumulator-Operators.md#$addToSet) | [`$first`](./Accumulator-Operators.md#$first) | [`$last`](./Accumulator-Operators.md#$last) | [`$mergeObjects`](./Accumulator-Operators.md#$mergeObjects) |
| [`$stdDevPop`](./Accumulator-Operators.md#$stdDevPop) | [`$stdDevSamp`](./Accumulator-Operators.md#$stdDevSamp) | [`$top`](./Accumulator-Operators.md#$top) | [`$bottom`](./Accumulator-Operators.md#$bottom) | [`$topN`](./Accumulator-Operators.md#$topN) |
| [`$bottomN`](./Accumulator-Operators.md#$bottomN) | [`$firstN`](./Accumulator-Operators.md#$firstN) | [`$lastN`](./Accumulator-Operators.md#$lastN) | [`$minN`](./Accumulator-Operators.md#$minN) | [`$maxN`](./Accumulator-Operators.md#$maxN) |


## Errors

`Aggregate` throws when:

- `Documents` or `Pipeline` is not an array.
- A stage is not an object, or does not have exactly one key. The error gives the stage's
  position in the pipeline.
- A stage or accumulator is not recognized.
- A stage's argument is the wrong type, or is missing something it needs, such as `$group`'s
  `_id`.

An invalid expression inside a stage throws, as it does in [`Evaluate()`](./Evaluate.md).
Missing and `null` values are not errors.


## What Is Not Implemented

`$lookup`, `$graphLookup` and `$unionWith` read a second collection, and `$out` and `$merge` write
  to one. `Aggregate` works on one array of documents, so it has none of these.

`$documents`, `$geoNear`, `$setWindowFields`, `$collStats`, `$indexStats` and `$vectorSearch` are
  also not implemented, nor are the `$accumulator`, `$median` and `$percentile` accumulators.

See the [Operator Reference](../Operator-Reference.md) for the full list.


## See Also

- [`Evaluate( Document, Expression )`](./Evaluate.md), which evaluates the expressions in a stage.
- [`Query( Document, Criteria )`](./Query.md) and [`Filter( Documents, QueryCriteria )`](./Filter.md), which `$match` uses.
- [`Project( Document, Projection )`](./Project.md), which works like `$project`.
- [`Sort( Documents, SortCriteria )`](./Sort.md), which `$sort` uses.
- [Scope](./Scope.md)
- [Operator Reference](../Operator-Reference.md)


## Examples

These use the `players` documents above.

### Score the living players by team
```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] );
// returns [ { _id: 'red', score: 8, top: 5 }, { _id: 'blue', score: 1, top: 1 } ]
```

### Build a leaderboard
```js
jsongin.Aggregate( players, [
	{ $addFields: { bonus: { $multiply: [ '$points', 2 ] } } },
	{ $sort: { bonus: -1 } },
	{ $limit: 2 },
	{ $project: { _id: 0, name: 1, bonus: 1 } },
] );
// returns [ { name: 'Eve', bonus: 18 }, { name: 'Bob', bonus: 10 } ]
```

### Count the tags
```js
jsongin.Aggregate( players, [
	{ $unwind: '$tags' },
	{ $group: { _id: '$tags', count: { $sum: 1 } } },
	{ $sort: { count: -1, _id: 1 } },
] );
// returns [ { _id: 'ranged', count: 2 }, { _id: 'tank', count: 2 }, { _id: 'melee', count: 1 } ]
```

### Summarize everything in one group
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

### List the members of each team
```js
jsongin.Aggregate( players, [
	{ $sort: { name: 1 } },
	{ $group: { _id: '$team', members: { $push: '$name' } } },
	{ $sort: { _id: 1 } },
] );
// returns [ { _id: 'blue', members: [ 'Eve', 'Mallory' ] }, { _id: 'red', members: [ 'Alice', 'Bob' ] } ]
```

### Page through the documents
```js
jsongin.Aggregate( players, [
	{ $sort: { _id: 1 } },
	{ $skip: 1 },
	{ $limit: 2 },
] );
// returns the documents for Bob and Eve
```
