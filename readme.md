# @liquicode/jsongin

> Home: [http://jsongin.liquicode.com](http://jsongin.liquicode.com)
>
> Version: 0.1.0

> ### WARNING:
>
> This version represents a significant divergence from previous versions of jsongin (v0.0.23 and older).
> Please review breaking changes in the [Version History](/docs/external/history.md) before replacing and upgrading.

### A JSON Engine for MongoDB-Style Queries and Data Structure Manipulation


<!-- Note: the links below are root-absolute, beginning with /docs/.
     GitHub resolves a leading slash from the repository root, so these reach
     docs/guides/... there. The docsify site runs with an alias that rewrites
     /docs/(.*) to /$1, so the same links route within the site. This keeps one
     source of truth for a file published to both the repo root and docs/external. -->


Quick Reference
---------------------------------------------------------------------

- [Library Guide](/docs/guides/Library-Guide.md)
- [Operator Reference](/docs/guides/Operator-Reference.md)
- [Operator Authoring](/docs/guides/Operator-Authoring.md)
- [Document Manipulation](/docs/guides/Document-Manipulation.md)
- [Project History](/docs/external/history.md)


Installation Guides
---------------------------------------------------------------------

- [NodeJS Usage](/docs/guides/Usage-NodeJS.md)
- [Browser Usage](/docs/guides/Usage-Browser.md)

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
Use it to query and manipulate your own data structures with a MongoDB-style interface.
Each MongoDB feature that is implemented here, operates accurately and in accordance with MongoDB.

I developed `jsongin` to provide a single query interface that could be used against data stored
  in different types of storage mediums (e.g. memory, file, server).
Now when I develop an application or server, I can work with my data in memory for development
  and testing. Then, I can quickly switch to a full MongoDB server for further testing and deployment.
To look at my project which implements a number of storage adapters for many common platforms and mediums,
see the [@liquicode/jsonstor](https://github.com/liquicode/jsonstor) project.

The sections below introduce each of the main functions.
See the [Operator Reference](/docs/guides/Operator-Reference.md) for the
  full list of supported query, expression, update, stage, and accumulator operators.


The Main Functions
---------------------------------------------------------------------

These two values are used by the examples throughout this section:

```js
// A single document.
let document =
{
	id: 1001,
	user: { name: 'Alice', location: 'East' },
	profile: { login: 'alice', role: 'admin' },
	tags: [ 'Staff', 'Dept. A' ],
};

// A set of documents.
let players =
[
	{ team: 'red', name: 'Alice', points: 7, alive: true },
	{ team: 'red', name: 'Bob', points: 3, alive: true },
	{ team: 'blue', name: 'Carol', points: 9, alive: false },
];
```


### Query( Document, QueryCriteria )

Tests a single document against a set of criteria and returns `true` or `false`.
Field names use dot notation, and criteria may be combined with query operators.

```js
jsongin.Query( document, { id: 1001 } ) === true
jsongin.Query( document, { 'user.name': 'Alice' } ) === true

// Several fields in one criteria must all match.
jsongin.Query( document, { tags: 'Staff', 'profile.role': 'admin' } ) === true

// Use operators for more than equality.
jsongin.Query( document, { 'profile.role': { $in: [ 'admin', 'super' ] } } ) === true
jsongin.Query( document, { $or: [ { 'user.location': 'East' }, { 'user.location': 'West' } ] } ) === true
```

See [Query](/docs/guides/jsongin/Query.md).


### Filter( Documents, QueryCriteria )

Selects the documents in a set which match a query criteria.
The criteria is exactly the one `Query` takes.

```js
let alive = jsongin.Filter( players, { alive: true } );
// alive holds the Alice and Bob documents

let strong = jsongin.Filter( players, { points: { $gt: 5 } } );
// strong holds the Alice and Carol documents
```

See [Filter](/docs/guides/jsongin/Filter.md).


### Sort( Documents, SortCriteria )

Orders a set of documents. Use `1` to sort a field ascending and `-1` to sort it descending.
Sorting follows the MongoDB value ordering, so mixed types and missing fields have defined places.

```js
jsongin.Sort( players, { points: 1 } );
// players is now ordered: Bob, Alice, Carol

jsongin.Sort( players, { team: 1, points: -1 } );
// players is now ordered: Carol, Alice, Bob
```

See [Sort](/docs/guides/jsongin/Sort.md).


### Distinct( Documents, DistinctCriteria )

Returns the distinct combinations of the named fields found in a set of documents.

```js
let teams = jsongin.Distinct( players, { team: 1 } );
// teams is [ { team: 'red' }, { team: 'blue' } ]

let pairs = jsongin.Distinct( players, { team: 1, alive: 1 } );
// pairs is [ { team: 'red', alive: true }, { team: 'blue', alive: false } ]
```

See [Distinct](/docs/guides/jsongin/Distinct.md).


### Project( Document, Projection )

Reshapes a document by including or excluding fields.
A projection either names the fields to keep or the fields to remove, never both.

```js
jsongin.Project( document, { id: 1, tags: 1 } );
// returns { id: 1001, tags: [ 'Staff', 'Dept. A' ] }

jsongin.Project( document, { profile: 0 } );
// returns the document without its profile field

// Nested fields can be named directly.
jsongin.Project( document, { id: 1, 'user.name': 1 } );
// returns { id: 1001, user: { name: 'Alice' } }

// A field whose value is an expression is computed.
jsongin.Project( { dmg: 12, armor: 5 }, { net: { $subtract: [ '$dmg', '$armor' ] } } );
// returns { net: 7 }
```

See [Project](/docs/guides/jsongin/Project.md).


### Update( Document, Updates )

Applies MongoDB update operators to a document and returns the modified copy.
The document you pass in is never changed.

```js
jsongin.Update( document, { $set: { 'user.location': 'West' } } );
// the returned user is { name: 'Alice', location: 'West' }

jsongin.Update( document, { $set: { is_logged_in: true } } );  // adds a field
jsongin.Update( document, { $unset: { profile: '' } } );       // removes a field
jsongin.Update( document, { $push: { tags: 'New' } } );        // appends to an array

jsongin.Update( { n: 1 }, { $inc: { n: 5 } } );
// returns { n: 6 }
```

See [Update](/docs/guides/jsongin/Update.md).


### Aggregate( Documents, Pipeline )

Runs a set of documents through an aggregation pipeline of stages.

```js
jsongin.Aggregate( players,
	[
		{ $match: { alive: true } },
		{ $group: { _id: '$team', score: { $sum: '$points' } } },
	] );
// returns [ { _id: 'red', score: 10 } ]

jsongin.Aggregate( players,
	[
		{ $sort: { points: -1 } },
		{ $limit: 2 },
		{ $project: { _id: 0, name: 1 } },
	] );
// returns [ { name: 'Carol' }, { name: 'Alice' } ]
```

See [Aggregate](/docs/guides/jsongin/Aggregate.md).


### Evaluate( Document, Expression )

Computes a value from a document with an aggregation expression.
A string beginning with `$` is a reference to a field; anything else is a literal.

```js
jsongin.Evaluate( { dmg: 12, armor: 5 }, { $subtract: [ '$dmg', '$armor' ] } ) === 7
jsongin.Evaluate( document, '$user.name' ) === 'Alice'

// The $expr query operator compares one field of a document to another.
jsongin.Query( { dmg: 12, armor: 5 }, { $expr: { $gt: [ '$dmg', '$armor' ] } } ) === true
```

See [Evaluate](/docs/guides/jsongin/Evaluate.md).


### Diff( Before, After )

Describes the change between two documents as an update document, in the same shape `Update` applies.

```js
jsongin.Diff( { hp: 10, n: 1 }, { hp: 7 } );
// returns { $set: { hp: 7 }, $unset: { n: '' } }
```

See [Diff](/docs/guides/jsongin/Diff.md).


### Invert( Before, Patch )

Returns the update document which undoes a patch.
It inverts any update document, not only the `$set` and `$unset` which `Diff` writes.

```js
jsongin.Update( { hp: 10 }, { $inc: { hp: -3 } } );   // returns { hp: 7 }
jsongin.Invert( { hp: 10 }, { $inc: { hp: -3 } } );   // returns { $set: { hp: 10 } }
```

See [Invert](/docs/guides/jsongin/Invert.md).


### Document Mechanics

Read, write, and reshape a document by path.
A path is dot notation, the same notation the query and update functions use.

```js
jsongin.GetValue( document, 'user.name' ) === 'Alice'
jsongin.GetValue( document, 'tags.0' ) === 'Staff'

jsongin.SetValue( document, 'user.tz', 'UTC' );      // creates the field
jsongin.DeleteValue( document, 'profile.login' );    // returns true when it removed something

// Flatten and Expand convert between a hierarchy and a set of paths.
jsongin.Flatten( { a: { b: 1 }, c: [ 1, 2 ] } );
// returns { 'a.b': 1, 'c.0': 1, 'c.1': 2 }

jsongin.Expand( { 'a.b': 1 } );
// returns { a: { b: 1 } }

// Merge combines two documents, descending only where both hold a sub-document.
jsongin.Merge( { a: 1, b: { x: 1 } }, { b: { y: 2 } } );
// returns { a: 1, b: { x: 1, y: 2 } }
```

See [GetValue](/docs/guides/jsongin/GetValue.md),
[SetValue](/docs/guides/jsongin/SetValue.md),
[DeleteValue](/docs/guides/jsongin/DeleteValue.md),
[Flatten](/docs/guides/jsongin/Flatten.md),
[Expand](/docs/guides/jsongin/Expand.md), and
[Merge](/docs/guides/jsongin/Merge.md).


More Functions
---------------------------------------------------------------------

**Document Mechanics**

- [SplitPath( Path )](/docs/guides/jsongin/SplitPath.md)
- [JoinPaths( Path1, Path2, ... )](/docs/guides/jsongin/JoinPaths.md)
- [GetValue( Document, Path )](/docs/guides/jsongin/GetValue.md)
- [SetValue( Document, Path, Value )](/docs/guides/jsongin/SetValue.md)
- [DeleteValue( Document, Path )](/docs/guides/jsongin/DeleteValue.md)
- [Flatten( Document )](/docs/guides/jsongin/Flatten.md)
- [Expand( Document )](/docs/guides/jsongin/Expand.md)
- [Hybridize( Document )](/docs/guides/jsongin/Hybridize.md)
- [Unhybridize( Document )](/docs/guides/jsongin/Unhybridize.md)
- [Merge( DocumentA, DocumentB )](/docs/guides/jsongin/Merge.md)
- [Parse( JsonString )](/docs/guides/jsongin/Parse.md)
- [Format( Document, WithWhitespace, LikeJavascript )](/docs/guides/jsongin/Format.md)

**Object Matching and Cloning**

- [LooseEquals( DocumentA, DocumentB )](/docs/guides/jsongin/LooseEquals.md)
- [StrictEquals( DocumentA, DocumentB )](/docs/guides/jsongin/StrictEquals.md)
- [CompareValues( ValueA, ValueB )](/docs/guides/jsongin/CompareValues.md)
- [Clone( Document )](/docs/guides/jsongin/Clone.md)
- [SafeClone( Document )](/docs/guides/jsongin/SafeClone.md)

**Data Types and Conversions**

- [ShortType( Value )](/docs/guides/jsongin/ShortType.md)
- [BsonType( Value, ReturnAlias )](/docs/guides/jsongin/BsonType.md)
- [AsNumber( Value )](/docs/guides/jsongin/AsNumber.md)
- [AsDate( Value )](/docs/guides/jsongin/AsDate.md)
- [AsBoolean( Value )](/docs/guides/jsongin/AsBoolean.md)

**Text Functions**

A small set of string helpers is available at `jsongin.Text`:
[Compare](/docs/guides/Text/Compare.md),
[FindBetween](/docs/guides/Text/FindBetween.md),
[Matches](/docs/guides/Text/Matches.md),
[SearchReplace](/docs/guides/Text/SearchReplace.md), and
[SearchReplacements](/docs/guides/Text/SearchReplacements.md).

See the [Library Guide](/docs/guides/Library-Guide.md) for more information.


Features
---------------------------------------------------------------------

- Developer Features:
	- No external dependencies.
	- 100% pure javascript.
	- Single minified file (~70k) for web deployment.
	- Use the `OpLog` feature to help understand and debug queries.
	- Extend `jsongin` by developing your own query, projection, and update operators.
	  See [Operator Authoring](/docs/guides/Operator-Authoring.md).

- Object Based Queries:
	- Compose queries in a structured and logical manner.
	- Easier to read, understand, and debug.
	- Maintain comments and documentation in your query source.
	- Programatically create and structure data queries.
