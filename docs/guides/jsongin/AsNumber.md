# @liquicode/jsongin


# AsNumber( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a number.        |


## Description

Converts `Value` to a number.
Returns `null` if it cannot.

Only ***numbers*** and ***numeric strings*** convert.
`AsNumber` does not use Javascript's type conversion, so a boolean, an array, or a date returns
  `null` even though Javascript could turn it into a number.
`NaN` also returns `null`.


## What Converts

| **Value**        | **Result** | **Why**                                     |
|------------------|:----------:|---------------------------------------------|
| `0`              |    `0`     | A number.                                   |
| `3.14`           |   `3.14`   | A number.                                   |
| `'42'`           |    `42`    | A numeric string.                           |
| `'3.14'`         |   `3.14`   | A numeric string.                           |
| `'abc'`          |   `null`   | Not numeric.                                |
| `''`             |   `null`   | An empty string is not a number.            |
| `'   '`          |   `null`   | Only whitespace.                            |
| `true`           |   `null`   | A boolean is not a number.                  |
| `[ 5 ]`          |   `null`   | An array is not a number.                   |
| `null`           |   `null`   | Not a number.                               |
| `NaN`            |   `null`   | Not a usable number.                        |
| `new Date()`     |   `null`   | A date is not a number. Use `AsDate()`.     |


## See Also

- [`AsDate( Value )`](./AsDate.md)
- [`AsBoolean( Value )`](./AsBoolean.md)
- [`ShortType( Value )`](./ShortType.md)


## Examples


### It converts numbers and numeric strings
```js
jsongin.AsNumber( 0 ) === 0
jsongin.AsNumber( 3.14 ) === 3.14
jsongin.AsNumber( '42' ) === 42
jsongin.AsNumber( '3.14' ) === 3.14
```


### It returns null for everything else
```js
jsongin.AsNumber( true ) === null
jsongin.AsNumber( [ 5 ] ) === null
jsongin.AsNumber( 'abc' ) === null
jsongin.AsNumber( '' ) === null
jsongin.AsNumber( null ) === null
jsongin.AsNumber( NaN ) === null
```
