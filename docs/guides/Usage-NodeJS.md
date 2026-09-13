# @liquicode/jsongin


# NodeJS Usage


## Install

```bash
npm install --save @liquicode/jsongin
```

`jsongin` has no runtime dependencies.


## Require

The module exports a ready-to-use ***engine***, not a function to call:

```js
const jsongin = require( '@liquicode/jsongin' );

console.log( jsongin.Library.name + ', v' + jsongin.Library.version );
```

This engine has logging turned off. For most uses, it is all you need.


## Import as an ES Module

Both `import` forms work:

```mjs
import jsongin from '@liquicode/jsongin';
import { Query, Evaluate, Project } from '@liquicode/jsongin';
```

`require()` and `import` give you the ***same*** engine, so an operator you add through one is
  available through the other.

Every member of the engine is a named export except `OpLog` and `OpError`.
Set those on the default export instead, so the engine sees the change:

```mjs
import jsongin from '@liquicode/jsongin';
jsongin.OpLog = function ( Message ) { console.log( Message ); };
```


## TypeScript

Type declarations are included in the package, in `types/`, so TypeScript projects and editors
  know the engine's functions without installing anything else.
`jsongin` itself is written in Javascript.


## Create an Engine with Settings

To choose settings, call `NewJsongin( Settings )`:

```js
let Settings = { OpLog: null, OpError: null };

const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

Each engine has its own settings and its own operators, so you can have more than one: for
  example, a quiet one for normal use and a logging one while you work out a problem.

> The module export is an engine, not a function, so `require( '@liquicode/jsongin' )( Settings )`
  does not work. Use `NewJsongin( Settings )`.


## Settings

```js
// docs-check: skip - the shape of the settings object.
let Settings = {
	OpLog: null, // A function, such as console.log, to receive explanations.
	OpError: null, // A function, such as console.error, to receive errors.
}
```

Both default to `null`, which sends nothing.

```js
// Log explanations and errors to the console.
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: console.log,
	OpError: console.error,
} );
```

See [OpLog](./OpLog.md).


## What an Engine Has

Besides the functions in the [Library Guide](./Library-Guide.md), an engine has these fields:

| **Field**                | **Description**                                                        |
|--------------------------|-------------------------------------------------------------------------|
| `Library`                | The library's `name`, `url` and `version`.                             |
| `Settings`               | The settings the engine was made with.                                 |
| `NewJsongin`             | The factory method, so any engine can make another.                    |
| `Text`                   | The [text functions](./Library-Guide.md#text-functions).               |
| `Scope`                  | The [Scope](./jsongin/Scope.md) functions.                              |
| `QueryOperators`         | The query operators, by name.                                          |
| `ExpressionOperators`    | The expression operators, by name.                                     |
| `UpdateOperators`        | The update operators, by name.                                         |
| `StageOperators`         | The pipeline stages, by name.                                          |
| `AccumulatorOperators`   | The accumulators, by name.                                             |

The operator tables are plain objects, so you can add operators of your own.
See [Operator Authoring](./Operator-Authoring.md).


## See Also

- [Browser Usage](./Usage-Browser.md)
- [Library Guide](./Library-Guide.md)
- [OpLog](./OpLog.md)
