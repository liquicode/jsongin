# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# OpLog

`jsongin` can emit log messages which can provide insight into why a particular query or update has failed.
Sometimes warnings are emitted which can explain why some unexpected behavior has occurred.
The OpLog does not affect the behavior of a function.
For example, when a function throws an error, it also emits a message as well throwing the error.

When `jsongin` is initialized, you can provide a `Settings` object which controls this behavior:

```js
let Settings = {
	OpLog: null, // A function to call (such as console.log) to output OpLog messages.
	OpError: null, // A function to call (such as console.error) to output OpError messages.
};
const jsongin = require('@liquicode/jsongin')( Settings );
```

If you want to see the trace messages for `jsongin` operations printed to the console,
  you can initialize `jsongin` like this:
```js
let Settings = { OpLog: console.log };
const jsongin = require('@liquicode/jsongin')( Settings );
```

To see error messages in the error console, use:
```js
let Settings = { OpError: console.error };
const jsongin = require('@liquicode/jsongin')( Settings );
```

You can use any Javascript function to handle the message output:
```js
function my_log( Message )
{
	let timestamp = (new Date()).toISOString();
	console.log( timestamp + ' - ' + Message );
}
let Settings = { OpLog: my_log, OpError: my_log };
const jsongin = require('@liquicode/jsongin')( Settings );
```

The following functions will emit messages to `OpLog` and `OpError`:

- `Query( Document, Criteria )`
- `Project( Document, Projection )`
- `Update( Document, Updates )`
- `SplitPath( Path )`
- `JoinPaths( Path1, Path2, ... )`
- `GetValue( Document, Path )`
- `SetValue( Document, Path, Value )`
- `Flatten( Document )`
- `Expand( Document )`
