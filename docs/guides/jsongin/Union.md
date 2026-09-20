# @liquicode/jsongin


# Union( Documents, UnionDocuments )


## Parameters

| **Parameter**  | **Allowed Types** | **Description**                                                   |
|----------------|:-----------------:|---------------------------------------------------------------------|
| Documents      |       a o         | The documents to start with. One document is taken as a set of one. |
| UnionDocuments |       a o         | The documents to add after them.                                    |


## Description

Returns one set of documents after another, in a new array.

```js
jsongin.Union( [ { Id: 1 }, { Id: 2 } ], [ { Id: 3 } ] );
// returns [ { Id: 1 }, { Id: 2 }, { Id: 3 } ]
```

***This is a concatenation, not a set union.***
Nothing is de-duplicated, and two documents which are identical both come back:

```js
jsongin.Union( [ { Id: 1 } ], [ { Id: 1 }, { Id: 2 } ] );
// returns [ { Id: 1 }, { Id: 1 }, { Id: 2 } ]
```

That is what MongoDB's
  [`$unionWith`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unionWith/)
  stage does: measured against MongoDB 8.3.8, a document repeated across two collections came
  back twice, `_id` and all.

Use [`Distinct()`](./Distinct.md) to reduce what a union gathers:

```js
let united = jsongin.Union( [ { Id: 1 } ], [ { Id: 1 }, { Id: 2 } ] );

jsongin.Distinct( united, { Id: 1 } );
// returns [ { Id: 1 }, { Id: 2 } ]
```


## Notes

***The documents are the caller's own.***
The array is new, and nothing in it is copied, so writing into a document of the result writes
  into the document which was passed in.
`Union` selects documents rather than producing them, which is the rule
  [`Filter()`](./Filter.md) states for the whole library.

Either side may be a single document, which is taken as a set of one.

`Union` throws when either side is not an array of documents or a document.


## See Also

- [`Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )`](./Join.md), which
  matches two sets of documents against each other rather than putting them end to end.
- [`Distinct( Documents, DistinctCriteria )`](./Distinct.md)
- [`Filter( Documents, QueryCriteria )`](./Filter.md)
- [`$setUnion`](./Expression-Operators.md#$setUnion), the expression operator, which treats two
  ***arrays of values*** as sets and does remove duplicates.


## Examples

### It puts one set after another
```js
jsongin.Union( [ { Side: 'left' } ], [ { Side: 'right' } ] );
// returns [ { Side: 'left' }, { Side: 'right' } ]
```

### An empty set adds nothing
```js
jsongin.Union( [ { Id: 1 } ], [] );
// returns [ { Id: 1 } ]
```

### One document on either side
```js
jsongin.Union( { Id: 1 }, { Id: 2 } );
// returns [ { Id: 1 }, { Id: 2 } ]
```

### The documents are not copied
```js
let documents = [ { Id: 1 } ];
let united = jsongin.Union( documents, [] );

united[ 0 ] === documents[ 0 ]
```
