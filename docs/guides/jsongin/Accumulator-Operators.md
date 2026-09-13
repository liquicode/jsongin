# @liquicode/jsongin


# Accumulator Operators

An accumulator combines the documents of one group into a single value.
Accumulators are used in the [`$group`](./Stage-Operators.md#$group) stage, and in the `output` of
  [`$bucket`](./Stage-Operators.md#$bucket) and [`$bucketAuto`](./Stage-Operators.md#$bucketAuto).
They cannot be used in [`Evaluate()`](./Evaluate.md) or `$expr`.

Some names, such as `$min`, `$max`, `$firstN` and `$mergeObjects`, are also
  [expression operators](./Expression-Operators.md). Those work on one document, and are different
  operators from the accumulators here.

Each accumulator takes an expression, which is evaluated for every document in the group.

| **Accumulator**             | **Result**                                                                       |
|-----------------------------|----------------------------------------------------------------------------------|
| [`$sum`](#$sum)             | The total of the numbers. Other values are skipped. `0` if there are no numbers. |
| [`$avg`](#$avg)             | The average of the numbers. Other values are skipped. `null` if there are no numbers. |
| [`$min`](#$min)             | The smallest value, skipping `null` and missing. `null` if there is none.        |
| [`$max`](#$max)             | The largest value, skipping `null` and missing. `null` if there is none.         |
| [`$count`](#$count)         | The number of documents. Written `{ $count: {} }`.                               |
| [`$push`](#$push)           | An array of every value, in order, including duplicates and `null`.             |
| [`$addToSet`](#$addToSet)   | An array of the ***different*** values, in no particular order.                  |
| [`$first`](#$first)         | The value from the first document.                                               |
| [`$last`](#$last)           | The value from the last document.                                                |
| [`$stdDevPop`](#$stdDevPop) | The population standard deviation of the numbers. `0` for one number.            |
| [`$stdDevSamp`](#$stdDevSamp) | The sample standard deviation of the numbers. `null` for one number.           |
| [`$mergeObjects`](#$mergeObjects) | All the objects merged into one. Later documents win.                      |
| [`$firstN`](#$firstN)       | The first `n` values, in order.                                                  |
| [`$lastN`](#$lastN)         | The last `n` values, in order.                                                   |
| [`$minN`](#$minN)           | The `n` smallest values, smallest first.                                         |
| [`$maxN`](#$maxN)           | The `n` largest values, ***largest first***.                                     |
| [`$top`](#$top)             | The `output` of the first document, sorted by `sortBy`.                          |
| [`$bottom`](#$bottom)       | The `output` of the last document, sorted by `sortBy`.                           |
| [`$topN`](#$topN)           | The `output` of the first `n` documents, sorted by `sortBy`.                     |
| [`$bottomN`](#$bottomN)     | The `output` of the last `n` documents, sorted by `sortBy`.                      |

***`$sum`, `$avg` and the standard deviations skip values which are not numbers.***
This is different from expression operators like `$add`, which throw.
One bad document in a group should not stop a whole report. MongoDB behaves the same way.

`$min`, `$max`, `$minN` and `$maxN` compare values of any type, using
  [`CompareValues()`](./CompareValues.md).

Most examples below use these documents:

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

Adds up the numbers the expression gives.
Other values, `null` and missing fields are skipped. With no numbers, the result is `0`.

`{ $sum: 1 }` adds `1` for each document, so it counts them.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', score: { $sum: '$points' } } } ] );
// returns [ { _id: 'red', score: 10 }, { _id: 'blue', score: 9 } ]

// Only the numbers are added.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $sum: '$n' } } } ] );
// returns [ { _id: null, v: 5 } ]

// Count the documents.
jsongin.Aggregate( players, [ { $group: { _id: '$team', n: { $sum: 1 } } } ] );
// returns [ { _id: 'red', n: 2 }, { _id: 'blue', n: 1 } ]
```


<a id="$avg"></a>$avg
---------------------------------------------------------------------

**Usage** : `{ field: { $avg: expression } }`

Averages the numbers the expression gives. Other values are skipped.
With no numbers, the result is `null`.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: null, avg: { $avg: '$points' } } } ] );
// returns [ { _id: null, avg: 6.333333333333333 } ]

// Only the numbers count.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $avg: '$n' } } } ] );
// returns [ { _id: null, v: 5 } ]

// No numbers gives null.
jsongin.Aggregate( [ { n: 'x' } ], [ { $group: { _id: null, v: { $avg: '$n' } } } ] );
// returns [ { _id: null, v: null } ]
```


<a id="$min"></a>$min
---------------------------------------------------------------------

**Usage** : `{ field: { $min: expression } }`

The smallest value in the group.
`null` and missing values are skipped. If there is no value, the result is `null`.

Values of any type can be compared, in MongoDB's type order, so a number is smaller than a string.

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

The largest value in the group. It works like [`$min`](#$min) in every other way.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', high: { $max: '$points' } } } ] );
// returns [ { _id: 'red', high: 7 }, { _id: 'blue', high: 9 } ]
```


<a id="$count"></a>$count
---------------------------------------------------------------------

**Usage** : `{ field: { $count: {} } }`

The number of documents in the group. Its argument must be an empty object, `{}`.

This is the `$count` ***accumulator***.
The [`$count` stage](./Stage-Operators.md#$count) is a different operator, which counts all the
  documents in the pipeline.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', n: { $count: {} } } } ] );
// returns [ { _id: 'red', n: 2 }, { _id: 'blue', n: 1 } ]
```


<a id="$push"></a>$push
---------------------------------------------------------------------

**Usage** : `{ field: { $push: expression } }`

An array of every value, in the order of the documents.
Duplicates and `null` are kept. A missing field adds nothing.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $push: '$name' } } } ] );
// returns [ { _id: 'red', who: [ 'Alice', 'Bob' ] }, { _id: 'blue', who: [ 'Carol' ] } ]

// null is kept. The missing field is not.
jsongin.Aggregate( [ { n: 5 }, { n: 'x' }, { n: null }, {} ],
	[ { $group: { _id: null, v: { $push: '$n' } } } ] );
// returns [ { _id: null, v: [ 5, 'x', null ] } ]
```


<a id="$addToSet"></a>$addToSet
---------------------------------------------------------------------

**Usage** : `{ field: { $addToSet: expression } }`

An array of the ***different*** values.
Values are compared by content, so two equal objects count once.
A missing field adds nothing.

***The order of the array is not guaranteed.***

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $addToSet: '$name' } } } ] );
// returns [ { _id: 'red', who: [ 'Alice', 'Bob' ] }, { _id: 'blue', who: [ 'Carol' ] } ]

// Duplicates count once.
jsongin.Aggregate( [ { a: 1 }, { a: 1 }, { a: 2 } ],
	[ { $group: { _id: null, s: { $addToSet: '$a' } } } ] );
// returns [ { _id: null, s: [ 1, 2 ] } ]

// Equal objects count once.
jsongin.Aggregate( [ { a: { x: 1 } }, { a: { x: 1 } } ],
	[ { $group: { _id: null, s: { $addToSet: '$a' } } } ] );
// returns [ { _id: null, s: [ { x: 1 } ] } ]
```


<a id="$first"></a>$first
---------------------------------------------------------------------

**Usage** : `{ field: { $first: expression } }`

The value from the first document in the group, or `null` if that document does not have it.
Which document is first depends on the order they arrive in, so put a
  [`$sort`](./Stage-Operators.md#$sort) before the `$group` when it matters.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', first: { $first: '$name' } } } ] );
// returns [ { _id: 'red', first: 'Alice' }, { _id: 'blue', first: 'Carol' } ]
```


<a id="$last"></a>$last
---------------------------------------------------------------------

**Usage** : `{ field: { $last: expression } }`

The value from the last document in the group. It works like [`$first`](#$first).

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', last: { $last: '$name' } } } ] );
// returns [ { _id: 'red', last: 'Bob' }, { _id: 'blue', last: 'Carol' } ]
```


<a id="$stdDevPop"></a>$stdDevPop
---------------------------------------------------------------------

**Usage** : `{ field: { $stdDevPop: expression } }`

The population standard deviation of the numbers: the average squared distance from the mean,
  divided by the ***count***, square rooted.
Other values are skipped. With no numbers, the result is `null`.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', spread: { $stdDevPop: '$points' } } } ] );
// returns [ { _id: 'red', spread: 2 }, { _id: 'blue', spread: 0 } ]
```


<a id="$stdDevSamp"></a>$stdDevSamp
---------------------------------------------------------------------

**Usage** : `{ field: { $stdDevSamp: expression } }`

The sample standard deviation of the numbers: like [`$stdDevPop`](#$stdDevPop), but divided by
  ***one less than the count***.
So with only one number, the result is `null` rather than `0`.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', spread: { $stdDevSamp: '$points' } } } ] );
// returns [ { _id: 'red', spread: Math.sqrt( 8 ) }, { _id: 'blue', spread: null } ]
```


<a id="$mergeObjects"></a>$mergeObjects
---------------------------------------------------------------------

**Usage** : `{ field: { $mergeObjects: expression } }`

Merges the objects from every document into one.
When two have the same field, the later document wins, so put a `$sort` first if order matters.

`null` and missing values are skipped. Any other value which is not an object throws.

The [`$mergeObjects` expression operator](./Expression-Operators.md#$mergeObjects) merges objects
  within one document.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', who: { $mergeObjects: { name: '$name', points: '$points' } } } } ] );
// returns [ { _id: 'red', who: { name: 'Bob', points: 3 } }, { _id: 'blue', who: { name: 'Carol', points: 9 } } ]
```


<a id="$firstN"></a>$firstN
---------------------------------------------------------------------

**Usage** : `{ field: { $firstN: { input: expression, n: count } } }`

The values from the first `n` documents, in order.

- This depends on document order, so use a `$sort` first.
- A missing value is included as `null`.
- A group with fewer than `n` documents gives all of them.
- `n` must be a whole number, `1` or more.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', names: { $firstN: { input: '$name', n: 2 } } } } ] );
// returns [ { _id: 'red', names: [ 'Alice', 'Bob' ] }, { _id: 'blue', names: [ 'Carol' ] } ]
```


<a id="$lastN"></a>$lastN
---------------------------------------------------------------------

**Usage** : `{ field: { $lastN: { input: expression, n: count } } }`

The values from the last `n` documents, ***in their original order***, so the very last value
  comes last.
It works like [`$firstN`](#$firstN) in every other way.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', names: { $lastN: { input: '$name', n: 1 } } } } ] );
// returns [ { _id: 'red', names: [ 'Bob' ] }, { _id: 'blue', names: [ 'Carol' ] } ]
```


<a id="$minN"></a>$minN
---------------------------------------------------------------------

**Usage** : `{ field: { $minN: { input: expression, n: count } } }`

The `n` smallest values, smallest first.

- Document order does not matter.
- `null` and missing values are skipped.
- Values are compared as in [`$min`](#$min).

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', low: { $minN: { input: '$points', n: 2 } } } } ] );
// returns [ { _id: 'red', low: [ 3, 7 ] }, { _id: 'blue', low: [ 9 ] } ]
```


<a id="$maxN"></a>$maxN
---------------------------------------------------------------------

**Usage** : `{ field: { $maxN: { input: expression, n: count } } }`

The `n` largest values, ***largest first***.
It works like [`$minN`](#$minN) in every other way.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', high: { $maxN: { input: '$points', n: 2 } } } } ] );
// returns [ { _id: 'red', high: [ 7, 3 ] }, { _id: 'blue', high: [ 9 ] } ]
```


<a id="$top"></a>$top
---------------------------------------------------------------------

**Usage** : `{ field: { $top: { sortBy: { field: 1 | -1, ... }, output: expression } } }`

Sorts the group's documents by `sortBy`, and gives `output` for the first one.

Use it to pick a document by one field and return another.
Unlike `$first`, it does its own sorting. Unlike `$max`, it can return a different field from the
  one it sorts by.

With an empty `sortBy`, which document comes first is not defined.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $top: { sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', best: 'Alice' }, { _id: 'blue', best: 'Carol' } ]

// output can be any expression, such as an array of fields.
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $top: { sortBy: { points: -1 }, output: [ '$name', '$points' ] } } } } ] );
// returns [ { _id: 'red', best: [ 'Alice', 7 ] }, { _id: 'blue', best: [ 'Carol', 9 ] } ]
```


<a id="$bottom"></a>$bottom
---------------------------------------------------------------------

**Usage** : `{ field: { $bottom: { sortBy: { field: 1 | -1, ... }, output: expression } } }`

Sorts the group's documents by `sortBy`, and gives `output` for the ***last*** one.
With the same `sortBy`, `$top` and `$bottom` give opposite ends.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', worst: { $bottom: { sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', worst: 'Bob' }, { _id: 'blue', worst: 'Carol' } ]
```


<a id="$topN"></a>$topN
---------------------------------------------------------------------

**Usage** : `{ field: { $topN: { n: count, sortBy: { field: 1 | -1, ... }, output: expression } } }`

Sorts the group's documents by `sortBy`, and gives an array of `output` for the first `n`, in
  sorted order.
A group with fewer than `n` documents gives all of them.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', best: { $topN: { n: 2, sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', best: [ 'Alice', 'Bob' ] }, { _id: 'blue', best: [ 'Carol' ] } ]
```


<a id="$bottomN"></a>$bottomN
---------------------------------------------------------------------

**Usage** : `{ field: { $bottomN: { n: count, sortBy: { field: 1 | -1, ... }, output: expression } } }`

Sorts the group's documents by `sortBy`, and gives an array of `output` for the last `n`,
  ***still in sorted order***.

### Example
```js
jsongin.Aggregate( players, [ { $group: { _id: '$team', worst: { $bottomN: { n: 1, sortBy: { points: -1 }, output: '$name' } } } } ] );
// returns [ { _id: 'red', worst: [ 'Bob' ] }, { _id: 'blue', worst: [ 'Carol' ] } ]
```


## See Also

- [`$group`](./Stage-Operators.md#$group)
- [`Aggregate( Documents, Pipeline, Scope )`](./Aggregate.md)
- [Expression Operators](./Expression-Operators.md)
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md)
- [Operator Reference](../Operator-Reference.md)
