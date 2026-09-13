# @liquicode/jsongin


# Filter( Documents, QueryCriteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        a          | The documents to filter.                 |
| QueryCriteria |        o          | The query each document must match.      |


## Description

Returns a new array holding the documents which match `QueryCriteria`.

Each document is tested with [`Query()`](./Query.md), so any query works as a filter.
An element of `Documents` which is not an object never matches.

The result holds the ***original documents***, not copies.
`Filter` does not change `Documents` or anything in it, but if you change a document in the
  result, you are changing the one in `Documents` too.

An empty criteria, `{}`, matches every document.

`Filter` throws when `Documents` is not an array, when `QueryCriteria` is not an object, or when
  the query is malformed.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`Sort( Documents, SortCriteria )`](./Sort.md)
- [`Distinct( Documents, DistinctCriteria )`](./Distinct.md)
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md) and its `$match` stage, which filters inside
  a pipeline.


## Examples

```js
let documents = [
	{ id: 1, type: 'A', qty: 5, tags: [ 'x' ] },
	{ id: 2, type: 'B', qty: 12, tags: [ 'y', 'x' ] },
	{ id: 3, type: 'A', qty: 12, tags: [] },
];
```


### It filters on a field value
```js
let result = jsongin.Filter( documents, { type: 'A' } );
// result is [
// 	{ id: 1, type: 'A', qty: 5, tags: [ 'x' ] },
// 	{ id: 3, type: 'A', qty: 12, tags: [] },
// ]
```


### It filters with query operators
```js
let result = jsongin.Filter( documents, { qty: { $gt: 10 } } );
// => documents 2 and 3
```


### It matches an array field by its elements
```js
let result = jsongin.Filter( documents, { tags: 'x' } );
// => documents 1 and 2
```


### It filters with an expression
```js
// Compare a field to another field, or to a computed value.
let result = jsongin.Filter( documents, { $expr: { $gt: [ '$qty', 10 ] } } );
// => documents 2 and 3
```


### An empty criteria matches everything
```js
jsongin.Filter( documents, {} ).length === 3
```


### No matches gives an empty array
```js
// jsongin.Filter( documents, { type: 'Z' } ) returns []
```
