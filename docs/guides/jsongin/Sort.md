# @liquicode/jsongin


# Sort( Documents, SortCriteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        a          | The documents to sort.                   |
| SortCriteria  |        o          | The fields to sort by, as `{ field: 1 }` or `{ field: -1 }`. |


## Description

Sorts an array of documents ***in place*** and returns the same array.

Each key of `SortCriteria` is a dot notation path.
Its value is `1` (or any positive number) to sort ascending, `-1` (or any negative number) to
  sort descending, or `0` to skip the field.
With more than one field, documents are sorted by the first field, and ties are broken by the
  next.

```js
let documents = [
	{ id: 1, type: 'B', title: 'Second' },
	{ id: 2, type: 'A', title: 'First' },
];

jsongin.Sort( documents, { type: 1, title: -1 } );
```

Documents which tie on every field keep their original order.

`Sort` throws when `Documents` is not an array or `SortCriteria` is not an object.


## Sort Order

Values are ordered by [`CompareValues()`](./CompareValues.md), which follows MongoDB:

    null < numbers < strings < objects < arrays < booleans < dates < regular expressions

***Missing fields*** :
A document without the field sorts as if the field were `null`, so it comes first in an
  ascending sort.

***Array fields*** :
A field holding an array sorts by its ***smallest*** element when ascending, and by its
  ***largest*** element when descending.
A field holding `[ 9, 0 ]` sorts as `0` ascending and as `9` descending.

Only one level is looked at.
`[ [ 3, 4 ], [ 1, 2 ] ]` sorts by its inner arrays, as the array `[ 1, 2 ]` ascending.

This is different from comparing two arrays with `CompareValues()`, which goes element by element.
MongoDB also uses different rules for sorting and for comparing.

***Paths through arrays*** :
When the path goes through an array, every element contributes a value, and the smallest or
  largest of them is used.
An element without the field contributes `null`.

```js
// 'a.x' goes through the array at a, then finds [ 0, 7 ] at x.
// The values are 0 and 7, so it sorts as 0 ascending and 7 descending.
let crossed = { a: [ { x: [ 0, 7 ] } ] };

// { a: [ { x: 5 }, { y: 9 } ] } sorted by 'a.x' has the values 5 and null,
// so it sorts as null ascending.
```

***Empty arrays*** :
A field holding `[]` has no elements to sort by, and sorts ***before every other value***,
  including `null` and missing fields.

This is only when the field's array is empty.
An empty array ***inside*** the field's array is a value like any other:

```js
// The values are 3 and [], and [] is larger than any number,
// so this sorts above every number when descending.
let inner = { v: [ 3, [] ] };
```

An empty array which the path has to go ***through*** gives `null`:
  `{ a: [] }` sorted by `'a.x'` sorts with the nulls.


## See Also

- [`Filter( Documents, QueryCriteria )`](./Filter.md)
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md) and its `$sort` stage.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md)


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

### Documents without the field come first
```js
let documents = [ { n: 2 }, { x: 9 }, { n: 1 } ];
jsongin.Sort( documents, { n: 1 } );
// => [ { x: 9 }, { n: 1 }, { n: 2 } ]
```

### Different types are ordered by type
```js
let documents = [ { n: 'abc' }, { n: 5 }, { n: null }, { n: true } ];
jsongin.Sort( documents, { n: 1 } );
// => [ { n: null }, { n: 5 }, { n: 'abc' }, { n: true } ]
```

### Array fields sort by their smallest or largest element
```js
let documents = [ { a: [ 5, 1 ] }, { a: [ 3 ] }, { a: [ 9, 0 ] } ];

jsongin.Sort( documents, { a: 1 } );   // sorts by 1, 3, 0
// => [ { a: [ 9, 0 ] }, { a: [ 5, 1 ] }, { a: [ 3 ] } ]

jsongin.Sort( documents, { a: -1 } );  // sorts by 5, 3, 9
// => [ { a: [ 9, 0 ] }, { a: [ 5, 1 ] }, { a: [ 3 ] } ]
```

### A path through an array uses a value from every element
```js
let documents = [
	{ id: 1, a: [ { x: 3 }, { x: 1 } ] },   // values 3 and 1
	{ id: 2, a: [ { x: 5 }, { y: 9 } ] },   // values 5 and null
	{ id: 3, a: [ { x: [ 0, 7 ] } ] },      // values 0 and 7
];

jsongin.Sort( documents, { 'a.x': 1 } );   // sorts by 1, null, 0
// => [ { id: 2, ... }, { id: 3, ... }, { id: 1, ... } ]

jsongin.Sort( documents, { 'a.x': -1 } );  // sorts by 3, 5, 7
// => [ { id: 3, ... }, { id: 2, ... }, { id: 1, ... } ]
```
