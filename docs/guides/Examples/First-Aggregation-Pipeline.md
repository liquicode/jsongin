# @liquicode/jsongin


# Examples: First Aggregation Pipeline

[`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md) runs an array of
documents through a MongoDB aggregation pipeline. A pipeline is an array of
***stages***; each stage receives the documents produced by the stage before it,
so a pipeline reads top to bottom.

This page walks one pipeline from a single stage to a finished result, then shows
a few more.

> A pipeline never modifies its input. Pass-through stages like `$match` and
> `$sort` hand back your own document objects; stages that change shape
> (`$group`, `$project`, `$unwind`, ...) clone before they write. See
> [`Aggregate()`](../jsongin/Aggregate.md).


## The Data

```js
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true, tags: [ 'melee', 'tank' ] },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true, tags: [ 'ranged' ] },
	{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false, tags: [ 'ranged', 'tank' ] },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true, tags: [] },
];
```


## Stage 1: `$match` Selects Documents

`$match` uses the same query language as [`Query()`](../jsongin/Query.md). It
keeps the documents that match and drops the rest:

```js
jsongin.Aggregate( players, [ { $match: { alive: true } } ] ).length === 3
```


## Stage 2: `$group` Summarizes per Team

`$group` folds documents into groups. `_id` is the group key — here the `team`
field — and the other fields are
[accumulators](../jsongin/Accumulator-Operators.md). `$sum: '$points'` adds up
the `points` field of every document in the group:

```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' } } },
	{ $sort: { score: -1 } },
] )
// returns [ { _id: 'red', score: 8 }, { _id: 'blue', score: 1 } ]
```

`$sort: { score: -1 }` orders the groups by their computed `score`, descending.
Always sort before you rely on the order of a `$group`'s output.


## The Finished Pipeline

Add a second accumulator — `$max` for the top score in each team — and the
pipeline is the one the [`Aggregate()`](../jsongin/Aggregate.md) page uses:

```js
jsongin.Aggregate( players, [
	{ $match: { alive: true } },
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] )
// returns [ { _id: 'red', score: 8, top: 5 }, { _id: 'blue', score: 1, top: 1 } ]
```


## Average per Team

`$avg` gives the mean. Sort by `_id` for a stable order:

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', avg: { $avg: '$points' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', avg: 5 }, { _id: 'red', avg: 4 } ]
```


## Unwind an Array, Then Count

`$unwind: '$tags'` produces one document per tag. Grouping by the tag and
`$sum: 1` counts how many documents carried each tag:

```js
jsongin.Aggregate( players, [
	{ $unwind: '$tags' },
	{ $group: { _id: '$tags', count: { $sum: 1 } } },
	{ $sort: { count: -1, _id: 1 } },
] )
// returns [ { _id: 'ranged', count: 2 }, { _id: 'tank', count: 2 }, { _id: 'melee', count: 1 } ]
```


## Shape a Leaderboard

`$addFields` adds a computed field, `$limit` keeps the top N, and `$project`
shapes the output. Expressions use the same language as
[`Evaluate()`](../jsongin/Evaluate.md):

```js
jsongin.Aggregate( players, [
	{ $addFields: { bonus: { $multiply: [ '$points', 2 ] } } },
	{ $sort: { bonus: -1 } },
	{ $limit: 2 },
	{ $project: { _id: 0, name: 1, bonus: 1 } },
] )
// returns [ { name: 'Eve', bonus: 18 }, { name: 'Bob', bonus: 10 } ]
```


## Summarize Everything in One Group

A `$group` with `_id: null` folds every document into a single group, which is
how you count a collection or total a field:

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
] )
// returns [ { _id: null, count: 4, total: 18, average: 4.5 } ]
```


## List the Members of Each Team

`$push` collects a value from every document in the group into an array. Sort
the input by name first so each team's list is alphabetical:

```js
jsongin.Aggregate( players, [
	{ $sort: { name: 1 } },
	{ $group: { _id: '$team', members: { $push: '$name' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', members: [ 'Eve', 'Mallory' ] }, { _id: 'red', members: [ 'Alice', 'Bob' ] } ]
```


## Page Through the Documents

`$skip` and `$limit` together select a page. Add a `$project` to keep the output
small:

```js
jsongin.Aggregate( players, [
	{ $sort: { _id: 1 } },
	{ $skip: 1 },
	{ $limit: 2 },
	{ $project: { _id: 1, name: 1 } },
] )
// returns [ { _id: 2, name: 'Bob' }, { _id: 3, name: 'Eve' } ]
```


## Where to Go Next

- [Aggregate Recipes](./Recipes-Aggregate.md) — more task-oriented pipelines.
- [Operators & Mechanics Recipes](./Recipes-Operators-Mechanics.md) — authoring
  your own operator and working with document paths.


## See Also

- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md)
- [`Evaluate( Document, Expression )`](../jsongin/Evaluate.md)
- [Stage Operators](../jsongin/Stage-Operators.md)
- [Accumulator Operators](../jsongin/Accumulator-Operators.md)
- [Expression Operators](../jsongin/Expression-Operators.md)