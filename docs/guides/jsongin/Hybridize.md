# @liquicode/jsongin


# Hybridize( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | The document to hybridize.               |


## Description

Takes a document and returns a hybridized copy of that document.
The hybrid document will not contain any nested objects or arrays.
Instead, the hybrid document will have only top-level fields and nested structures,
  such as objects and arrays, are json encoded.

The `Document` parameter must be an object.

Use the `jsongin.Unhybridize( Document )` function to return a hybrid document back to its
  original state with nested objects and arrays.


## See Also

- [`Unhybridize( Document )`](./Unhybridize.md)


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

let hybrid = jsongin.Hybridize( document );
hybrid === {
	id: 1001,
	user: '{"type":"o","value":{"name":"Alice","location":"East"}}',
	tags: '{"type":"a","value":["Staff","Dept. A"]}',
};
```

### Use Unhybridize() to turn a hybrid document back into a hierarchical document
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

let hybrid = jsongin.Hybridize( document );
let unhybrid = jsongin.Unhybridize( hybrid );
unhybrid === document
```

### It preserves dates across the round trip
```js
let document = { created: new Date( 1700000000000 ) };

let hybrid = jsongin.Hybridize( document );
hybrid.created === '{"type":"d","value":"2023-11-14T22:13:20.000Z"}'

let unhybrid = jsongin.Unhybridize( hybrid );
( unhybrid.created instanceof Date ) === true
```

A `Date` is recorded with its own type marker `d`, so `Unhybridize` can rebuild an actual
  `Date` rather than a string or an empty object.

This is the round trip to use when the ***type*** of a date must survive.
[`Format()`](./Format.md) and [`Parse()`](./Parse.md) follow JSON's rules instead, where a date
  becomes an ISO string and reads back as a string.
