# @liquicode/jsongin


# AsNumber( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a number.        |


## Description

Converts `Value` to a number and returns it.
Returns `null` when the value is not numeric.

Only ***numbers*** and ***numeric strings*** convert.
`AsNumber` does not apply Javascript's own type coercion, so a boolean, an array, or a date is
  not a number no matter what Javascript would make of it.

This function is used by the `$inc`, `$mul`, `$min`, and `$max` update operators to decide
  whether an update value is usable.

> ***Breaking change in v0.1.0*** :
  `AsNumber` previously coerced any value Javascript could coerce.
  `AsNumber( true )` returned `1` and `AsNumber( [ 5 ] )` returned `5`; both now return `null`.
  Consequently an update like `$inc: { count: true }` no longer modifies the field.
>
> The same version also fixed the opposite defect. `AsNumber` tested its parameter for
  falsiness, so `AsNumber( 0 )` returned `null` instead of `0`.
  This is why `$mul`, `$min`, and `$max` silently did nothing when given a value of `0`.


## What Converts

| **Value**        | **Result** | **Why**                                     |
|------------------|:----------:|---------------------------------------------|
| `0`              |    `0`     | Zero is a number.                           |
| `3.14`           |   `3.14`   | A number.                                   |
| `'42'`           |    `42`    | A numeric string.                           |
| `'3.14'`         |   `3.14`   | A numeric string.                           |
| `'abc'`          |   `null`   | Not numeric.                                |
| `''`             |   `null`   | An empty string is not a number.            |
| `'   '`          |   `null`   | Whitespace only.                            |
| `true`           |   `null`   | A boolean is not a number.                  |
| `[ 5 ]`          |   `null`   | An array is not a number.                   |
| `null`           |   `null`   | Not a number.                               |
| `NaN`            |   `null`   | Not a usable number.                        |
| `new Date()`     |   `null`   | A date is not a number. Use `AsDate()`.     |


## See Also

- [`AsDate( Value )`](./AsDate.md)
- [`AsBoolean( Value )`](./AsBoolean.md)
- [`ShortType( Value )`](./ShortType.md)
- [`Update()`](./Update.md) and its `$inc`, `$mul`, `$min`, and `$max` operators.


## Examples


### It converts numbers and numeric strings
```js
jsongin.AsNumber( 0 ) === 0
jsongin.AsNumber( 3.14 ) === 3.14
jsongin.AsNumber( '42' ) === 42
jsongin.AsNumber( '3.14' ) === 3.14
```


### It rejects everything else
```js
jsongin.AsNumber( true ) === null
jsongin.AsNumber( [ 5 ] ) === null
jsongin.AsNumber( 'abc' ) === null
jsongin.AsNumber( '' ) === null
jsongin.AsNumber( null ) === null
jsongin.AsNumber( NaN ) === null
```


### Zero converts, because zero is a number
```js
// This is what makes clamping to zero work.
// jsongin.Update( { hp: 5 }, { $max: { hp: 0 } } ) returns { hp: 5 }
// jsongin.Update( { hp: 5 }, { $min: { hp: 0 } } ) returns { hp: 0 }
```
