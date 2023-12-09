# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin) (v0.0.18)

### A JSON Engine for MongoDB-Style Queries and Data Structure Manipulation


> Official Docs: [http://jsongin.liquicode.com](http://jsongin.liquicode.com)


Quick Reference
---------------------------------------------------------------------

- [Library Guide](docs/guides/Library%20Guide.md)

***MongoDB Mechanics***
- [Query Reference](docs/guides/Query%20Reference.md)
- [Projection Reference](docs/guides/Projection%20Reference.md)
- [Update Reference](docs/guides/Update%20Reference.md)
- [Operator Reference](docs/guides/Operators%20Reference.md)

***Document Inspection and Manipulation***
- [Short Types](docs/guides/Short%20Types.md)
- [Document Manipulation](docs/guides/Document%20Manipulation.md)


Overview
---------------------------------------------------------------------

`jsongin` provides a robust implementation of the MongoDB query, projection, and update mechanics.
It strives to be consistent and easy to use.
You can use MongoDB style operations in your own projects by using these `jsongin` functions:

- `Query( Document, Criteria )`
- `Project( Document, Projection )`
- `Update( Document, Updates )`

With these functions you can query and manipulate your own data structures with MongoDB-style interface.
Each MongoDB feature that is implemented here, operates accurately and in accordance with MongoDB.

I developed `jsongin` to provide a single query interface that could be used against data stored
  in different types of storage mediums (e.g. memory, file, server).
Now when I develop an application or server, I can work with my data in memory for development
  and then quickly switch to a full MongoDB server for deployment.
To look at my project which implements a number of storage adapters for many common platforms and mediums,
see the [@liquicode/jsonstor]() project.

There are a number of other functions implemented here which serve to not only support the above
  functions, but also provide functionality common to general work with Javascript objects:

**Document Mechanics**

- `SplitPath( Path )`
- `JoinPaths( Path1, Path2, ... )`
- `GetValue( Document, Path )`
- `SetValue( Document, Path, Value )`
- `Flatten( Document )`
- `Expand( Document )`
- `Hybridize( Document )`
- `Unhybridize( Document )`

**Object Matching and Cloning**

- `LooseEquals( DocumentA, DocumentB )`
- `StrictEquals( DocumentA, DocumentB )`
- `Clone( Document )`
- `SafeClone( Document )`

**Data Types and Conversions**

- `ShortType( Value )`
- `BsonType( Value, ReturnAlias )`
- `AsNumber( Value )`
- `AsDate( Value )`

See the [Library Guide](docs/guides/Library%20Guide.md) for more information.

See the [Operator Reference](docs/guides/Operator%20Reference.md) for list of all
  supported MongoDB query and update operators.


Getting Started
---------------------------------------------------------------------

***Install with NPM:***
```bash
npm install --save @liquicode/jsongin
```

***Include in your NodeJS Project***
```js
// Create an instance of jsongin:
const jsongin = require('@liquicode/jsongin')(); // jsongin exports a function to call.

// Or, create with custom settings:
const jsongin = require('@liquicode/jsongin')( Settings ); // You can pass a Settings parameter.
```


### Examples

```js
// This is our example object.
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
};
```


#### Perform Queries on Documents

```js
// Use Query to match values against a document.
jsongin.Query( document, { id: 1001 } ) === true
jsongin.Query( document, { 'user.name': 'Alice' } ) === true
jsongin.Query( document, { tags: 'Staff', 'profile.role': 'admin' } ) === true

// Query returns false when the values are not matched.
jsongin.Query( document, { tags: 'Hourly' } ) === false
jsongin.Query( document, { 'user.name': 'alice' } ) === false

// Use query operators to perform more complex matches.
jsongin.Query( document, { 'user.name': { $ne: 'Joe' } ) === true
jsongin.Query( document, { 'profile.role': { $in: ['admin', 'super'] } ) === true
jsongin.Query( document, { $or:
	[
		{'user.location': 'East'},
		{'user.location': 'West'}
	] } ) === true
jsongin.Query( document, { $and:
	[
		{'user.location': 'East'},
		{'user.role': {$ne: 'user'}}
	] } ) === true
```


#### Project Fields From One Document To Another

```js
// Use Project to supress some fields from the output.
let p = jsongin.Project( document, { id: 0, user: 0 } );
p === {
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
}

// Use Project to include certain fields and supress the rest.
let p = jsongin.Project( document, { id: 1, tags: 1 } );
p === {
	id: 1001,
	tags: [ 'Staff', 'Dept. A' ],
}

// Use Project to select nested fields.
let p = jsongin.Project( document, { id: 1, "user.name": 1 } );
p === {
	user: { name: 'Alice' },
	tags: [ 'Staff', 'Dept. A' ],
}
```


#### Modify Fields in a Document

```js
// Use Update to modify values in a document.
let p = jsongin.Update( document, { $set: { "user.location": 'West' } } );
p === {
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'West',
	},
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
}

// Use Update to add fields to a document.
let p = jsongin.Update( document, { $set: { is_logged_in: true } } );
p === {
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'West',
	},
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
	is_logged_in: true,
}

// Use Update to remove fields in a document.
let p = jsongin.Update( document, { $unset: { user: 0 } } );
p === {
	id: 1001,
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
}

```


Features
---------------------------------------------------------------------

- Developer Features:
	- No external dependencies.
	- 100% pure javascript.
	- Single minified file (33k) deployment for web.
	- Use the `Explain` feature to help understand and debug queries.
	- Extend `jsongin` by developing your own query, projection, and update operators.

- Object Based Queries:
	- Compose queries in a structured and logical manner.
	- Easier to read, understand, and debug.
	- Maintain comments and documentation in your query source.
	- Programatically create and structure data queries.


