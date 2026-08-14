# @liquicode/jsongin


# AsBoolean( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a boolean.       |


## Description

Converts `Value` to a boolean, using ***MongoDB's*** expression evaluation rules.

Only four things are false:

- `false`
- `0`
- `null`
- a missing value (`undefined`)

***Everything else is true.***
This includes the empty string `""` and the empty array `[]`, both of which Javascript treats
  as falsy in the first case and truthy in the second.

This is the rule applied by the logical and conditional expression operators (`$and`, `$or`,
  `$not`, `$cond`, `$switch`), so it is what decides which branch an expression takes.


## Javascript Disagrees

The difference worth remembering is the empty string.

| **Value** | **`AsBoolean`** | **Javascript truthiness** |
|-----------|:---------------:|:-------------------------:|
| `false`   |     `false`     |          `false`          |
| `0`       |     `false`     |          `false`          |
| `null`    |     `false`     |          `false`          |
| `undefined` |   `false`     |          `false`          |
| `''`      |   ***`true`***  |      ***`false`***        |
| `[]`      |     `true`      |          `true`           |
| `{}`      |     `true`      |          `true`           |
| `'abc'`   |     `true`      |          `true`           |
| `1`       |     `true`      |          `true`           |

Note that `NaN` is a number and is not `0`, so it converts to `true`.


## See Also

- [`AsNumber( Value )`](./AsNumber.md)
- [`AsDate( Value )`](./AsDate.md)
- [`Evaluate( Document, Expression )`](./Evaluate.md) and its logical and conditional operators.
- [Operator Reference](../Operator-Reference.md)


## Examples


### Only false, zero, null, and missing are false
```js
jsongin.AsBoolean( false ) === false
jsongin.AsBoolean( 0 ) === false
jsongin.AsBoolean( null ) === false
jsongin.AsBoolean( undefined ) === false
```


### Everything else is true
```js
jsongin.AsBoolean( '' ) === true
jsongin.AsBoolean( [] ) === true
jsongin.AsBoolean( {} ) === true
jsongin.AsBoolean( 'abc' ) === true
jsongin.AsBoolean( 1 ) === true
jsongin.AsBoolean( new Date() ) === true
```


### It is what expression operators use
```js
// The empty string is true, so $cond takes its first branch.
jsongin.Evaluate( { name: '' }, { $cond: [ '$name', 'has a name', 'no name' ] } ) === 'has a name'
```
