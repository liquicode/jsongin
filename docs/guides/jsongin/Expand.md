---
layout: simple.njk
bodyClass: "topic-page"

seo:
  title: jsongin.Expand()
  description: "Takes a previously flattened document and returns it back to its original form."
  socialImage: "/assets/images/jsongin-logo-50x50.png"
  canonicalOverwrite: ""
---


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

let flattened = jsongin.Flatten( Document );
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

