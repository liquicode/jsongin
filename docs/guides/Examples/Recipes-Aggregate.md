# @liquicode/jsongin


# Recipes: Aggregate

Task-oriented aggregation pipelines for [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md).
Each recipe is self-contained. A pipeline is an array of stages that runs top to
bottom, and `$group` output should be sorted before you rely on its order.

The recipes use this collection:

```js
let players = [
	{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true, tags: [ 'melee', 'tank' ] },
	{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true, tags: [ 'ranged' ] },
	{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false, tags: [ 'ranged', 'tank' ] },
	{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true, tags: [] },
];
```


### Count the documents

The `$count` stage writes the running count to a field of your choice:

```js
jsongin.Aggregate( players, [ { $count: 'total' } ] )
// returns [ { total: 4 } ]
```

Count the documents left after a `$match`:

```js
jsongin.Aggregate( players, [ { $match: { alive: true } }, { $count: 'living' } ] )
// returns [ { living: 3 } ]
```


### Group and sum by category

`$group` with `_id: '$team'` folds by team, and `$sum: '$points'` adds up the
field. Sort by the computed total, descending:

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
	{ $sort: { score: -1 } },
] )
// returns [ { _id: 'blue', score: 10, top: 9 }, { _id: 'red', score: 8, top: 5 } ]
```


### Average per group

`$avg` gives the mean of a field across the group:

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', avg: { $avg: '$points' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', avg: 5 }, { _id: 'red', avg: 4 } ]
```


### Unwind an array, then count

`$unwind: '$tags'` produces one document per tag; `$sum: 1` counts them:

```js
jsongin.Aggregate( players, [
	{ $unwind: '$tags' },
	{ $group: { _id: '$tags', count: { $sum: 1 } } },
	{ $sort: { count: -1, _id: 1 } },
] )
// returns [ { _id: 'ranged', count: 2 }, { _id: 'tank', count: 2 }, { _id: 'melee', count: 1 } ]
```


### Build a top-N leaderboard

`$addFields` computes a value, `$sort` and `$limit` keep the top N, and
`$project` shapes the output:

```js
jsongin.Aggregate( players, [
	{ $addFields: { bonus: { $multiply: [ '$points', 2 ] } } },
	{ $sort: { bonus: -1 } },
	{ $limit: 2 },
	{ $project: { _id: 0, name: 1, bonus: 1 } },
] )
// returns [ { name: 'Eve', bonus: 18 }, { name: 'Bob', bonus: 10 } ]
```


### Summarize everything in one group

A `$group` with `_id: null` folds every document into a single group:

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


### Collect the members of each group

`$push` gathers a value from every document in the group into an array. Sort the
input first so each list is alphabetical:

```js
jsongin.Aggregate( players, [
	{ $sort: { name: 1 } },
	{ $group: { _id: '$team', members: { $push: '$name' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', members: [ 'Eve', 'Mallory' ] }, { _id: 'red', members: [ 'Alice', 'Bob' ] } ]
```


### Page through the documents

`$skip` and `$limit` select a page; `$project` keeps the output small:

```js
jsongin.Aggregate( players, [
	{ $sort: { _id: 1 } },
	{ $skip: 1 },
	{ $limit: 2 },
	{ $project: { _id: 1, name: 1 } },
] )
// returns [ { _id: 2, name: 'Bob' }, { _id: 3, name: 'Eve' } ]
```


### Compute a field, then filter on it

`$addFields` adds a computed field; a later `$match` can filter on it. Find
players whose doubled score is at least 10:

```js
jsongin.Aggregate( players, [
	{ $addFields: { doubled: { $multiply: [ '$points', 2 ] } } },
	{ $match: { doubled: { $gte: 10 } } },
	{ $project: { _id: 0, name: 1, doubled: 1 } },
] )
// returns [ { name: 'Bob', doubled: 10 }, { name: 'Eve', doubled: 18 } ]
```


### Keep the first and last of each group

`$first` and `$last` take the value from the first and last document a group
receives, so sort first to make them meaningful. The lowest- and highest-scoring
name on each team:

```js
jsongin.Aggregate( players, [
	{ $sort: { points: 1 } },
	{ $group: { _id: '$team', low: { $first: '$name' }, high: { $last: '$name' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', low: 'Mallory', high: 'Eve' }, { _id: 'red', low: 'Alice', high: 'Bob' } ]
```


### Keep the min and max of each group

`$min` and `$max` are accumulators that track the extreme values:

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', low: { $min: '$points' }, high: { $max: '$points' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', low: 1, high: 9 }, { _id: 'red', low: 3, high: 5 } ]
```


### Collect the distinct values of each group

`$addToSet` gathers the distinct values into an array. Unwind the tags first, then
collect one set per team:

```js
jsongin.Aggregate( players, [
	{ $unwind: '$tags' },
	{ $group: { _id: '$team', tags: { $addToSet: '$tags' } } },
	{ $sort: { _id: 1 } },
] )
// returns [ { _id: 'blue', tags: [ 'ranged', 'tank' ] }, { _id: 'red', tags: [ 'melee', 'tank', 'ranged' ] } ]
```


### Drop fields with `$project` in a pipeline

`$project` in a pipeline works the same way as
[`Project()`](../jsongin/Project.md): set a field to `0` to drop it:

```js
jsongin.Aggregate( players, [
	{ $project: { tags: 0, alive: 0 } },
	{ $limit: 1 },
] )
// returns [ { _id: 1, name: 'Alice', team: 'red', points: 3 } ]
```


### Sort by more than one field

A `$sort` with several keys breaks ties in order. Sort by `team` ascending, then
by `points` descending within each team:

```js
jsongin.Aggregate( players, [
	{ $sort: { team: 1, points: -1 } },
	{ $project: { _id: 0, team: 1, points: 1 } },
] )
// returns [ { team: 'blue', points: 9 }, { team: 'blue', points: 1 }, { team: 'red', points: 5 }, { team: 'red', points: 3 } ]
```


### Filter with `$expr` in `$match`

`$match` accepts `$expr`, so a pipeline can filter on a comparison between fields
or against a computed value. Find players with more than four points:

```js
jsongin.Aggregate( players, [
	{ $match: { $expr: { $gt: [ '$points', 4 ] } } },
	{ $project: { _id: 0, name: 1, points: 1 } },
] )
// returns [ { name: 'Bob', points: 5 }, { name: 'Eve', points: 9 } ]
```


## See Also

- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md)
- [Stage Operators](../jsongin/Stage-Operators.md)
- [Accumulator Operators](../jsongin/Accumulator-Operators.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [First Aggregation Pipeline](./First-Aggregation-Pipeline.md)