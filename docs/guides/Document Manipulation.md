# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Document Manipulation


The functions `jsongin.GetObjectValue( Document, Path )` and `jsongin.SetObjectValue( Document, Path, Value )`
accept a `Path` parameter which identifies a field within the document.

A `Path` can also be used inside of a `Query` to filter on a nested field when calling the
`jsongin.Query( Document, Criteria )` function.

Here is an example object.
We will get and set values from it.
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

You can use the path `"id"` to refer to the `document.id` field and `"user"` to refer to
the `document.user` object.

```js
jsongin.GetObjectValue( document, 'id' ) === 1001
jsongin.GetObjectValue( document, 'user' ) === { name: 'Alice', location: 'East' }
```

To specify a nested field within the document, use the dot '.' notation to specify 
that field.

```js
jsongin.GetObjectValue( document, 'user.name' ) === 'Alice'
jsongin.GetObjectValue( document, 'profile.role' ) === 'admin'
```

To access a specific array element, specify the numeric index of that element.

```js
jsongin.GetObjectValue( document, 'tags.0' ) === 'Staff'
jsongin.GetObjectValue( document, 'tags.1' ) === 'Dept. A'
```

You can even access fields nested within an array of objects.

```js
jsongin.GetObjectValue( document, 'actions.0.timestamp' ) === '2023-11-01T08:00:00.000Z'
jsongin.GetObjectValue( document, 'actions.0.action' ) === 'login'
```

## MongoDB Compatability

`jsongin` strives to be 100% compatible with MongoDB's path notation and function.
To learn more about how MongoDB structures documents and uses paths, [read here](https://www.mongodb.com/docs/manual/core/document/).

