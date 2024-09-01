# @liquicode/jsongin


# NodeJS Usage


## Install jsongin with NPM

```bash
npm install --save @liquicode/jsongin
```


## Include jsongin in your NodeJS Project

```js
// Create an instance of jsongin:
const jsongin = require('@liquicode/jsongin');

// Or, create with custom settings:
const jsongin = require('@liquicode/jsongin').NewJsongin( Settings );
```


## Customize jsongin Behavior with Settings

```js
Settings = {
	OpLog: null, // A function to call (such as console.log) to output OpLog messages.
	OpError: null, // A function to call (such as console.error) to output OpError messages.
}
```
> See the [OpLog](OpLog.md) document for more information about how OpLog works.

