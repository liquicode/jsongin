# @liquicode/jsongin


# Expand( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | The flattened document to expand.        |


## Description

Takes a previously flattened document (from `jsongin.Flatten()`) and returns it back to its original form.

The `Document` parameter can be an object.


## See Also

- [`Flatten( Document )`](./Flatten.md)


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
// flattened is {
// 	id: 1001,
// 	'user.name': 'Alice',
// 	'user.location': 'East',
// 	'tags.0': 'Staff',
// 	'tags.1': 'Dept. A',
// };
```

### Use Expand() to turn a flattened document back into a hierarchical document
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
// expanded matches document
```

### It should flatten an empty document
```js
let flattened = jsongin.Flatten( {} );
// flattened is {}
```

### It should flatten an array
```js
let flattened = jsongin.Flatten( [ 1, 2, 'three' ] );
// flattened is {
// 	0: 1,
// 	1: 2,
// 	2: 'three',
// }
```

### It should flatten an empty array
```js
let flattened = jsongin.Flatten( [] );
// flattened is {}
```

### It preserves empty objects and arrays
```js
let expanded = jsongin.Expand( jsongin.Flatten( { a: {}, b: [] } ) );
// expanded is { a: {}, b: [] }, and expanded.b is a real array
```

### It should not flatten a non-document
```js
let flattened = jsongin.Flatten( 3.14 ); // throws error: Document must be an object or array.
```


## Round Trip Limitations

`Expand` always builds an object, and a dot notation path cannot record whether a container
  was an object or an array.
So a document which is itself an array expands back as an object, and an object whose keys are
  canonical integers expands back as an array.
See [Round Trip Limitations](./Flatten.md) under `Flatten` for the details.

