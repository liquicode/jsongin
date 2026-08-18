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


### Clamp a number with `$min` or `$max`

`$min` sets the field to the smaller of its current value and the given value;
`$max` sets it to the larger. They only change the field when the new value wins:

```js
jsongin.Update( users[ 0 ], { $min: { age: 20 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 20, logins: 5, tags: [ 'staff', 'a' ] }
```

```js
jsongin.Update( users[ 0 ], { $max: { age: 50 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 50, logins: 5, tags: [ 'staff', 'a' ] }
```


### Scale a number with `$mul`

`$mul` multiplies a numeric field:

```js
jsongin.Update( users[ 0 ], { $mul: { age: 2 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 60, logins: 5, tags: [ 'staff', 'a' ] }
```


### Remove the last element with `$pop`

`$pop: 1` removes the last element of an array; `$pop: -1` removes the first:

```js
jsongin.Update( users[ 0 ], { $pop: { tags: 1 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'staff' ] }
```

```js
jsongin.Update( users[ 0 ], { $pop: { tags: -1 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'a' ] }
```


### Remove every occurrence with `$pullAll`

`$pullAll` removes every element that equals any value in the list:

```js
jsongin.Update( users[ 0 ], { $pullAll: { tags: [ 'a' ] } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, logins: 5, tags: [ 'staff' ] }
```


## Project and Update Nested Fields

Dot notation reaches into sub-documents. The next recipes use this document:

```js
let doc = { _id: 1, name: 'Alice', role: 'admin', age: 30, profile: { city: 'East', logins: 5 }, tags: [ 'staff', 'a' ] };
```


### Project a nested field

A dot-path in `Project` keeps the parent structure around the field you named:

```js
jsongin.Project( doc, { 'profile.city': 1 } )
// returns { _id: 1, profile: { city: 'East' } }
```


### Fall back to a default with `$ifNull`

`$ifNull: [ expression, fallback ]` returns the first value that is not null or
missing:

```js
jsongin.Project( doc, { label: { $ifNull: [ '$missing', 'none' ] } } )
// returns { _id: 1, label: 'none' }
```


### Take a string literally with `$literal`

A string that begins with `$` is a field reference. `$literal` takes its argument
as a value instead:

```js
jsongin.Project( doc, { x: { $literal: '$name' } } )
// returns { _id: 1, x: '$name' }
```


### Update a nested field

Every update operator accepts dot-paths. `$set` writes a nested field:

```js
jsongin.Update( doc, { $set: { 'profile.city': 'North' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, profile: { city: 'North', logins: 5 }, tags: [ 'staff', 'a' ] }
```

`$inc` adds to a nested number:

```js
jsongin.Update( doc, { $inc: { 'profile.logins': 1 } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, profile: { city: 'East', logins: 6 }, tags: [ 'staff', 'a' ] }
```

`$unset` removes a nested field:

```js
jsongin.Update( doc, { $unset: { 'profile.city': '' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, profile: { logins: 5 }, tags: [ 'staff', 'a' ] }
```

`$rename` moves a nested field to a new key:

```js
jsongin.Update( doc, { $rename: { 'profile.city': 'profile.town' } } )
// returns { _id: 1, name: 'Alice', role: 'admin', age: 30, profile: { logins: 5, town: 'East' }, tags: [ 'staff', 'a' ] }
```


## See Also

- [`Project( Document, Projection )`](../jsongin/Project.md)
- [`Update( Document, Updates )`](../jsongin/Update.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [Update Operators](../jsongin/Update-Operators.md)
- [Reshaping and Updating](./Reshaping-and-Updating.md)