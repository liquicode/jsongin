# @liquicode/jsongin


# Stage Operators

The stages of an aggregation pipeline, run by [`Aggregate()`](./Aggregate.md).
A pipeline is an array of stages. Each stage works on the documents the previous stage returned.

Each stage below has its usage, what it does, and examples.
See [`Aggregate()`](./Aggregate.md) for the rules of a whole pipeline, and
  [Accumulator Operators](./Accumulator-Operators.md) for what can go inside `$group`.

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
| [`$redact`](#$redact)              | `{ $redact: expression }`                                            |
| [`$lookup`](#$lookup)              | `{ $lookup: { from, localField, foreignField, as } }`                 |
| [`$unionWith`](#$unionWith)        | `{ $unionWith: documents }` or `{ $unionWith: { coll, pipeline } }`   |
| [`$graphLookup`](#$graphLookup)    | `{ $graphLookup: { from, startWith, connectFromField, connectToField, as } }` |


Most examples below use these documents:

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

**Usage** : `{ $match: query }`

Keeps the documents which match the query, and drops the rest.
Any query works, including `$expr`. See [Query Operators](./Query-Operators.md).

```js
jsongin.Aggregate( players, [ { $match: { alive: true, points: { $gte: 3 } } } ] );
jsongin.Aggregate( players, [ { $match: { $expr: { $gt: [ '$dmg', '$armor' ] } } } ] );
```


<a id="$project"></a>$project
---------------------------------------------------------------------

**Usage** : `{ $project: { field: 1 | 0, field: expression, ... } }`

Reshapes each document: keeps fields, removes fields, or computes new ones.
It follows the rules of [`Project()`](./Project.md), with two differences:

- The projection operators (`$slice`, `$elemMatch`) are not available. Inside a stage, a value
  such as `{ $slice: [ '$a', 2 ] }` is an [expression](./Expression-Operators.md#$slice).
- An empty `$project: {}` throws.

`1` or `true` keeps a field, `0` or `false` removes it, and any other value is an expression
  which computes it.
You cannot keep some fields and remove others in the same stage, except that `_id` can always be
  removed with `_id: 0`.

```js
jsongin.Aggregate( players, [ { $project: { _id: 0, name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
// returns [ { name: 'Alice', net: 7 }, { name: 'Bob', net: -2 }, { name: 'Carol', net: 7 } ]
```


<a id="$addFields"></a><a id="$set"></a>$addFields and $set
---------------------------------------------------------------------

**Usage** : `{ $addFields: { field: expression, ... } }` or `{ $set: { field: expression, ... } }`

Adds or replaces fields in each document, keeping all the other fields.
`$set` is another name for `$addFields`, as in MongoDB.

- Field names can be dot notation paths.
- If an expression gives nothing, such as `'$$REMOVE'` or a missing field, the field is
  ***removed*** from the document.
- Every expression reads the ***original*** document, so a field added by the stage cannot be
  used by another expression in the same stage.

```js
jsongin.Aggregate( [ { a: 1 } ], [ { $addFields: { b: '$a', c: '$b' } } ] );
// returns [ { a: 1, b: 1 } ]     c read the original document, which had no b

jsongin.Aggregate( [ { a: 1, b: 2 } ], [ { $addFields: { b: '$$REMOVE' } } ] );
// returns [ { a: 1 } ]
```


<a id="$unwind"></a>$unwind
---------------------------------------------------------------------

**Usage** : `{ $unwind: '$path' }`
  or `{ $unwind: { path: '$path', includeArrayIndex: 'name', preserveNullAndEmptyArrays: true } }`

Outputs one document for each element of an array field, with the field set to that element.
The path must start with `$`.

| **The field holds**              | **Output**                                                      |
|----------------------------------|-----------------------------------------------------------------|
| An array                         | One document per element.                                       |
| An empty array, `null`, or nothing | No document, unless `preserveNullAndEmptyArrays` is `true`.   |
| Any other value                  | The document once, unchanged.                                   |

With `preserveNullAndEmptyArrays: true`, those documents are output too: an empty array is
  removed from the document, and a `null` is kept.

With `includeArrayIndex`, that field is set to the element's position, or to `null` when the
  document did not come from an array.

```js
jsongin.Aggregate( [ { t: [ 1, 2 ] }, { t: [] }, { t: 5 } ], [ { $unwind: '$t' } ] );
// returns [ { t: 1 }, { t: 2 }, { t: 5 } ]
```


<a id="$group"></a>$group
---------------------------------------------------------------------

**Usage** : `{ $group: { _id: expression, field: { accumulator: expression }, ... } }`

Sorts the documents into groups, and outputs one document per group.

- `_id` is required. Its expression gives each document's group.
  Documents where it is missing go in the `null` group.
  Use `_id: null` to put every document in one group.
- Every other field uses an [accumulator](./Accumulator-Operators.md), such as `$sum`, to combine
  the group's documents into one value.
  If the accumulator has no value, the field is set to `null`, not left out.
- Values of different types are different groups: `5` and `'5'` are two groups.
- Groups are output in the order they were first seen. MongoDB does not promise any order, so
  add a `$sort` if you need one.

```js
jsongin.Aggregate( players, [
	{ $group: { _id: '$team', score: { $sum: '$points' }, members: { $push: '$name' } } },
] );
// returns [ { _id: 'red', score: 10, members: [ 'Alice', 'Bob' ] }, { _id: 'blue', score: 9, members: [ 'Carol' ] } ]
```


<a id="$sort"></a>$sort
---------------------------------------------------------------------

**Usage** : `{ $sort: { field: 1 | -1, ... } }`

Sorts the documents. The input array is not changed.
It follows the rules of [`Sort()`](./Sort.md):

- A missing field sorts like `null`.
- Values of different types are ordered by type.
- An array field sorts by its smallest element ascending, and its largest descending.
- Documents which tie keep their order.


<a id="$limit"></a><a id="$skip"></a>$limit and $skip
---------------------------------------------------------------------

**Usage** : `{ $limit: count }` and `{ $skip: count }`

`$limit` keeps the first `count` documents. `$skip` drops the first `count` documents.
`count` must be a whole number, `0` or more.


<a id="$count"></a>$count
---------------------------------------------------------------------

**Usage** : `{ $count: 'field_name' }`

Replaces all the documents with one document holding how many there were.
The field name must be a non-empty string which does not start with `$`.

If there are no documents, the output is empty, not a count of `0`.

This is the `$count` ***stage***.
The [`$count` accumulator](./Accumulator-Operators.md#$count) counts inside a `$group`.

### Example
```js
jsongin.Aggregate( players, [ { $count: 'total' } ] );
// returns [ { total: 3 } ]

jsongin.Aggregate( players, [ { $match: { alive: true } }, { $count: 'living' } ] );
// returns [ { living: 2 } ]

// No documents, no output.
jsongin.Aggregate( players, [ { $match: { alive: 'nope' } }, { $count: 'n' } ] );
// returns []

jsongin.Aggregate( players, [ { $count: '' } ] );   // throws: the field name is empty
jsongin.Aggregate( players, [ { $count: 5 } ] );    // throws: not a string
```


<a id="$unset"></a>$unset
---------------------------------------------------------------------

**Usage** : `{ $unset: 'path' }` or `{ $unset: [ 'path', 'path', ... ] }`

Removes fields from every document. It is the same as a `$project` which removes those fields.

- A dot in a path goes into a nested object. (In the
  [`$unsetField`](./Expression-Operators.md#$unsetField) expression, a dot is part of the name.)
- A document without the field is unchanged.
- `_id` can be removed like any other field.
- An empty list throws.

### Example
```js
jsongin.Aggregate( players, [ { $unset: [ 'dmg', 'armor', 'alive' ] } ] );
// returns [ { team: 'red', name: 'Alice', points: 7 }, { team: 'red', name: 'Bob', points: 3 }, { team: 'blue', name: 'Carol', points: 9 } ]

jsongin.Aggregate( [ { a: { b: 1, c: 2 } } ], [ { $unset: 'a.b' } ] );
// returns [ { a: { c: 2 } } ]

jsongin.Aggregate( players, [ { $unset: [] } ] );   // throws
```


<a id="$replaceRoot"></a><a id="$replaceWith"></a>$replaceRoot and $replaceWith
---------------------------------------------------------------------

**Usage** : `{ $replaceRoot: { newRoot: expression } }` or `{ $replaceWith: expression }`

Replaces each document with the object the expression gives.
The two are the same stage; `$replaceWith` just leaves out `newRoot`.

- The old document is thrown away, including its `_id`.
- If the expression gives something which is not an object, or nothing, the pipeline ***throws***.
  Use [`$ifNull`](./Expression-Operators.md#$ifNull) when the value may be missing.

### Example
```js
jsongin.Aggregate( players, [
	{ $match: { name: 'Alice' } },
	{ $replaceRoot: { newRoot: { who: '$name', net: { $subtract: [ '$dmg', '$armor' ] } } } },
] );
// returns [ { who: 'Alice', net: 7 } ]

jsongin.Aggregate( players, [ { $match: { name: 'Alice' } }, { $replaceWith: { who: '$name' } } ] );
// returns [ { who: 'Alice' } ]

// A string is not an object.
jsongin.Aggregate( players, [ { $replaceWith: '$name' } ] );   // throws

// Give a fallback for a field which may be missing.
jsongin.Aggregate( players, [ { $replaceWith: { $ifNull: [ '$gear', { none: true } ] } } ] );
// returns [ { none: true }, { none: true }, { none: true } ]
```


<a id="$sortByCount"></a>$sortByCount
---------------------------------------------------------------------

**Usage** : `{ $sortByCount: expression }`

Groups the documents by the expression's value, and outputs one document per value with its
  `_id` and a `count`, ***most common first***.
It is a shortcut for a `$group` followed by a `$sort`.

The expression must be a path starting with `$`, or an operator such as `{ $toUpper: '$team' }`.
Anything else throws.

### Example
```js
jsongin.Aggregate( players, [ { $sortByCount: '$team' } ] );
// returns [ { _id: 'red', count: 2 }, { _id: 'blue', count: 1 } ]

jsongin.Aggregate( players, [ { $sortByCount: { $toUpper: '$team' } } ] );
// returns [ { _id: 'RED', count: 2 }, { _id: 'BLUE', count: 1 } ]

jsongin.Aggregate( players, [ { $sortByCount: 'team' } ] );   // throws: must start with $
```


<a id="$sample"></a>$sample
---------------------------------------------------------------------

**Usage** : `{ $sample: { size: count } }`

Picks `size` documents at random. No document is picked twice.

- If `size` is larger than the number of documents, all of them are returned.
- A `size` of `0` returns none. A fraction is rounded down. A negative `size` throws.
- The order of the result is random. Add a `$sort` if order matters.

### Example
```js
let sampled = jsongin.Aggregate( players, [ { $sample: { size: 2 } } ] );
let took_two = ( sampled.length === 2 );

let all = jsongin.Aggregate( players, [ { $sample: { size: 99 } } ] );
let took_all = ( all.length === 3 );

jsongin.Aggregate( players, [ { $sample: { size: -1 } } ] );   // throws
```


<a id="$facet"></a>$facet
---------------------------------------------------------------------

**Usage** : `{ $facet: { name: [ stage, ... ], ... } }`

Runs several pipelines on the same documents, and outputs ***one document*** with each pipeline's
  results in a field.

- Every pipeline gets ***all*** of the input documents.
- A pipeline which matches nothing gives an empty array.
- An empty pipeline, `[]`, gives all the input documents.

### Example
```js
jsongin.Aggregate( players, [ {
	$facet: {
		total: [ { $count: 'n' } ],
		best: [ { $sort: { points: -1 } }, { $limit: 1 }, { $project: { _id: 0, name: 1 } } ],
	}
} ] );
// returns [ { total: [ { n: 3 } ], best: [ { name: 'Carol' } ] } ]

// Each pipeline sees all three documents, even after another one ran $limit.
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

Groups documents into ranges which you choose, and outputs one document per range.

- `boundaries` lists the edges, at least two, in ascending order. `[ 0, 10, 20 ]` makes the
  ranges `0` up to (but not including) `10`, and `10` up to `20`.
- Each output document's `_id` is the lower edge of its range.
- A value outside every range goes in a bucket whose `_id` is `default`. Without a `default`,
  it throws.
- Ranges with no documents are not output.
- `output` holds accumulators, as in `$group`. It defaults to `{ count: { $sum: 1 } }`. If you
  give `output`, there is no `count` unless you ask for one.

### Example
```js
jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 5, 10 ] } },
] );
// returns [ { _id: 0, count: 1 }, { _id: 5, count: 2 } ]

// With output, there is no count.
jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 10 ], output: { names: { $push: '$name' } } } },
] );
// returns [ { _id: 0, names: [ 'Alice', 'Bob', 'Carol' ] } ]

