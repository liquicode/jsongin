# @liquicode/jsongin


# Operator Authoring

Every operator in `jsongin` is a small module, added to an engine by name.
You can add operators of your own the same way.

This page describes what an operator looks like and how to add one.


## The Shape of an Operator Module

An operator module exports a ***factory function***. It takes the engine and returns the operator:

```js
// docs-check: skip - an operator module, not a call.
'use strict';

module.exports = function ( jsongin )
{
	let operator =
	{
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'n',

		Query: function ( Document, MatchValue, Path = '' )
		{
			// ...
		},
	};

	return operator;
};
```

The factory is called once for each engine, so each operator belongs to one engine.

Every operator has an `Engine` member holding the engine it belongs to.


## The Five Kinds of Operator

What else an operator needs depends on which table you add it to:

| **Table**               | **Function**  | **Also needs**             | **Receives a Scope** |
|-------------------------|---------------|----------------------------|:--------------------:|
| `QueryOperators`        | `Query`       | `TopLevel`, `ValueTypes`   |          no          |
| `ExpressionOperators`   | `Evaluate`    | `ArgTypes`                 |        ***yes***     |
| `UpdateOperators`       | `Update`      | `TopLevel`, `ValueTypes`   |          no          |
| `StageOperators`        | `Stage`       | `ArgTypes`                 |        ***yes***     |
| `AccumulatorOperators`  | `Accumulate`  | `ArgTypes`                 |        ***yes***     |

