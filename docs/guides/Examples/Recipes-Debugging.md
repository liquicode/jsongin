# @liquicode/jsongin


# Recipes: Debugging with OpLog and OpError

The engine takes two logging hooks in its settings, both `null` by default so a
production instance emits nothing:

- **`OpError`** is called when the engine ***refuses*** an operation — a query it
  cannot mean, a malformed pipeline stage, a bad operator argument. The operation
  still throws; the hook lets you see and record why.
- **`OpLog`** is called as the engine ***evaluates***, narrating the decisions it
  makes. It speaks up when a query criterion fails, which is how you find out why a
  document did not match.

Set them with [`NewJsongin( Settings )`](../Usage-NodeJS.md):


## Send Logs to the Console in Node

The common form passes the console functions straight in:

```js
// docs-check: skip - the console form, shown as you would write it in Node.
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: console.log,
	OpError: console.error,
} );
```

The recipes below capture the messages into arrays instead, so they can be checked.


## Capture the Messages

Route the hooks to functions that collect what they receive:

```js
let logs = [];
let errs = [];
const engine = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: function ( msg ) { logs.push( msg ); },
	OpError: function ( msg ) { errs.push( msg ); },
} );
```


## See Why a Query Was Refused with `OpError`

A malformed query throws, and `OpError` is called with the reason first. Capture
it to record or inspect the failure without losing the throw:

```js
let errs = [];
const engine = require( '@liquicode/jsongin' ).NewJsongin( {
	OpError: function ( msg ) { errs.push( msg ); },
} );
try { engine.Query( { a: 1 }, { $bogus: 1 } ); } catch ( e ) {}
errs.length === 1
errs[ 0 ].includes( '$bogus' ) === true
```

A malformed aggregation stage refuses the same way:

```js
let errs = [];
const engine = require( '@liquicode/jsongin' ).NewJsongin( {
	OpError: function ( msg ) { errs.push( msg ); },
} );
try { engine.Aggregate( [], [ { $bogus: 1 } ] ); } catch ( e ) {}
errs.length === 1
```


## Trace a Query That Matches Nothing with `OpLog`

`OpLog` narrates evaluation. A query that fails to match leaves a trail of the
criteria that returned false, which is how you find out why a document was dropped:

```js
let logs = [];
const engine = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: function ( msg ) { logs.push( msg ); },
} );
engine.Query( { a: 1 }, { a: { $gt: 5 } } );
logs.length > 0 === true
```


## A Matching Query Is Silent

`OpLog` only speaks up when something fails to match. A query that succeeds says
nothing, so a quiet log is a good sign:

```js
let logs = [];
const engine = require( '@liquicode/jsongin' ).NewJsongin( {
	OpLog: function ( msg ) { logs.push( msg ); },
} );
engine.Query( { a: 1 }, { a: 1 } );
logs.length === 0
```


## See Also

- [OpLog](../OpLog.md) — the full reference for the `OpLog` and `OpError` settings.
- [NodeJS Usage](../Usage-NodeJS.md) — `NewJsongin( Settings )` and the settings object.
- [`Query( Document, Criteria )`](../jsongin/Query.md) — which queries refuse and
  which simply return `false`.
- [`Aggregate( Documents, Pipeline )`](../jsongin/Aggregate.md) — pipeline errors.