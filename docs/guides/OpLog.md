# @liquicode/jsongin


# OpLog

`jsongin` can emit log messages which can provide insight into why a particular query or update has failed.
Sometimes warnings are emitted which can explain why some unexpected behavior has occurred.
The OpLog does not affect the behavior of a function.
For example, when a function throws an error, it also emits a message as well throwing the error.

Logging is off by default. Both handlers are `null` and nothing is emitted.


## Enabling the Log

The log is configured per engine instance, so you must create an instance with the
  `NewJsongin( Settings )` factory method.
The module's default export is an already-constructed instance which has logging turned off.

```js
let Settings = {
	OpLog: null, // A function to call (such as console.log) to output OpLog messages.
	OpError: null, // A function to call (such as console.error) to output OpError messages.
};
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

If you want to see the trace messages for `jsongin` operations printed to the console,
  you can initialize `jsongin` like this:
```js
let Settings = { OpLog: console.log };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

To see error messages in the error console, use:
```js
let Settings = { OpError: console.error };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

You can use any Javascript function to handle the message output:
```js
function my_log( Message )
{
	let timestamp = ( new Date() ).toISOString();
	console.log( timestamp + ' - ' + Message );
}
let Settings = { OpLog: my_log, OpError: my_log };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```


## OpLog and OpError

The two handlers describe two different situations:

- `OpLog` receives ***explanations***.
  An operation completed, but did not do what you may have expected.
  A query clause did not match, a field could not be set, an operator was given a value of the
  wrong type. These are the messages which tell you ***why*** a result came back the way it did.

- `OpError` receives ***errors***.
  An operation could not complete and an exception is being thrown.
  The message is emitted in addition to the throw, never instead of it.

Assign the same function to both if you want one combined stream.


## What Emits Messages

Every message is prefixed with the name of the function or operator which emitted it, so a
  message can be traced back to its source.

```
$gt: cannot compare [s] type with [n] type at [hp].
Update.$currentDate: Setting the value of [user.last_login] to [1700812593086] failed.
Distinct: Documents must be an array.
```

Note that the prefix is not uniformly qualified.
The query operators log under their bare name (`$gt:`), while the update operators and pipeline
  stages qualify theirs (`Update.$inc:`).
Messages emitted to `OpError` are always qualified (`Query.$gt:`).

***Engine functions*** :
All of them emit, except for the five which cannot fail:
`ShortType()`, `BsonType()`, `CompareValues()`, `Hybridize()`, and `Unhybridize()`.

| Category                | Functions                                                                     |
|-------------------------|-------------------------------------------------------------------------------|
| MongoDB Mechanics       | `Query`, `Evaluate`, `Aggregate`, `Filter`, `Distinct`, `Sort`, `Project`, `Update` |
| Snapshots               | `Diff`, `Invert`                                                              |
| Document Paths          | `SplitPath`, `JoinPaths`                                                      |
| Document Values         | `GetValue`, `SetValue`, `DeleteValue`                                         |
| Document Conversions    | `Parse`, `Format`, `Flatten`, `Expand`                                        |
| Cloning and Merging     | `SafeClone`, `Merge`                                                          |

***Operators*** :
Every operator emits under its own name.
This covers all of the query operators, expression operators, update operators, pipeline
  stages, and accumulators.

Note that `$set` is registered twice, as an update operator and as an aggregation stage.
Each reports under its own name, so a message from a pipeline `$set` is never mistaken for one
  from the update operator.


## See Also

- [NodeJS Usage](./Usage-NodeJS.md), which describes the full `Settings` object.
