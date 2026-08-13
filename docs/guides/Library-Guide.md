# @liquicode/jsongin


# Library Guide

`jsongin` is a library of functions for working with Javascript objects.


jsongin Functions
---------------------------------------------------------------------


### MongoDB Mechanics

`jsongin` implements functions that mirror MongoDB query and update functionality.

- [Query( Document, Criteria )](guides/jsongin/Query.md)
  : Returns `true` if the `Document` satisfies `Criteria`.

- [Evaluate( Document, Expression )](guides/jsongin/Evaluate.md)
  : Evaluates an aggregation `Expression` against a `Document` and returns the resulting value.
  Use the `$expr` query operator to match documents with an expression.

- [Aggregate( Documents, Pipeline )](guides/jsongin/Aggregate.md)
  : Runs an array of documents through an aggregation `Pipeline` and returns the resulting
  array of documents.
  Neither the given array nor the documents within it are modified.

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


### Snapshots

These functions describe the difference between two documents as an update document, which is
the same shape `Update()` applies. They are the primitives behind undo/redo, save states, and
replay.

- [Diff( Before, After )](guides/jsongin/Diff.md)
  : Returns an update document which turns `Before` into `After`.
  Arrays are compared whole, and neither document is modified.

- [Invert( Before, Patch )](guides/jsongin/Invert.md)
  : Returns the update document which undoes `Patch`.
  Any update operator inverts, not only the ones `Diff` writes.


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

- `DeleteValue( Document, Path )`
  : Removes the field at the specified `Path`.
  The key is removed rather than being set to `undefined`, so that `Object.keys()` and the
  document's contents agree with each other.

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

- `CompareValues( ValueA, ValueB )`
  : Compares two values and returns `-1`, `0`, or `1`.
  Values of different types are ordered by MongoDB's comparison order:
  `null` < numbers < strings < objects < arrays < booleans < dates < regular expressions.
  Null and missing values are equivalent.
  This is the comparison used by the expression comparison operators and by `Sort()`.

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
- `AsBoolean( Value )`
  : Converts a value to a boolean, using MongoDB's expression evaluation rules.
  Only `false`, `0`, `null`, and missing values are false.
  Note that the empty string `""` and the empty array `[]` are both true.


MongoDB References
---------------------------------------------------------------------

- [MongoDB Main Site](https://www.mongodb.com/)
- [Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)
- [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)

