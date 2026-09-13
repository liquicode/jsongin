# @liquicode/jsongin


# ShortType( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to get the type of.            |


## Description

Returns a one-letter code for the type of a value.

| **Code** | **Type**    | **Example**            |
|:--------:|-------------|------------------------|
|   `b`    | boolean     | `true`                 |
|   `n`    | number      | `3.14`, `NaN`          |
|   `s`    | string      | `'abc'`                |
|   `d`    | date        | `new Date()`           |
|   `l`    | null        | `null`                 |
|   `o`    | object      | `{ a: 1 }`             |
|   `a`    | array       | `[ 1, 2 ]`             |
|   `r`    | regexp      | `/^abc/`               |
|   `e`    | error       | `new Error( 'x' )`     |
|   `f`    | function    | `function () {}`       |
|   `y`    | symbol      | `Symbol()`             |
|   `u`    | undefined   | `undefined`            |

`ShortType` throws for a type it does not know, such as a `bigint`.

These codes appear throughout the `jsongin` documentation.
In a parameter table, ***Allowed Types*** lists the codes a parameter accepts: `bns` means a
  boolean, number or string.

The codes also make type checks shorter. Instead of:
```js
// docs-check: skip - Value stands for the reader's own value.
if( (typeof Value === 'boolean') || (typeof Value === 'number') || (typeof Value === 'string') ) { /* ... */ }
```
you can write:
```js
// docs-check: skip - Value stands for the reader's own value.
if( 'bns'.includes( jsongin.ShortType( Value ) ) ) { /* ... */ }
```

The idea comes from a similar notation in the JSONata project.


## Dates

A `Date` has its own code, `d`. It is not an `o`.

A date has no fields to look inside, so code which treated it as an object would find nothing
  and lose its value.
The separate code is what lets `Query`, `Sort`, `Flatten`, `SafeClone` and the expression
  operators handle dates properly.

A value is a date only if it is a `Date` object.
A number which could be a timestamp is still `n`, and a string which could be read as a date is
  still `s`:

```js
jsongin.ShortType( new Date() ) === 'd'
jsongin.ShortType( 1700000000000 ) === 'n'
jsongin.ShortType( '2023-11-14T22:13:20.000Z' ) === 's'
```


## Examples


### Simple values
```js
jsongin.ShortType( true ) === 'b'
jsongin.ShortType( 3.14 ) === 'n'
jsongin.ShortType( 'abc' ) === 's'
```

### Objects are split into more specific types
```js
jsongin.ShortType( null ) === 'l'
jsongin.ShortType( { a: 1 } ) === 'o'
jsongin.ShortType( [ 1, 2, 3 ] ) === 'a'
jsongin.ShortType( new Date() ) === 'd'
jsongin.ShortType( /^abc/ ) === 'r'
jsongin.ShortType( new Error( 'x' ) ) === 'e'
```

### undefined
```js
jsongin.ShortType() === 'u'
```


## See Also

- [`BsonType( Value, ReturnAlias )`](./BsonType.md), the BSON type of a value.
- [`CompareValues( ValueA, ValueB )`](./CompareValues.md), which orders values by type.
- [`AsBoolean( Value )`](./AsBoolean.md), [`AsNumber( Value )`](./AsNumber.md), and [`AsDate( Value )`](./AsDate.md), which convert values.
