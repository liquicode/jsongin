# @liquicode/jsongin


# Distinct( Documents, DistinctCriteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        a          | The array of documents to filter.        |
| DistinctCriteria |        o       | The fields used to distinguish documents. |


## Description

Finds the distinct values of a set of fields in array of documents and returns an array of those distinct values.


## See Also

- [`Query( Document, Criteria )`](./Query.md)


## Examples

```js
let documents = [
	{ type: 1, category: 'A', title: 'First' },
	{ type: 1, category: 'A', title: 'Second' },
	{ type: 1, category: 'B', title: 'Third' },
	{ type: 1, category: 'A', title: 'Fourth' },
	{ type: 2, category: 'B', title: 'Fifth' },
	{ type: 2, category: 'B', title: 'Sixth' },
	{ type: 2, category: 'A', title: 'Seventh' },
	{ type: 2, category: 'A', title: 'Eighth' },
];
let result = jsongin.Distinct( documents, { type: true, category: true } );
result === [
		{ type: 1, category: 'A' },
		{ type: 1, category: 'B' },
		{ type: 2, category: 'B' },
		{ type: 2, category: 'A' },
	]
```