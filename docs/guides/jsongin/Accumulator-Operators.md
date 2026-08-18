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


## See Also

- [`$group`](./Stage-Operators.md#$group), the stage these are used within.
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md), which runs the pipeline.
- [Expression Operators](./Expression-Operators.md), for the values an accumulator reduces.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md), which `$min` and `$max` order by.
- [Operator Reference](../Operator-Reference.md), for which MongoDB operators are implemented.
