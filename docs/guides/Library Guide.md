# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Library Guide

`jsongin` is a library of functions for working with Javascript objects.


Installation
---------------------------------------------------------------------


### Install jsongin with NPM

```bash
npm install --save @liquicode/jsongin
```


### Include jsongin in your NodeJS Project

```js
// Create an instance of jsongin:
const jsongin = require('@liquicode/jsongin')(); // jsongin exports a function to call.

// Or, create with custom settings:
const jsongin = require('@liquicode/jsongin')( Settings ); // You can pass a Settings parameter.
```


### Customize jsongin Behavior with Settings

```js
Settings = {
	OpLog: null, // A function to call (such as console.log) to output OpLog messages.
	OpError: null, // A function to call (such as console.error) to output OpError messages.
}
```
> See the [OpLog](OpLog.md) document for more information about how OpLog works.


jsongin Functions
---------------------------------------------------------------------


### MongoDB Mechanics

`jsongin` implements functions that mirror MongoDB query and update functionality.

- `Query( Document, Criteria )`
  : Returns `true` when `Document` satisfies `Criteria`.
  See [Query Reference](guides/Query%20Reference.md) for details.

- `Project( Document, Projection )`
  : Returns a document containing fields found in `Document`.
  See [Projection Reference](guides/Projection%20Reference.md) for details.

- `Update( Document, Updates )`
  : Returns a copy of `Document` containing the changes specified in `Updates`.
  See [Update Reference](guides/Update%20Reference.md) for details.

> See the [Operator Reference](guides/Operator%20Reference.md) document for more information on which
  operators `jsongin` supports and how to use them.


### Document Mechanics

These functions allow you to manipulate Javascript objects and arrays.
They all share the concept of a document path that is expressed in dot-notation.

- [`GetValue( Document, Path )`](guides/jsongin/GetValue.md)
  : Gets a value from a document at the specified `Path`.

- [`SetValue( Document, Path, Value )`](guides/jsongin/SetValue.md)
  : Sets a value in a document at the specified `Path`.
  This function will create fields specified in `Path` if they don't already exist.

- [`Flatten( Document )`](guides/jsongin/Flatten.md)
  : Flattens a hierarchical document into a document with top-level entries in dot notation.

- [`Expand( Document )`](guides/jsongin/Expand.md)
  : Expands fields found in dot notation into hierarchical elements within the document.

- [`SplitPath( Path )`](guides/jsongin/SplitPath.md)
  : Returns an array of the path elements found in `Path`.
  The `Path` parameter is a string path to a document field expressed in dot notation.

- [`JoinPaths( PathSegment1, PathSegment2, ... )`](guides/jsongin/JoinPaths.md)
  : Returns a string from a series a paths joined together in dot notation.

> See the [Document Manipulation](guides/Document%20Manipulation.md) document for more information on how to use these functions.


### Object Matching and Cloning

- `LooseEquals( DocumentA, DocumentB )`

- `StrictEquals( DocumentA, DocumentB )`

- `Clone( Document )`
  : Clones a document using `JSON.parse( JSON.stringify( Document ) )`.

- [`SafeClone( Document, Exceptions )`](guides/jsongin/SafeClone.md)
  : Performs a member-wise clone of `Document`.
  Fields listed in `Exceptions` are copied by reference rather than by value.


### Data Types and Conversions

- `ShortType( Value )`
- `BsonType( Value, ReturnAlias )`
- `AsNumber( Value )`
- `AsDate( Value )`


Related Information
---------------------------------------------------------------------

### MongoDB References

- [MongoDB Main Site](https://www.mongodb.com/)
- [MongoDB: Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [MongoDB: Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)
- [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)


### Similar Projects

- [json-criteria](https://www.npmjs.com/package/json-criteria) :
	A MongoDB-style querying mechanism.

- [nedb](https://www.npmjs.com/package/nedb) : 
	A MongoDB-style querying mechanism.
	Create and manage memory-based and file-based data collections.
	No longer maintained by the author(s).

- [@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb) : 
	A currently maintained fork of `nedb`.

- [Mongo-Local-DB](https://www.npmjs.com/package/mongo-local-db) :

- [RxDB](https://www.npmjs.com/package/rxdb) :

- [realm](https://www.npmjs.com/package/realm) :

