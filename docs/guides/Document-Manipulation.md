# @liquicode/jsongin


# Document Manipulation

Many `jsongin` functions name a field with a ***path***: a string of field names joined with dots,
  such as `'user.name'`.
[`GetValue()`](./jsongin/GetValue.md), [`SetValue()`](./jsongin/SetValue.md) and
  [`DeleteValue()`](./jsongin/DeleteValue.md) read and change a field by path, and queries,
  updates and projections use the same paths.

The examples on this page use this document:

```js
let document =
{
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'East',
	},
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
	actions:
	[
		{ timestamp: '2023-11-01T08:00:00.000Z', action: 'login' },
		{ timestamp: '2023-11-01T08:15:00.000Z', action: 'logout' },
	],
};
```


## Reading Values

A top-level field is named by itself:

```js
jsongin.GetValue( document, 'id' ) === 1001
// jsongin.GetValue( document, 'user' ) returns { name: 'Alice', location: 'East' }
```

A field inside another is named with a dot:

```js
jsongin.GetValue( document, 'user.name' ) === 'Alice'
jsongin.GetValue( document, 'profile.role' ) === 'admin'
```

An array element is named by its position, starting at `0`:

```js
jsongin.GetValue( document, 'tags.0' ) === 'Staff'
jsongin.GetValue( document, 'tags.1' ) === 'Dept. A'
```

And the two can be combined:

```js
jsongin.GetValue( document, 'actions.0.timestamp' ) === '2023-11-01T08:00:00.000Z'
jsongin.GetValue( document, 'actions.0.action' ) === 'login'
```


## Changing Values

`SetValue()` and `DeleteValue()` change the document in place:

```js
jsongin.SetValue( document, 'user.location', 'West' ) === true
jsongin.GetValue( document, 'user.location' ) === 'West'

jsongin.SetValue( document, 'profile.active', true ) === true
jsongin.GetValue( document, 'profile.active' ) === true

jsongin.DeleteValue( document, 'profile.active' ) === true
jsongin.GetValue( document, 'profile.active' ) === undefined
```

To change a copy instead, use [`Update()`](./jsongin/Update.md).


## Paths in Queries

The same paths work in a query:

```js
jsongin.Query( document, { 'user.name': 'Alice' } ) === true
jsongin.Query( document, { 'actions.1.action': 'logout' } ) === true
```


## MongoDB Compatibility

Paths work the way MongoDB's dot notation does.
See MongoDB's [Documents](https://www.mongodb.com/docs/manual/core/document/) page.
