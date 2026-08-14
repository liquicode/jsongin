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

```
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


## Escape Sequences

String values are decoded the way `JSON.parse()` decodes them:
`\b`, `\f`, `\n`, `\r`, `\t`, `\"`, `\\`, `\/`, and `\uXXXX`.

Because `Parse()` also reads single quoted strings, `\'` works as well.
Any other escape stands for the character which follows the backslash.

```js
jsongin.Parse( '{ "a": "one\\ntwo" }' )
// returns { a: 'one\ntwo' }
```


## It Never Throws

`Parse()` is a forgiving parser.
A string it cannot read is ***returned unchanged*** rather than throwing, and so is an argument
  which is not a string at all.

```js
jsongin.Parse( '{ bad' )   // returns '{ bad'
jsongin.Parse( '"abc' )    // returns '"abc'
jsongin.Parse( '' )        // returns ''
jsongin.Parse( 42 )        // returns 42
```

The reason is reported to [`OpLog`](../OpLog.md), which is where to look when a value comes back
  as the string that went in:

```js
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( { OpLog: console.log } );
jsongin.Parse( '{ bad' );
// Parse: At position [2]: Expected a ':' after the field name 'bad'. The string was returned unchanged.
```

Note that a value which was returned unchanged cannot be told apart from a successful parse
  which happened to produce a string.
`Parse( '"abc"' )` returns `abc` because it parsed, and `Parse( '"abc' )` returns `"abc` because
  it did not.
`OpLog` is what distinguishes them.


## See Also

- [`Format( Value, WithWhitespace, AndPretty )`](./Format.md)
- [`OpLog`](../OpLog.md)


## Examples

### It reads JSON from a string
```js
let text = `{"id":1001, "user":{"name":"Alice","location":"East"}, "tags":["Staff", "Dept. A"]}`;
let result = jsongin.Parse( text );
// result is {
// 	id: 1001,
// 	user: {
// 		name: 'Alice',
// 		location: 'East',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ]
// }
```

### It reads JSON that uses a Javascript syntax
```js
let text = `{ id: 1001, user: { name : 'Alice', location: 'East' }, tags: [ 'Staff', 'Dept. A' ], }`;
let result = jsongin.Parse( text );
// result is {
// 	id: 1001,
// 	user: {
// 		name: 'Alice',
// 		location: 'East',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ]
// }
```
