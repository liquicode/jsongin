# @liquicode/jsongin


# Sort( Documents, SortCriteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        a          | The array of documents to sort.        |
| SortCriteria  |        o          | The sort criteria used to sort the documents. |


## Description

Sorts an array of documents according to the Sort Criteria.
Sorting is done "in place", no copy is made.
Returns the sorted documents.

`SortCriteria` is an object of document paths and sort directions.
A direction of `1` sorts that field in ascending order, `-1` sorts it in descending order, and
  `0` ignores that field.
When more than one field is given, documents are sorted by the first field, then ties are
  broken by the second, and so on.

```js
let documents = [
	{ id: 1, type: 'B', title: 'Second' },
	{ id: 2, type: 'A', title: 'First' },
];

jsongin.Sort( documents, { type: 1, title: -1 } );
```


## Sort Order

Values are ordered by [`CompareValues()`](./CompareValues.md), which follows MongoDB's comparison order:

    null < numbers < strings < objects < arrays < booleans < dates < regular expressions

***Missing fields*** :
A document which does not contain the sort field is sorted as though the field held `null`,
  which places it at the beginning of an ascending sort.

***Array fields*** :
A sort key is built from a ***set of candidates*** rather than from the field's value directly.
An array found at the end of the path offers each of its elements as a candidate.
An ascending sort takes the smallest candidate and a descending sort takes the largest.
So a field holding `[ 9, 0 ]` sorts as `0` when ascending and as `9` when descending, taking
  its place among the other values rather than among the other arrays.

Only ***one*** level is expanded this way.
A field holding `[ [ 3, 4 ], [ 1, 2 ] ]` offers the two inner arrays as its candidates, not the
  numbers inside them, so it sorts as `[ 1, 2 ]` when ascending and carries the array type rank.

Note that this differs from how two arrays are compared against each other by the expression
  operators and by `CompareValues()`, which compare element by element.
Both rules are MongoDB's; which one applies depends on whether you are sorting documents or
  comparing two values.

***Paths which cross an array*** :
Every array crossed while walking the path applies the ***remaining*** path to each of its
  elements, and each of those contributes candidates in turn.
The number of array levels which get expanded therefore depends on the shape of the ***path***
  and not on the shape of the value:

```js
// 'a.x' crosses the array at 'a' and then finds an array at 'x'.
// The candidates are 0 and 7, so this sorts as 0 ascending and 7 descending.
let crossed = { a: [ { x: [ 0, 7 ] } ] };

// 'v' crosses nothing, so the candidates are the two inner arrays themselves.
let direct = { v: [ [ 3, 4 ], [ 1, 2 ] ] };
```

An element which does not carry the field contributes `null`, so `{ a: [ { x: 5 }, { y: 9 } ] }`
  sorted by `a.x` offers `5` and `null` and sorts as `null` when ascending.

***Empty arrays*** :
A field holding an empty array `[]` offers ***no candidate at all***, and a document with no
  candidates sorts ***below every other value***, including `null` and below documents which
  are missing the field entirely.

That rule is about the ***absence*** of candidates, not about the sort key being an empty array.
An empty array which is ***selected*** as the sort key is an ordinary value carrying the array
  type rank:

```js
// [] is a candidate here beside 3, and it wins the descending max,
// so this document sorts above every number when descending.
let selected = { v: [ 3, [] ] };

// The only candidate is [], so this sorts by the array type rank, NOT below null.
let only = { v: [ [] ] };
```

An empty array which the path merely ***crosses*** cannot be followed into, so it contributes
  `null` instead: `{ a: [] }` sorted by `a.x` sorts with the other nulls.

Compared as a value rather than sorted, an empty array still carries the array type rank, so
  `CompareValues( [], null )` returns `1`.

***Ties*** :
Documents whose sort keys are equal keep their original relative order.
This is more predictable than MongoDB, which does not guarantee an order for tied documents.


## See Also

- [`Filter( Documents, Criteria )`](./Filter.md)
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md) and its `$sort` stage.


## Examples

### It sorts by one or more fields
```js
let documents = [
	{ id: 1, type: 'B', title: 'Second' },
	{ id: 2, type: 'A', title: 'First' },
	{ id: 3, type: 'B', title: 'Third' },
];
jsongin.Sort( documents, { type: 1, title: 1 } );
// => [ { id: 2, ... }, { id: 1, ... }, { id: 3, ... } ]
```

### Documents missing the sort field are sorted first
```js
let documents = [ { n: 2 }, { x: 9 }, { n: 1 } ];
jsongin.Sort( documents, { n: 1 } );
// => [ { x: 9 }, { n: 1 }, { n: 2 } ]
```

### Values of different types are ordered by type
```js
let documents = [ { n: 'abc' }, { n: 5 }, { n: null }, { n: true } ];
jsongin.Sort( documents, { n: 1 } );
// => [ { n: null }, { n: 5 }, { n: 'abc' }, { n: true } ]
```

### Array fields are sorted by their smallest or largest element
```js
let documents = [ { a: [ 5, 1 ] }, { a: [ 3 ] }, { a: [ 9, 0 ] } ];

jsongin.Sort( documents, { a: 1 } );   // sort keys 1, 3, 0
// => [ { a: [ 9, 0 ] }, { a: [ 5, 1 ] }, { a: [ 3 ] } ]

jsongin.Sort( documents, { a: -1 } );  // sort keys 5, 3, 9
// => [ { a: [ 9, 0 ] }, { a: [ 5, 1 ] }, { a: [ 3 ] } ]
```

### A path which crosses an array gathers a candidate from every element
```js
let documents = [
	{ id: 1, a: [ { x: 3 }, { x: 1 } ] },   // candidates 3 and 1
	{ id: 2, a: [ { x: 5 }, { y: 9 } ] },   // candidates 5 and null
	{ id: 3, a: [ { x: [ 0, 7 ] } ] },      // candidates 0 and 7
];

jsongin.Sort( documents, { 'a.x': 1 } );   // sort keys 1, null, 0
// => [ { id: 2, ... }, { id: 3, ... }, { id: 1, ... } ]

jsongin.Sort( documents, { 'a.x': -1 } );  // sort keys 3, 5, 7
// => [ { id: 3, ... }, { id: 2, ... }, { id: 1, ... } ]
```
