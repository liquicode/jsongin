# @liquicode/jsongin

> Home: [http://jsongin.liquicode.com](http://jsongin.liquicode.com)
>
> Version: 0.1.0

### A JSON Engine for MongoDB-Style Queries and Data Structure Manipulation


<!-- Note: the links below are absolute on purpose.
     This file is published to three places which resolve relative links
     differently: the repository root, the documentation site, and npmjs.com. -->


Quick Reference
---------------------------------------------------------------------

- [Library Guide](http://jsongin.liquicode.com/#/guides/Library-Guide.md)
- [Operator Reference](http://jsongin.liquicode.com/#/guides/Operator-Reference.md)
- [Operator Authoring](http://jsongin.liquicode.com/#/guides/Operator-Authoring.md)
- [Document Manipulation](http://jsongin.liquicode.com/#/guides/Document-Manipulation.md)
- [Project History](http://jsongin.liquicode.com/#/external/history.md)


Installation Guides
---------------------------------------------------------------------

- [NodeJS Usage](http://jsongin.liquicode.com/#/guides/Usage-NodeJS.md)
- [Browser Usage](http://jsongin.liquicode.com/#/guides/Usage-Browser.md)

```bash
npm install --save @liquicode/jsongin
```

```js
const jsongin = require( '@liquicode/jsongin' );
```


Overview
---------------------------------------------------------------------

`jsongin` provides a robust implementation of the MongoDB query, projection, and update mechanics.
It strives to be consistent and easy to use.
You can use MongoDB style operations in your own projects by using these `jsongin` functions:

- `Query( Document, QueryCriteria )`
- `Evaluate( Document, Expression )`
- `Aggregate( Documents, Pipeline )`
- `Filter( Documents, QueryCriteria )`
- `Distinct( Documents, DistinctCriteria )`
- `Sort( Documents, SortCriteria )`
- `Project( Document, Projection )`
- `Update( Document, Updates )`
- `Diff( Before, After )`
- `Invert( Before, Patch )`

With these functions you can query and manipulate your own data structures with MongoDB-style interface.
Each MongoDB feature that is implemented here, operates accurately and in accordance with MongoDB.
See the [Operator Reference](http://jsongin.liquicode.com/#/guides/Operator-Reference.md) for
  which operators are implemented.

I developed `jsongin` to provide a single query interface that could be used against data stored
  in different types of storage mediums (e.g. memory, file, server).
Now when I develop an application or server, I can work with my data in memory for development
  and then quickly switch to a full MongoDB server for deployment.
To look at my project which implements a number of storage adapters for many common platforms and mediums,
see the [@liquicode/jsonstor](https://github.com/liquicode/jsonstor) project.

There are a number of other functions implemented here which serve to not only support the above
  functions, but also provide functionality common to general work with Javascript objects:

**Document Mechanics**

- `SplitPath( Path )`
- `JoinPaths( Path1, Path2, ... )`
- `GetValue( Document, Path )`
- `SetValue( Document, Path, Value )`
- `DeleteValue( Document, Path )`
- `Flatten( Document )`
- `Expand( Document )`
- `Hybridize( Document )`
- `Unhybridize( Document )`
- `Merge( DocumentA, DocumentB )`
- `Parse( JsonString )`
- `Format( Document, WithWhitespace, LikeJavascript )`

**Object Matching and Cloning**

- `LooseEquals( DocumentA, DocumentB )`
- `StrictEquals( DocumentA, DocumentB )`
- `CompareValues( ValueA, ValueB )`
- `Clone( Document )`
- `SafeClone( Document )`

**Data Types and Conversions**

- `ShortType( Value )`
- `BsonType( Value, ReturnAlias )`
- `AsNumber( Value )`
- `AsDate( Value )`
- `AsBoolean( Value )`

**Text Functions**

A small set of string helpers is available at `jsongin.Text`:
`Compare`, `FindBetween`, `Matches`, `SearchReplace`, and `SearchReplacements`.

See the [Library Guide](http://jsongin.liquicode.com/#/guides/Library-Guide.md) for more information.

See the [Operator Reference](http://jsongin.liquicode.com/#/guides/Operator-Reference.md) for list of all
  supported MongoDB query, expression, update, stage, and accumulator operators.


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
jsongin.Query( document, { 'user.name': { $ne: 'Joe' } } ) === true
jsongin.Query( document, { 'profile.role': { $in: [ 'admin', 'super' ] } } ) === true
jsongin.Query( document, { $or:
	[
		{ 'user.location': 'East' },
		{ 'user.location': 'West' }
	] } ) === true
jsongin.Query( document, { $and:
	[
		{ 'user.location': 'East' },
		{ 'profile.role': { $ne: 'user' } }
	] } ) === true
```


#### Evaluate Expressions Against a Document

```js
// Use Evaluate to compute a value from a document.
jsongin.Evaluate( { dmg: 12, armor: 5 }, { $subtract: [ '$dmg', '$armor' ] } ) === 7

// Use the $expr query operator to compare one field to another.
jsongin.Query( { dmg: 12, armor: 5 }, { $expr: { $gt: [ '$dmg', '$armor' ] } } ) === true
```


#### Run Documents Through an Aggregation Pipeline

```js
let players = [
	{ team: 'red', name: 'Alice', points: 7, alive: true },
	{ team: 'red', name: 'Bob', points: 3, alive: true },
	{ team: 'blue', name: 'Carol', points: 9, alive: false },
];

let result = jsongin.Aggregate( players,
	[
		{ $match: { alive: true } },
		{ $group: { _id: '$team', score: { $sum: '$points' } } },
	] );

// result is [ { _id: 'red', score: 10 } ]
```


#### Project Fields From One Document To Another

```js
// Use Project to supress some fields from the output.
let p = jsongin.Project( document, { id: 0, user: 0 } );
// p is {
// 	profile:
// 	{
// 		login: 'alice',
// 		role: 'admin',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ],
// }

// Use Project to include certain fields and supress the rest.
p = jsongin.Project( document, { id: 1, tags: 1 } );
// p is {
// 	id: 1001,
// 	tags: [ 'Staff', 'Dept. A' ],
// }

// Use Project to select nested fields.
p = jsongin.Project( document, { id: 1, "user.name": 1 } );
// p is {
// 	id: 1001,
// 	user: { name: 'Alice' },
// }

// Use Project to compute a new field with an expression.
// A computed field makes this an inclusion projection, so only the
// named fields appear in the output.
p = jsongin.Project( { dmg: 12, armor: 5 }, { net: { $subtract: [ '$dmg', '$armor' ] } } );
// p is {
// 	net: 7,
// }

// Name the other fields to keep them.
p = jsongin.Project( { dmg: 12, armor: 5 }, { dmg: 1, net: { $subtract: [ '$dmg', '$armor' ] } } );
// p is {
// 	dmg: 12,
// 	net: 7,
// }
```


#### Modify Fields in a Document

```js
// Use Update to modify values in a document.
let p = jsongin.Update( document, { $set: { "user.location": 'West' } } );
// p is {
// 	id: 1001,
// 	user:
// 	{
// 		name: 'Alice',
// 		location: 'West',
// 	},
// 	profile:
// 	{
// 		login: 'alice',
// 		role: 'admin',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ],
// }

// Use Update to add fields to a document.
p = jsongin.Update( document, { $set: { is_logged_in: true } } );
// p is {
// 	id: 1001,
// 	user:
// 	{
// 		name: 'Alice',
// 		location: 'East',
// 	},
// 	profile:
// 	{
// 		login: 'alice',
// 		role: 'admin',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ],
// 	is_logged_in: true,
// }

// Use Update to remove fields in a document.
p = jsongin.Update( document, { $unset: { user: 0 } } );
// p is {
// 	id: 1001,
// 	profile:
// 	{
// 		login: 'alice',
// 		role: 'admin',
// 	},
// 	tags: [ 'Staff', 'Dept. A' ],
// }

```


#### Describe and Undo a Change

```js
// Use Diff to describe a change as an update document.
// jsongin.Diff( { hp: 10, n: 1 }, { hp: 7 } ) returns { $set: { hp: 7 }, $unset: { n: '' } }

// Use Invert to build the update document which undoes a patch.
// jsongin.Invert( { hp: 10 }, { $inc: { hp: -3 } } ) returns { $set: { hp: 10 } }
```


Features
---------------------------------------------------------------------

- Developer Features:
	- No external dependencies.
	- 100% pure javascript.
	- Single minified file (~35k) for web deployment.
	- Use the `OpLog` feature to help understand and debug queries.
	- Extend `jsongin` by developing your own query, projection, and update operators.
	  See [Operator Authoring](http://jsongin.liquicode.com/#/guides/Operator-Authoring.md).

- Object Based Queries:
	- Compose queries in a structured and logical manner.
	- Easier to read, understand, and debug.
	- Maintain comments and documentation in your query source.
	- Programatically create and structure data queries.

