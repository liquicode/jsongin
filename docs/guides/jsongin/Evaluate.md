# @liquicode/jsongin


# Evaluate( Document, Expression, Scope )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                    |
|---------------|:-----------------:|----------------------------------------------------|
| Document      |        (any)      | The document to evaluate the expression against.   |
| Expression    |        (any)      | The expression to evaluate.                        |
| Scope         |         o         | Optional. The variables in effect. One is made for the occasion when it is not given. |


## Description

Evaluates a MongoDB aggregation `Expression` against a `Document` and returns the resulting value.

An expression is built from four kinds of things:

***Field References*** :
A string which begins with a `$` character is a reference to a field within the `Document`.
The rest of the string is a document path in dot-notation, which is resolved with
  [`GetValue( Document, Path )`](./GetValue.md).
For example, `"$user.name"` is the value of the `name` field within the `user` field.
A field which does not exist evaluates to `undefined`.

***Literals*** :
Numbers, booleans, `null`, and strings which do not begin with a `$` character are literal
  values which evaluate to themselves.
To produce a literal string which does begin with a `$` character, use the `$literal` operator.

***Variables*** :
A string which begins with `$$` is a reference to a variable rather than to a field.
`$$ROOT`, `$$CURRENT`, `$$NOW`, and `$$REMOVE` are always in scope, and
  [$let](./Expression-Operators.md#$let), [$map](./Expression-Operators.md#$map),
  [$filter](./Expression-Operators.md#$filter), and
  [$reduce](./Expression-Operators.md#$reduce) bind names of their own.
***A variable nobody bound is an error***, where a field which does not exist is merely
  missing. See [Variables](./Expression-Operators.md#variables).

***Operators*** :
An object with a single field whose name is an expression operator, such as
  `{ $add: [ 1, 2 ] }`, applies that operator to its arguments.
Arguments are themselves expressions, so operators can be nested to any depth.

Any other object is an ***expression object***.
Each of its field values is evaluated and an object of the resulting values is returned.

Arrays are evaluated element by element.

See the [Operator Reference](../Operator-Reference.md) for the list of supported expression
  operators.


## Errors and Missing Values

`Evaluate` throws an error when an expression is malformed.
This includes unrecognized operators, incorrect argument counts, arithmetic on values which are
  not numbers, and division by zero.

Missing and `null` values are not errors.
Arithmetic performed on a missing or `null` value returns `null`, which is what MongoDB does.
This lets an expression run over documents with incomplete data without failing.

```js
jsongin.Evaluate( { dmg: 8 }, { $subtract: [ '$dmg', '$armor' ] } ) === null  // armor is missing
jsongin.Evaluate( { dmg: 8 }, { $subtract: [ '$dmg', 'five' ] } )             // throws
```


## Operator Summary

| **Category**     | **Operators**                                                                                                                                                    |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Arithmetic       | [$add](./Expression-Operators.md#$add), [$subtract](./Expression-Operators.md#$subtract), [$multiply](./Expression-Operators.md#$multiply), [$divide](./Expression-Operators.md#$divide), [$mod](./Expression-Operators.md#$mod), [$abs](./Expression-Operators.md#$abs) |
| Rounding         | [$ceil](./Expression-Operators.md#$ceil), [$floor](./Expression-Operators.md#$floor), [$round](./Expression-Operators.md#$round), [$trunc](./Expression-Operators.md#$trunc) |
| Comparison       | [$eq](./Expression-Operators.md#$eq), [$ne](./Expression-Operators.md#$ne), [$gt](./Expression-Operators.md#$gt), [$gte](./Expression-Operators.md#$gte), [$lt](./Expression-Operators.md#$lt), [$lte](./Expression-Operators.md#$lte), [$cmp](./Expression-Operators.md#$cmp) |
| Smallest/Largest | [$min](./Expression-Operators.md#$min), [$max](./Expression-Operators.md#$max)                                                                                    |
| Array            | [$size](./Expression-Operators.md#$size), [$arrayElemAt](./Expression-Operators.md#$arrayElemAt), [$concatArrays](./Expression-Operators.md#$concatArrays), [$in](./Expression-Operators.md#$in) |
| Logical          | [$and](./Expression-Operators.md#$and), [$or](./Expression-Operators.md#$or), [$not](./Expression-Operators.md#$not)                                              |
| Conditional      | [$cond](./Expression-Operators.md#$cond), [$ifNull](./Expression-Operators.md#$ifNull), [$switch](./Expression-Operators.md#$switch)                              |
| Literal          | [$literal](./Expression-Operators.md#$literal)                                                                                                                   |
| Variables        | [$let](./Expression-Operators.md#$let), [$map](./Expression-Operators.md#$map), [$filter](./Expression-Operators.md#$filter), [$reduce](./Expression-Operators.md#$reduce) |

Each operator is described in detail, with examples, in
  [Expression Operators](./Expression-Operators.md).

***An expression operator throws on an operand of the wrong type***, unlike the accumulators,
  which ignore what they cannot use. See [Accumulator Operators](./Accumulator-Operators.md).


## See Also

- [Scope](./Scope.md), the object which holds the variables, and why it is a value the caller
  owns rather than state the engine keeps.
- [`Query( Document, Criteria )`](./Query.md) and the `$expr` operator, which uses `Evaluate`
  to match documents.
- [`GetValue( Document, Path )`](./GetValue.md)
- [Operator Reference](../Operator-Reference.md)


## Examples

### It resolves field references and computes values
```js
jsongin.Evaluate( { dmg: 8, armor: 5 }, { $subtract: [ '$dmg', '$armor' ] } ) === 3
jsongin.Evaluate( { hp: 3, max: 10 }, { $divide: [ '$hp', '$max' ] } ) === 0.3
```

### It returns booleans from comparisons
```js
jsongin.Evaluate( { hp: 3, max: 10 }, { $lte: [ { $divide: [ '$hp', '$max' ] }, 0.25 ] } ) === false
jsongin.Evaluate( { dmg: 8, armor: 5 }, { $gt: [ '$dmg', '$armor' ] } ) === true
```

### It selects values conditionally
```js
let document = { hp: 3 };
jsongin.Evaluate( document, { $cond: [ { $gt: [ '$hp', 0 ] }, 'alive', 'dead' ] } ) === 'alive'

jsongin.Evaluate( document, {
	$switch: {
		branches: [
			{ case: { $lte: [ '$hp', 0 ] }, then: 'dead' },
			{ case: { $lt: [ '$hp', 5 ] }, then: 'wounded' },
		],
		default: 'healthy',
	}
} ) === 'wounded'
```

### It substitutes values which are missing
```js
jsongin.Evaluate( { }, { $ifNull: [ '$hp', 0 ] } ) === 0
jsongin.Evaluate( { hp: 0 }, { $ifNull: [ '$hp', 99 ] } ) === 0  // zero is not a missing value
```

### It returns an object when given an expression object
```js
let document = { dmg: 8, armor: 5 };
jsongin.Evaluate( document, {
	attacker: '$dmg',
	net_damage: { $subtract: [ '$dmg', '$armor' ] },
} )
// returns { attacker: 8, net_damage: 3 }
```

### It resolves variables, which a caller may add to
```js
jsongin.Evaluate( { a: 5 }, '$$ROOT.a' ) === 5

// A variable nobody bound is an error, where a missing field is not.
jsongin.Evaluate( { a: 5 }, '$nope' ) === undefined
jsongin.Evaluate( { a: 5 }, '$$nope' );   // throws

// $let binds one within the expression.
jsongin.Evaluate( { a: 5 }, { $let: { vars: { b: 2 }, in: { $add: [ '$a', '$$b' ] } } } ) === 7

// A Scope binds one from outside it.
let scope = jsongin.Scope.NewDocument( { a: 5 } ).Child( { b: 2 } );
jsongin.Evaluate( { a: 5 }, { $add: [ '$a', '$$b' ] }, scope ) === 7
```

### It returns literal values with $literal
```js
jsongin.Evaluate( { dmg: 8 }, '$dmg' ) === 8
jsongin.Evaluate( { dmg: 8 }, { $literal: '$dmg' } ) === '$dmg'
```
