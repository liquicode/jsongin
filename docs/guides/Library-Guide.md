# @liquicode/jsongin


# Library Guide

`jsongin` is a library of functions for working with Javascript objects.

The module's default export is a ready-to-use engine instance.
To create an instance with custom settings, use the `NewJsongin( Settings )` factory method.
See [NodeJS Usage](./Usage-NodeJS.md) for both forms.


jsongin Functions
---------------------------------------------------------------------


### MongoDB Mechanics

`jsongin` implements functions that mirror MongoDB query and update functionality.

- [Query( Document, Criteria )](./jsongin/Query.md)
  : Returns `true` if the `Document` satisfies `Criteria`.

- [Evaluate( Document, Expression )](./jsongin/Evaluate.md)
  : Evaluates an aggregation `Expression` against a `Document` and returns the resulting value.
  Use the `$expr` query operator to match documents with an expression.

- [Aggregate( Documents, Pipeline )](./jsongin/Aggregate.md)
  : Runs an array of documents through an aggregation `Pipeline` and returns the resulting
  array of documents.
  Neither the given array nor the documents within it are modified.

- [Filter( Documents, Criteria )](./jsongin/Filter.md)
  : Returns an array of filtered documents.

- [Distinct( Documents, Criteria )](./jsongin/Distinct.md)
  : Returns an array of unique document values.

- [Sort( Documents, Criteria )](./jsongin/Sort.md)
  : Sorts (in place) an array of documents.

- [Project( Document, Projection )](./jsongin/Project.md)
  : Returns a document containing fields found in the given `Document`.
  The `Projection` parameter identifies which fields to include/exclude in the output.

- [Update( Document, Updates )](./jsongin/Update.md)
  : Returns a copy of `Document` containing the changes specified in `Updates`.

- [IsQuery( Query )](./jsongin/IsQuery.md)
  : Returns `true` when a value looks like a query document.

> See the [Operator Reference](./Operator-Reference.md) document for more information on which
  operators `jsongin` supports and how to use them.
>
> See the [Operator Authoring](./Operator-Authoring.md) document to add operators of your own.


### Snapshots

These functions describe the difference between two documents as an update document, which is
the same shape `Update()` applies. They are the primitives behind undo/redo, save states, and
replay.

- [Diff( Before, After )](./jsongin/Diff.md)
  : Returns an update document which turns `Before` into `After`.
  Arrays are compared whole, and neither document is modified.

- [Invert( Before, Patch )](./jsongin/Invert.md)
  : Returns the update document which undoes `Patch`.
  Any update operator inverts, not only the ones `Diff` writes.


### Document Mechanics

These functions allow you to manipulate Javascript objects and arrays.
They all share the concept of a document path that is expressed in dot-notation.

**Working with Document Paths**

- [SplitPath( Path )](./jsongin/SplitPath.md)
  : Returns an array of the path elements found in `Path`.
  The `Path` parameter is a string path to a document field expressed in dot notation.

- [JoinPaths( PathSegment1, PathSegment2, ... )](./jsongin/JoinPaths.md)
  : Returns a string from a series a paths joined together in dot notation.

**Get and Set Document Values**

- [GetValue( Document, Path )](./jsongin/GetValue.md)
  : Gets a value from a document at the specified `Path`.

- [SetValue( Document, Path, Value )](./jsongin/SetValue.md)
  : Sets a value in a document at the specified `Path`.
  This function will create fields specified in `Path` if they don't already exist.

- [DeleteValue( Document, Path )](./jsongin/DeleteValue.md)
  : Removes the field at the specified `Path`.
  The key is removed rather than being set to `undefined`, so that `Object.keys()` and the
  document's contents agree with each other.

**Document Conversions**

- [Parse( JsonString )](./jsongin/Parse.md)
  : Similar to `JSON.parse()` but able to read Javascript as well as JSON.

- [Format( Document, WithWhitespace, LikeJavascript )](./jsongin/Format.md)
  : Similar to `JSON.stringify()` but with additional format options.

- [Flatten( Document )](./jsongin/Flatten.md)
  : Flattens a hierarchical document into a document with top-level entries in dot notation.

- [Expand( Document )](./jsongin/Expand.md)
  : Expands fields found in dot notation into hierarchical elements within the document.

- [Hybridize( Document )](./jsongin/Hybridize.md)
  : Hybridizes a hierarchical document into a document with top-level entries only and json-encoded sub-structures.

- [Unhybridize( Document )](./jsongin/Unhybridize.md)
  : Unhybridize a document back into a hierarchical document.

**Combining Documents**

