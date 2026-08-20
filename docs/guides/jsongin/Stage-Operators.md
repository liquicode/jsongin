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
| [`$unset`](#$unset)                | `{ $unset: 'path' \| [ 'path', ... ] }`                              |
| [`$replaceRoot`](#$replaceRoot)    | `{ $replaceRoot: { newRoot: expression } }`                          |
| [`$replaceWith`](#$replaceWith)    | `{ $replaceWith: expression }`                                       |
| [`$sortByCount`](#$sortByCount)    | `{ $sortByCount: expression }`                                       |
| [`$sample`](#$sample)              | `{ $sample: { size: count } }`                                       |
| [`$facet`](#$facet)                | `{ $facet: { name: [ stage, ... ], ... } }`                          |
| [`$bucket`](#$bucket)              | `{ $bucket: { groupBy: expression, boundaries: [ ... ], ... } }`     |
| [`$bucketAuto`](#$bucketAuto)      | `{ $bucketAuto: { groupBy: expression, buckets: count, ... } }`      |
| [`$fill`](#$fill)                  | `{ $fill: { output: { field: { value: ... } \| { method: ... } } } }` |
| [`$densify`](#$densify)            | `{ $densify: { field: 'name', range: { step: ..., bounds: ... } } }` |



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
***An accumulator whose value is missing writes a null***, rather than omitting its field. A
  `$group` output field is always written, which is unlike [`$project`](#$project), where an
  expression producing no value leaves its field out.

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


<a id="$unset"></a>$unset
---------------------------------------------------------------------

**Usage** : `{ $unset: 'path' }` or `{ $unset: [ 'path', 'path', ... ] }`

Removes fields from every document. A shorthand for a [`$project`](#$project) of exclusions,
  and built as one, so the two cannot disagree.

***A path here, not a name.*** A dot steps into a sub-document, which is the opposite of the
  expression operator
  [`$unsetField`](./Expression-Operators.md#$unsetField), where a dot is part of the field's
  name.

A document which does not have the field passes through unchanged, and `_id` may be removed
  like any other field. An empty specification is refused.

### Example
```js
jsongin.Aggregate( players, [ { $unset: [ 'dmg', 'armor', 'alive' ] } ] );
// returns [ { team: 'red', name: 'Alice', points: 7 }, { team: 'red', name: 'Bob', points: 3 }, { team: 'blue', name: 'Carol', points: 9 } ]

// A dot steps into a sub-document.
jsongin.Aggregate( [ { a: { b: 1, c: 2 } } ], [ { $unset: 'a.b' } ] );
// returns [ { a: { c: 2 } } ]

jsongin.Aggregate( players, [ { $unset: [] } ] );   // throws, at least one path is required
```


<a id="$replaceRoot"></a><a id="$replaceWith"></a>$replaceRoot and $replaceWith
---------------------------------------------------------------------

**Usage** : `{ $replaceRoot: { newRoot: expression } }` or `{ $replaceWith: expression }`

Replaces each document with the document the expression produces.
The two are the same stage; `$replaceWith` simply omits the `newRoot` wrapper.

***The document is replaced rather than merged into***, so `_id` does not survive unless the
  new root carries one of its own.

***A new root which is missing or is not a document fails the pipeline***, rather than dropping
  that one document, which is why [`$ifNull`](./Expression-Operators.md#$ifNull) is the usual
  guard on a field which may not be there.

### Example
```js
jsongin.Aggregate( players, [
	{ $match: { name: 'Alice' } },
	{ $replaceRoot: { newRoot: { who: '$name', net: { $subtract: [ '$dmg', '$armor' ] } } } },
] );
// returns [ { who: 'Alice', net: 7 } ]

jsongin.Aggregate( players, [ { $match: { name: 'Alice' } }, { $replaceWith: { who: '$name' } } ] );
// returns [ { who: 'Alice' } ]

// A new root which is not a document fails the pipeline.
jsongin.Aggregate( players, [ { $replaceWith: '$name' } ] );   // throws

// Which is why a field that may be missing is guarded.
jsongin.Aggregate( players, [ { $replaceWith: { $ifNull: [ '$gear', { none: true } ] } } ] );
// returns [ { none: true }, { none: true }, { none: true } ]
```


<a id="$sortByCount"></a>$sortByCount
---------------------------------------------------------------------

**Usage** : `{ $sortByCount: expression }`

Groups the documents by the expression and emits one document per group, holding the group's
  value as `_id` and how many documents it held as `count`, ***most frequent first***.

A shorthand for the [`$group`](#$group) and [`$sort`](#$sort) it stands for, and built as them.

***The argument is narrower than an expression.*** It must be a `$`-prefixed path or a document
  naming an operator. `$group` would take `{ team: 1 }` as an expression object and gather every
  document under it, which answers a question nobody asked, so this stage refuses it.

### Example
```js
jsongin.Aggregate( players, [ { $sortByCount: '$team' } ] );
// returns [ { _id: 'red', count: 2 }, { _id: 'blue', count: 1 } ]

jsongin.Aggregate( players, [ { $sortByCount: { $toUpper: '$team' } } ] );
// returns [ { _id: 'RED', count: 2 }, { _id: 'BLUE', count: 1 } ]

jsongin.Aggregate( players, [ { $sortByCount: 'team' } ] );   // throws, a path must begin with a '$'
```


<a id="$sample"></a>$sample
---------------------------------------------------------------------

**Usage** : `{ $sample: { size: count } }`

Selects `size` documents at random, ***without replacement***, so no document is selected twice.

A `size` larger than the stream takes the whole stream, and a `size` of `0` takes nothing.
***A fractional size is truncated rather than refused***, which is worth knowing because the
  N accumulators do require a whole number. A negative size throws.

***The order of the result is not specified.*** Pair this with a [`$sort`](#$sort) when the
  order matters.

### Example
```js
let sampled = jsongin.Aggregate( players, [ { $sample: { size: 2 } } ] );
let took_two = ( sampled.length === 2 );

// A size larger than the stream takes all of it.
let all = jsongin.Aggregate( players, [ { $sample: { size: 99 } } ] );
let took_all = ( all.length === 3 );

jsongin.Aggregate( players, [ { $sample: { size: -1 } } ] );   // throws
```


<a id="$facet"></a>$facet
---------------------------------------------------------------------

**Usage** : `{ $facet: { name: [ stage, ... ], ... } }`

Runs several pipelines over the same input and gathers their results into one document, one
  field per branch.

***Every branch sees the whole input***, not what another branch left behind, which is the
  point of the stage: it answers several questions about one set of documents in a single pass.

***One document comes out*** however many went in. A branch which selects nothing answers an
  empty array, and an empty branch pipeline answers everything.

### Example
```js
jsongin.Aggregate( players, [ {
	$facet: {
		total: [ { $count: 'n' } ],
		best: [ { $sort: { points: -1 } }, { $limit: 1 }, { $project: { _id: 0, name: 1 } } ],
	}
} ] );
// returns [ { total: [ { n: 3 } ], best: [ { name: 'Carol' } ] } ]

// Each branch is given the whole input. If they shared a stream, the count would be 1.
jsongin.Aggregate( players, [ {
	$facet: {
		first: [ { $limit: 1 }, { $project: { _id: 0, name: 1 } } ],
		total: [ { $count: 'n' } ],
	}
} ] );
// returns [ { first: [ { name: 'Alice' } ], total: [ { n: 3 } ] } ]
```


<a id="$bucket"></a>$bucket
---------------------------------------------------------------------

**Usage** : `{ $bucket: { groupBy: expression, boundaries: [ ... ], default: value, output: { ... } } }`

Groups the documents into buckets whose edges are given, reducing each bucket the way
  [`$group`](#$group) reduces a group.

***The ranges are half open.*** A value equal to a boundary belongs to the bucket ***above***
  it, so `[ 0, 10, 20 ]` makes the buckets `0 <= n < 10` and `10 <= n < 20`. A bucket's `_id`
  is its lower boundary.

***A bucket nothing fell into is left out entirely***, rather than reported with a count of
  zero, and the same is true of the `default` bucket.

***A value outside every bucket needs a `default`***, and throws without one.

`output` replaces the default of `{ count: { $sum: 1 } }` entirely rather than adding to it.
`boundaries` must hold at least two values, in ascending order.

### Example
```js
jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 5, 10 ] } },
] );
// returns [ { _id: 0, count: 1 }, { _id: 5, count: 2 } ]

// output replaces the count rather than adding to it.
jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 10 ], output: { names: { $push: '$name' } } } },
] );
// returns [ { _id: 0, names: [ 'Alice', 'Bob', 'Carol' ] } ]

// A value outside every bucket needs a default.
jsongin.Aggregate( players, [ { $bucket: { groupBy: '$points', boundaries: [ 0, 5 ] } } ] );   // throws

jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 5 ], default: 'high' } },
] );
// returns [ { _id: 0, count: 1 }, { _id: 'high', count: 2 } ]
```


<a id="$bucketAuto"></a>$bucketAuto
---------------------------------------------------------------------

**Usage** : `{ $bucketAuto: { groupBy: expression, buckets: count, output: { ... } } }`

Groups the documents into a given number of buckets, choosing the boundaries so that each holds
  about the same number of documents.

***A bucket's `_id` is a range***, `{ min, max }`, which is the visible difference from
  [`$bucket`](#$bucket). The `max` of one bucket is the `min` of the next, except the last,
  whose `max` is the largest value rather than one past it.

***An odd document goes to the earlier bucket***, so five values across two buckets is three
  and then two.

***Fewer buckets than asked for may come back***, because documents sharing a value are never
  split across a boundary.

***An empty `output` counts, where `$bucket`'s empty `output` does not.*** The two stages
  disagree about this and `jsongin` reproduces it rather than tidying it up.

### Example
```js
// Three values across two buckets is two and then one, and the max of the first
// bucket is the min of the second.
jsongin.Aggregate( players, [ { $bucketAuto: { groupBy: '$points', buckets: 2 } } ] );
// returns [ { _id: { min: 3, max: 9 }, count: 2 }, { _id: { min: 9, max: 9 }, count: 1 } ]

jsongin.Aggregate( players, [
	{ $bucketAuto: { groupBy: '$points', buckets: 1, output: { total: { $sum: '$points' } } } },
] );
// returns [ { _id: { min: 3, max: 9 }, total: 19 } ]
```


<a id="$fill"></a>$fill
---------------------------------------------------------------------

**Usage** : `{ $fill: { partitionBy: expression, partitionByFields: [ 'field', ... ], sortBy: { field: 1 | -1 }, output: { field: { value: expression } | { method: 'locf' | 'linear' } } } }`

Supplies a value for a field which has none.

***A null counts as having none***, which is unusual: almost everywhere else in this engine a
  null is a value and only a missing field is absent. `$fill` replaces both.

| **Written** | **Fills with** |
|-------------|-----------------|
| `{ value: expression }` | the expression, evaluated against the document being filled |
| `{ method: 'locf' }` | the ***l***ast ***o***bserved ***c***arried ***f***orward |
| `{ method: 'linear' }` | a value interpolated between the ones on either side |

***A method writes its field for every document***, even where it has nothing to write: a gap
  before the first observed value, or at either end of a `linear` series, becomes a `null`
  rather than staying missing.

***An output field naming neither fills nothing***, and is accepted; naming ***both*** is
  refused. `linear` requires the `sortBy` field to hold no repeated values, and numbers on
  both sides of a gap.

`partitionBy` takes a document rather than a path, so `{ k: '$k' }` and not `'$k'`.

### Example
```js
let readings = [
	{ t: 1, v: 10 },
	{ t: 2 },
	{ t: 3, v: 30 },
];

jsongin.Aggregate( readings, [ { $fill: { output: { v: { value: 0 } } } } ] );
// returns [ { t: 1, v: 10 }, { t: 2, v: 0 }, { t: 3, v: 30 } ]

jsongin.Aggregate( readings, [ { $fill: { sortBy: { t: 1 }, output: { v: { method: 'locf' } } } } ] );
// returns [ { t: 1, v: 10 }, { t: 2, v: 10 }, { t: 3, v: 30 } ]

jsongin.Aggregate( readings, [ { $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } } ] );
// returns [ { t: 1, v: 10 }, { t: 2, v: 20 }, { t: 3, v: 30 } ]

// Naming both a value and a method is refused.
jsongin.Aggregate( readings, [ { $fill: { output: { v: { value: 0, method: 'locf' } } } } ] );   // throws
```


<a id="$densify"></a>$densify
---------------------------------------------------------------------

**Usage** : `{ $densify: { field: 'name', partitionByFields: [ 'field', ... ], range: { step: number, unit: string, bounds: 'full' | 'partition' | [ lower, upper ] } } }`

Adds documents to close the gaps in a sequence, so that the values of `field` step evenly.

***An added document holds the field and its partition, and nothing else.*** It stands for a
  point in the sequence which had no data.

***Densifying only ever adds.*** A document whose value does not sit on the series is kept
  where it is rather than moved or removed.

| **`bounds`** | **Runs from** |
|--------------|----------------|
| `'full'` | the smallest value in the whole stream to the largest |
| `'partition'` | the smallest to the largest within each partition |
| `[ lower, upper ]` | the values given, with `upper` excluded |

***A date field needs a `unit`*** and a numeric field must not have one. A field which is
  neither a number nor a date is refused, since there is no step from one value to the next.

### Example
```js
let readings = [ { t: 1 }, { t: 2 }, { t: 4 } ];

jsongin.Aggregate( readings, [
	{ $densify: { field: 't', range: { step: 1, bounds: 'full' } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 1 }, { t: 2 }, { t: 3 }, { t: 4 } ]

// The upper bound is excluded.
jsongin.Aggregate( readings, [
	{ $densify: { field: 't', range: { step: 1, bounds: [ 0, 2 ] } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 0 }, { t: 1 }, { t: 2 }, { t: 4 } ]

// A step which skips over an existing value leaves it where it is.
jsongin.Aggregate( readings, [
	{ $densify: { field: 't', range: { step: 2, bounds: 'full' } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 1 }, { t: 2 }, { t: 3 }, { t: 4 } ]
```


## Stages Which Are Not Implemented

`$redact` and `$documents` are the only two of the twelve stages this project set out to build
  which are not here, and for two different reasons.

***`$redact` needs expression system variables.*** It walks a document level by level and asks
  an expression what to do with each one, and the expression answers by evaluating to
  `$$DESCEND`, `$$PRUNE`, or `$$KEEP`. [`Evaluate()`](./Evaluate.md) has no system variables at
  all, so the answers cannot be expressed. It becomes buildable with the same change that
  brings `$let`, `$map`, `$filter`, and `$reduce`, and until then it is measured as a gap by
  `test/Parity Tests/Aggregate Tests/test-suite/Redact Gap Tests.js`.

***`$documents` is a source stage of a database-level aggregation.*** It replaces the input
  rather than transforming it, which is why MongoDB allows it in `db.aggregate()` and refuses
  it against a collection. [`Aggregate()`](./Aggregate.md) always takes the documents it works
  on, so there is no position for such a stage to occupy.

The other stages MongoDB documents and `jsongin` does not implement — `$lookup`, `$graphLookup`,
  `$merge`, `$out`, `$unionWith`, `$geoNear`, `$collStats`, `$indexStats`, `$setWindowFields`,
  and `$vectorSearch` — need a collection, an index, or a second collection to join against, and
  `jsongin` works on an array of documents. See the
  [Operator Reference](../Operator-Reference.md).


## See Also

- [`Aggregate( Documents, Pipeline )`](./Aggregate.md), which runs these stages.
- [Accumulator Operators](./Accumulator-Operators.md), for what may appear inside a `$group`.
- [Expression Operators](./Expression-Operators.md), for the values a stage computes.
- [Operator Reference](../Operator-Reference.md), for which MongoDB operators are implemented.
