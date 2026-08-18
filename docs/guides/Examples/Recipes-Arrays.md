# @liquicode/jsongin


# Recipes: Arrays

Arrays are where MongoDB's matching rules get interesting. This page collects the
query, update, and aggregation recipes that work with array fields in one place.

The recipes use this collection:

```js
let users = [
	{ _id: 1, name: 'Alice', tags: [ 'staff', 'a' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] },
	{ _id: 2, name: 'Bob', tags: [ 'a' ], orders: [ { id: 3, total: 5 } ] },
	{ _id: 3, name: 'Eve', tags: [ 'staff', 'b' ], orders: [ { id: 4, total: 15 } ] },
];
```


## Querying Arrays


### Match when any element equals

A plain value against an array field matches when the whole array equals the value
***or*** when any one element does:

```js
jsongin.Query( users[ 0 ], { tags: 'staff' } ) === true
jsongin.Query( users[ 1 ], { tags: 'staff' } ) === false
```


### Match any of several values with `$in`

`$in` matches when any element is in the list:

```js
jsongin.Query( users[ 0 ], { tags: { $in: [ 'a', 'z' ] } } ) === true
jsongin.Query( users[ 1 ], { tags: { $in: [ 'staff', 'z' ] } } ) === false
```


### Require every value with `$all`

`$all` matches when the array contains every listed value:

```js
jsongin.Query( users[ 0 ], { tags: { $all: [ 'staff', 'a' ] } } ) === true
jsongin.Query( users[ 1 ], { tags: { $all: [ 'staff', 'a' ] } } ) === false
```


### Match the length with `$size`

`$size` matches an array with exactly that many elements:

```js
jsongin.Query( users[ 0 ], { tags: { $size: 2 } } ) === true
jsongin.Query( users[ 1 ], { tags: { $size: 2 } } ) === false
```


### Test one element with `$elemMatch`

`$elemMatch` matches when at least one element satisfies a sub-query. Find users
with an order over 20:

```js
jsongin.Query( users[ 0 ], { orders: { $elemMatch: { total: { $gt: 20 } } } } ) === true
jsongin.Query( users[ 2 ], { orders: { $elemMatch: { total: { $gt: 20 } } } } ) === false
```

Several sub-criteria combine with an implicit "and", so they apply to the same
element:

```js
jsongin.Query( users[ 0 ], { orders: { $elemMatch: { total: { $gt: 10 }, id: { $lt: 3 } } } } ) === true
```


### Ask whether the field is an array with `$type`

`$type: 'array'` matches a field which is itself an array:

```js
jsongin.Query( users[ 0 ], { tags: { $type: 'array' } } ) === true
```


## Updating Arrays


### Append with `$push`

`$push` appends a value to the end of an array:

```js
jsongin.Update( users[ 0 ], { $push: { tags: 'c' } } )
// returns { _id: 1, name: 'Alice', tags: [ 'staff', 'a', 'c' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```


### Remove an end with `$pop`

`$pop: 1` removes the last element; `$pop: -1` removes the first:

```js
jsongin.Update( users[ 0 ], { $pop: { tags: 1 } } )
// returns { _id: 1, name: 'Alice', tags: [ 'staff' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```

```js
jsongin.Update( users[ 0 ], { $pop: { tags: -1 } } )
// returns { _id: 1, name: 'Alice', tags: [ 'a' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```


### Append only when absent with `$addToSet`

`$addToSet` appends a value only when it is not already in the array:

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'staff' } } )
// returns { _id: 1, name: 'Alice', tags: [ 'staff', 'a' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'z' } } )
// returns { _id: 1, name: 'Alice', tags: [ 'staff', 'a', 'z' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```


### Remove every occurrence with `$pullAll`

`$pullAll` removes every element that equals any value in the list:

```js
jsongin.Update( users[ 0 ], { $pullAll: { tags: [ 'a' ] } } )
// returns { _id: 1, name: 'Alice', tags: [ 'staff' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] }
```


## Aggregating Arrays


### One document per element with `$unwind`

`$unwind: '$path'` produces one output document for each element of the array:

```js
jsongin.Aggregate( users, [ { $unwind: '$tags' }, { $project: { _id: 1, tags: 1 } } ] )
// returns [ { _id: 1, tags: 'staff' }, { _id: 1, tags: 'a' }, { _id: 2, tags: 'a' }, { _id: 3, tags: 'staff' }, { _id: 3, tags: 'b' } ]
```

`$unwind` on an array of sub-documents gives one document per sub-document, with
the sub-document promoted to the path:

```js
jsongin.Aggregate( users, [ { $unwind: '$orders' }, { $project: { _id: 1, 'orders.id': 1, 'orders.total': 1 } } ] )
// returns [ { _id: 1, orders: { id: 1, total: 10 } }, { _id: 1, orders: { id: 2, total: 25 } }, { _id: 2, orders: { id: 3, total: 5 } }, { _id: 3, orders: { id: 4, total: 15 } } ]
```


## Array Expressions

The expression operators work on arrays too. These use
[`Evaluate()`](../jsongin/Evaluate.md) directly so you can see each result.


### Read one element with `$arrayElemAt`

`$arrayElemAt: [ array, index ]` returns the element at that index. A negative
index counts from the end:

```js
jsongin.Evaluate( users[ 0 ], { $arrayElemAt: [ '$tags', 0 ] } ) === 'staff'
jsongin.Evaluate( users[ 0 ], { $arrayElemAt: [ '$tags', -1 ] } ) === 'a'
```


### Concatenate arrays with `$concatArrays`

`$concatArrays` joins arrays end to end:

```js
jsongin.Evaluate( users[ 0 ], { $concatArrays: [ '$tags', [ 'x' ] ] } )
// returns [ 'staff', 'a', 'x' ]
```


### Count elements with `$size`

`$size` returns the length of an array:

```js
jsongin.Evaluate( users[ 0 ], { $size: '$tags' } ) === 2
```


### Test membership with `$in`

`$in: [ value, array ]` returns whether the value is in the array:

```js
jsongin.Evaluate( users[ 0 ], { $in: [ 'a', '$tags' ] } ) === true
jsongin.Evaluate( users[ 0 ], { $in: [ 'z', '$tags' ] } ) === false
```


## Reach an Element by Index in a Path

[`GetValue()`](../jsongin/GetValue.md) follows a numeric segment as an array index:

```js
jsongin.GetValue( users[ 0 ], 'tags.1' ) === 'a'
jsongin.GetValue( users[ 0 ], 'orders.1.total' ) === 25
```

[`SetValue()`](../jsongin/SetValue.md) writes an element by index when the array is
already there:

```js
let doc = { tags: [ 'a', 'b' ] };
jsongin.SetValue( doc, 'tags.1', 'B' ) === true
JSON.stringify( doc ) === '{"tags":["a","B"]}'
```


## See Also

- [`Query( Document, Criteria )`](../jsongin/Query.md) and
  [Query Operators](../jsongin/Query-Operators.md)
- [`Update( Document, Updates )`](../jsongin/Update.md) and
  [Update Operators](../jsongin/Update-Operators.md)
- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md)
- [`Evaluate( Document, Expression )`](../jsongin/Evaluate.md) and
  [Expression Operators](../jsongin/Expression-Operators.md)
- [`GetValue()`](../jsongin/GetValue.md), [`SetValue()`](../jsongin/SetValue.md)