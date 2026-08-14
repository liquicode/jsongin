# @liquicode/jsongin


# AsDate( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a date.          |


## Description

Converts `Value` to a `Date` and returns it.
Returns `null` when the value cannot be converted.

Three kinds of value convert:

- A ***date*** returns a copy, never the original object.
- A ***number*** is treated as a millisecond timestamp.
- A ***string*** is parsed. It converts when Javascript's `Date` constructor can read it.

Everything else returns `null`, including booleans, arrays, objects, and `null` itself.

> ***Note*** : `AsDate` is a conversion, not a classification.
  It is willing to read a date out of a number or a string, which is exactly what
  [`ShortType()`](./ShortType.md) refuses to do.
  A number is still a number and a string is still a string; `AsDate` simply converts one on
  request.

> ***Fixed in v0.1.0*** :
  `AsDate` tested its parameter for falsiness, so `AsDate( 0 )` returned `null` rather than the
  epoch. Zero is a valid timestamp and now converts.


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
- [`Update()`](./Update.md) and its `$currentDate` operator.


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


### It rejects values which are not dates
```js
jsongin.AsDate( 'abc' ) === null
jsongin.AsDate( '' ) === null
jsongin.AsDate( true ) === null
jsongin.AsDate( [] ) === null
jsongin.AsDate( null ) === null
```
