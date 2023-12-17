# @liquicode/jsongin


# SetValue( Document, Path, Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        oa         | The document to set a value into.        |
| Path          |        sn         | The path of a field within the document. |
| Value         |       (any)       | The value to set in the document.        |


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
You can use negative index numbers to select from the end of an array.
Use `-1` to set the last element of an array, `-2` to set the next to last element, and so on.
If you have an array of objects, you can omit the array index to set the value into each of those objects.


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

jsongin.SetValue( document, 1, undefined ) === true
document.length === 3
document[ 0 ] === 'one'
document[ 1 ] === undefined
document[ 2 ] === 'three'
```

### It performs reverse indexing when an array index is negative
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, -1, 'xyz' ) === true
document.length === 3
document[ 0 ] === 'one'
document[ 1 ] === 'two'
document[ 2 ] === 'xyz'
```

### Array elements can be set to undefined, but they are not removed
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, 4, 'xyz' ) === true
document.length === 5
document[ 0 ] === 'one'
document[ 1 ] === 'two'
document[ 2 ] === 'three'
document[ 3 ] === undefined
document[ 4 ] === 'xyz'
```

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

### It sets fields inside all elements of an array of objects
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ id: 102, name: 'Bob' },
		{ id: 103, name: 'Eve' },
	]
};

// Omit the array index to set into each array element.
jsongin.SetValue( document, 'users.status', 42 ) === true
document.users[ 0 ].status === true
document.users[ 1 ].status === true
document.users[ 2 ].status === true
```

### It returns false when an empty path is given
```js
let document = { user: { name: 'Alice' } };
jsongin.SetValue( document, '', 42 ) === false
```

### It returns false when an array index is negative
```js
let document = [ 'one', 'two', 'three' ];
jsongin.SetValue( document, -1, 'four' ) === false
```

### It returns false when an array index is out of bounds
```js
let document = [ 'one', 'two', 'three' ];
jsongin.SetValue( document, 3, 'four' ) === false
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

