# @liquicode/jsongin


# BsonType( Value, ReturnAlias )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                        |
|---------------|:-----------------:|------------------------------------------------------------------------|
| Value         |       (any)       | The value to get the BSON type of.                                     |
| ReturnAlias   |         b         | Return the type's string alias instead of its number. Defaults to `false`. |


## Description

Returns the MongoDB BSON type of a value.

By default the type is returned as its ***number***.
Pass `true` for `ReturnAlias` to get the ***string alias*** instead.

Returns `null` for a value which has no BSON type.

This is the type used by the `$type` query operator, which accepts either form:

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
| `Math.pow( 2, 53 )`    |    `18`    | `'long'`      |
| `NaN`                  |     `1`    | `'double'`    |
| `Infinity`             |     `1`    | `'double'`    |

***Numbers*** are classified by their value rather than by a declared width, because Javascript
  has only one number type:
- A number written with a decimal point is a `double`.
- A whole number within `Number.isSafeInteger()` is an `int`.
- A whole number outside that range is a `long`.
- `NaN`, `Infinity`, and `-Infinity` are `double`s, which is what BSON calls them.
  Note that BSON has no separate type for any of the three.

A ***function*** has no BSON type and returns `null`.


## Unsupported Types

These BSON types exist in MongoDB but have no Javascript counterpart here, so no value ever
  reports them: `binData` (5), `objectId` (7), `dbPointer` (12), `javascript` (13),
  `javascriptWithScope` (15), `timestamp` (17), `decimal` (19), `minKey` (-1), and
  `maxKey` (127).

Note that BSON type `17` is `timestamp`, a MongoDB replication internal, and is ***not*** the
  same thing as a date.


## See Also

- [`ShortType( Value )`](./ShortType.md), the single-character type used throughout `jsongin`.
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


### It returns the alias when asked
```js
jsongin.BsonType( true, true ) === 'bool'
jsongin.BsonType( 42, true ) === 'int'
jsongin.BsonType( 3.14, true ) === 'double'
jsongin.BsonType( new Date(), true ) === 'date'
jsongin.BsonType( [ 1 ], true ) === 'array'
```


### Dates are their own type
```js
// A date is a date, and not an object.
jsongin.BsonType( new Date() ) === 9
jsongin.BsonType( { a: 1 } ) === 3

// A number which would be a valid timestamp is still a number.
jsongin.BsonType( 1700000000000 ) === 16
```
