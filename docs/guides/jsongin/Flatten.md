# @liquicode/jsongin


# Flatten( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        oa         | The document to flatten.                 |


## Description

Returns a flat copy of a document.
Every value ends up in a top-level field whose name is the value's dot notation path, such as
  `'user.name'` or `'tags.0'`.

`Document` can be an object or an array.
`Flatten` throws for anything else.

Use [`Expand()`](./Expand.md) to turn a flat document back into a nested one.

A few values are kept whole rather than taken apart:

- An ***empty object*** or ***empty array*** is kept at its own path, so that `Expand` can put it
  back. It is a new empty object or array, not the original.
- A ***date*** is kept as a value.


## Round Trip Limitations

A dot notation path does not record whether a container was an object or an array.
Two kinds of document come back from `Expand( Flatten( ... ) )` in a different shape.

***A document which is an array*** comes back as an object:

```js
let flattened = jsongin.Flatten( [ 1, 2, 'three' ] );
// flattened is { '0': 1, '1': 2, '2': 'three' }

let expanded = jsongin.Expand( flattened );
// expanded is { '0': 1, '1': 2, '2': 'three' }, an object rather than an array
```

Arrays inside the document are not affected. They come back as arrays.

***An object whose keys are whole numbers*** comes back as an array:

```js
let flattened = jsongin.Flatten( { a: { '0': 'x' } } );
// flattened is { 'a.0': 'x' }

let expanded = jsongin.Expand( flattened );
// expanded is { a: [ 'x' ] }, an array rather than an object
```

`{ a: { '0': 'x' } }` and `{ a: [ 'x' ] }` flatten to the same thing, and `Expand` builds an array.

To copy a document exactly, use [`SafeClone()`](./SafeClone.md) instead.


## See Also

- [`Expand( Document )`](./Expand.md)
- [`Hybridize( Document )`](./Hybridize.md)


## Examples


### It flattens a nested document
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

### Expand() reverses it
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

### It flattens an empty document
```js
let flattened = jsongin.Flatten( {} );
// flattened is {}
```

### It flattens an array
```js
let flattened = jsongin.Flatten( [ 1, 2, 'three' ] );
// flattened is {
// 	0: 1,
// 	1: 2,
// 	2: 'three',
// }
```

### It flattens an empty array
```js
let flattened = jsongin.Flatten( [] );
// flattened is {}
```

### It keeps empty objects and arrays
```js
let flattened = jsongin.Flatten( { a: {}, b: [], c: { d: {} } } );
// flattened is {
// 	'a': {},
// 	'b': [],
// 	'c.d': {},
// }

let expanded = jsongin.Expand( flattened );
// expanded matches the original document, and expanded.b is a real array
```

### It keeps a date as a value
```js
let document = { user: { created: new Date( 1700000000000 ) } };

let flattened = jsongin.Flatten( document );
( flattened[ 'user.created' ] instanceof Date ) === true
```

### It throws for anything but an object or array
```js
let flattened = jsongin.Flatten( 3.14 ); // throws: Document must be an object or array.
```