// 7 and 9 are outside [ 0, 5 ), and there is no default.
jsongin.Aggregate( players, [ { $bucket: { groupBy: '$points', boundaries: [ 0, 5 ] } } ] );   // throws

jsongin.Aggregate( players, [
	{ $bucket: { groupBy: '$points', boundaries: [ 0, 5 ], default: 'high' } },
] );
// returns [ { _id: 0, count: 1 }, { _id: 'high', count: 2 } ]
```


<a id="$bucketAuto"></a>$bucketAuto
---------------------------------------------------------------------

**Usage** : `{ $bucketAuto: { groupBy: expression, buckets: count, output: { ... } } }`

Groups documents into `buckets` ranges, choosing the edges so each range holds about the same
  number of documents.

- Each output document's `_id` is `{ min, max }`. A range's `max` is the next range's `min`,
  except for the last, whose `max` is the largest value.
- When the documents do not divide evenly, earlier ranges get the extra ones: five documents in
  two buckets gives three, then two.
- Documents with the same value always go in the same range, so you can get fewer ranges than
  you asked for.
- `output` works as in `$bucket`, except that an empty `output: {}` still gives a `count`.

### Example
```js
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

Fills in fields which are missing ***or `null`***.

| **Output**              | **Fills with** |
|-------------------------|-----------------|
| `{ value: expression }` | the expression, evaluated against the document being filled |
| `{ method: 'locf' }`    | the last value before it ("last observation carried forward") |
| `{ method: 'linear' }`  | a value in a straight line between the values before and after it |

