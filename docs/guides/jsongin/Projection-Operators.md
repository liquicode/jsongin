# @liquicode/jsongin


# Projection Operators

The operators which may appear as the value of a field in a projection, read by
  [`Project()`](./Project.md) and by the `$project` aggregation stage.

MongoDB defines four. `jsongin` implements two of them and refuses the other two by name.

| **Operator**                  | **Supported** | **Usage**                                        |
|-------------------------------|:-------------:|--------------------------------------------------|
| [`$slice`](#$slice)           |      Yes      | `{ field: { $slice: count } }`                   |
| [`$elemMatch`](#$elemMatch)   |      Yes      | `{ field: { $elemMatch: criteria } }`            |
| [`$`](#$)                     |       -       | `{ 'field.$': 1 }`                               |
| [`$meta`](#$meta)             |       -       | `{ field: { $meta: 'textScore' } }`              |

A projection field whose value is neither `1`/`true`, `0`/`false`, nor one of these operators is
  a ***computed field***, evaluated as an expression. See
  [`Project()`](./Project.md) and [Expression Operators](./Expression-Operators.md).

***Whether an operator makes a projection an inclusion matters***, because a projection is
  either an inclusion or an exclusion and never both.
`$elemMatch` is an inclusion; `$slice` is not, which is what lets `$slice` sit beside exclusions.

This document is used by the examples below:

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

A positive `count` takes from the front and a negative one takes from the end.
The `[ skip, limit ]` pair skips that many elements and then takes that many.

***`$slice` does not make a projection an inclusion.***
The rest of the document comes back untouched, which is what lets a `$slice` sit beside
  exclusions in the same projection.

A field which is not an array is left alone rather than refused.

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

// It sits beside an exclusion, because it is not an inclusion itself.
jsongin.Project( document, { name: 0, scores: { $slice: 2 } } );
// returns { _id: 1, scores: [ 10, 20 ], items: [ { sku: 'a', qty: 1 }, { sku: 'b', qty: 9 } ] }
```


<a id="$elemMatch"></a>$elemMatch
---------------------------------------------------------------------

**Usage** : `{ field: { $elemMatch: criteria } }`

Returns only the ***first*** element of an array field which matches the criteria.
The criteria is an ordinary query criteria — see
  [Query Operators](./Query-Operators.md).

***`$elemMatch` does make a projection an inclusion***, so only `_id` and the named fields come
  back.
When no element matches, the field is omitted rather than coming back empty.

This is the ***projection*** `$elemMatch`. There is also a
  [query `$elemMatch`](./Query-Operators.md#$elemMatch), which selects documents rather than
  reshaping them.

### Example
```js
jsongin.Project( document, { items: { $elemMatch: { qty: { $gt: 5 } } } } );
// returns { _id: 1, items: [ { sku: 'b', qty: 9 } ] }

// Nothing matched, so the field is omitted.
jsongin.Project( document, { items: { $elemMatch: { qty: { $gt: 99 } } } } );
// returns { _id: 1 }
```


<a id="$"></a>$
---------------------------------------------------------------------

**Usage** : `{ 'field.$': 1 }`  ***(not supported)***

In MongoDB, the positional operator projects the first array element which matched the ***query***
  that selected the document.
`jsongin` does not support it, because [`Project()`](./Project.md) reshapes a document it is
  handed directly and has no query to take a matched position from.

Written as an operator document it is refused by name:

### Example
```js
jsongin.Project( document, { items: { $: 1 } } );   // throws, $ is not supported

// Written as a path element it is not an operator at all, and '$' is read as
// an ordinary field name, which no document has.
jsongin.Project( document, { 'items.$': 1 } );
// returns { _id: 1, items: [ {}, {} ] }
```


<a id="$meta"></a>$meta
---------------------------------------------------------------------

**Usage** : `{ field: { $meta: 'textScore' } }`  ***(not supported)***

In MongoDB, `$meta` projects metadata the server produced while running the query, such as a
  full-text search score.
`jsongin` has no such metadata, so there is nothing for it to return, and it is refused by name.

### Example
```js
jsongin.Project( document, { score: { $meta: 'textScore' } } );   // throws, $meta is not supported
```


## See Also

- [`Project( Document, Projection )`](./Project.md)
- [Query Operators](./Query-Operators.md), for the criteria `$elemMatch` takes
- [Expression Operators](./Expression-Operators.md), for computed fields
- [Operator Reference](../Operator-Reference.md)
