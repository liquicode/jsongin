# @liquicode/jsongin


# Accumulator Operators

An accumulator reduces the documents of one group to a single value.
Accumulators are only meaningful inside the [`$group`](./Stage-Operators.md#$group) stage, and
  cannot be used with [`Evaluate()`](./Evaluate.md) or `$expr`.

Each accumulator takes an expression, evaluated against every document in the group.
See [`Aggregate()`](./Aggregate.md) for the pipeline rules and
  [Stage Operators](./Stage-Operators.md) for the stages themselves.

| **Accumulator**             | **Behavior**                                                                     |
|-----------------------------|----------------------------------------------------------------------------------|
| [`$sum`](#$sum)             | Sums the numeric values. Non-numeric values are ignored. `0` when nothing is numeric. |
| [`$avg`](#$avg)             | Averages the numeric values, ignoring non-numeric ones. `null` when nothing is numeric. |
| [`$min`](#$min)             | The smallest value, ignoring null and missing. `null` when there is no value.    |
| [`$max`](#$max)             | The largest value, ignoring null and missing. `null` when there is no value.     |
| [`$count`](#$count)         | The number of documents in the group. Takes `{}` as its argument.                |
| [`$push`](#$push)           | Every value, in group order, keeping nulls and duplicates.                       |
| [`$addToSet`](#$addToSet)   | Every ***distinct*** value, compared by content. Order is not specified.         |
| [`$first`](#$first)         | The value from the first document in the group.                                  |
| [`$last`](#$last)           | The value from the last document in the group.                                   |
| [`$stdDevPop`](#$stdDevPop) | Standard deviation over the count. `0` for one value.                            |
| [`$stdDevSamp`](#$stdDevSamp) | Standard deviation over one less than the count. `null` for one value.         |
| [`$mergeObjects`](#$mergeObjects) | Every document merged into one, later winning a shared field.              |
| [`$firstN`](#$firstN)       | The first `n` values, in group order, keeping a missing one as null.             |
| [`$lastN`](#$lastN)         | The last `n` values, still in group order.                                       |
| [`$minN`](#$minN)           | The `n` smallest values, ascending, ignoring null and missing.                   |
| [`$maxN`](#$maxN)           | The `n` largest values, ***descending***, ignoring null and missing.             |
| [`$top`](#$top)             | The `output` of the first document by the accumulator's own `sortBy`.            |
| [`$bottom`](#$bottom)       | The `output` of the last document by that same order.                            |
| [`$topN`](#$topN)           | The `output` of the first `n` documents by `sortBy`.                             |
| [`$bottomN`](#$bottomN)     | The `output` of the last `n` documents, in `sortBy` order.                       |

***`$sum` and `$avg` ignore what the expression operators throw on, and this is deliberate.***
The expression operator `$add` throws when an operand is not numeric, because an expression is
  authored against a single document and a type error there is an authoring mistake worth
  surfacing.
The accumulator `$sum` runs across a whole group, where one malformed document should not abort
  the report. Both behaviors are what MongoDB does.

`$min` and `$max` order values with [`CompareValues()`](./CompareValues.md), which follows
  MongoDB's BSON type order, so a group holding values of several types still has a well defined
  smallest and largest.

These documents are used by the examples below:

```js
let players = [
	{ team: 'red', name: 'Alice', points: 7, alive: true },
	{ team: 'red', name: 'Bob', points: 3, alive: true },
	{ team: 'blue', name: 'Carol', points: 9, alive: false },
];
```


<a id="$sum"></a>$sum
---------------------------------------------------------------------

**Usage** : `{ field: { $sum: expression } }`

Sums the numeric values produced by the expression.
Non-numeric values, `null`, and missing fields are ignored rather than throwing, and a group with
  nothing numeric in it sums to `0`.

`$sum: 1` counts the documents in a group, the same way [`$count`](#$count) does, because the
  literal `1` is contributed once per document.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', score: { $sum: '$points' } } } ] );
// returns [ { _id: 'red', score: 10 }, { _id: 'blue', score: 9 } ]

// Non-numeric values are skipped rather than refused.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $sum: '$n' } } } ] );
// returns [ { _id: null, v: 5 } ]

// $sum: 1 counts the documents.
jsongin.Aggregate( players, [ { $group: { _id: '$team', n: { $sum: 1 } } } ] );
// returns [ { _id: 'red', n: 2 }, { _id: 'blue', n: 1 } ]
```


<a id="$avg"></a>$avg
---------------------------------------------------------------------

**Usage** : `{ field: { $avg: expression } }`

Averages the numeric values produced by the expression, ignoring everything which is not a
  number. A group with nothing numeric in it averages to `null` rather than to `0`, because there
  is no average of nothing.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: null, avg: { $avg: '$points' } } } ] );
// returns [ { _id: null, avg: 6.333333333333333 } ]

// Only the numeric values take part.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $avg: '$n' } } } ] );
// returns [ { _id: null, v: 5 } ]

// Nothing numeric gives null.
jsongin.Aggregate( [ { n: 'x' } ], [ { $group: { _id: null, v: { $avg: '$n' } } } ] );
// returns [ { _id: null, v: null } ]
```


<a id="$min"></a>$min
---------------------------------------------------------------------

**Usage** : `{ field: { $min: expression } }`

The smallest value in the group, ordered by [`CompareValues()`](./CompareValues.md).
`null` and missing values are ignored, and a group with no value at all gives `null`.

Unlike the expression operators, this is not a numeric comparison: strings, dates, and booleans
  all order against each other by the BSON type order.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', low: { $min: '$points' } } } ] );
// returns [ { _id: 'red', low: 3 }, { _id: 'blue', low: 9 } ]

// null and missing are skipped.
jsongin.Aggregate( [ { n: 5 }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $min: '$n' } } } ] );
// returns [ { _id: null, v: 5 } ]
```


<a id="$max"></a>$max
---------------------------------------------------------------------

**Usage** : `{ field: { $max: expression } }`

The largest value in the group, ordered by [`CompareValues()`](./CompareValues.md).
It is the mirror of [`$min`](#$min) in every respect.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', high: { $max: '$points' } } } ] );
// returns [ { _id: 'red', high: 7 }, { _id: 'blue', high: 9 } ]
```


<a id="$count"></a>$count
---------------------------------------------------------------------

**Usage** : `{ field: { $count: {} } }`

The number of documents in the group.
It takes an empty document as its argument, because it looks at no field.

This is the `$count` ***accumulator***. There is also a `$count`
  [stage](./Stage-Operators.md#$count), which takes a field name and replaces the whole stream
  with one document. Both are supported and they are not the same operator.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', n: { $count: {} } } } ] );
// returns [ { _id: 'red', n: 2 }, { _id: 'blue', n: 1 } ]
```


<a id="$push"></a>$push
---------------------------------------------------------------------

**Usage** : `{ field: { $push: expression } }`

Collects every value into an array, in the order the documents appear in the group.
Duplicates are kept, and so is an explicit `null`. A field which is not there contributes
  nothing.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $push: '$name' } } } ] );
// returns [ { _id: 'red', who: [ 'Alice', 'Bob' ] }, { _id: 'blue', who: [ 'Carol' ] } ]

// A null is a value; a missing field is not.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $push: '$n' } } } ] );
// returns [ { _id: null, v: [ 5, 'x', null ] } ]
```


<a id="$addToSet"></a>$addToSet
---------------------------------------------------------------------

**Usage** : `{ field: { $addToSet: expression } }`

Collects the ***distinct*** values into an array.
Values are compared by content rather than by reference, so an array, a document, or a date is
  recognized as one it already holds rather than added again.

***The order of the result is not specified.***

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $addToSet: '$name' } } } ] );
// returns [ { _id: 'red', who: [ 'Alice', 'Bob' ] }, { _id: 'blue', who: [ 'Carol' ] } ]

// Duplicates collapse.
jsongin.Aggregate( [ { a: 1 }, { a: 1 }, { a: 2 } ],
	[ { $group: { _id: null, s: { $addToSet: '$a' } } } ] );
// returns [ { _id: null, s: [ 1, 2 ] } ]

// Comparison is by content, so two equal documents are one value.
jsongin.Aggregate( [ { a: { x: 1 } }, { a: { x: 1 } } ],
	[ { $group: { _id: null, s: { $addToSet: '$a' } } } ] );
// returns [ { _id: null, s: [ { x: 1 } ] } ]
```


<a id="$first"></a>$first
---------------------------------------------------------------------

**Usage** : `{ field: { $first: expression } }`

The value from the first document in the group.
Which document is first depends on the order the documents reached `$group`, so pair it with a
  [`$sort`](./Stage-Operators.md#$sort) when the order matters.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', first: { $first: '$name' } } } ] );
// returns [ { _id: 'red', first: 'Alice' }, { _id: 'blue', first: 'Carol' } ]
```


<a id="$last"></a>$last
---------------------------------------------------------------------

**Usage** : `{ field: { $last: expression } }`

The value from the last document in the group, and the mirror of [`$first`](#$first).

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', last: { $last: '$name' } } } ] );
// returns [ { _id: 'red', last: 'Bob' }, { _id: 'blue', last: 'Carol' } ]
```


<a id="$stdDevPop"></a>$stdDevPop
---------------------------------------------------------------------

**Usage** : `{ field: { $stdDevPop: expression } }`

The population standard deviation of the numeric values: the squared deviations divided by the
  ***count***.
Non-numeric values are ignored, the same rule [`$sum`](#$sum) and [`$avg`](#$avg) follow, and a
  group with nothing numeric in it answers `null`.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', spread: { $stdDevPop: '$points' } } } ] );
// returns [ { _id: 'red', spread: 2 }, { _id: 'blue', spread: 0 } ]
```


<a id="$stdDevSamp"></a>$stdDevSamp
---------------------------------------------------------------------

**Usage** : `{ field: { $stdDevSamp: expression } }`

The sample standard deviation: the squared deviations divided by ***one less than the count***.

***A single value answers `null`*** where [`$stdDevPop`](#$stdDevPop) answers `0`. That follows
  from the divisor: a population of one has no spread, and a sample of one cannot say what the
  spread is.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', spread: { $stdDevSamp: '$points' } } } ] );
// returns [ { _id: 'red', spread: Math.sqrt( 8 ) }, { _id: 'blue', spread: null } ]
```


<a id="$mergeObjects"></a>$mergeObjects
---------------------------------------------------------------------

**Usage** : `{ field: { $mergeObjects: expression } }`

Merges every document in the group into one, where a later document wins a field the two share.
"Later" is the order the group arrived in, so pair it with a
  [`$sort`](./Stage-Operators.md#$sort) when it matters.

A null or missing value is ignored rather than making the result null; any other non-document
  value throws.

***There is also an expression operator called `$mergeObjects`***, which merges the documents
  given to it within a single document. See
  [Expression Operators](./Expression-Operators.md#$mergeObjects).

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $mergeObjects: { name: '$name', points: '$points' } } } } ] );
// returns [ { _id: 'red', who: { name: 'Bob', points: 3 } }, { _id: 'blue', who: { name: 'Carol', points: 9 } } ]
```


<a id="$firstN"></a>$firstN
---------------------------------------------------------------------

**Usage** : `{ field: { $firstN: { input: expression, n: count } } }`

The first `n` values of the group, in the order it arrived in.

***This is positional and not comparative***, so it depends on a `$sort` earlier in the
  pipeline, and ***a missing value is reported as a null*** rather than left out.
  [`$minN`](#$minN) does the opposite on both counts.

A group with fewer than `n` values answers all of them.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', names: { $firstN: { input: '$name', n: 2 } } } } ] );
// returns [ { _id: 'red', names: [ 'Alice', 'Bob' ] }, { _id: 'blue', names: [ 'Carol' ] } ]
```


<a id="$lastN"></a>$lastN
---------------------------------------------------------------------

**Usage** : `{ field: { $lastN: { input: expression, n: count } } }`

The last `n` values of the group, ***still in group order***, so the very last value is last in
  the result rather than first.

Positional in the same way [`$firstN`](#$firstN) is, and with the same treatment of a missing
  value.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', names: { $lastN: { input: '$name', n: 1 } } } } ] );
// returns [ { _id: 'red', names: [ 'Bob' ] }, { _id: 'blue', names: [ 'Carol' ] } ]
```


<a id="$minN"></a>$minN
---------------------------------------------------------------------

**Usage** : `{ field: { $minN: { input: expression, n: count } } }`

The `n` smallest values of the group, in ascending order.

***This is comparative and not positional***, so the order the group arrived in does not matter
  and ***a null or missing value is left out*** rather than reported — there is nothing to
  compare it with. Values are ordered by [`CompareValues()`](./CompareValues.md), the same way
  [`$min`](#$min) orders them.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', low: { $minN: { input: '$points', n: 2 } } } } ] );
// returns [ { _id: 'red', low: [ 3, 7 ] }, { _id: 'blue', low: [ 9 ] } ]
```


<a id="$maxN"></a>$maxN
---------------------------------------------------------------------

**Usage** : `{ field: { $maxN: { input: expression, n: count } } }`

The `n` largest values of the group, in ***descending*** order.

***The largest comes first***, which makes this the mirror of [`$minN`](#$minN) rather than a
  sorted list of the same values: the first element of either result is the most extreme one.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', high: { $maxN: { input: '$points', n: 2 } } } } ] );
// returns [ { _id: 'red', high: [ 7, 3 ] }, { _id: 'blue', high: [ 9 ] } ]
```


<a id="$top"></a>$top
---------------------------------------------------------------------

**Usage** : `{ field: { $top: { sortBy: specification, output: expression } } }`

Sorts the group by `sortBy` and returns the `output` expression of the first document.

***This carries its own sort***, so unlike [`$first`](#$first) it does not depend on a `$sort`
  earlier in the pipeline, and unlike [`$max`](#$max) it can ***sort by one field and answer
  with another***. That is the whole reason it exists.

`sortBy` names fields and gives each a direction of `1` or `-1`. An empty `sortBy` is accepted
  and sorts nothing, in which case which document answers is not specified.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $top: { sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', best: 'Alice' }, { _id: 'blue', best: 'Carol' } ]

// output is any expression, so it may gather several fields.
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $top: { sortBy: { points: -1 }, output: [ '$name', '$points' ] } } } } ] );
// returns [ { _id: 'red', best: [ 'Alice', 7 ] }, { _id: 'blue', best: [ 'Carol', 9 ] } ]
```


<a id="$bottom"></a>$bottom
---------------------------------------------------------------------

**Usage** : `{ field: { $bottom: { sortBy: specification, output: expression } } }`

Sorts the group by `sortBy` and returns the `output` expression of the ***last*** document.

***The sort is not reversed*** — this reads the far end of the same order [`$top`](#$top) reads
  the near end of, so the two with the same `sortBy` answer opposite documents.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', worst: { $bottom: { sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', worst: 'Bob' }, { _id: 'blue', worst: 'Carol' } ]
```


<a id="$topN"></a>$topN
---------------------------------------------------------------------

**Usage** : `{ field: { $topN: { n: count, sortBy: specification, output: expression } } }`

Sorts the group by `sortBy` and returns the `output` expression of the first `n` documents, in
  that sort order.
A group with fewer than `n` documents answers all of them.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $topN: { n: 2, sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', best: [ 'Alice', 'Bob' ] }, { _id: 'blue', best: [ 'Carol' ] } ]
```


<a id="$bottomN"></a>$bottomN
---------------------------------------------------------------------

**Usage** : `{ field: { $bottomN: { n: count, sortBy: specification, output: expression } } }`

Sorts the group by `sortBy` and returns the `output` expression of the last `n` documents,
  ***in that sort order*** rather than reversed.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', worst: { $bottomN: { n: 1, sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', worst: [ 'Bob' ] }, { _id: 'blue', worst: [ 'Carol' ] } ]
```


## See Also

- [`$group`](./Stage-Operators.md#$group), the stage these are used within.
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md), which runs the pipeline.
- [Expression Operators](./Expression-Operators.md), for the values an accumulator reduces.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md), which `$min` and `$max` order by.
- [Operator Reference](../Operator-Reference.md), for which MongoDB operators are implemented.