- The methods need `sortBy`, to know which document comes before which.
- With a method, a gap which has no value to use, such as before the first value, is set to
  `null`.
- `linear` needs numbers on both sides of the gap, and no repeated `sortBy` values.
- Giving both `value` and `method` throws. Giving neither fills nothing.
- `partitionBy` and `partitionByFields` fill each group of documents separately.
  `partitionBy` takes an object, such as `{ k: '$k' }`, not a path.

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

jsongin.Aggregate( readings, [ { $fill: { output: { v: { value: 0, method: 'locf' } } } } ] );   // throws
```


<a id="$densify"></a>$densify
---------------------------------------------------------------------

**Usage** : `{ $densify: { field: 'name', partitionByFields: [ 'field', ... ], range: { step: number, unit: string, bounds: 'full' | 'partition' | [ lower, upper ] } } }`

Adds documents to fill the gaps in a sequence of numbers or dates, one `step` apart.

- An added document holds only `field` and the `partitionByFields`.
- Existing documents are never changed or removed, even if they fall between steps.
- `field` must hold numbers or dates. A date field needs a `unit`, such as `'day'`; a number field
  must not have one.

| **`bounds`**       | **The sequence runs from** |
|--------------------|-----------------------------|
| `'full'`           | the smallest value of all documents to the largest |
| `'partition'`      | the smallest to the largest value in each partition |
| `[ lower, upper ]` | `lower` up to, but not including, `upper` |

### Example
```js
let sparse = [ { t: 1 }, { t: 2 }, { t: 4 } ];

