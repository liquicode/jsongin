# @liquicode/jsongin


# Evaluate( Document, Expression )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                    |
|---------------|:-----------------:|----------------------------------------------------|
| Document      |        (any)      | The document to evaluate the expression against.   |
| Expression    |        (any)      | The expression to evaluate.                        |


## Description

Evaluates a MongoDB aggregation `Expression` against a `Document` and returns the resulting value.

An expression is built from three kinds of things:

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


## See Also

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
// === { attacker: 8, net_damage: 3 }
```

### It returns literal values with $literal
```js
jsongin.Evaluate( { dmg: 8 }, '$dmg' ) === 8
jsongin.Evaluate( { dmg: 8 }, { $literal: '$dmg' } ) === '$dmg'
```
