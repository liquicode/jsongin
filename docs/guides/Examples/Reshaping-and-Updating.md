# @liquicode/jsongin


# Examples: Reshaping and Updating

This page picks up from [Getting Started](./Getting-Started.md) and shows the two
functions that change a document's shape:

- [`Project( Document, Projection )`](../jsongin/Project.md) returns a copy with
  only the fields you ask for, plus computed fields.
- [`Update( Document, Updates )`](../jsongin/Update.md) returns a copy with the
  MongoDB update operators (`$set`, `$inc`, `$push`, ...) applied.

Both leave the original document untouched.


## A Collection to Work With

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', age: 30, tags: [ 'staff', 'a' ] },
	{ _id: 2, name: 'Bob', role: 'user', age: 25, tags: [ 'a' ] },
];
```


## Project: Pick Fields

Set a field to `1` to include it. The `_id` field is included by default:

```js
jsongin.Project( users[ 0 ], { name: 1, role: 1 } )
// returns { _id: 1, name: 'Alice', role: 'admin' }
```

Set `_id` to `0` to drop it:

```js
jsongin.Project( users[ 0 ], { _id: 0, name: 1 } )
// returns { name: 'Alice' }
```

Set a field to `0` to exclude it. Exclusion mode returns every field ***except***
the ones you list:

```js
jsongin.Project( users[ 0 ], { tags: 0 } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30 }
```

> MongoDB does not allow mixing inclusion and exclusion on the same projection
> (except for `_id`). `jsongin` follows that rule and throws on a mixed
> projection. See [`Project()`](../jsongin/Project.md).


## Project: Computed Fields

A field whose value is an ***expression object*** is computed. The moment a
projection contains a computed field it behaves in inclusion mode: only `_id` and
the fields you name appear.

Expressions use the same language as [`Evaluate()`](../jsongin/Evaluate.md):
prefix a field reference with `$`, and operators begin with `$`.

```js
jsongin.Project( users[ 0 ], { age_next: { $add: [ '$age', 1 ] } } )
// returns { _id: 1, age_next: 31 }
```

```js
jsongin.Project( users[ 0 ], { is_admin: { $eq: [ '$role', 'admin' ] } } )
// returns { _id: 1, is_admin: true }
```

`$cond` picks between two values:

```js
jsongin.Project( users[ 0 ], { status: { $cond: [ { $eq: [ '$age', 30 ] }, 'senior', 'junior' ] } } )
// returns { _id: 1, status: 'senior' }
```

Mix an included field with a computed one:

```js
jsongin.Project( users[ 0 ], { name: 1, age_next: { $add: [ '$age', 1 ] } } )
// returns { _id: 1, name: 'Alice', age_next: 31 }
```

See [Expression Operators](../jsongin/Expression-Operators.md) for the full set,
including `$cond`, `$ifNull`, `$switch`, and the arithmetic and comparison
operators.


## Update: Change a Document

[`Update()`](../jsongin/Update.md) applies MongoDB update operators and returns a
***new*** document. The original is not modified.

`$set` writes a value:

```js
jsongin.Update( users[ 0 ], { $set: { age: 31 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 31, tags: [ 'staff', 'a' ] }
```

`$inc` adds to a number:

```js
jsongin.Update( users[ 0 ], { $inc: { age: 1 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 31, tags: [ 'staff', 'a' ] }
```

`$unset` removes a field:

```js
jsongin.Update( users[ 0 ], { $unset: { tags: '' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30 }
```

`$rename` moves a field to a new key:

```js
jsongin.Update( users[ 0 ], { $rename: { name: 'full_name' } } )
// returns { _id: 1, role: 'admin', age: 30, tags: [ 'staff', 'a' ], full_name: 'Alice' }
```

`$push` appends to an array:

```js
jsongin.Update( users[ 0 ], { $push: { tags: 'c' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, tags: [ 'staff', 'a', 'c' ] }
```

`$addToSet` appends only when the value is not already present:

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'staff' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, tags: [ 'staff', 'a' ] }
```

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'z' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, tags: [ 'staff', 'a', 'z' ] }
```

See [Update Operators](../jsongin/Update-Operators.md) for the full list.


## The Original Is Unchanged

`Update` returns a copy, so the document you passed in keeps its values:

```js
jsongin.Update( users[ 0 ], { $inc: { age: 1 } } );
users[ 0 ].age === 30
```

That makes `Update` safe to use on documents you are still filtering or
displaying. See [`Diff()`](../jsongin/Diff.md) and [`Invert()`](../jsongin/Invert.md)
for turning a change into a patch you can apply and later revert.


## Where to Go Next

- [First Aggregation Pipeline](./First-Aggregation-Pipeline.md) — chain stages
  with [`Aggregate()`](../jsongin/Aggregate.md).
- [Project & Update Recipes](./Recipes-Project-Update.md) — more task-oriented
  recipes.


## See Also

- [`Project( Document, Projection )`](../jsongin/Project.md)
- [`Update( Document, Updates )`](../jsongin/Update.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [Update Operators](../jsongin/Update-Operators.md)