# @liquicode/jsongin


# Parse( JsonString, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| JsonString    |        s          | The json string to parse.                |
| Options       |        o          | The options document below.              |

### Options

| **Option**  | **Type** | **Default** | **Description**                          |
|-------------|:--------:|:-----------:|------------------------------------------|
| Strict      |    b     |   `false`   | Throws when the string cannot be read, rather than returning it unchanged. |
| TypedValues |    b     |   `false`   | Reads the tagged forms [`Format()`](./Format.md) writes for values JSON cannot hold. |


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


## It Does Not Throw By Default

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

***Set `Strict` when that ambiguity is not acceptable.***
Forgiveness is right for input a person typed and wrong for reading back something the engine
  wrote, where a truncated value has to be an error rather than a string which happens to look
  like one.

```js
// jsongin.Parse( '{ bad', { Strict: true } )
// throws: At position [2]: Expected a ':' after the field name 'bad'.
```

A `Strict` failure is reported to [`OpError`](../OpLog.md) rather than `OpLog`.


## Typed Values

`TypedValues` reads the tagged forms [`Format()`](./Format.md) writes, so that a `Date`, an
  `undefined`, and a `RegExp` come back as what they were rather than as a string, a missing
  field, and an empty object.

```js
const options = { TypedValues: true };
let text = jsongin.Format( { created: new Date( 1700000000000 ) }, options );
jsongin.ShortType( jsongin.Parse( text, options ).created )
// returns 'd'
```

Both ends need the option.
Reading tagged text without it gives back the tag documents themselves, and writing without it
  loses the values before `Parse()` ever sees them.

***A tag is only a tag when it is the whole document.***
`{ $date: ... }` alongside any other field is an ordinary document which happens to use the
  name.
This is the same reading MongoDB's Extended JSON takes, and it means a document whose only
  field is genuinely called `$date` cannot be told apart from a tagged value.
A malformed tag is left exactly as it was found, so nothing is lost to a bad guess.


## See Also

- [`Format( Value, Options )`](./Format.md)
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
