# @liquicode/jsongin


# OpLog

`jsongin` can send you messages that explain what it is doing: why a query did not match, why an
  update was refused, and so on.
The messages never change what a function does or returns.

Logging is off by default.


## Turning It On

Logging is set per engine, so create an engine with `NewJsongin( Settings )`.
The module's default export is an engine with logging off.

```js
let Settings = {
	OpLog: null, // A function, such as console.log, to receive explanations.
	OpError: null, // A function, such as console.error, to receive errors.
};
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

To print explanations to the console:
```js
let Settings = { OpLog: console.log };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

To print errors to the error console:
```js
let Settings = { OpError: console.error };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

Any function which takes a message string will do:
```js
function my_log( Message )
{
	let timestamp = ( new Date() ).toISOString();
	console.log( timestamp + ' - ' + Message );
}
let Settings = { OpLog: my_log, OpError: my_log };
const jsongin = require( '@liquicode/jsongin' ).NewJsongin( Settings );
```

You can also set them on an existing engine: `jsongin.OpLog = console.log`.


## OpLog and OpError

- `OpLog` receives ***explanations***: something finished, but may not have done what you
  expected. For example, a query condition did not match, or a value had the wrong type.
- `OpError` receives ***errors***: the message of an error which is being thrown. The error is
  still thrown.

Give both the same function to get one combined stream.

Each message starts with the name of the function or operator which sent it, such as
  `Distinct:` or `$gt:`, so you can tell where it came from:

```
$gt: cannot compare [s] type with [n] type at [hp].
Distinct: Documents must be an array.
```

Most engine functions, and all operators, send messages.


## See Also

- [NodeJS Usage](./Usage-NodeJS.md)
- [Library Guide](./Library-Guide.md#settings)
