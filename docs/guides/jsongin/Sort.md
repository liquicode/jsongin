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
jsongin.Sort( documents, { type: 1, title: -1 } );
```


## Sort Order

Values are ordered by [`CompareValues()`](#), which follows MongoDB's comparison order:

    null < numbers < strings < objects < arrays < booleans < dates < regular expressions

***Missing fields*** :
A document which does not contain the sort field is sorted as though the field held `null`,
  which places it at the beginning of an ascending sort.

***Array fields*** :
When a sort field holds an array, the array is first reduced to a single sort key.
An ascending sort uses the array's ***smallest*** element, and a descending sort uses its
  ***largest*** element.
So a field holding `[ 9, 0 ]` sorts as `0` when ascending and as `9` when descending, and it
  takes its place among the other values accordingly, not among the other arrays.

Note that this differs from how two arrays are compared against each other by the expression
  operators and by `CompareValues()`, which compare element by element.
Both rules are MongoDB's; which one applies depends on whether you are sorting documents or
  comparing two values.

***Empty array fields*** :
A field holding an empty array `[]` has no element to reduce to.
It sorts ***below every other value***, including `null` and below documents which are missing
  the field entirely.
This too is a sorting rule only. Compared as a value, an empty array still carries the array
  type rank, so `CompareValues( [], null )` returns `1`.

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