jsongin.Aggregate( sparse, [
	{ $densify: { field: 't', range: { step: 1, bounds: 'full' } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 1 }, { t: 2 }, { t: 3 }, { t: 4 } ]

// The upper bound is not included.
jsongin.Aggregate( sparse, [
	{ $densify: { field: 't', range: { step: 1, bounds: [ 0, 2 ] } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 0 }, { t: 1 }, { t: 2 }, { t: 4 } ]

// With a step of 2 from 1, only 3 is added. 2 and 4 are kept as they are.
jsongin.Aggregate( sparse, [
	{ $densify: { field: 't', range: { step: 2, bounds: 'full' } } },
	{ $sort: { t: 1 } },
] );
// returns [ { t: 1 }, { t: 2 }, { t: 3 }, { t: 4 } ]
```


<a id="$redact"></a>$redact
---------------------------------------------------------------------

**Usage** : `{ $redact: expression }`

Removes parts of each document, deciding level by level.

`$match` keeps or drops whole documents. `$redact` goes into each document and decides again for
  every nested object, so part of a document can be removed while the rest is kept.
Use it to show different callers different parts of the same data.

The expression must give one of three values, which only exist inside this stage:

| **Value**     | **Meaning**                                                            |
|---------------|--------------------------------------------------------------------------|
| `$$DESCEND`   | Keep this level's fields, and decide again for each object inside it.  |
| `$$PRUNE`     | Remove this level and everything inside it.                            |
| `$$KEEP`      | Keep this level and everything inside it, without deciding again.      |

- While deciding, `$$CURRENT` is the object being decided on, and a path such as `'$level'` reads
  from it. `$$ROOT` is still the whole document.
- `$$DESCEND` also goes into the objects inside arrays. A pruned array element is removed from
  the array. Array elements which are not objects are kept.
- If the top level is pruned, the document is not output.
- Any other value throws, but only when it is actually given: a `$cond` branch which is never
  taken is not checked.

### Example
```js
let records =
[
	{ _id: 1, level: 1, name: 'open', inner: { level: 1, secret: 'visible' } },
	{ _id: 2, level: 5, name: 'closed', inner: { level: 5, secret: 'hidden' } },
];

// Record 2 is pruned at the top, so it is not output.
jsongin.Aggregate( records, [
	{ $redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] } },
] );
// returns [ { _id: 1, level: 1, name: 'open', inner: { level: 1, secret: 'visible' } } ]

// The inner object is decided on separately, and pruned.
jsongin.Aggregate( [ { _id: 1, level: 1, inner: { level: 9, secret: 'hidden' } } ], [
	{ $redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] } },
] );
// returns [ { _id: 1, level: 1 } ]

