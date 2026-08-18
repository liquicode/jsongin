# @liquicode/jsongin


# Examples: Getting Started

This page walks through the first steps with `jsongin`: including the library,
understanding the engine instance, and running your first [`Query()`](../jsongin/Query.md)
and [`Filter()`](../jsongin/Filter.md) calls against a small collection of documents.

If you have not installed the library yet, see the
[NodeJS Usage](../Usage-NodeJS.md) or [Browser Usage](../Usage-Browser.md) guide.


## Include the Library

The module's default export is a ready-to-use engine ***instance***:

```js
const jsongin = require( '@liquicode/jsongin' );

jsongin.Library.name === '@liquicode/jsongin'
jsongin.Library.version === '0.1.0'
```

One instance is all most applications need. When you want isolated settings or your
own operator registries, build a fresh instance with the `NewJsongin( Settings )`
factory:

```js
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( { OpLog: null } );
```

See [NodeJS Usage](../Usage-NodeJS.md) for the full settings object, and
[OpLog](../OpLog.md) for tracing what the engine does.


## A Collection to Work With

The examples on this page use this small collection of user documents:

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', active: true, age: 30, profile: { city: 'East' }, tags: [ 'staff', 'a' ] },
	{ _id: 2, name: 'Bob', role: 'user', active: false, age: 25, profile: { city: 'West' }, tags: [ 'a' ] },
	{ _id: 3, name: 'Eve', role: 'admin', active: true, age: 40, profile: { city: 'East' }, tags: [ 'staff', 'b' ] },
];
```


## Your First Query

[`Query( Document, Criteria )`](../jsongin/Query.md) tests a single document and
returns `true` when it matches. The simplest criteria is an equality test on a
field:

```js
jsongin.Query( users[ 0 ], { role: 'admin' } ) === true
jsongin.Query( users[ 1 ], { role: 'admin' } ) === false
```

A criteria object is an implicit ***and***: every key must match.

```js
jsongin.Query( users[ 0 ], { role: 'admin', active: true } ) === true
jsongin.Query( users[ 1 ], { role: 'admin', active: true } ) === false
```

Use a query operator for anything beyond equality. Operators are named with a
leading `$` and live in an object whose key is the field:

```js
jsongin.Query( users[ 0 ], { age: { $gt: 18 } } ) === true
jsongin.Query( users[ 1 ], { age: { $gt: 18 } } ) === true
jsongin.Query( users[ 1 ], { active: true, age: { $gt: 18 } } ) === false
```

Reach into nested fields with dot notation:

```js
jsongin.Query( users[ 0 ], { 'profile.city': 'East' } ) === true
jsongin.Query( users[ 1 ], { 'profile.city': 'East' } ) === false
```

A field which holds an array is matched when ***any element*** matches, which is
how MongoDB behaves:

```js
jsongin.Query( users[ 0 ], { tags: 'staff' } ) === true
jsongin.Query( users[ 1 ], { tags: 'staff' } ) === false
```

See [Query Operators](../jsongin/Query-Operators.md) for the full list, including
`$in`, `$regex`, `$elemMatch`, `$expr`, and the logical operators `$and`, `$or`,
`$nor`, and `$not`.


## Your First Filter

[`Filter( Documents, QueryCriteria )`](../jsongin/Filter.md) runs the same query
language across a whole array and returns the matching documents:

```js
jsongin.Filter( users, { role: 'admin' } ).length === 2
jsongin.Filter( users, { 'profile.city': 'East', active: true } ).length === 2
jsongin.Filter( users, { age: { $gte: 30 } } ).length === 2
jsongin.Filter( users, { active: true } ).length === 2
jsongin.Filter( users, { role: 'user' } ).length === 1
```

`Filter` returns the matching document objects themselves; it does not clone them,
so you can keep working with the same references.


## Where to Go Next

- [Reshaping and Updating](./Reshaping-and-Updating.md) — pick fields with
  [`Project()`](../jsongin/Project.md) and change documents with
  [`Update()`](../jsongin/Update.md).
- [First Aggregation Pipeline](./First-Aggregation-Pipeline.md) — chain
  `$match`, `$group`, `$sort`, and more with
  [`Aggregate()`](../jsongin/Aggregate.md).
- [Query & Filter Recipes](./Recipes-Query-Filter.md) — task-oriented recipes for
  matching documents.


## See Also

- [`Query( Document, Criteria )`](../jsongin/Query.md)
- [`Filter( Documents, QueryCriteria )`](../jsongin/Filter.md)
- [Query Operators](../jsongin/Query-Operators.md)
- [NodeJS Usage](../Usage-NodeJS.md)
- [Library Guide](../Library-Guide.md)