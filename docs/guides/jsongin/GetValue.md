# @liquicode/jsongin


# GetValue( Document, Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The document to read from.               |
| Path          |       ulsn        | The path of the value to read.           |


## Description

Returns the value at `Path` in `Document`, or `undefined` if there is none.

`Path` is a dot notation string, such as `'user.name'`, or a number.
If `Path` is `undefined`, `null` or `''`, the whole `Document` is returned.
Any other type of `Path` throws.

***Objects*** :
A path element names a field. Field names are case sensitive.

***Arrays*** :
A number in the path selects an element by position, starting at `0`.

A field name used against an array is applied to ***every element***, and the result is an array
  with one value per element.
An element without the field gives `undefined` in its position, so the result lines up with the
  array.

```js
jsongin.GetValue( { users: [ { id: 1 }, { name: 'Bob' } ] }, 'users.id' )
// returns [ 1, undefined ]
```

***No counting from the end*** :
A negative number is not an index.
`GetValue( document, 'a.-1' )` returns `undefined` when `a` is an array, not the last element, as
  in MongoDB.
Against an object, `-1` is an ordinary field name.

Queries and aggregation expressions read paths by slightly different rules.
See [`ResolveCandidates()`](./ResolveCandidates.md) for queries, and
  [`Evaluate()`](./Evaluate.md) for a field reference such as `'$users.id'`.


## See Also

- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [`ResolveCandidates( Document, Path )`](./ResolveCandidates.md)
- [`SplitPath( Path )`](./SplitPath.md)


## Examples

### It returns fields from a document
```js
let document = {
	id: 101,
	user: {
		name: 'Alice'
	},
};
jsongin.GetValue( document, 'id' ) === 101
jsongin.GetValue( document, 'user.name' ) === 'Alice'
```

### It returns elements of an array
```js
let document = [ 'one', 'two', 'three' ];
jsongin.GetValue( document, '0' ) === 'one'
jsongin.GetValue( document, '1' ) === 'two'

// A negative number is not an index.
jsongin.GetValue( document, '-1' ) === undefined
```

### It returns fields from inside an array of objects
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ id: 102, name: 'Bob' },
		{ id: 103, name: 'Eve' },
	]
};
// jsongin.GetValue( document, 'users.1' ) returns { id: 102, name: 'Bob' }
jsongin.GetValue( document, 'users.1.name' ) === 'Bob'
// Leave out the index to get the field from every element:
// jsongin.GetValue( document, 'users.name' ) returns [ 'Alice', 'Bob', 'Eve' ]
```

### An element without the field gives undefined
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ xyz: 102, name: 'Bob' },
		{ id: 103, name: 'Eve' },
	]
};
jsongin.GetValue( document, 'users.1.id' ) === undefined
// jsongin.GetValue( document, 'users.id' ) returns [ 101, undefined, 103 ]
// jsongin.GetValue( document, 'users.name' ) returns [ 'Alice', 'Bob', 'Eve' ]
```

### An empty path returns the whole document
```js
jsongin.GetValue( 'abc' )  === 'abc'
// jsongin.GetValue( [ 'one', 'two', 'three' ], null ) returns [ 'one', 'two', 'three' ]
// jsongin.GetValue( { id: 101, name: 'Alice' }, '' ) returns { id: 101, name: 'Alice' }
```

### A path which is not found returns undefined
```js
jsongin.GetValue( 'abc', 'score' ) === undefined
jsongin.GetValue( { id: 101, name: 'Alice' }, 'score' ) === undefined
jsongin.GetValue( [ 'one', 'two', 'three' ], '3' ) === undefined
```

### It throws for a path of the wrong type
```js
jsongin.GetValue( 'abc', { a: 1 } ) // throws 'Path is invalid ...'
```
