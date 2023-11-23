# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Flatten( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        oa         | The document to flatten.                 |


## Description

Takes a document and returns a flattened copy of that document.
The flattened document will not contain any nested objects or arrays.
Instead, the flattened document will have only top-level fields whose field names are paths
  to that field within the original document.

The `Document` parameter can be an object or an array.

Use the `jsongin.Expand( Document )` function to return a flattened document back to its
  original state with nested objects and arrays.


## See Also

- [`Expand( Document )`](./Expand.md)


## Examples


### It flattens a hierarchical document
```js
let document = {
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'East',
	},
	tags: [ 'Staff', 'Dept. A' ],
};

let flattened = jsongin.Flatten( document );
flattened === {
	id: 1001,
	'user.name': 'Alice',
	'user.location': 'East',
	'profile.login': 'alice',
	'profile.role': 'admin',
	'tags.0': 'Staff',
	'tags.1': 'Dept. A',
};
```

### Use Expand() to turn a flattened document back into ahierarchical document
```js
let document = {
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'East',
	},
	tags: [ 'Staff', 'Dept. A' ],
};

let flattened = jsongin.Flatten( document );
let expanded = jsongin.Expand( flattened );
expanded === document
```

### It should flatten an empty document
```js
let flattened = jsongin.Flatten( {} );
flattened === {}
```

### It should flatten an array
```js
let flattened = jsongin.Flatten( [ 1, 2, 'three' ] );
flattened === {
	0: 1,
	1: 2,
	2: 'three',
}
```

### It should flatten an empty array
```js
let flattened = jsongin.Flatten( [] );
flattened === []
```

### It should not flatten a non-document
```js
let flattened = jsongin.Flatten( 3.14 ); // throws error: Document must be an object or array.
```

