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
> See the [OpLog](./OpLog.md) document for more information about how OpLog works.


jsongin Functions
---------------------------------------------------------------------


### MongoDB Mechanics

- `Query( Document, Criteria )` : Returns `true` when `Document` satisfies `Criteria`.
  See [Query Reference](./Query%20Reference.md) for details.
- `Project( Document, Projection )` : Returns a document containing fields found in `Document`.
  See [Projection Reference](./Projection%20Reference.md) for details.
- `Update( Document, Updates )` : Returns a copy of `Document` containing the changes specified in `Updates`.
  See [Update Reference](./Update%20Reference.md) for details.

> See the [Operator Reference](./Operator%20Reference.md) document for more information on which
  operators `jsongin` supports and how to use them.


### Document Paths and Values

- `SplitPath( Path )` : Returns an array of the path elements found in `Path`.
  The `Path` parameter is a string path to a document field expressed in dot notation.
- `JoinPaths( Path1, Path2, ... )` : Returns a string from a series a paths joined together in dot notation.
- `GetValue( Document, Path )` : Gets a value from a document at the specified `Path`.
- `SetValue( Document, Path, Value )` : Sets a value in a document at the specified `Path`.
  This function will create the field specified `Path` if it does not already exist.
- `Flatten( Document )` : Flattens a hierarchical document into a document with top-level entries in dot notation.
- `Expand( Document )` : Expands fields found in dot notation into hierarchical elements within the document.


### Object Cloning

- `Clone( Document )` : Clones a document by doing `JSON.parse( JSON.stringify( Document ) )`.
- `SafeClone( Document, Exceptions )` : Performs a memberwise clone of `Document` to avoid pitfalls of the
  stringify/parse approach to cloning.
  The `Exceptions` paramter is an array of field names (in dot notation) that are treated differently and are
  copied by reference rather than by cloning its value.


### Data Types and Conversions

- `AsNumber( Value )`
- `AsDate( Value )`
- `ShortType( Value )`
- `BsonType( Value, ReturnAlias )`


### Miscellaneous

- `IsQuery( Document )`
- `LooseEquals( DocumentA, DocumentB )`
- `StrictEquals( DocumentA, DocumentB )`



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