- [Merge( DocumentA, DocumentB )](./jsongin/Merge.md)
  : Merges `DocumentB` into `DocumentA` and returns the merged document.
  Both parameters must be objects, and neither of them is modified.
  The merge is member-wise and recursive: two sub-documents are merged into each other, while
  any other value in `DocumentB` — including an array — replaces the one in `DocumentA`.
  Use this to apply a partial override to a document of defaults.

> See the [Document Manipulation](./Document-Manipulation.md) document for more information on how to use these functions.


### Object Equality and Cloning

- [StrictEquals( DocumentA, DocumentB )](./jsongin/StrictEquals.md)
  : Performs a strict equality comparison between two values.
  No type coercion is applied, and values must appear in the same order within objects and arrays.
  This is [`CompareValues()`](./jsongin/CompareValues.md) asked whether its result is zero, so it
  is not quite Javascript's `===`: two `Date` objects holding the same instant are equal, as are
  two equal regular expressions, and `null` equals a missing value.

- [LooseEquals( DocumentA, DocumentB )](./jsongin/LooseEquals.md)
  : Performs a loose equality comparison between two values.
  Primitives are compared with `==`, and values may appear in a different order within objects
  and arrays.

- [CompareValues( ValueA, ValueB )](./jsongin/CompareValues.md)
  : Compares two values and returns `-1`, `0`, or `1`.
  Values of different types are ordered by MongoDB's comparison order:
  `null` < numbers < strings < objects < arrays < booleans < dates < regular expressions.
  Null and missing values are equivalent.
  This is the comparison used by the expression comparison operators and by `Sort()`.

- [Clone( Document )](./jsongin/Clone.md)
  : Clones a document using `JSON.parse( JSON.stringify( Document ) )`.
  Note that this converts dates to strings.

- [SafeClone( Document, Exceptions )](./jsongin/SafeClone.md)
  : Performs a member-wise clone of `Document`, preserving dates.
  Fields listed in `Exceptions` are copied by reference rather than by value.


### Data Types and Conversions

- [ShortType( Value )](./jsongin/ShortType.md)
  : Returns the single-character `ShortType` of a value.
  This is a shorter, yet more precise, type name string than Javascript's `typeof` operator.

- [BsonType( Value, ReturnAlias )](./jsongin/BsonType.md)
  : Returns the MongoDB BSON type of a value, as a number or as its string alias.

- [AsNumber( Value )](./jsongin/AsNumber.md)
  : Converts a value to a number, or returns `null` when it is not numeric.
  Only numbers and numeric strings convert.

- [AsDate( Value )](./jsongin/AsDate.md)
  : Converts a value to a `Date`, or returns `null` when it is not a date.

- [AsBoolean( Value )](./jsongin/AsBoolean.md)
  : Converts a value to a boolean, using MongoDB's expression evaluation rules.
  Only `false`, `0`, `null`, and missing values are false.
  Note that the empty string `""` and the empty array `[]` are both true.


### Text Functions

The `Text` module is reachable at `jsongin.Text`.

- [Compare( TextA, TextB, CaseSensitive )](./Text/Compare.md)
- [FindBetween( Text, StartText, EndText, ... )](./Text/FindBetween.md)
- [Matches( Text, Pattern, CaseSensitive )](./Text/Matches.md)
- [SearchReplace( Text, Search, Replace, CaseSensitive )](./Text/SearchReplace.md)
- [SearchReplacements( Text, ReplacementMap, CaseSensitive )](./Text/SearchReplacements.md)


### Diagnostics

- `OpLog` and `OpError`
  : Two optional handler functions which explain why an operation behaved the way it did.
  See the [OpLog](./OpLog.md) document.


### Settings

Settings are given to the `NewJsongin( Settings )` factory method.

- `PathExtensions`
  : Defaults to `false`. Enables the ***implicit iterator*** on the write side, where a non
  numeric key against an array applies to every element of that array.

  It is off by default because MongoDB does not do this. `$set` and the arithmetic update
    operators reject such a path outright, and `$unset` treats it as a no-op which modifies
    nothing.
  With the setting off, [`SetValue`](./jsongin/SetValue.md) throws and
    [`DeleteValue`](./jsongin/DeleteValue.md) returns `false`, which is what makes the update
    operators agree with MongoDB.

  Reading is ***not*** gated by this setting. MongoDB does traverse arrays when it resolves a
    query path, so [`GetValue`](./jsongin/GetValue.md) reads through one regardless, and a
    query like `{ 'users.id': 101 }` matches an array of objects the way it does in MongoDB.

- `OpLog` and `OpError`
  : See Diagnostics above.


MongoDB References
---------------------------------------------------------------------

- [MongoDB Main Site](https://www.mongodb.com/)
- [Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)
- [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)
