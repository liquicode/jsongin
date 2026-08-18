# @liquicode/jsongin


# SetValue( Document, Path, Value, CreateArrays )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                                       |
|---------------|:-----------------:|-----------------------------------------------------------------------------------------|
| Document      |        oa         | The document to set a value into.                                                        |
| Path          |        sn         | The path of a field within the document.                                                 |
| Value         |       (any)       | The value to set in the document.                                                        |
| CreateArrays  |         b         | Whether a numeric key creates an array rather than a document. Defaults to `false`. Optional. |


## Description

Sets the field in the `Document` specified by `Path` to the given `Value`.

`Document` must be an object or an array.

`Path` is the string path (in dot-notation) of a field within `Document`.
If the `Path` specifies one or more fields that do not exist, then those fields are created.
If the `Path` is not valid, then an error is thrown.

Pass `undefined` for `Value` to unset a field in the document.
Array elements can also be set to `undefined`, but this does not change the length of the array.

This function returns `true` if the value was set.
If the value fails to be set, then an `OpLog` message is emitted and the function resturns `false`.


***Specifying Object Elements*** : 
To specify a field in an object, use that field name (case sensitive) within `Path`.
To specify a field in an embedded object, use dot notation (e.g. `"user.name"`) to identify that field.

***Specifying Array Elements*** : 
To specify an element of an array, use the numeric (zero-based) index of that element within the `Path`.

***There is no reverse indexing*** :
A negative number is read as a field name like any other, and a field cannot be created on an
  array, so `SetValue( document, 'a.-1', 9 )` ***throws***.
MongoDB refuses the same write with `Cannot create field '-1' in element {a: [ 1, 2, 3 ]}`.
Against a ***document***, `-1` is an ordinary field name and is set normally.

***A path may not reach into an array by field name*** :
`SetValue( document, 'users.status', 42 )` ***throws*** when `users` is an array.
MongoDB refuses this too, and reaching through an array on the write side requires the all
  positional operator, `'users.$[].status'`.

***Writing Past the End of an Array*** :
The gap is filled with `null`, which is what MongoDB does:

```js
let document = { a: [ 1 ] };
jsongin.SetValue( document, 'a.3', 9 );
// document.a is now [ 1, null, null, 9 ]
```

The gap is never left as Javascript array holes.
A hole is not representable in JSON, and only looks like a `null` because `JSON.stringify`
  renders it as one.

***Creating a Path Which Is Not There*** :
Each missing path element is created as a ***document***, whatever the next key looks like.
A numeric key does not imply an array, because only the array update operators ever create one.
This matches MongoDB:

```js
let document = {};
jsongin.SetValue( document, 'a.0', 9 );
// document is now { a: { '0': 9 } }, not { a: [ 9 ] }
```

An array which ***already exists*** is still indexed by a numeric key, so this rule only decides
  what gets created.
Pass `true` for `CreateArrays` to get the older behavior, where a numeric key creates an array.
[`Expand()`](./Expand.md) is the one caller which asks for it: it is rebuilding a hierarchy that
  [`Flatten()`](./Flatten.md) took apart, so a numeric path element there did come from an array.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`Update( Document, Updates )`](./Update.md)


## Examples


### It sets fields in a document
```js
let document = {
	id: 101,
	user: {
		name: 'Alice'
	},
};

jsongin.SetValue( document, 'id', 'abc' ) === true
document.id === 'abc'

jsongin.SetValue( document, 'user.name', 'Bob' ) === true
document.user.name === 'Bob'
```

### It creates document fields if they don't exist
```js
let document = { user: { name: 'Alice' } };

jsongin.SetValue( document, 'user.status', true ) === true
document.user.status === true

jsongin.SetValue( document, 'extra', { more: 'data' } ) === true
document.extra.more === 'data'
```

### It removes document fields when set to undefined
```js
let document = { id: 101, user: { name: 'Alice', status: 42 } };

jsongin.SetValue( document, 'user.status', undefined ) === true
document.user.status === undefined

jsongin.SetValue( document, 'id', undefined ) === true
document.id === undefined
```

### It sets elements of an array
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, 1, 'abc' ) === true
document[ 1 ] === 'abc'

jsongin.SetValue( document, '1', 'def' ) === true
document[ 1 ] === 'def'
```

### It creates array elements and grows the array if the elements don't exist
```js
let document = [ 'one', 'two', 'three' ];

// The gap is filled with nulls rather than left as holes.
jsongin.SetValue( document, 4, 'xyz' ) === true
document.length === 5
document[ 2 ] === 'three'
document[ 3 ] === null
document[ 4 ] === 'xyz'
```

### It refuses a negative array index
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, -1, 'xyz' );
// throws: Cannot create field [-1] in the array at [].
```

A negative number is a field name, not an index, and a field cannot be created on an array.
MongoDB refuses the same update with `Cannot create field '-1' in element {a: [ ... ]}`.

There is no reverse indexing anywhere in the engine, on the read side or the write side, so a
  path means the same thing everywhere it appears.

### It sets a document field which is literally named -1
```js
let document = { a: { x: 1 } };

jsongin.SetValue( document, 'a.-1', 9 ) === true
document.a[ '-1' ] === 9
```

Against a document the key is a field name rather than an index, so this is legal.
MongoDB does the same: `{ $set: { 'a.-1': 9 } }` gives `{ a: { '-1': 9 } }`.

### Writing past the end of an array fills the gap with null
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, 4, 'xyz' ) === true
document.length === 5
document[ 0 ] === 'one'
document[ 1 ] === 'two'
document[ 2 ] === 'three'
document[ 3 ] === null
document[ 4 ] === 'xyz'
```

A Javascript array hole is not representable in JSON, so the gap is filled with `null` rather
  than left empty.

### It sets fields inside an array of objects
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ id: 102, name: 'Bob' },
		{ id: 103, name: 'Eve' },
	]
};

jsongin.SetValue( document, 'users.1.id', 'abc' ) === true
document.users[ 1 ].id === 'abc'
```

### It rejects a field name against an array
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ id: 102, name: 'Bob' },
	]
};

jsongin.SetValue( document, 'users.status', 42 );
// throws: Cannot create field [status] in the array at [users].
```

MongoDB rejects the same update, with
  `Cannot create field 'status' in element {users: [ ... ]}`.
Reaching through an array on the write side requires the all positional operator,
  `'users.$[].status'`.

`jsongin`'s path syntax is MongoDB's path syntax, with no extensions and no settings to turn on.

Note that ***reading*** through an array by field name still works, because MongoDB does
  traverse arrays when it resolves a query path.
See [`GetValue( Document, Path )`](./GetValue.md).

### It returns false when an empty path is given
```js
let document = { user: { name: 'Alice' } };
jsongin.SetValue( document, '', 42 ) === false
```

### It throws when an array index is negative
```js
let document = [ 'one', 'two', 'three' ];
jsongin.SetValue( document, -1, 'four' );
// throws: Cannot create field [-1] in the array at [].
```

### An index past the end of an array extends it
```js
let document = [ 'one', 'two', 'three' ];
jsongin.SetValue( document, 3, 'four' ) === true
// document is now [ 'one', 'two', 'three', 'four' ]
```

### It throws an error when an invalid document is given
```js
jsongin.SetValue( null, 'user.name', 'Bob' ) // throws 'Document must be an object or array.'
```

### It throws an error when an invalid path is given
```js
let document = { user: { name: 'Alice' } };
jsongin.SetValue( document, true, 42 ) // throws 'Path is invalid ...'
```

