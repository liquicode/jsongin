# @liquicode/jsongin


# Hybridize( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | The document to hybridize.               |


## Description

Returns a copy of a document in which every top-level field holds a simple value.

- Numbers, strings, booleans and `null` are copied as they are.
- Every other value is written as a JSON string which records its type: objects, arrays, dates,
  regular expressions, errors, functions, symbols and `undefined`.

This is useful for storage which can only hold simple values in each column.
Only the top level is changed. The inside of an object or array is stored in its JSON string.

Use [`Unhybridize()`](./Unhybridize.md) to turn a hybrid document back into the original.

Because the type is recorded, a date comes back from `Unhybridize` as a `Date`.
[`Format()`](./Format.md) and [`Parse()`](./Parse.md) follow JSON's rules instead, where a date
  becomes a string and stays a string.


## See Also

- [`Unhybridize( Document )`](./Unhybridize.md)
- [`Flatten( Document )`](./Flatten.md)


## Examples


### It encodes nested values as strings
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
// hybrid is {
// 	id: 1001,
// 	user: '{"type":"o","value":{"name":"Alice","location":"East"}}',
// 	tags: '{"type":"a","value":["Staff","Dept. A"]}',
// };
```

### Unhybridize() reverses it
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
// unhybrid matches document
```

### A date comes back as a date
```js
let document = { created: new Date( 1700000000000 ) };

let hybrid = jsongin.Hybridize( document );
hybrid.created === '{"type":"d","value":"2023-11-14T22:13:20.000Z"}'

let unhybrid = jsongin.Unhybridize( hybrid );
( unhybrid.created instanceof Date ) === true
```
