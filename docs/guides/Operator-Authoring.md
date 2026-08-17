# @liquicode/jsongin


# Operator Authoring

Every operator `jsongin` supports is a self contained module which is registered into an engine
  instance by name.
Nothing about that registry is private, so you can add operators of your own the same way the
  built-in ones are added.

This document describes the operator contract and how to register one.


## The Shape of an Operator Module

An operator module exports a ***factory function*** which takes the engine and returns an
  operator object:

```js
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

The factory is called once per engine instance, so the operator closes over the engine it
  belongs to.
This is why two engines with different settings do not share operator state.


## Common Members

Every operator carries one:

| **Member**     | **Type** | **Description**                                                          |
|----------------|:--------:|---------------------------------------------------------------------------|
| `Engine`       |    o     | The engine instance this operator belongs to.                            |

> ***Removed in v0.1.0*** : `OperatorType`, a category name which was carried by all 75
  operators and read by nothing. Unlike `ValueTypes` and `ArgTypes` there was nothing a
  dispatcher could do with it — a label cannot refuse anything — so it could not make the
  engine more correct, and the diagnostics and grouping it was said to serve never
  materialized. Which kind an operator is remains determined by its registry, as below.


## The Five Kinds of Operator

Which remaining members an operator needs depends on what kind it is.
The kind is determined by which registry you put it in.

| **Registry**            | **Method**    | **Also needs**             |
|-------------------------|---------------|----------------------------|
| `QueryOperators`        | `Query`       | `TopLevel`, `ValueTypes`   |
| `ExpressionOperators`   | `Evaluate`    | `ArgTypes`                 |
| `UpdateOperators`       | `Update`      | `TopLevel`, `ValueTypes`   |
| `StageOperators`        | `Stage`       | `ArgTypes`                 |
| `AccumulatorOperators`  | `Accumulate`  | `ArgTypes`                 |

`ValueTypes` and `ArgTypes` are the same idea under two names: the
  [ShortTypes](./jsongin/ShortType.md) the operator accepts for the ***single value it is
  handed***.
The name follows what that value is called — a match value for a query, an argument for
  everything else.


## Type Checking

***The engine checks the declared types before it calls an operator.***

`Query()`, `Evaluate()`, `Update()`, and `Aggregate()` each compare the value they are about to
  pass against the operator's declared types, and refuse to dispatch when it does not fit.
A query or an update reports to the [`OpLog`](./OpLog.md) and treats the clause as not matching;
  an expression or a pipeline stage throws.

***Declare your operator's types accurately, and validate the value anyway.***

The two are not redundant, because the check above only runs when the operator is reached
  through the engine. An operator called directly, as
  `jsongin.QueryOperators.$size.Query( doc, 'two' )`, gets whatever the caller passed.
Every built-in operator therefore still validates what it receives.

A declaration which is narrower than what the operator really accepts is worse than no
  declaration at all: it turns working input into a rejection, and nothing about the operator's
  own code will contradict it. Declare what the code actually handles.


### Query Operators

```
Query: function ( Document, MatchValue, Path = '' )
```

Returns `true` when the document satisfies the operator at `Path`, and `false` when it does not.

- `Document` is the whole document being tested.
- `MatchValue` is whatever the query wrote as the operator's value.
- `Path` is the document path the operator was found at, in dot notation. It is `''` at the top
  level.

Use `Engine.GetValue( Document, Path )` to read the field being tested.

| **Member**   | **Description**                                                                |
|--------------|---------------------------------------------------------------------------------|
| `TopLevel`   | `true` when the operator may appear as a key of the query itself, rather than only within a field. `$and` and `$noop` are `true`; `$gt` is `false`. |
| `ValueTypes` | The [ShortTypes](./jsongin/ShortType.md) this operator accepts as its `MatchValue`. A query which gives it anything else is rejected, and the clause does not match. |


### Expression Operators

```
Evaluate: function ( Document, Args )
```

Returns the computed value.

- `Args` is the operator's operand or array of operands, each of which is itself an expression.
  Evaluate them with `Engine.Evaluate( Document, arg )`.

| **Member**  | **Description**                                                             |
|-------------|------------------------------------------------------------------------------|
| `ArgTypes`  | The ShortTypes accepted for `Args`. An expression which gives it anything else throws. |

Note that `ArgTypes` describes `Args` itself, not the operands inside it.
An operator which takes an operand list declares `'a'`, and one which also accepts a single
  operand without the enclosing array — which the arithmetic operators do — declares the
  expression types as well.

***Check the operand count yourself***, in the operator, and throw when it is wrong.
There is no declaration for it: the count means something different for each operator —
  `$literal` never counts its argument at all, `$cond` takes three operands or one object, and
  the variadic operators take any number — so a single declared number could not be enforced
  without carving out exceptions for the operators it does not fit.

> ***Removed in v0.1.0*** : `ArgCount`, which declared that number on 22 operators and was read
  by nothing. 13 operators already enforced exactly what they declared, 6 were variadic and
  declared `null`, and the remaining two were wrong. What an engine refuses is now measured
  rather than declared, by
  `test/Parity Tests/Aggregate Tests/test-suite/Expression Rejection Tests.js`.


### Update Operators

```
Update: function ( Document, UpdateFields )
```

Modifies `Document` in place and returns `true` on success, `false` on failure.

`UpdateFields` is the object of `field: value` pairs written under the operator's name.
Use `Engine.SetValue` and `Engine.DeleteValue` to make the changes so that document paths are
  handled consistently.

> ***Return the result.*** An update operator which reports success unconditionally makes a
  failed update indistinguishable from a successful one. This was a real defect in `$push`
  before v0.1.0.


### Stage Operators

```
Stage: function ( Documents, StageArgs )
```

Takes an array of documents and returns a new array of documents.

***Do not modify the input.***
A stage which only selects or reorders documents may pass the original documents along.
A stage which produces documents must clone with `Engine.SafeClone()` before writing, so that
  dates and regular expressions survive the pipeline.


### Accumulators

```
Accumulate: function ( Documents, Args )
```

Takes the array of documents belonging to one group and returns a single value.

Accumulators belong to the `$group` stage and cannot be used with `Evaluate` or `$expr`.

> Note that accumulators conventionally ***ignore*** values of the wrong type rather than
  throwing on them, which is the opposite of what the expression operators do.
  An expression is authored against a single document, where a type error is an authoring
  mistake worth surfacing. An accumulator runs across a whole group, where one malformed
  document should not abort the report.


## Reporting Problems

Operators do not print anything directly. They report through the engine's log handlers, which
  are `null` unless the caller configured them.

```js
try
{
	// An explanation: the operation completed, but not as expected.
	if ( jsongin.OpLog ) { jsongin.OpLog( `$myop: cannot compare [${type}] at [${Path}].` ); }
}
catch ( error )
{
	// An error: the operation cannot complete.
	if ( jsongin.OpError ) { jsongin.OpError( `Query.$myop: ${error.message}` ); }
	throw error;
}
```

Always guard the call with `if ( jsongin.OpLog )`.
Always prefix the message with your operator's name.
When you catch an error to log it, ***rethrow it***; the log is an addition to the throw, not a
  replacement for it.

See the [OpLog](./OpLog.md) document.


## Registering an Operator

Add it to the appropriate registry on an engine instance:

```js
const jsongin = require( '@liquicode/jsongin' ).NewJsongin();

