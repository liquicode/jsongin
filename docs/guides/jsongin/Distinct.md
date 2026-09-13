# @liquicode/jsongin


# Distinct( Documents, DistinctCriteria )


## Parameters

| **Parameter**    | **Allowed Types** | **Description**                           |
|------------------|:-----------------:|-------------------------------------------|
| Documents        |        a          | The documents to look through.            |
| DistinctCriteria |        o          | The fields to compare, as `{ field: 1 }`. |


## Description

Returns one document for each distinct combination of values found in the named fields.

Each key of `DistinctCriteria` names a field, and can be a dot notation path.
Only the keys are used, so `{ type: 1 }` and `{ type: true }` mean the same thing.
Each result document holds only the named fields.

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

Results come back in the order each combination first appears.

`Distinct` throws if `Documents` is not an array or `DistinctCriteria` is not an object.


## How Values Are Compared

Values are compared by ***content and type***.
`1` and `'1'` are different values, and so are `0` and `false`, and a date and its ISO string.
The `$group` stage compares values the same way.

```js
jsongin.Distinct( [ { v: 1 }, { v: '1' } ], { v: 1 } );
// returns [ { v: 1 }, { v: '1' } ]
```

A document without a named field counts as its own combination, separate from one where the
  field is `null`.
In the result, that field holds `undefined`:

```js
jsongin.Distinct( [ { a: 1 }, { b: 2 } ], { a: 1 } );
// returns [ { a: 1 }, { a: undefined } ]
```


## Notes

The result documents are ***copies***, so you can change them without affecting `Documents`.

An empty array gives an empty result.

```js
jsongin.Distinct( [], { a: 1 } );
// returns []
```


## See Also

- [`Filter( Documents, QueryCriteria )`](./Filter.md), which selects whole documents.
- [`$group`](./Stage-Operators.md#$group), the pipeline stage which groups documents by a value.
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

### It returns each combination once
```js
let documents = [ { v: 'x' }, { v: 'x' }, { v: 'x' }, { v: 'y' } ];

jsongin.Distinct( documents, { v: 1 } ).length === 2
```
