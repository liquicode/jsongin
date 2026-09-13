# @liquicode/jsongin


# AsBoolean( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to convert to a boolean.       |


## Description

Converts `Value` to a boolean, using ***MongoDB's*** rules.

Only four values are false:

- `false`
- `0`
- `null`
- `undefined`

***Everything else is true***, including the empty string `''`, the empty array `[]`, and `NaN`.

This is the rule the expression operators `$and`, `$or`, `$not`, `$cond`, `$switch` and
  `$filter` use to decide what is true, and so do the `$expr` and `$exists` query operators.


## Where Javascript Differs

Javascript treats `''` and `NaN` as false. `AsBoolean` treats them as true.

| **Value** | **`AsBoolean`** | **Javascript truthiness** |
|-----------|:---------------:|:-------------------------:|
| `false`   |     `false`     |          `false`          |
| `0`       |     `false`     |          `false`          |
| `null`    |     `false`     |          `false`          |
| `undefined` |   `false`     |          `false`          |
| `''`      |   ***`true`***  |      ***`false`***        |
| `NaN`     |   ***`true`***  |      ***`false`***        |
| `[]`      |     `true`      |          `true`           |
| `{}`      |     `true`      |          `true`           |
| `'abc'`   |     `true`      |          `true`           |
| `1`       |     `true`      |          `true`           |


## See Also

- [`AsNumber( Value )`](./AsNumber.md)
- [`AsDate( Value )`](./AsDate.md)
- [`Evaluate( Document, Expression )`](./Evaluate.md)
- [Operator Reference](../Operator-Reference.md)


## Examples


### Only false, zero, null, and undefined are false
```js
jsongin.AsBoolean( false ) === false
jsongin.AsBoolean( 0 ) === false
jsongin.AsBoolean( null ) === false
jsongin.AsBoolean( undefined ) === false
```


### Everything else is true
```js
jsongin.AsBoolean( '' ) === true
jsongin.AsBoolean( NaN ) === true
jsongin.AsBoolean( [] ) === true
jsongin.AsBoolean( {} ) === true
jsongin.AsBoolean( 'abc' ) === true
jsongin.AsBoolean( 1 ) === true
jsongin.AsBoolean( new Date() ) === true
```


### Expression operators use it
```js
// The empty string is true, so $cond takes its first branch.
jsongin.Evaluate( { name: '' }, { $cond: [ '$name', 'has a name', 'no name' ] } ) === 'has a name'
```
