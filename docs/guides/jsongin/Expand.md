# @liquicode/jsongin


# Expand( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | An object whose keys are dot notation paths. |


## Description

Turns an object whose keys are dot notation paths into a nested document.
It is the reverse of [`Flatten()`](./Flatten.md).

The object does not have to come from `Flatten()`.
You can use `Expand` to write a nested document as a flat list of paths.

A number in a path creates an ***array***: `'tags.0'` makes `tags` an array.
`Expand` is the only function in `jsongin` which does this.
Everywhere else, such as [`SetValue()`](./SetValue.md) and `$set`, a number in a new path creates
  an object field named `'0'`, as MongoDB does.

An array position which nothing fills is set to `null`:

```js
let expanded = jsongin.Expand( { 'tags.2': 'Dept. C' } );
// expanded is { tags: [ null, null, 'Dept. C' ] }
```

Empty objects, empty arrays and dates are kept as values.

`Expand` throws when:

- `Document` is not an object. An array is not accepted.
- Two paths contradict each other, such as `{ a: 1, 'a.b': 2 }`, where `a` would have to be both
  `1` and an object holding `b`. `Flatten()` never produces this.


## Round Trip Limitations

A dot notation path cannot record whether a container was an object or an array, so:

- A document which is an array expands back as an object.
- An object whose keys are whole numbers, such as `{ '0': 'x' }`, expands back as an array.

See [Round Trip Limitations](./Flatten.md#round-trip-limitations) under `Flatten`.


## See Also

- [`Flatten( Document )`](./Flatten.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)


## Examples


### It expands a flat document into a nested one
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

### It reverses Flatten()
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

### A number in a path builds an array
```js
let expanded = jsongin.Expand( { 'tags.0': 'Staff', 'tags.1': 'Dept. A' } );
// expanded is { tags: [ 'Staff', 'Dept. A' ] }, and expanded.tags is a real array
```

### It expands an empty document
```js
let expanded = jsongin.Expand( {} );
// expanded is {}
```

### It keeps empty objects and arrays
```js
let expanded = jsongin.Expand( { a: {}, b: [] } );
// expanded is { a: {}, b: [] }, and expanded.b is a real array
```

### It keeps a date whole
```js
let expanded = jsongin.Expand( { 'user.created': new Date( 1700000000000 ) } );
( expanded.user.created instanceof Date ) === true
```

### It throws for anything but an object
```js
jsongin.Expand( 3.14 );       // throws: Document must be an object.
jsongin.Expand( [ 1, 2 ] );   // throws: Document must be an object.
```

### It throws for paths which contradict each other
```js
let expanded = jsongin.Expand( { a: 1, 'a.b': 2 } );
// throws: The element [b] of the path [a.b] must reference an object or array.
```