jsongin.QueryOperators.$startsWith = require( './my-operators/startsWith' )( jsongin );

jsongin.Query( { name: 'Alice' }, { name: { $startsWith: 'Al' } } ) === true
```

The registries are plain objects keyed by operator name, so this is all registration amounts
  to. Replacing an existing key overrides that operator for the instance.

Because the registry belongs to the instance, an operator you add to one engine is not visible
  to another. Use `NewJsongin()` to make an instance to extend, and leave the module's default
  instance alone if other code shares it.


## A Complete Example

A query operator which matches a string field by its prefix:

```js
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

				let value = jsongin.GetValue( Document, Path );
				if ( jsongin.ShortType( value ) !== 's' )
				{
					if ( jsongin.OpLog )
					{
						// jsongin.OpLog( `$startsWith: [${Path}] is not a string.` );
					}
					return false;
				}

				return value.startsWith( MatchValue );
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


## Conventions in the Source

Two conventions are worth following if you are contributing operators back rather than adding
  them from outside:

***One operator per file.***
Operators live under `src/Operators/`, in a folder named for their kind, and are registered in
  `src/jsongin.js`.

***An `/*md` block at the top of the file.***
Every operator carries a markdown comment describing its usage:

```js
'use strict';
/*md

## Operators > Expression > $abs

Usage: `$abs: expression`

Returns the absolute value of a number.

*/
```

***This is required, and it is checked.*** `npm run check-docs` verifies that every file under
  `src/Operators/` has one, and fails the build when one is missing. Helper modules, whose names
  begin with an underscore, are not operators and are skipped.

The check exists because the convention did not hold on its own: it stood at 56 of 85 operators
  before the check was written, with the query and update operators ignoring it almost entirely.
  That is the same lesson the `OperatorType` and `ArgCount` members taught when they were
  deleted for being declared and never read — ***an unenforced convention drifts***.

Note that nothing ***reads*** these blocks to generate anything. They are documentation kept
  beside the code, and the check only asserts that they are present.

Write what the operator does and what it refuses, and state the cases which are easy to get
  wrong — a missing field, a null, an empty array, a value of the wrong type. The
  [Operator Reference](./Operator-Reference.md) carries the one-line summary; this block is for
  the maintainer standing in the file.


## See Also

- [Operator Reference](./Operator-Reference.md) — every operator, supported or not.
- [`Query()`](./jsongin/Query.md), [`Evaluate()`](./jsongin/Evaluate.md),
  [`Update()`](./jsongin/Update.md), [`Aggregate()`](./jsongin/Aggregate.md)
- [`ShortType()`](./jsongin/ShortType.md) — the type codes used by `ValueTypes` and `ArgTypes`.
- [NodeJS Usage](./Usage-NodeJS.md) — what else an engine instance exposes.