// $$KEEP keeps everything inside without deciding again.
jsongin.Aggregate( [ { _id: 1, level: 1, inner: { level: 9, secret: 'kept' } } ], [
	{ $redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$KEEP', '$$PRUNE' ] } },
] );
// returns [ { _id: 1, level: 1, inner: { level: 9, secret: 'kept' } } ]

// A pruned array element is removed from the array.
jsongin.Aggregate( [ { _id: 1, level: 1, items: [ { level: 1 }, { level: 9 } ] } ], [
	{ $redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] } },
] );
// returns [ { _id: 1, level: 1, items: [ { level: 1 } ] } ]

jsongin.Aggregate( records, [ { $redact: '$$ROOT' } ] );   // throws
```



<a id="$lookup"></a>$lookup
---------------------------------------------------------------------

**Usage** : `{ $lookup: { from: <documents>, localField: 'field', foreignField: 'field', as: 'field' } }`

or `{ $lookup: { from: <documents>, let: { name: expression }, pipeline: [ stage, ... ], as: 'field' } }`

Joins each document with a second set of documents, gathering what it matched into an array.

***`from` is the documents themselves, or a `$$name` bound in the pipeline's scope.***
MongoDB names a collection there and reads it from the database.
`jsongin` has no collections, so it takes the array - and that is the only difference between
  the two.
A name which is not a `$variable` is refused rather than read as a collection.

```js
let bookings = [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'C' } ];
let nights = [ { DomeId: 'A', Night: 'clear' } ];

jsongin.Aggregate( bookings, [
	{ $lookup: { from: nights, localField: 'Dome', foreignField: 'DomeId', as: 'Nights' } },
] );
// returns [ { Id: 1, Dome: 'A', Nights: [ { DomeId: 'A', Night: 'clear' } ] }, { Id: 2, Dome: 'C', Nights: [] } ]
```

The same pipeline with the documents bound in the scope instead:

```js
let bookings = [ { Id: 1, Dome: 'A' } ];
let scope = jsongin.Scope.NewPipeline().Child( { Nights: [ { DomeId: 'A', Night: 'clear' } ] } );

