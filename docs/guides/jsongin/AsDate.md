# @liquicode/jsongin


# AsDate( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a date.          |


## Description

Converts `Value` to a `Date`.
Returns `null` if it cannot.

Three kinds of value convert:

- A ***date*** returns a new copy of the date.
- A ***number*** is read as milliseconds since 1970, so `0` is `1970-01-01T00:00:00.000Z`.
- A ***string*** converts if Javascript's `Date` constructor can read it.

Everything else returns `null`, including booleans, arrays, objects, `null`, empty strings, and
  `NaN`.

`AsDate` converts when you ask it to.
It does not change what type a value is: [`ShortType()`](./ShortType.md) still calls a number a
  number and a string a string.


## What Converts

| **Value**                        | **Result**                        |
|----------------------------------|-----------------------------------|
| `new Date( 0 )`                  | A copy of that date.              |
| `0`                              | `1970-01-01T00:00:00.000Z`        |
| `'2023-11-14T22:13:20.000Z'`     | That date.                        |
| `'abc'`                          | `null`                            |
| `''` or `'   '`                  | `null`                            |
| `true`                           | `null`                            |
| `[]`                             | `null`                            |
| `null`                           | `null`                            |


## See Also

- [`AsNumber( Value )`](./AsNumber.md)
- [`AsBoolean( Value )`](./AsBoolean.md)
- [`ShortType( Value )`](./ShortType.md), which explains why a date has its own short type `d`.


## Examples


### It converts dates, timestamps, and date strings
```js
jsongin.AsDate( new Date( 0 ) ).toISOString() === '1970-01-01T00:00:00.000Z'
jsongin.AsDate( 0 ).toISOString() === '1970-01-01T00:00:00.000Z'
jsongin.AsDate( '2023-11-14T22:13:20.000Z' ).toISOString() === '2023-11-14T22:13:20.000Z'
```


### It returns a copy, not the original
```js
let original = new Date( 0 );
let copy = jsongin.AsDate( original );

( copy === original ) === false
copy.getTime() === original.getTime()
```


### It returns null for values which are not dates
```js
jsongin.AsDate( 'abc' ) === null
jsongin.AsDate( '' ) === null
jsongin.AsDate( true ) === null
jsongin.AsDate( [] ) === null
jsongin.AsDate( null ) === null
jsongin.AsDate( NaN ) === null
```
