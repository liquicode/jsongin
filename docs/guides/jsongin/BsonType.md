# @liquicode/jsongin


# BsonType( Value, ReturnAlias )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                        |
|---------------|:-----------------:|------------------------------------------------------------------------|
| Value         |       (any)       | The value to get the BSON type of.                                     |
| ReturnAlias   |         b         | `true` returns the type's name instead of its number. Defaults to `false`. |


## Description

Returns the MongoDB BSON type of a value, as a ***number*** by default, or as its ***name*** when
  `ReturnAlias` is `true`.

A function or an `Error` has no BSON type, and returns `null`.

The `$type` query operator uses these types, and accepts either form:

```js
jsongin.Query( { n: 42 }, { n: { $type: 'int' } } ) === true
jsongin.Query( { n: 42 }, { n: { $type: 16 } } ) === true
```


## Supported Types

| **Value**              | **Number** | **Alias**     |
|------------------------|:----------:|---------------|
| `3.14`                 |     `1`    | `'double'`    |
| `'abc'`                |     `2`    | `'string'`    |
| `{ a: 1 }`             |     `3`    | `'object'`    |
| `[ 1 ]`                |     `4`    | `'array'`     |
| `undefined`            |     `6`    | `'undefined'` |
| `true`                 |     `8`    | `'bool'`      |
| `new Date()`           |     `9`    | `'date'`      |
| `null`                 |    `10`    | `'null'`      |
| `/^abc/`               |    `11`    | `'regex'`     |
| `Symbol()`             |    `14`    | `'symbol'`    |
| `42`                   |    `16`    | `'int'`       |
| `2147483647`           |    `16`    | `'int'`       |
| `2147483648`           |     `1`    | `'double'`    |
| `Math.pow( 2, 53 )`    |     `1`    | `'double'`    |
| `NaN`                  |     `1`    | `'double'`    |
| `Infinity`             |     `1`    | `'double'`    |

Javascript has only one kind of number, so a number's BSON type depends on its value:

- A whole number from `-2147483648` to `2147483647` (the `int32` range) is an `int`.
- Every other number is a `double`: numbers with a fractional part, whole numbers outside that
  range, `NaN`, `Infinity` and `-Infinity`.
- A number is never a `long`.

This is what MongoDB does too.
If you store `3000000000` in MongoDB, `$type` reports `double`, and `$type: 'long'` does not
  match it.


## Unsupported Types

These BSON types have no Javascript value to match, so `BsonType` never returns them:
  `binData` (5), `objectId` (7), `dbPointer` (12), `javascript` (13),
  `javascriptWithScope` (15), `timestamp` (17), `decimal` (19), `minKey` (-1), and
  `maxKey` (127).

BSON type `17`, `timestamp`, is used internally by MongoDB and is ***not*** a date.


## See Also

- [`ShortType( Value )`](./ShortType.md), the one-letter type code used throughout `jsongin`.
- [`Query()`](./Query.md) and its `$type` operator.
- MongoDB Reference: [BSON Types](https://www.mongodb.com/docs/manual/reference/bson-types)


## Examples


### It returns the BSON type number
```js
jsongin.BsonType( true ) === 8
jsongin.BsonType( 42 ) === 16
jsongin.BsonType( 3.14 ) === 1
jsongin.BsonType( 'abc' ) === 2
jsongin.BsonType( new Date() ) === 9
jsongin.BsonType( null ) === 10
```


### It returns the name when asked
```js
jsongin.BsonType( true, true ) === 'bool'
jsongin.BsonType( 42, true ) === 'int'
jsongin.BsonType( 3.14, true ) === 'double'
jsongin.BsonType( new Date(), true ) === 'date'
jsongin.BsonType( [ 1 ], true ) === 'array'
```


### A date is its own type
```js
// A date is not an object.
jsongin.BsonType( new Date() ) === 9
jsongin.BsonType( { a: 1 } ) === 3

// A number is a number, even when it could be a timestamp.
// This one is a double because it is outside the int32 range.
jsongin.BsonType( 1700000000000 ) === 1
jsongin.BsonType( 1700000000000, true ) === 'double'
```
