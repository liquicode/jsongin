# @liquicode/jsongin


# Distinct( Documents, DistinctCriteria )


## Parameters

| **Parameter**    | **Allowed Types** | **Description**                           |
|------------------|:-----------------:|-------------------------------------------|
| Documents        |        a          | The array of documents to examine.        |
| DistinctCriteria |        o          | The fields used to distinguish documents. |


## Description

Returns the distinct combinations of the named fields found across a set of documents.

`DistinctCriteria` names the fields to look at. Any truthy value selects a field, so `1` and
  `true` mean the same thing. The result is an array of documents holding only those fields,
  one for each combination which appears in the input.

```js
let documents = [
	{ type: 1, category: 'A' },
	{ type: 1, category: 'A' },
	{ type: 2, category: 'B' },
];

jsongin.Distinct( documents, { type: 1 } );
// returns [ { type: 1 }, { type: 2 } ]

jsongin.Distinct( documents, { type: 1, category: 1 } );
// returns [ { type: 1, category: 'A' }, { type: 2, category: 'B' } ]
```

Combinations are returned in the order they were first seen, so the result is deterministic and
  can be compared in a test.


## How Values Are Compared

Values are compared by ***content***, not by reference, and the comparison is type strict.
Each field's key carries its type, so `1` and `'1'` are different values, as are `0` and
  `false`.
This is the same rule the `$group` aggregation stage uses.

```js
jsongin.Distinct( [ { v: 1 }, { v: '1' } ], { v: 1 } );
// returns [ { v: 1 }, { v: '1' } ]
```

A document which does not have a named field contributes a combination without it, which is
  distinct from any combination that has it:

```js
jsongin.Distinct( [ { a: 1 }, { b: 2 } ], { a: 1 } );
// returns [ { a: 1 }, {} ]
```


## Notes

The returned documents are ***clones***, so the result does not alias the documents it was
  built from and can be modified freely.

An empty input gives an empty result.

```js
jsongin.Distinct( [], { a: 1 } );
// returns []
```


## See Also

- [`Filter( Documents, QueryCriteria )`](./Filter.md), which selects documents rather than values.
- [`$group`](./Stage-Operators.md#$group), the aggregation stage which groups by a key.
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md)
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md)


## Examples

### It finds the distinct values of one field
```js
let documents = [
	{ type: 1, category: 'A', title: 'First' },
	{ type: 1, category: 'A', title: 'Second' },
	{ type: 1, category: 'B', title: 'Third' },
	{ type: 2, category: 'B', title: 'Fourth' },
];

jsongin.Distinct( documents, { category: 1 } );
// returns [ { category: 'A' }, { category: 'B' } ]
```

### It finds the distinct combinations of several fields
```js
let documents = [
	{ type: 1, category: 'A', title: 'First' },
	{ type: 1, category: 'A', title: 'Second' },
	{ type: 1, category: 'B', title: 'Third' },
	{ type: 2, category: 'B', title: 'Fourth' },
];

jsongin.Distinct( documents, { type: 1, category: 1 } );
// returns [ { type: 1, category: 'A' }, { type: 1, category: 'B' }, { type: 2, category: 'B' } ]
```

### It accepts true in place of 1
```js
let documents = [ { type: 1 }, { type: 1 }, { type: 2 } ];

jsongin.Distinct( documents, { type: true } );
// returns [ { type: 1 }, { type: 2 } ]
```

### It counts each combination once, however many documents hold it
```js
let documents = [ { v: 'x' }, { v: 'x' }, { v: 'x' }, { v: 'y' } ];

jsongin.Distinct( documents, { v: 1 } ).length === 2
```
