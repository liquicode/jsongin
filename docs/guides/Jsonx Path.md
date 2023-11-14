
# Jsonx Path

The functions `GetObjectValue( Data, Path )` and `SetObjectValue( Data, Path, Value )`
accept a `Path` parameter to identify which field within the document to get or set.

A `Path` can also be used inside of a `Query` to filter on a nested field when calling the
`Evaluate( Query, Document )` function.

Using this example object:
```JS
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

You can use the path `id` to refer to the field `document.id` and `user` to refer to
the `document.user` object.

```js
JSONX.GetObjectValue( document, 'id' ) === 1001
JSONX.GetObjectValue( document, 'user' ) === { name: 'Alice', location: 'East' }
```

To specify a nested field within the document, use the dot '.' notation to specify 
the field.

```js
JSONX.GetObjectValue( document, 'user.name' ) === 'Alice'
JSONX.GetObjectValue( document, 'profile.role' ) === 'admin'
```

Finally, to access a specific array element, specify the index of that element within the array.

```js
JSONX.GetObjectValue( document, 'tags.0' ) === 'Staff'
JSONX.GetObjectValue( document, 'tags.1' ) === 'Dept. A'
```

And even fields nested within an array of objects.

```js
JSONX.GetObjectValue( document, 'actions.0.timestamp' ) === '2023-11-01T08:00:00.000Z'
JSONX.GetObjectValue( document, 'actions.0.action' ) === 'login'
```

## MongoDB Compatability

Jsonx strives to be 100% compatible with MongoDB's path notation and function.
To learn more about how MongoDB structures documents, [read here](https://www.mongodb.com/docs/manual/core/document/).

## Jsonx Extensions

In Jsonx, you can optionally specify the root level object with a '$' path element.

```js
JSONX.GetObjectValue( document, '$.id' ) === 1001
JSONX.GetObjectValue( document, '$.user.name' ) === 'Alice'
```

When using '$', it must always appear at the beginning of the path.

