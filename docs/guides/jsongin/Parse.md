# @liquicode/jsongin


# Parse( JsonString, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| JsonString    |        s          | The text to read.                        |
| Options       |        o          | Optional. The options below.             |

### Options

| **Option**  | **Type** | **Default** | **Description**                          |
|-------------|:--------:|:-----------:|------------------------------------------|
| Strict      |    b     |   `false`   | Throws when the text cannot be read, instead of returning it unchanged. |
| TypedValues |    b     |   `false`   | Reads the tagged values [`Format()`](./Format.md) writes for dates, regular expressions and `undefined`. |


## Description

Reads a value from text, like `JSON.parse()`, but accepts Javascript object syntax as well as JSON.

Compared with `JSON.parse()`, `Parse` also accepts:

- field names without quotes: `{ name: "Books" }`
- strings in single quotes: `'Books'`
- trailing commas: `[ 1, 2, ]`
- missing commas: `[ 1 2 3 ]`
- `null`, `true` and `false` in any letter case
- a word without quotes as a string value: `{ a: hello }` gives `{ a: 'hello' }`

So these two strings give the same object:

```
{ name: 'Books', count: 4, }
```

```json
{ "name": "Books", "count": 4 }
```

***Only the first value is read.***
Anything after it is ignored, so `'{ a: 1 } xyz'` gives `{ a: 1 }`.

`Parse` does ***not*** understand comments.


## Escape Sequences

Strings are decoded the way `JSON.parse()` decodes them:
`\b`, `\f`, `\n`, `\r`, `\t`, `\"`, `\\`, `\/` and `\uXXXX`.
`\'` also works, for single quoted strings.
Any other backslash is dropped and the character after it is kept.

```js
jsongin.Parse( '{ "a": "one\\ntwo" }' )
// returns { a: 'one\ntwo' }
```


## It Does Not Throw By Default

When `Parse` cannot read the text, it ***returns the text unchanged*** instead of throwing.
A value which is not a string is also returned unchanged.

```js
jsongin.Parse( '{ bad' )   // returns '{ bad'
jsongin.Parse( '"abc' )    // returns '"abc'
jsongin.Parse( '' )        // returns ''
jsongin.Parse( 42 )        // returns 42
```

The reason is sent to the [`OpLog`](../OpLog.md):

```js
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( { OpLog: console.log } );
jsongin.Parse( '{ bad' );
// Parse: At position [2]: Expected a ':' after the field name 'bad'. The string was returned unchanged.
```

This means a failed parse can look like a successful one.
`Parse( '"abc"' )` returns `abc` because it worked, while `Parse( '"abc' )` returns `"abc` because
  it failed.

***Use `Strict` when that matters***, such as when reading text a program wrote.
With `Strict`, a failure throws, and the message goes to [`OpError`](../OpLog.md):

```js
// jsongin.Parse( '{ bad', { Strict: true } )
// throws: At position [2]: Expected a ':' after the field name 'bad'.
```


## Typed Values

With `TypedValues`, the tagged values [`Format()`](./Format.md) writes come back as a `Date`, a
  `RegExp` or `undefined`.

```js
const options = { TypedValues: true };
let text = jsongin.Format( { created: new Date( 1700000000000 ) }, options );
jsongin.ShortType( jsongin.Parse( text, options ).created )
// returns 'd'
```

Use the option with both `Format` and `Parse`.
Without it, `Parse` returns the tag objects themselves, and `Format` writes no tags to begin with.

A tag is only read when it is the ***only*** field in its object.
`{ $date: ..., other: 1 }` is an ordinary object.
This also means an object whose only field really is named `$date` is read as a date.
A tag which is not in the right form is left as it is.


## See Also

- [`Format( Value, Options )`](./Format.md)
- [`OpLog`](../OpLog.md)


## Examples

### It reads JSON
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

### It reads Javascript object syntax
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
