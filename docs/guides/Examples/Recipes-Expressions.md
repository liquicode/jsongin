# @liquicode/jsongin


# Recipes: Expressions

The expression language is what [`Project()`](../jsongin/Project.md) computes with,
what [`$expr`](../jsongin/Query-Operators.md) matches with, and what every computing
aggregation stage evaluates. [`Evaluate( Document, Expression )`](../jsongin/Evaluate.md)
runs one expression and returns its value, which makes it the easiest way to see
what an operator does.

The recipes use this document:

```js
let d = { _id: 1, name: 'Alice', age: 30, tags: [ 'staff', 'a' ], profile: { city: 'East' }, missing: null };
```


## Field References and Literals

A string that begins with `$` is a field reference — the rest is a dot-path the
document is read along:

```js
jsongin.Evaluate( d, '$age' ) === 30
jsongin.Evaluate( d, '$profile.city' ) === 'East'
```

Anything else is a literal. A number, a boolean, `null`, and an array are
themselves. A string ***without*** a leading `$` is a literal string, not a field:

```js
jsongin.Evaluate( d, 5 ) === 5
jsongin.Evaluate( d, 'hello' ) === 'hello'
jsongin.Evaluate( d, 'age' ) === 'age'
jsongin.Evaluate( d, null ) === null
```

A missing field resolves to `undefined`; a field holding `null` resolves to `null`:

```js
jsongin.Evaluate( d, '$nosuch' ) === undefined
jsongin.Evaluate( d, '$missing' ) === null
```


## Arithmetic

The arithmetic operators take an array of operands. `$add` takes any number; the
rest take two:

```js
jsongin.Evaluate( d, { $add: [ '$age', 1, 10 ] } ) === 41
jsongin.Evaluate( d, { $subtract: [ '$age', 10 ] } ) === 20
jsongin.Evaluate( d, { $multiply: [ '$age', 2 ] } ) === 60
jsongin.Evaluate( d, { $mod: [ '$age', 7 ] } ) === 2
```

`$abs`, `$ceil`, `$floor`, and `$round` take one operand (`$round` takes a second
for the number of decimal places):

```js
jsongin.Evaluate( d, { $abs: -5 } ) === 5
jsongin.Evaluate( d, { $ceil: 3.2 } ) === 4
jsongin.Evaluate( d, { $floor: 3.8 } ) === 3
jsongin.Evaluate( d, { $round: [ 3.567, 2 ] } ) === 3.57
```


## Comparison

Comparison operators return a boolean, except `$cmp` which returns `-1`, `0`, or
`1`:

```js
jsongin.Evaluate( d, { $eq: [ '$age', 30 ] } ) === true
jsongin.Evaluate( d, { $ne: [ '$age', 30 ] } ) === false
jsongin.Evaluate( d, { $gt: [ '$age', 40 ] } ) === false
jsongin.Evaluate( d, { $lt: [ '$age', 40 ] } ) === true
jsongin.Evaluate( d, { $cmp: [ '$age', 30 ] } ) === 0
```


## Logical

`$and`, `$or`, and `$not` combine boolean expressions:

```js
jsongin.Evaluate( d, { $and: [ { $gt: [ '$age', 20 ] }, { $lt: [ '$age', 40 ] } ] } ) === true
jsongin.Evaluate( d, { $or: [ { $eq: [ '$age', 99 ] }, { $eq: [ '$age', 30 ] } ] } ) === true
jsongin.Evaluate( d, { $not: [ { $gt: [ '$age', 50 ] } ] } ) === true
```


## Conditional

`$cond` picks between two values. The array form is
`[ condition, then, else ]`:

```js
jsongin.Evaluate( d, { $cond: [ { $gte: [ '$age', 35 ] }, 'senior', 'junior' ] } ) === 'junior'
```

`$ifNull: [ expression, fallback ]` returns the first value that is not null or
missing:

```js
jsongin.Evaluate( d, { $ifNull: [ '$age', 0 ] } ) === 30
jsongin.Evaluate( d, { $ifNull: [ '$nosuch', 'none' ] } ) === 'none'
```

`$switch` evaluates a list of branches and a default:

```js
jsongin.Evaluate( d, {
	$switch: {
		branches: [ { case: { $eq: [ '$age', 30 ] }, then: 'thirty' } ],
		default: 'other'
	}
} ) === 'thirty'
```


## Take a Value Literally with `$literal`

A string that begins with `$` is a field reference. `$literal` takes its argument
as a value instead, which is how you store a string that happens to start with `$`:

```js
jsongin.Evaluate( d, { $literal: '$name' } ) === '$name'
```


## Array Expressions

`$size` counts elements, `$arrayElemAt` reads one, `$concatArrays` joins arrays,
and `$in` tests membership:

```js
jsongin.Evaluate( d, { $size: '$tags' } ) === 2
jsongin.Evaluate( d, { $arrayElemAt: [ '$tags', 0 ] } ) === 'staff'
jsongin.Evaluate( d, { $concatArrays: [ '$tags', [ 'x' ] ] } )
// returns [ 'staff', 'a', 'x' ]
jsongin.Evaluate( d, { $in: [ 'a', '$tags' ] } ) === true
```


## Use an Expression in `Project`

A field whose value is an expression object is computed. The projection switches
to inclusion mode, so only `_id` and the fields you name appear:

```js
jsongin.Project( d, { double_age: { $multiply: [ '$age', 2 ] } } )
// returns { _id: 1, double_age: 60 }
```


## Use an Expression in `$expr`

`$expr` puts an expression in a query, so a query can compare fields or compute:

```js
jsongin.Query( d, { $expr: { $gt: [ '$age', 25 ] } } ) === true
```


## Use an Expression in an Aggregation Stage

The computing stages — `$addFields`, `$project`, `$group` accumulators — all use
this language. Square each `x`, sort by the square, and shape the output:

```js
jsongin.Aggregate( [ { _id: 1, x: 3 }, { _id: 2, x: 5 } ], [
	{ $addFields: { sq: { $multiply: [ '$x', '$x' ] } } },
	{ $sort: { sq: -1 } },
	{ $project: { _id: 0, x: 1, sq: 1 } },
] )
// returns [ { x: 5, sq: 25 }, { x: 3, sq: 9 } ]
```


## See Also

- [`Evaluate( Document, Expression )`](../jsongin/Evaluate.md)
- [Expression Operators](../jsongin/Expression-Operators.md)
- [`Project( Document, Projection )`](../jsongin/Project.md)
- [`Query( Document, Criteria )`](../jsongin/Query.md) and `$expr`
- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md)