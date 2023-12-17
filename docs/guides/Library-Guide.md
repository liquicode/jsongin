# @liquicode/jsongin


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
const jsongin = require('@liquicode/jsongin');

// Or, create with custom settings:
const jsongin = require('@liquicode/jsongin').NewJsongin( Settings );
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

- [Query( Document, Criteria )](guides/jsongin/Query.md)
  : Returns `true` if the `Document` satisfies `Criteria`.

- [Filter( Documents, Criteria )](guides/jsongin/Filter.md)
  : Returns an array of filtered documents.

- [Distinct( Documents, Criteria )](guides/jsongin/Distinct.md)
  : Returns an array of unique document values.

- [Sort( Documents, Criteria )](guides/jsongin/Sort.md)
  : Sorts (in place) an array of documents.

- [Project( Document, Projection )](guides/jsongin/Project.md)
  : Returns a document containing fields found in the given `Document`.
  The `Projection` parameter identifies which fields to include/exclude in the output.

- [Update( Document, Updates )](guides/jsongin/Update.md)
  : Returns a copy of `Document` containing the changes specified in `Updates`.

> See the [Operator Reference](guides/Operator-Reference.md) document for more information on which
  operators `jsongin` supports and how to use them.


### Document Mechanics

These functions allow you to manipulate Javascript objects and arrays.
They all share the concept of a document path that is expressed in dot-notation.

**Working with Document Paths**

- [SplitPath( Path )](guides/jsongin/SplitPath.md)
  : Returns an array of the path elements found in `Path`.
  The `Path` parameter is a string path to a document field expressed in dot notation.

- [JoinPaths( PathSegment1, PathSegment2, ... )](guides/jsongin/JoinPaths.md)
  : Returns a string from a series a paths joined together in dot notation.

**Get and Set Document Values**

- [GetValue( Document, Path )](guides/jsongin/GetValue.md)
  : Gets a value from a document at the specified `Path`.

- [SetValue( Document, Path, Value )](guides/jsongin/SetValue.md)
  : Sets a value in a document at the specified `Path`.
  This function will create fields specified in `Path` if they don't already exist.

**Document Conversions**

- [Parse( JsonString )](guides/jsongin/Parse.md)
  : Similar to `JSON.parse()` but able to read Javascript as well as JSON.

- [Format( Document, WithWhitespace, LikeJavascript )](guides/jsongin/Format.md)
  : Similar to `JSON.stringify()` but with additional format options.

- [Flatten( Document )](guides/jsongin/Flatten.md)
  : Flattens a hierarchical document into a document with top-level entries in dot notation.

- [Expand( Document )](guides/jsongin/Expand.md)
  : Expands fields found in dot notation into hierarchical elements within the document.

- [Hybridize( Document )](guides/jsongin/Hybridize.md)
  : Hybridizes a hierarchical document into a document with top-level entries only and json-encoded sub-structures.

- [Unhybridize( Document )](guides/jsongin/Unhybridize.md)
  : Unhybridize a document back into a hierarchical document.

> See the [Document Manipulation](guides/Document-Manipulation.md) document for more information on how to use these functions.


### Object Equality and Cloning

- `StrictEquals( DocumentA, DocumentB )`
  : Performs a strict equality comparison between two values.
  Values must match excatly (===) and values must appear in the same order within objects and arrays.

- `LooseEquals( DocumentA, DocumentB )`
  : Performs a loose equality comparison between two values.
  Values must match loosely (==) and values can appear in different orders.

- `Clone( Document )`
  : Clones a document using `JSON.parse( JSON.stringify( Document ) )`.

- [SafeClone( Document, Exceptions )](guides/jsongin/SafeClone.md)
  : Performs a member-wise clone of `Document`.
  Fields listed in `Exceptions` are copied by reference rather than by value.


### Data Types and Conversions

- [ShortType( Value )](guides/jsongin/ShortType.md)
  : Returns the single-character `ShortType` of a value.
  This is a shorter, yet more precise, type name string than Javascript's `typeof` operator.
- `BsonType( Value, ReturnAlias )`
- `AsNumber( Value )`
- `AsDate( Value )`


MongoDB References
---------------------------------------------------------------------

- [MongoDB Main Site](https://www.mongodb.com/)
- [Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)
- [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)

