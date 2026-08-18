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

These documents are used by the examples on this page:

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


## Operator Summary

***Stages*** — see [Stage Operators](./Stage-Operators.md) for the detail and examples.

| **Stage**                                          | **Usage**                                                            |
|----------------------------------------------------|----------------------------------------------------------------------|
| [`$match`](./Stage-Operators.md#$match)            | `{ $match: query }`                                                  |
| [`$project`](./Stage-Operators.md#$project)        | `{ $project: { field: 1 \| 0, field: expression, ... } }`            |
| [`$addFields`](./Stage-Operators.md#$addFields)    | `{ $addFields: { field: expression, ... } }`                         |
| [`$set`](./Stage-Operators.md#$set)                | `{ $set: { field: expression, ... } }`                               |
| [`$unwind`](./Stage-Operators.md#$unwind)          | `{ $unwind: '$path' }`                                               |
| [`$group`](./Stage-Operators.md#$group)            | `{ $group: { _id: expression, field: { accumulator: expression } } }` |
| [`$sort`](./Stage-Operators.md#$sort)              | `{ $sort: { field: 1 \| -1, ... } }`                                 |
| [`$limit`](./Stage-Operators.md#$limit)            | `{ $limit: count }`                                                  |
| [`$skip`](./Stage-Operators.md#$skip)              | `{ $skip: count }`                                                   |
| [`$count`](./Stage-Operators.md#$count)            | `{ $count: 'field_name' }`                                           |

***Accumulators*** — only meaningful inside `$group`.
See [Accumulator Operators](./Accumulator-Operators.md) for the detail and examples.

| [`$sum`](./Accumulator-Operators.md#$sum) | [`$avg`](./Accumulator-Operators.md#$avg) | [`$min`](./Accumulator-Operators.md#$min) | [`$max`](./Accumulator-Operators.md#$max) | [`$count`](./Accumulator-Operators.md#$count) |
|:---:|:---:|:---:|:---:|:---:|
| [`$push`](./Accumulator-Operators.md#$push) | [`$addToSet`](./Accumulator-Operators.md#$addToSet) | [`$first`](./Accumulator-Operators.md#$first) | [`$last`](./Accumulator-Operators.md#$last) | |

Expressions inside a stage are evaluated by [`Evaluate()`](./Evaluate.md); see
  [Expression Operators](./Expression-Operators.md).


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

The stages `$bucket`, `$facet`, `$sortByCount`, `$replaceRoot`, `$sample`, `$unset`, `$out`,
  `$merge`, and `$setWindowFields` are not implemented.
Neither are the accumulators `$stdDevPop`, `$stdDevSamp`, `$mergeObjects`, `$top`, `$bottom`,
  `$percentile`, and the `N` variants.

See the [Operator Reference](../Operator-Reference.md) for the full list.


## See Also

- [`Evaluate( Document, Expression )`](./Evaluate.md), the expression engine every computing stage uses.
- [`Query( Document, Criteria )`](./Query.md) and [`Filter( Documents, QueryCriteria )`](./Filter.md), which `$match` uses.
- [`Project( Document, Projection )`](./Project.md), which `$project` uses.
- [`Sort( Documents, SortCriteria )`](./Sort.md), which `$sort` uses.
- [`SafeClone( Document )`](./SafeClone.md), which the document-producing stages clone with.
- [Operator Reference](../Operator-Reference.md)


## Examples

Given the documents declared above:

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