jsongin.Aggregate( bookings, [
	{ $lookup: { from: '$$Nights', localField: 'Dome', foreignField: 'DomeId', as: 'Nights' } },
], scope );
// returns [ { Id: 1, Dome: 'A', Nights: [ { DomeId: 'A', Night: 'clear' } ] } ]
```

***The equality form matches where the local value is among the foreign ones.***
An array on either side matches element by element, and a ***missing field counts as null***,
  so a document with no local field matches foreign documents whose field is null or missing.
Numbers compare across their types, and a number never matches its text.
All of this was measured against MongoDB 8.3.8.

```js
let domes = [ { Id: 1, Dome: [ 'A', 'B' ] }, { Id: 2 } ];
let nights = [ { N: 1, DomeId: 'A' }, { N: 2, DomeId: [ 'B', 'Z' ] }, { N: 3, DomeId: null } ];

jsongin.Aggregate( domes, [
	{ $lookup: { from: nights, localField: 'Dome', foreignField: 'DomeId', as: 'F' } },
] );
// returns [ { Id: 1, Dome: [ 'A', 'B' ], F: [ { N: 1, DomeId: 'A' }, { N: 2, DomeId: [ 'B', 'Z' ] } ] }, { Id: 2, F: [ { N: 3, DomeId: null } ] } ]
```

***The pipeline form runs a pipeline over the second set***, with `let` bound as variables a
  `$match`'s `$expr` can read.
Both forms may be given together, and both apply.

```js
let bookings = [ { Id: 1, Dome: 'A', Minimum: 2 } ];
let stays = [ { DomeId: 'A', Nights: 1 }, { DomeId: 'A', Nights: 5 } ];

jsongin.Aggregate( bookings, [
	{ $lookup: {
		from: stays,
		let: { dome: '$Dome', minimum: '$Minimum' },
		pipeline: [ { $match: { $expr: { $and: [ { $eq: [ '$DomeId', '$$dome' ] }, { $gt: [ '$Nights', '$$minimum' ] } ] } } } ],
		as: 'Long',
	} },
] );
// returns [ { Id: 1, Dome: 'A', Minimum: 2, Long: [ { DomeId: 'A', Nights: 5 } ] } ]
```

`as` is ***always written***, holding an empty array where nothing matched.
It may be a dotted path, which keeps what is beside it, and it replaces whatever was there.

The documents it writes are copies, so neither set is changed.

See [`Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )`](./Join.md), which is
  this stage without a pipeline, and which can answer a right or outer join as well.


<a id="$unionWith"></a>$unionWith
---------------------------------------------------------------------

**Usage** : `{ $unionWith: <documents> }` or `{ $unionWith: { coll: <documents>, pipeline: [ stage, ... ] } }`

Adds a second set of documents to the stream, after the ones already in it.

***`coll` is the documents themselves, or a `$$name` bound in the pipeline's scope***, as it
  is for [`$lookup`](#$lookup).
MongoDB names a collection there; `jsongin` has no collections.

```js
let morning = [ { Id: 1, When: 'morning' } ];
let evening = [ { Id: 2, When: 'evening' }, { Id: 3, When: 'evening', Clouded: true } ];

jsongin.Aggregate( morning, [ { $unionWith: evening } ] );
// returns [ { Id: 1, When: 'morning' }, { Id: 2, When: 'evening' }, { Id: 3, When: 'evening', Clouded: true } ]
```

***This is a concatenation, not a set union.***
Nothing is de-duplicated, and a document which is in both sets comes back twice - measured
  against MongoDB 8.3.8, where the same `_id` in both collections came back twice.
Follow it with [`$group`](#$group) to reduce it.

A `pipeline` runs over the second set only, before it joins the stream:

```js
let morning = [ { Id: 1, When: 'morning' } ];
let evening = [ { Id: 2, When: 'evening' }, { Id: 3, When: 'evening', Clouded: true } ];

