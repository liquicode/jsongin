# Plugin / Operator Author Guide

`jsongin` is extended by writing ***operators*** and registering them into an engine instance.

The full guide lives with the published documentation:

- [`docs/guides/Operator-Authoring.md`](../docs/guides/Operator-Authoring.md)

That document covers the operator contract, the five kinds of operator and the method each one
  implements, how to report problems through `OpLog` / `OpError`, and a complete worked example.


## The Short Version

An operator module exports a factory which takes the engine and returns an operator object:

```js
module.exports = function ( jsongin )
{
	return {
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 's',
		Query: function ( Document, MatchValue, Path = '' ) { /* ... */ },
	};
};
```

Register it on an instance:

```js
const jsongin = require( '@liquicode/jsongin' ).NewJsongin();
jsongin.QueryOperators.$startsWith = require( './startsWith' )( jsongin );
```

The registries are plain objects on the instance:
`QueryOperators`, `ExpressionOperators`, `UpdateOperators`, `StageOperators`, and
`AccumulatorOperators`.


## If You Are Contributing an Operator Back

- One operator per file, under `src/Operators/<Kind>/`.
- Register it in `src/jsongin.js`.
- Add an `/*md` block at the top of the file describing its usage.
- Add it to the table in `docs/guides/Operator-Reference.md` and give it a section in the
  relevant guide.
- Add tests to the matching `2xx` file in `test/`. See
  [`docs/guides/Testing-Procedure.md`](../docs/guides/Testing-Procedure.md).
