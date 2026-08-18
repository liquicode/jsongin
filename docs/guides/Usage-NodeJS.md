# @liquicode/jsongin


# NodeJS Usage


## Install jsongin with NPM

```bash
npm install --save @liquicode/jsongin
```

`jsongin` has no runtime dependencies.


## Include jsongin in your NodeJS Project

The module's default export is a ready-to-use engine ***instance***, not a factory:

```js
const jsongin = require( '@liquicode/jsongin' );

console.log( jsongin.Library.name + ', v' + jsongin.Library.version );
```

This instance has logging turned off.
For most uses it is all you need.


## Create an Instance with Custom Settings

To configure the engine, call the `NewJsongin( Settings )` factory method:

```js
let Settings = { OpLog: null, OpError: null };

const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

Each instance carries its own settings and its own operator registries, so you can hold more
  than one at a time — a quiet one for production paths and a logging one for the query you are
  trying to understand.

> ***Note*** : the module export is an instance, so `require( '@liquicode/jsongin' )( Settings )`
  does not work. Use `NewJsongin( Settings )`.


## Customize jsongin Behavior with Settings

```js
// docs-check: skip - the shape of the settings object.
let Settings = {
	OpLog: null, // A function to call (such as console.log) to output OpLog messages.
	OpError: null, // A function to call (such as console.error) to output OpError messages.
}
```

Both default to `null`, which emits nothing.

```js
// Explain what the engine is doing, on the console:
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: console.log,
	OpError: console.error,
} );
```

> See the [OpLog](./OpLog.md) document for more information about how OpLog works.


## What the Engine Exposes

Beyond the functions described in the [Library Guide](./Library-Guide.md), an engine instance
  carries a few fields worth knowing about:

| **Field**                | **Description**                                                        |
|--------------------------|-------------------------------------------------------------------------|
| `Library`                | The library's `name`, `url`, and `version`.                            |
| `Settings`               | The settings this instance was created with.                           |
| `NewJsongin`             | The factory method, so any instance can make another.                  |
| `Text`                   | The text helper functions.                                             |
| `QueryOperators`         | The registered query operators, keyed by name.                         |
| `ExpressionOperators`    | The registered expression operators.                                   |
| `UpdateOperators`        | The registered update operators.                                       |
| `StageOperators`         | The registered aggregation pipeline stages.                            |
| `AccumulatorOperators`   | The registered accumulators.                                           |

The operator registries are plain objects, which is what makes it possible to add operators of
  your own. See [Operator Authoring](./Operator-Authoring.md).


## See Also

- [Browser Usage](./Usage-Browser.md)
- [Library Guide](./Library-Guide.md)
- [OpLog](./OpLog.md)
