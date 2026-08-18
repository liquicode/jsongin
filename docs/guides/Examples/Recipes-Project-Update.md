# @liquicode/jsongin


# Recipes: Project & Update

Task-oriented recipes for reshaping a document with
[`Project()`](../jsongin/Project.md) and changing one with
[`Update()`](../jsongin/Update.md). Each recipe is self-contained, and both
functions leave the original document untouched.

The recipes use this collection:

```js
let users = [
	{ _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'staff', 'a' ] },
	{ _id: 2, name: 'Bob', role: 'user', age: 25, logins: 1, tags: [ 'a' ] },
];
```


### Pick a few fields with `Project`

Set a field to `1` to include it. `_id` is included by default:

```js
jsongin.Project( users[ 0 ], { name: 1, role: 1 } )
// returns { _id: 1, name: 'Alice', role: 'admin' }
```

### Drop the `_id` field

Set `_id` to `0` to exclude it:

```js
jsongin.Project( users[ 0 ], { _id: 0, name: 1 } )
// returns { name: 'Alice' }
```


### Compute a boolean field

A field whose value is an expression object is computed. The projection switches
to inclusion mode, so only `_id` and the fields you name appear:

```js
jsongin.Project( users[ 0 ], { can_edit: { $eq: [ '$role', 'admin' ] } } )
// returns { _id: 1, can_edit: true }
```

Mix an included field with a computed one:

```js
jsongin.Project( users[ 0 ], { name: 1, can_edit: { $eq: [ '$role', 'admin' ] } } )
// returns { _id: 1, name: 'Alice', can_edit: true }
```


### Increment a counter with `$inc`

`$inc` adds to a number field. The updated document is returned; the original is
not changed:

```js
jsongin.Update( users[ 0 ], { $inc: { logins: 1 } } ).logins === 6
users[ 0 ].logins === 5
```


### Append a unique tag with `$addToSet`

`$addToSet` appends a value only when it is not already in the array:

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'staff' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'staff', 'a' ] }
```

```js
jsongin.Update( users[ 0 ], { $addToSet: { tags: 'z' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'staff', 'a', 'z' ] }
```


### Remove a field with `$unset`

`$unset` deletes a field. The value you give it is ignored — `''` is the
convention:

```js
jsongin.Update( users[ 0 ], { $unset: { age: '' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', logins: 5, tags: [ 'staff', 'a' ] }
```


### Rename a field with `$rename`

`$rename` moves a field from one key to another:

```js
jsongin.Update( users[ 0 ], { $rename: { name: 'full_name' } } )
// returns { _id: 1, role: 'admin', age: 30, logins: 5, tags: [ 'staff', 'a' ], full_name: 'Alice' }
```


## See Also

- [`Project( Document, Projection )`](../jsongin/Project.md)
- [`Update( Document, Updates )`](../jsongin/Update.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [Update Operators](../jsongin/Update-Operators.md)
- [Reshaping and Updating](./Reshaping-and-Updating.md)