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


## See Also

- [`Query( Document, Criteria )`](../jsongin/Query.md)
- [`Filter( Documents, QueryCriteria )`](../jsongin/Filter.md)
- [Query Operators](../jsongin/Query-Operators.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [Getting Started](./Getting-Started.md)