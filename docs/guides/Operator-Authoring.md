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
		OperatorType: 'Comparison',
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

Every operator carries these two:

| **Member**     | **Type** | **Description**                                                          |
|----------------|:--------:|---------------------------------------------------------------------------|
| `Engine`       |    o     | The engine instance this operator belongs to.                            |
| `OperatorType` |    s     | A category name, used for diagnostics and grouping.                      |

`OperatorType` is one of `Comparison`, `Logical`, `Array`, `Evaluation`, `Extension`, `Meta`,
  `Arithmetic`, `Conditional`, `Literal`, `Update`, `Stage`, or `Accumulator`.


## The Five Kinds of Operator

Which remaining members an operator needs depends on what kind it is.
The kind is determined by which registry you put it in.

| **Registry**            | **Method**    | **Also needs**             |
|-------------------------|---------------|----------------------------|
| `QueryOperators`        | `Query`       | `TopLevel`, `ValueTypes`   |
| `ExpressionOperators`   | `Evaluate`    | `ArgCount`, `ArgTypes`     |
| `UpdateOperators`       | `Update`      | `TopLevel`, `ValueTypes`   |
| `StageOperators`        | `Stage`       | `ValueTypes`               |
| `AccumulatorOperators`  | `Accumulate`  | `ArgTypes`                 |


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
| `ValueTypes` | The [ShortTypes](./jsongin/ShortType.md) this operator accepts as its `MatchValue`. A query which gives it anything else is rejected. |


### Expression Operators

```
Evaluate: function ( Document, Args )
```

Returns the computed value.

- `Args` is the operator's operand or array of operands, each of which is itself an expression.
  Evaluate them with `Engine.Evaluate( Document, arg )`.

| **Member**  | **Description**                                                             |
|-------------|------------------------------------------------------------------------------|
| `ArgCount`  | The number of operands expected. Use `0` for a variable count.              |
| `ArgTypes`  | The ShortTypes accepted for the operands.                                   |


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
		OperatorType: 'Comparison',
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
The newer operators carry a markdown comment describing their usage:

```js
'use strict';
/*md

## Operators > Expression > $abs

Usage: `$abs: expression`

Returns the absolute value of a number.

*/
```

Note that nothing currently reads these blocks; they are documentation kept beside the code
  rather than a build input.


## See Also

- [Operator Reference](./Operator-Reference.md) — every operator, supported or not.
- [`Query()`](./jsongin/Query.md), [`Evaluate()`](./jsongin/Evaluate.md),
  [`Update()`](./jsongin/Update.md), [`Aggregate()`](./jsongin/Aggregate.md)
- [`ShortType()`](./jsongin/ShortType.md) — the type codes used by `ValueTypes` and `ArgTypes`.
- [NodeJS Usage](./Usage-NodeJS.md) — what else an engine instance exposes.
