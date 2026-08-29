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


### It expands a flat document into a hierarchical one
```js
let flattened = {
	id: 1001,
	'user.name': 'Alice',
	'user.location': 'East',
	'tags.0': 'Staff',
	'tags.1': 'Dept. A',
};

let expanded = jsongin.Expand( flattened );
// expanded is {
// 	id: 1001,
// 	user:
// 	{
// 		name: 'Alice',
// 		location: 'East',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ],
// };
```

The document does not have to have come from `Flatten()`.
Any object whose keys are dot notation paths can be expanded, which is what makes `Expand` a
  way to write a nested document as a flat list of paths.

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

### A numeric path element builds an array
```js
let expanded = jsongin.Expand( { 'tags.0': 'Staff', 'tags.1': 'Dept. A' } );
// expanded is { tags: [ 'Staff', 'Dept. A' ] }, and expanded.tags is a real array
```

This is the one place in `jsongin` where a numeric path element creates an array.
Everywhere else it creates a document, which is the rule MongoDB follows for an update.

An index which nothing fills is filled with `null`, because an array cannot leave a position
  out:

```js
let expanded = jsongin.Expand( { 'tags.2': 'Dept. C' } );
// expanded is { tags: [ null, null, 'Dept. C' ] }
```

### It should expand an empty document
```js
let expanded = jsongin.Expand( {} );
// expanded is {}
```

### It preserves empty objects and arrays
```js
let expanded = jsongin.Expand( { a: {}, b: [] } );
// expanded is { a: {}, b: [] }, and expanded.b is a real array
```

### It keeps a date whole
```js
let expanded = jsongin.Expand( { 'user.created': new Date( 1700000000000 ) } );
( expanded.user.created instanceof Date ) === true
```

### It should not expand a non-document
```js
jsongin.Expand( 3.14 );       // throws error: Document must be an object.
jsongin.Expand( [ 1, 2 ] );   // throws error: Document must be an object.
```

`Expand` requires an object, where [`Flatten`](./Flatten.md) accepts an object or an array.
An array holds no paths to expand, and the result is always an object in any case.

### It should not expand paths which contradict each other
```js
let expanded = jsongin.Expand( { a: 1, 'a.b': 2 } );
// throws error: The element [b] of the path [a.b] must reference an object or array.
```

`a` cannot be both the number `1` and the object which holds `b`.
`Flatten` never produces such a pair, so this only arises in a flat document written by hand.


## Round Trip Limitations

`Expand` always builds an object, and a dot notation path cannot record whether a container
  was an object or an array.
So a document which is itself an array expands back as an object, and an object whose keys are
  canonical integers expands back as an array.
See [Round Trip Limitations](./Flatten.md) under `Flatten` for the details.

