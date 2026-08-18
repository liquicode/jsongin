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


## See Also

- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md)
- [Stage Operators](../jsongin/Stage-Operators.md)
- [Accumulator Operators](../jsongin/Accumulator-Operators.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [First Aggregation Pipeline](./First-Aggregation-Pipeline.md)