# @liquicode/jsongin


# Parse( JsonString )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| JsonString    |        s          | The json string to parse.                |


## Description

`jsongin.Parse()` emulates Javascript's `JSON.parse()` function which constructs a Javascript object from a text string.

`jsongin.Parse()` differs from `JSON.parse()` in that it provides a more relaxed parsing of JSON strings which is more in
  line with Javascipt's object syntax (as opposed to JSON's syntax).

Consider the following JSON string:

```js
{ name: 'Books', count: 4, } // This is my object.
```

Javascript's more strict JSON parsing will have four problems with the above string:
- You are required to use double quotes around the field names `name` and `count`.
- The string literal `'Books'` must use double quotes instead of single quotes: `"Books"`.
- There is a trailing comma after the `count` field, which is not allowed.
- The inline comment following the object will cause `JSON.parse()` to throw an error.

In order for `JSON.parse()` to read the JSON string, you would have to change it to look like this:

```json
{ "name": "Books", "count": 4 }
```

The `jsongin.Parse()` function will work equally well with either string and will return the same object.


## See Also

- [`Format( Value, WithWhitespace, AndPretty )`](./Format.md)


## Examples

### It reads JSON from a string
```js
let text = `{"id":1001, "user":{"name":"Alice","location":"East"}, "tags":["Staff", "Dept. A"]}`;
let result = jsongin.Parse( text );
result === {
	id: 1001,
	user: {
		name: 'Alice',
		location: 'East',
	},
	tags: [ 'Staff', 'Dept. A' ]
}
```

### It reads JSON that uses a Javascript syntax
```js
let text = `{ id: 1001, user: { name : 'Alice', location: 'East' }, tags: [ 'Staff', 'Dept. A' ], }`;
let result = jsongin.Parse( text );
result === {
	id: 1001,
	user: {
		name: 'Alice',
		location: 'East',
	},
	tags: [ 'Staff', 'Dept. A' ]
}
```
