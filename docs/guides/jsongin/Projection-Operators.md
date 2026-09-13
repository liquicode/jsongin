# @liquicode/jsongin


# Projection Operators

The operators which can be used as a field's value in a [`Project()`](./Project.md) projection.

The [`$project`](./Stage-Operators.md#$project) pipeline stage does not use these.
Inside a stage, `$slice` is the [expression operator](./Expression-Operators.md) of that name.

MongoDB has four projection operators. `jsongin` supports two, and throws on the other two.

| **Operator**                  | **Supported** | **Usage**                                        |
|-------------------------------|:-------------:|--------------------------------------------------|
| [`$slice`](#$slice)           |      Yes      | `{ field: { $slice: count } }`                   |
| [`$elemMatch`](#$elemMatch)   |      Yes      | `{ field: { $elemMatch: criteria } }`            |
| [`$`](#$)                     |       -       | `{ 'field.$': 1 }`                               |
| [`$meta`](#$meta)             |       -       | `{ field: { $meta: 'textScore' } }`              |

A value which is not an include (`1`, `true`), an exclude (`0`, `false`), or one of these operators
  is a ***computed field***, evaluated as an expression.
See [`Project()`](./Project.md) and [Expression Operators](./Expression-Operators.md).

A projection either includes fields or excludes them, never both.
`$elemMatch` counts as an inclusion. `$slice` does not, so it can be used beside exclusions.

The examples below use this document:

```js
let document =
{
	_id: 1,
	name: 'Alice',
	scores: [ 10, 20, 30, 40 ],
	items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ],
};
```


<a id="$slice"></a>$slice
---------------------------------------------------------------------

**Usage** : `{ field: { $slice: count } }` or `{ field: { $slice: [ skip, limit ] } }`

Returns part of an array field.

A positive `count` takes elements from the start, and a negative `count` takes them from the end.
`[ skip, limit ]` skips `skip` elements and then takes `limit` elements.
A negative `skip` counts back from the end.

`$slice` is not an inclusion, so the rest of the document is returned as it is.

A field which is not an array is left unchanged.

### Example
```js
jsongin.Project( document, { scores: { $slice: 2 } } );
// returns { _id: 1, name: 'Alice', scores: [ 10, 20 ], items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ] }

// A negative count takes from the end.
jsongin.Project( document, { scores: { $slice: -2 } } );
// returns { _id: 1, name: 'Alice', scores: [ 30, 40 ], items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ] }

// [ skip, limit ]
jsongin.Project( document, { scores: { $slice: [ 1, 2 ] } } );
// returns { _id: 1, name: 'Alice', scores: [ 20, 30 ], items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ] }

// It can be used beside an exclusion.
jsongin.Project( document, { name: 0, scores: { $slice: 2 } } );
// returns { _id: 1, scores: [ 10, 20 ], items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ] }
```


<a id="$elemMatch"></a>$elemMatch
---------------------------------------------------------------------

**Usage** : `{ field: { $elemMatch: criteria } }`

Returns only the ***first*** element of an array field which matches `criteria`.
`criteria` is an ordinary query; see [Query Operators](./Query-Operators.md).

`$elemMatch` is an inclusion, so on its own it returns only `_id` and the field.
If no element matches, the field is left out.

This is the ***projection*** `$elemMatch`.
The [query `$elemMatch`](./Query-Operators.md#$elemMatch) is a different operator, which selects
  documents instead of reshaping them.

### Example
```js
jsongin.Project( document, { items: { $elemMatch: { qty: { $gt: 5 } } } } );
// returns { _id: 1, items: [ { sku: 'b', qty: 9 } ] }

// Nothing matched, so the field is left out.
jsongin.Project( document, { items: { $elemMatch: { qty: { $gt: 99 } } } } );
// returns { _id: 1 }
```


<a id="$"></a>$
---------------------------------------------------------------------

**Usage** : `{ 'field.$': 1 }`  ***(not supported)***

In MongoDB, this returns the first array element which matched the query that found the
  document.
`Project()` is given a document, not a query, so there is no matched element to return.
It throws.

### Example
```js
jsongin.Project( document, { 'items.$': 1 } );      // throws, $ is not supported
jsongin.Project( document, { items: { $: 1 } } );   // throws, $ is not supported
```


<a id="$meta"></a>$meta
---------------------------------------------------------------------

**Usage** : `{ field: { $meta: 'textScore' } }`  ***(not supported)***

In MongoDB, this returns information the server produced while running the query, such as a
  text search score.
`jsongin` has no such information, so it throws.

### Example
```js
jsongin.Project( document, { score: { $meta: 'textScore' } } );   // throws, $meta is not supported
```


## See Also

- [`Project( Document, Projection )`](./Project.md)
- [Query Operators](./Query-Operators.md), for the criteria `$elemMatch` takes
- [Expression Operators](./Expression-Operators.md), for computed fields
- [Operator Reference](../Operator-Reference.md)
