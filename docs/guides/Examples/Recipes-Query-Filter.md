# @liquicode/jsongin


# Recipes: Query & Filter

Task-oriented recipes for matching documents with [`Query()`](../jsongin/Query.md)
and selecting from a collection with [`Filter()`](../jsongin/Filter.md). Each
recipe is self-contained.

The recipes use this collection:

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', active: true, age: 30, score: 50, tags: [ 'staff', 'a' ], orders: [ { id: 1, total: 10 }, { id: 2, total: 25 } ] },
	{ _id: 2, name: 'Bob', role: 'user', active: false, age: 25, score: 20, tags: [ 'a' ], orders: [ { id: 3, total: 5 } ] },
	{ _id: 3, name: 'Eve', role: 'admin', active: true, age: 40, score: 90, tags: [ 'staff', 'b' ], orders: [ { id: 4, total: 15 } ] },
];
```


### Find the active admins

A criteria object is an implicit ***and***, so multiple keys all must match:

```js
jsongin.Filter( users, { role: 'admin', active: true } ).length === 2
```


### Match any of several tags with `$in`

`$in` matches when the field equals any value in the list. Against an array
field, it matches when any element is in the list:

```js
jsongin.Query( users[ 0 ], { tags: { $in: [ 'a', 'z' ] } } ) === true
jsongin.Query( users[ 1 ], { tags: { $in: [ 'staff', 'z' ] } } ) === false
```


### Search a name with `$regex`

`$regex` matches a string field against a pattern:

```js
jsongin.Query( users[ 0 ], { name: { $regex: '^Al' } } ) === true
```

Add `$options: 'i'` for a case-insensitive match:

```js
jsongin.Query( users[ 1 ], { name: { $regex: 'bob', $options: 'i' } } ) === true
```


### Match a nested array element with `$elemMatch`

`$elemMatch` tests an element of an array field against its own sub-query. Find
users who have at least one order with a total over 20:

```js
jsongin.Query( users[ 0 ], { orders: { $elemMatch: { total: { $gt: 20 } } } } ) === true
jsongin.Query( users[ 2 ], { orders: { $elemMatch: { total: { $gt: 20 } } } } ) === false
```


### Compare two fields with `$expr`

`$expr` lets a query compare fields to each other, using the
[expression](../jsongin/Expression-Operators.md) language. Find users whose
`score` is greater than their `age`:

```js
jsongin.Query( users[ 0 ], { $expr: { $gt: [ '$score', '$age' ] } } ) === true
jsongin.Query( users[ 1 ], { $expr: { $gt: [ '$score', '$age' ] } } ) === false
```


### Combine criteria with `$or` and `$nor`

`$or` matches when any sub-query matches. Bob is neither active nor an admin:

```js
jsongin.Query( users[ 1 ], { $or: [ { active: true }, { role: 'admin' } ] } ) === false
```

`$nor` matches when no sub-query matches:

```js
jsongin.Query( users[ 1 ], { $nor: [ { active: true }, { role: 'admin' } ] } ) === true
```


### Test whether a field is present with `$exists`

`$exists: true` matches documents that carry the field (even when its value is
`null`); `$exists: false` matches documents that do not:

```js
jsongin.Query( users[ 0 ], { score: { $exists: true } } ) === true
jsongin.Query( users[ 0 ], { missing: { $exists: true } } ) === false
```


### Filter a whole collection

[`Filter()`](../jsongin/Filter.md) runs the same query language across an array
and returns the matching documents. Find everyone carrying the `staff` tag:

```js
jsongin.Filter( users, { tags: 'staff' } ).length === 2
```


### Make the "and" explicit with `$and`

Multiple keys in one criteria object already mean "and". `$and` makes it explicit,
which is useful when two conditions apply to the same field:

```js
jsongin.Query( users[ 0 ], { $and: [ { role: 'admin' }, { active: true } ] } ) === true
```


### Negate with `$not`

`$not` inverts the operator it wraps:

```js
jsongin.Query( users[ 0 ], { age: { $not: { $gt: 50 } } } ) === true
jsongin.Query( users[ 0 ], { age: { $not: { $gt: 25 } } } ) === false
```


### Match a range with `$gte` and `$lte`

Two comparison operators on one field select a range:

```js
jsongin.Query( users[ 0 ], { age: { $gte: 30, $lte: 40 } } ) === true
jsongin.Query( users[ 1 ], { age: { $gte: 30, $lte: 40 } } ) === false
```


### Exclude values with `$nin`

`$nin` matches when the field is none of the listed values:

```js
jsongin.Query( users[ 0 ], { tags: { $nin: [ 'z' ] } } ) === true
jsongin.Query( users[ 0 ], { tags: { $nin: [ 'staff' ] } } ) === false
```


### Require every value with `$all`

`$all` matches when the array field contains every listed value:

```js
jsongin.Query( users[ 0 ], { tags: { $all: [ 'staff', 'a' ] } } ) === true
jsongin.Query( users[ 1 ], { tags: { $all: [ 'staff', 'a' ] } } ) === false
```


### Match an array's length with `$size`

`$size` matches an array field with exactly that many elements:

```js
jsongin.Query( users[ 0 ], { tags: { $size: 2 } } ) === true
jsongin.Query( users[ 1 ], { tags: { $size: 2 } } ) === false
```


### Select by type with `$type`

`$type` matches a field whose value is of a named BSON type. `'number'` is an
alias for every numeric type:

```js
jsongin.Query( users[ 0 ], { age: { $type: 'number' } } ) === true
jsongin.Query( users[ 0 ], { name: { $type: 'string' } } ) === true
jsongin.Query( users[ 0 ], { tags: { $type: 'array' } } ) === true
```


### Match an array element on several fields with `$elemMatch`

`$elemMatch` can test an array element against more than one sub-criteria at once.
Find users with an order whose `total` is over 10 and whose `id` is under 3:

```js
jsongin.Query( users[ 0 ], { orders: { $elemMatch: { total: { $gt: 10 }, id: { $lt: 3 } } } } ) === true
jsongin.Query( users[ 2 ], { orders: { $elemMatch: { total: { $gt: 10 }, id: { $lt: 3 } } } } ) === false
```


### Combine expressions with `$expr` and `$and`

`$expr` can hold a logical expression, so two field comparisons combine into one
query. Find users whose `score` beats their `age` and is under 100:

```js
jsongin.Query( users[ 0 ], { $expr: { $and: [ { $gt: [ '$score', '$age' ] }, { $lt: [ '$score', 100 ] } ] } } ) === true
jsongin.Query( users[ 1 ], { $expr: { $and: [ { $gt: [ '$score', '$age' ] }, { $lt: [ '$score', 100 ] } ] } } ) === false
```


### Sort a collection with `Sort()`

[`Sort( Documents, SortCriteria )`](../jsongin/Sort.md) orders documents by one or
more fields. `1` is ascending, `-1` is descending. It sorts the array ***in place***,
so pass it a fresh array when you do not want to reorder the original:

```js
let sorted = jsongin.Sort(
	[ { name: 'Alice', age: 30 }, { name: 'Eve', age: 40 }, { name: 'Bob', age: 25 } ],
	{ age: -1 }
);
sorted[ 0 ].name === 'Eve'
sorted[ 2 ].name === 'Bob'
```


### List the distinct values with `Distinct()`

[`Distinct( Documents, DistinctCriteria )`](../jsongin/Distinct.md) returns one
document per distinct combination of the fields you name. The criteria is an object
mapping each field path to `1`:

```js
jsongin.Sort( jsongin.Distinct( users, { role: 1 } ), { role: 1 } )
// returns [ { role: 'admin' }, { role: 'user' } ]
```

Two fields give one row per combination:

```js
jsongin.Sort( jsongin.Distinct( users, { role: 1, active: 1 } ), { role: 1, active: 1 } )
// returns [ { role: 'admin', active: true }, { role: 'user', active: false } ]
```


### Filter, then sort

`Filter` returns a new array, so you can sort it without disturbing the original
collection. The active users, oldest first:

```js
let top = jsongin.Sort( jsongin.Filter( users, { active: true } ), { age: -1 } );
top[ 0 ].name === 'Eve'
top[ 1 ].name === 'Alice'
```


## See Also

- [`Query( Document, Criteria )`](../jsongin/Query.md)
- [`Filter( Documents, QueryCriteria )`](../jsongin/Filter.md)
- [Query Operators](../jsongin/Query-Operators.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [Getting Started](./Getting-Started.md)