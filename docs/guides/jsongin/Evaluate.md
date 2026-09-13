# @liquicode/jsongin


# Evaluate( Document, Expression, Scope )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                    |
|---------------|:-----------------:|----------------------------------------------------|
| Document      |        (any)      | The document to evaluate the expression against.   |
| Expression    |        (any)      | The expression to evaluate.                        |
| Scope         |         o         | Optional. The variables in effect. See [Scope](./Scope.md). |


## Description

Evaluates a MongoDB aggregation `Expression` against `Document`, and returns the result.

An expression is made of these parts:

***Field references*** :
A string starting with `$` refers to a field of `Document`.
`'$user.name'` is the `name` field inside the `user` field.
A field which does not exist gives `undefined`.

A field reference into an array ***collects*** the values from the elements which have the field,
  and a number in the path is a field name, not an index:

```js
jsongin.Evaluate( { a: [ { x: 5 }, { y: 9 } ] }, '$a.x' )   // returns [ 5 ]
jsongin.Evaluate( { a: [ 5, 6 ] }, '$a.1' )                 // returns []
```

This is how MongoDB reads a field reference, and it is different from
  [`GetValue()`](./GetValue.md).
To get an element by position, use [`$arrayElemAt`](./Expression-Operators.md#$arrayElemAt).

***Literals*** :
Numbers, booleans, `null`, and strings which do not start with `$` are returned as they are.
For a string which does start with `$`, use `$literal`.

***Variables*** :
A string starting with `$$` refers to a variable.
`$$ROOT`, `$$CURRENT`, `$$NOW` and `$$REMOVE` are always available, and
  [$let](./Expression-Operators.md#$let), [$map](./Expression-Operators.md#$map),
  [$filter](./Expression-Operators.md#$filter) and
  [$reduce](./Expression-Operators.md#$reduce) add their own.
***Using a variable which was never defined throws***, while a missing field only gives
  `undefined`. See [Variables](./Expression-Operators.md#variables).

***Operators*** :
An object with one key naming an expression operator, such as `{ $add: [ 1, 2 ] }`, applies the
  operator.
The operator's arguments are expressions too, so operators can be nested.

***Expression objects*** :
Any other object is evaluated field by field, and the result is an object of the results.
A field whose result is `undefined` is left out.

***Arrays*** :
An array is evaluated element by element.
An element whose result is `undefined` becomes `null`, so the array keeps its length.


## Errors and Missing Values

`Evaluate` throws when an expression is wrong: an unknown operator, the wrong number of
  arguments, an argument of the wrong type (such as adding a string), or dividing by zero.

Missing and `null` values are not errors.
Arithmetic on a missing or `null` value gives `null`, as in MongoDB, so an expression can run over
  documents with incomplete data.

```js
jsongin.Evaluate( { dmg: 8 }, { $subtract: [ '$dmg', '$armor' ] } ) === null  // armor is missing
jsongin.Evaluate( { dmg: 8 }, { $subtract: [ '$dmg', 'five' ] } )             // throws
```

The accumulators used by `$group` are different: they skip values they cannot use.
See [Accumulator Operators](./Accumulator-Operators.md).


## Operators

[Expression Operators](./Expression-Operators.md) describes every expression operator, with
  examples, in these groups:
  arithmetic, rounding, comparison, smallest and largest, array, variables, string,
  trigonometry, type, set, object, date, data size, miscellaneous, logical, conditional,
  and literal.

The [Operator Reference](../Operator-Reference.md) lists which MongoDB operators are supported.


## See Also

- [Scope](./Scope.md), the object which holds the variables.
- [`Query( Document, Criteria )`](./Query.md) and its `$expr` operator, which uses `Evaluate` to
  match documents.
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md)
- [Operator Reference](../Operator-Reference.md)


## Examples

### It reads fields and computes values
```js
jsongin.Evaluate( { dmg: 8, armor: 5 }, { $subtract: [ '$dmg', '$armor' ] } ) === 3
jsongin.Evaluate( { hp: 3, max: 10 }, { $divide: [ '$hp', '$max' ] } ) === 0.3
```

### Comparisons return booleans
```js
jsongin.Evaluate( { hp: 3, max: 10 }, { $lte: [ { $divide: [ '$hp', '$max' ] }, 0.25 ] } ) === false
jsongin.Evaluate( { dmg: 8, armor: 5 }, { $gt: [ '$dmg', '$armor' ] } ) === true
```

### It chooses between values
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

### It fills in missing values
```js
jsongin.Evaluate( { }, { $ifNull: [ '$hp', 0 ] } ) === 0
jsongin.Evaluate( { hp: 0 }, { $ifNull: [ '$hp', 99 ] } ) === 0  // zero is not missing
```

### An expression object returns an object
```js
let document = { dmg: 8, armor: 5 };
jsongin.Evaluate( document, {
	attacker: '$dmg',
	net_damage: { $subtract: [ '$dmg', '$armor' ] },
} )
// returns { attacker: 8, net_damage: 3 }
```

### It reads variables
```js
jsongin.Evaluate( { a: 5 }, '$$ROOT.a' ) === 5

// An undefined variable throws. A missing field does not.
jsongin.Evaluate( { a: 5 }, '$nope' ) === undefined
jsongin.Evaluate( { a: 5 }, '$$nope' );   // throws

// $let defines a variable inside the expression.
jsongin.Evaluate( { a: 5 }, { $let: { vars: { b: 2 }, in: { $add: [ '$a', '$$b' ] } } } ) === 7

// A Scope defines one from outside.
let scope = jsongin.Scope.NewDocument( { a: 5 } ).Child( { b: 2 } );
jsongin.Evaluate( { a: 5 }, { $add: [ '$a', '$$b' ] }, scope ) === 7
```

### $literal returns a string starting with $ as it is
```js
jsongin.Evaluate( { dmg: 8 }, '$dmg' ) === 8
jsongin.Evaluate( { dmg: 8 }, { $literal: '$dmg' } ) === '$dmg'
```