The three kinds which evaluate expressions receive a `Scope`, and must pass it on.
See [The Scope Rules](#the-scope-contract).

`ValueTypes` and `ArgTypes` mean the same thing: the [short type codes](./jsongin/ShortType.md)
  the operator accepts for the value it is given, such as `'n'` for a number or `'oa'` for an
  object or array.


## Type Checking

`Query()`, `Evaluate()`, `Update()` and `Aggregate()` check the value against `ValueTypes` or
  `ArgTypes` before calling the operator. If it does not fit, they ***throw***.

***Declare the types accurately, and check the value in the operator too.***
The engine only checks when the operator is reached through it. Code which calls an operator
  directly, such as `jsongin.QueryOperators.$size.Query( doc, 'two' )`, skips the check.

Do not declare fewer types than the operator really handles: that turns valid input into an error.


### Query Operators

```
Query: function ( Document, MatchValue, Path = '' )
```

Returns `true` when the document matches, and `false` when it does not.

- `Document` is the whole document.
- `MatchValue` is the value written after the operator in the query.
- `Path` is the dot notation path of the field the operator is under, or `''` at the top level.

To read the field, use `Engine.ResolveCandidates( Document, Path )`. It returns every value the
  path can refer to, including array elements, the way MongoDB matches.
See [`ResolveCandidates()`](./jsongin/ResolveCandidates.md).

| **Member**   | **Description**                                                                |
|--------------|---------------------------------------------------------------------------------|
| `TopLevel`   | `true` for an operator used at the top level of a query, such as `$and`. `false` for one used under a field, such as `$gt`. |
| `FieldLevel` | Optional. `true` lets a `TopLevel` operator also be used under a field, as `$exprx` and `$noop` are. |
| `ElementLevel` | Optional. `true` lets a `TopLevel` operator be used inside `$elemMatch`, as `$jsonSchema` is. |
| `ValueTypes` | The short type codes accepted for `MatchValue`. |


### Expression Operators

```
Evaluate: function ( Document, Args, Scope )
```

Returns the computed value.

- `Args` is what was written after the operator: one operand, or an array of operands.
  Each operand is an expression. Evaluate it with `Engine.Evaluate( Document, operand, Scope )`.
- `Scope` holds the variables. ***Pass it to everything you call.***

| **Member**  | **Description**                                                             |
|-------------|------------------------------------------------------------------------------|
| `ArgTypes`  | The short type codes accepted for `Args` itself, not for the operands inside it. |

An operator which takes a list declares `'a'`. One which also accepts a single operand without
  the array, as the arithmetic operators do, declares the other types too.

***Check the number of operands in the operator***, and throw when it is wrong.
There is no member for this, because operators count their operands in too many different ways.


### Update Operators

```
Update: function ( Document, UpdateFields )
```

Changes `Document` in place.
Returns `true` if it worked, or `false` if it could not be applied, after sending the reason to
  `OpLog`. `Update()` then throws.

`UpdateFields` is the object of `field: value` pairs written after the operator.
Use `Engine.SetValue` and `Engine.DeleteValue` to make changes, so paths are handled the same way
  as everywhere else.

***Return the real result.*** An operator which always returns `true` hides its failures.


### Stage Operators

```
Stage: function ( Documents, StageArgs, Scope )
```

Takes an array of documents and returns a new array of documents.

`Scope` is the pipeline's scope. To evaluate an expression against one document, make a scope
  for it with `Scope.ForDocument( document )`, so `$$ROOT` is that document.

***Do not change the input.***
A stage which only selects or reorders documents can return the original objects.
A stage which changes documents must copy them first with `Engine.SafeClone()`.


### Accumulators

```
Accumulate: function ( Documents, Args, Scope )
```

Takes the documents of one group and returns one value.
Make a scope for each document with `Scope.ForDocument( document )`, as a stage does.

By convention, accumulators ***skip*** values of the wrong type instead of throwing, unlike
  expression operators.


## The Scope Rules

<a id="the-scope-contract"></a>

***An operator which does not pass its `Scope` on loses every variable below it.***
Nothing fails at first. It fails later, when someone uses a `$$` variable inside that operator.

`npm run scope-check` checks four rules in the source:

1. Every call to `jsongin.Evaluate(` passes three arguments. With only two, a new, empty scope is
   made and the variables are lost.
2. Every helper function which evaluates expressions takes `Scope` as its ***last*** parameter.
3. Every operator's `Evaluate`, `Stage` or `Accumulate` function takes `Scope` as its last
   parameter.
4. Every call to such a helper passes as many arguments as it declares, so the scope lands in the
   right parameter.

A static check cannot tell whether a caller really passes the scope it was given.
To catch that, start every helper which evaluates with:

```js
// docs-check: skip - Scope is the caller's own parameter.
jsongin.Scope.Require( Scope, 'myfamily.ReadArgs' );
```

A missing scope then throws the first time a test uses the operator.

***To define a variable, make a child scope with `Scope.Child( { name: value } )`.***
Never write into `Scope.Variables`.
If the caller chose the name, check it first with `jsongin.Scope.RequireName( Name, '$myop' )`,
  which throws for a name that could hide a system variable.

See [Scope](./jsongin/Scope.md) and [Variables](./jsongin/Expression-Operators.md#variables).


## Reporting Problems

Operators never print directly. They send messages to the engine's `OpLog` and `OpError`, which
  are `null` unless the caller set them.

```js
try
{
	// An explanation: it worked, but maybe not as expected.
	if ( jsongin.OpLog ) { jsongin.OpLog( `$myop: cannot compare [${type}] at [${Path}].` ); }
}
catch ( error )
{
	// An error: it could not work.
	if ( jsongin.OpError ) { jsongin.OpError( `Query.$myop: ${error.message}` ); }
	throw error;
}
```

- Always check `if ( jsongin.OpLog )` before calling it.
- Always start the message with your operator's name.
- When you catch an error to report it, ***throw it again***.

See [OpLog](./OpLog.md).


## Adding an Operator

Add it to the right table on an engine:

```js
// docs-check: skip - registers an operator from a file of your own.
const jsongin = require( '@liquicode/jsongin' ).NewJsongin();

jsongin.QueryOperators.$startsWith = require( './my-operators/startsWith' )( jsongin );

jsongin.Query( { name: 'Alice' }, { name: { $startsWith: 'Al' } } ) === true
```

The tables are plain objects keyed by name. Using an existing name replaces that operator.

Each engine has its own tables, so an operator added to one engine is not in another.
Make your own engine with `NewJsongin()` to add operators to, rather than changing the default
  engine which other code may share.


## A Complete Example

A query operator which matches a string field by how it starts:

```js
// docs-check: skip - an operator module, not a call.
'use strict';

module.exports = function ( jsongin )
{
	let operator =
	{
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 's',

		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				if ( jsongin.ShortType( MatchValue ) !== 's' )
				{
					throw new Error( `$startsWith requires a string.` );
				}

				// Every value the path can refer to, including array elements.
				let candidates = jsongin.ResolveCandidates( Document, Path );
				for ( let index = 0; index < candidates.length; index++ )
				{
					let value = candidates[ index ];
					if ( ( jsongin.ShortType( value ) === 's' ) && value.startsWith( MatchValue ) )
					{
						return true;
					}
				}

				if ( jsongin.OpLog ) { jsongin.OpLog( `$startsWith: nothing at [${Path}] starts with [${MatchValue}].` ); }
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$startsWith: ${error.message}` ); }
				throw error;
			}
		},
	};

	return operator;
};
```


## Contributing an Operator

If you are adding an operator to `jsongin` itself:

- ***One operator per file***, under `src/Operators/`, in the folder for its kind. Register it in
  `src/jsongin.js`.
- ***Start the file with an `/*md` comment*** describing how to use it. `npm run check-docs` fails
  if an operator file does not have one. Files whose names start with `_` are helpers and are
  skipped.

```js
'use strict';
/*md

## Operators > Expression > $abs

Usage: `$abs: expression`

Returns the absolute value of a number.

*/
```

Describe what the operator does, what it refuses, and the cases which are easy to get wrong: a
  missing field, `null`, an empty array, a value of the wrong type.


## See Also

- [Operator Reference](./Operator-Reference.md)
- [`Query()`](./jsongin/Query.md), [`Evaluate()`](./jsongin/Evaluate.md),
  [`Update()`](./jsongin/Update.md), [`Aggregate()`](./jsongin/Aggregate.md)
- [`ShortType()`](./jsongin/ShortType.md), for the type codes.
- [NodeJS Usage](./Usage-NodeJS.md)
