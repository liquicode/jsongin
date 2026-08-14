# @liquicode/jsongin


# Filter( Documents, QueryCriteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        a          | The array of documents to filter.        |
| QueryCriteria |        o          | The query criteria used to perform the filter. |


## Description

Applies a filter to an array of documents and returns an array of the filtered results.

Each document is tested with [`Query()`](./Query.md), so anything you can write as a query you
  can write as a filter.

`Filter` returns a ***new array*** holding the ***original documents***, not copies of them.
Neither the given array nor the documents within it are modified, but modifying a document in
  the result also modifies the one in the source array.

An empty criteria `{}` matches every document.
`Filter` throws when `Documents` is not an array.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`Sort( Documents, SortCriteria )`](./Sort.md)
- [`Distinct( Documents, DistinctCriteria )`](./Distinct.md)
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md) and its `$match` stage, which does the
  same thing as part of a pipeline.


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


### It matches array fields by their elements
```js
let result = jsongin.Filter( documents, { tags: 'x' } );
// => documents 1 and 2
```


### It filters with an expression
```js
// Compare one field to another, or to a computed value.
let result = jsongin.Filter( documents, { $expr: { $gt: [ '$qty', 10 ] } } );
// => documents 2 and 3
```


### An empty criteria matches everything
```js
jsongin.Filter( documents, {} ).length === 3
```


### No matches returns an empty array
```js
// jsongin.Filter( documents, { type: 'Z' } ) returns []
```
