# @liquicode/jsongin


# GetValue( Document, Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The document to get a value from.        |
| Path          |       ulsn        | The path of a field within the document. |


## Description

Searches within `Document` for the field identified by `Path` and returns that field value.

If the `Path` is empty (`undefined`, `null`, or empty string `""`), then the `Document` is returned.
Otherwise `Path` must be a string, in dot-notation, which identifies a value within the `Document`.
If the field specified by `Path` is not found within the `Document`, then `undefined` is returned.
`Path` can also be numeric to specify an array index.

If `Path` is not of type `ulsn`, then an error is thrown.

***Specifying Object Elements*** : 
To specify a field in an object, use that field name (case sensitive) within `Path`.
To specify a field in an embedded object, use dot notation (e.g. `"user.name"`) to identify that field.

***Specifying Array Elements*** : 
To specify an element of an array, use the numeric (zero-based) index of that element within the `Path`.
You can use negative index numbers to select from the end of an array.
Use `-1` to retrieve the last element of an array, `-2` to select the next to last element, and so on.
If you have an array of objects, you can omit the array index to retrieve values inside those objects.


## See Also

- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [`Update( Document, Updates )`](./Update.md)


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
jsongin.GetValue( document, '-1' ) === 'three'
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
jsongin.GetValue( document, 'users.1' ) === { id: 102, name: 'Bob' }
jsongin.GetValue( document, 'users.1.name' ) === 'Bob'
// Omit the array index to reurn an array of sub-values:
jsongin.GetValue( document, 'users.name' ) === [ 'Alice', 'Bob', 'Eve' ]
```

### It might return undefined array elements when missing data is encountered
```js
let document = {
	users: [
		{ id: 101, name: 'Alice' },
		{ xyz: 102, name: 'Bob' },
		{ id: 103, name: 'Eve' },
	]
};
jsongin.GetValue( document, 'users.1.id' ) === undefined
jsongin.GetValue( document, 'users.id' ) === [ 101, undefined, 103 ]
jsongin.GetValue( document, 'users.name' ) === [ 'Alice', 'Bob', 'Eve' ]
```

### If the path is undefined, null, or empty "", then it returns the entire document
```js
jsongin.GetValue( 'abc' )  === 'abc'
jsongin.GetValue( [ 'one', 'two', 'three' ], null ) === [ 'one', 'two', 'three' ]
jsongin.GetValue( { id: 101, name: 'Alice' }, '' ) === { id: 101, name: 'Alice' }
```

### If the path is specified but not found, it returns undefined
```js
jsongin.GetValue( 'abc', 'score' ) === undefined
jsongin.GetValue( { id: 101, name: 'Alice' }, 'score' ) === undefined
jsongin.GetValue( [ 'one', 'two', 'three' ], '3' ) === undefined
```

### It throws an error when an invalid path is given
```js
jsongin.GetValue( 'abc', { a: 1 } ) // throws 'Path is invalid ...'
```