jsongin.Aggregate( morning, [
	{ $unionWith: { coll: evening, pipeline: [ { $match: { Clouded: { $ne: true } } } ] } },
] );
// returns [ { Id: 1, When: 'morning' }, { Id: 2, When: 'evening' } ]
```

Every stage after this one sees both sets.
The documents are the caller's own, as they are through [`$match`](#$match): this stage adds
  documents to the stream rather than making new ones.

See [`Union( Documents, UnionDocuments )`](./Union.md), which is this stage without a pipeline.


<a id="$graphLookup"></a>$graphLookup
---------------------------------------------------------------------

**Usage** : `{ $graphLookup: { from: <documents>, startWith: expression, connectFromField: 'field', connectToField: 'field', as: 'field', maxDepth: number, depthField: 'field', restrictSearchWithMatch: query } }`

Follows a chain through a second set of documents, gathering everything it reaches.

Each round matches `connectToField` against the values it is looking for, and what it finds
  supplies the next round through `connectFromField`.
The first round looks for whatever `startWith` evaluates to.

***`from` is the documents themselves, or a `$$name` bound in the pipeline's scope***, as it
  is for [`$lookup`](#$lookup).

```js
let bookings = [ { Id: 1, Dome: 'A' } ];
let domes = [
	{ Name: 'A', Parent: 'B' },
	{ Name: 'B', Parent: 'C' },
	{ Name: 'C' },
];

let found = jsongin.Aggregate( bookings, [
	{ $graphLookup: {
		from: domes, startWith: '$Dome',
		connectFromField: 'Parent', connectToField: 'Name',
		as: 'Chain', depthField: 'Level',
	} },
] );

found[ 0 ].Chain.map( function ( Each ) { return Each.Name + '@' + Each.Level; } ).sort().join( ' ' ) === 'A@0 B@1 C@2'
```

***A document is reached once, and carries the shallowest depth it was reached at.***
`depthField` counts from 0 for the documents `startWith` found, and is written only when it
  is asked for.
A cycle ends, because a document already reached is not followed again.

***Which document a document is, is where it sits in the array.***
MongoDB tells two identical documents apart by their `_id`; here their positions do that, so
  two documents which look alike are still two documents.

`maxDepth` bounds the rounds, and `0` is the first round alone:

```js
let domes = [ { Name: 'A', Parent: 'B' }, { Name: 'B', Parent: 'C' }, { Name: 'C' } ];

let found = jsongin.Aggregate( [ { Dome: 'A' } ], [
	{ $graphLookup: {
		from: domes, startWith: '$Dome',
		connectFromField: 'Parent', connectToField: 'Name',
		as: 'Chain', depthField: 'Level', maxDepth: 1,
	} },
] );

found[ 0 ].Chain.length === 2
```

A negative or fractional `maxDepth` is refused, as MongoDB refuses it.

***`restrictSearchWithMatch` is a query the documents must also match***, the first round
  included, and what lies beyond a document it excludes is never reached.

An array on either side matches element by element.
A `startWith` which evaluates to nothing finds nothing; one which evaluates to `null` looks
  for `null`.
`as` is always written, holding an empty array where nothing was found, and may be a dotted
  path.

***The order of what it found is not MongoDB's.***
The server answers in its own order, which an in-memory engine cannot reproduce, so read what
  it found rather than the array as it stands.
Every other rule above was measured against MongoDB 8.3.8.

See [`Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )`](./Join.md), which
  is one round of this without the walk.

## Stages Not Implemented

`$merge`, `$out`, `$geoNear`, `$collStats`, `$indexStats`,
  `$setWindowFields`, `$vectorSearch` and `$documents` are not implemented.
`$merge` and `$out` write to a database collection, and the rest need one, an index, or a
  source `jsongin` does not have.
***`$lookup`, `$unionWith` and `$graphLookup` used to be on this list***, and are not any more: they needed a second collection
  only because MongoDB names one. See the [Operator Reference](../Operator-Reference.md).


## See Also

- [`Aggregate( Documents, Pipeline, Scope )`](./Aggregate.md)
- [Accumulator Operators](./Accumulator-Operators.md)
- [Expression Operators](./Expression-Operators.md)
- [Operator Reference](../Operator-Reference.md)
