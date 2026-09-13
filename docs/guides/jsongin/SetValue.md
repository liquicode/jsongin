# @liquicode/jsongin


# SetValue( Document, Path, Value, CreateArrays )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                                       |
|---------------|:-----------------:|-----------------------------------------------------------------------------------------|
| Document      |        oa         | The document to write into.                                                              |
| Path          |       ulsn        | The path of the value to set.                                                            |
| Value         |       (any)       | The value to set.                                                                        |
| CreateArrays  |         b         | Optional. When `true`, a number in a new path creates an array. Defaults to `false`.     |


## Description

Sets the value at `Path` in `Document`, and returns `true`.
`Document` is changed in place.

Any fields along the path which do not exist are created.

`SetValue` returns `false`, and sends a message to the [`OpLog`](../OpLog.md), when `Path` is
  empty.
It throws when:

- `Document` is not an object or array.
- `Path` is not a string or number.
- The path goes through a value which cannot hold fields, such as a number.
- The path uses a field name, or a negative number, against an array (see below).

Setting a value to `undefined` keeps the key.
To remove a field, use [`DeleteValue()`](./DeleteValue.md).


## Paths

***Objects*** :
A path element names a field. Field names are case sensitive.

***Arrays*** :
A number selects an element by position, starting at `0`.

***Writing past the end of an array*** fills the gap with `null`, as MongoDB does:

```js
let document = { a: [ 1 ] };
jsongin.SetValue( document, 'a.3', 9 );
// document.a is now [ 1, null, null, 9 ]
```

***A field name against an array throws.***
`SetValue( document, 'users.status', 42 )` throws when `users` is an array, because it cannot say
  which element to change.
MongoDB refuses this too.
To set a field in every element, use `Update()` with `$[]`: `{ $set: { 'users.$[].status': 42 } }`.

***A negative number is not an index.***
Against an array it is a field name, so it throws for the same reason.
Against an object, `-1` is an ordinary field name and is set normally.

***A new path creates objects, not arrays.***
When part of the path does not exist, it is created as an object, even if the next element is a
  number:

```js
let document = {};
jsongin.SetValue( document, 'a.0', 9 );
// document is now { a: { '0': 9 } }, not { a: [ 9 ] }
```

MongoDB's `$set` does the same.
An array which already exists is still indexed by a number.
Pass `true` for `CreateArrays` to create arrays instead. [`Expand()`](./Expand.md) does this.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`DeleteValue( Document, Path )`](./DeleteValue.md)
- [`Update( Document, Updates )`](./Update.md)


## Examples


### It sets fields
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

### It creates fields which do not exist
```js
let document = { user: { name: 'Alice' } };

jsongin.SetValue( document, 'user.status', true ) === true
document.user.status === true

jsongin.SetValue( document, 'extra', { more: 'data' } ) === true
document.extra.more === 'data'
```

### Setting undefined keeps the key
```js
let document = { id: 101 };

jsongin.SetValue( document, 'id', undefined ) === true
document.id === undefined
( 'id' in document ) === true
```

### It sets array elements
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, 1, 'abc' ) === true
document[ 1 ] === 'abc'

jsongin.SetValue( document, '1', 'def' ) === true
document[ 1 ] === 'def'
```

### Writing past the end fills the gap with null
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, 4, 'xyz' ) === true
document.length === 5
document[ 2 ] === 'three'
document[ 3 ] === null
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

### It throws for a field name against an array
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

### It throws for a negative index
```js
let document = [ 'one', 'two', 'three' ];

jsongin.SetValue( document, -1, 'xyz' );
// throws: Cannot create field [-1] in the array at [].
```

### A field named -1 in an object is fine
```js
let document = { a: { x: 1 } };

jsongin.SetValue( document, 'a.-1', 9 ) === true
document.a[ '-1' ] === 9
```

### It returns false for an empty path
```js
let document = { user: { name: 'Alice' } };
jsongin.SetValue( document, '', 42 ) === false
```

### It throws for a document or path of the wrong type
```js
jsongin.SetValue( null, 'user.name', 'Bob' ) // throws 'Document must be an object or array.'

let document = { user: { name: 'Alice' } };
jsongin.SetValue( document, true, 42 ) // throws 'Path is invalid ...'
```
