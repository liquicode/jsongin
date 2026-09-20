# @liquicode/jsongin


# Library Guide

`jsongin` is a library of functions for working with Javascript objects.

The module exports a ready-to-use engine.
To make an engine with your own settings, call `NewJsongin( Settings )`.
See [NodeJS Usage](./Usage-NodeJS.md) for both forms.


MongoDB Mechanics
---------------------------------------------------------------------

These functions work the way MongoDB's queries, updates, projections and aggregations work.

- [Query( Document, Criteria )](./jsongin/Query.md)
  : Returns `true` if `Document` matches `Criteria`.

- [ValidateQuery( Criteria )](./jsongin/ValidateQuery.md)
  : Throws if `Criteria` is malformed, the same way `Query` would, without needing a document.

- [IsQuery( Value )](./jsongin/IsQuery.md)
  : Returns `true` if `Value` is an object with at least one key starting with `$`.

- [Evaluate( Document, Expression, Scope )](./jsongin/Evaluate.md)
  : Evaluates an aggregation `Expression` against `Document` and returns the result.
  `Scope` is optional.
  To match documents with an expression, use the `$expr` query operator.

- [Aggregate( Documents, Pipeline, Scope )](./jsongin/Aggregate.md)
  : Runs an array of documents through an aggregation `Pipeline` and returns a new array.
  `Scope` is optional.
  Neither the array nor the documents in it are modified.

- [Filter( Documents, QueryCriteria )](./jsongin/Filter.md)
  : Returns a new array holding the documents which match `QueryCriteria`.
  The documents are not copied.

- [Distinct( Documents, DistinctCriteria )](./jsongin/Distinct.md)
  : Returns one document for each distinct combination of the fields named in `DistinctCriteria`.

- [Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )](./jsongin/Join.md)
  : Matches two sets of documents against each other, gathering what each one matched.

- [Union( Documents, UnionDocuments )](./jsongin/Union.md)
  : Returns one set of documents after another. A concatenation: nothing is removed and nothing is copied.

- [Sort( Documents, SortCriteria )](./jsongin/Sort.md)
  : Sorts an array of documents in place, by fields given as `{ field: 1 }` or `{ field: -1 }`.

- [Project( Document, Projection )](./jsongin/Project.md)
  : Returns a new document holding the fields `Projection` selects or computes.

- [Update( Document, Updates )](./jsongin/Update.md)
  : Returns a copy of `Document` with `Updates` applied.

- [Scope](./jsongin/Scope.md)
  : The object holding the `$$` variables an expression can read.
  You only need one when writing an operator, or when you want to supply variables yourself.

> See the [Operator Reference](./Operator-Reference.md) for the operators `jsongin` supports.
>
> See [Operator Authoring](./Operator-Authoring.md) to add operators of your own.


Snapshots
---------------------------------------------------------------------

These functions describe the difference between two documents as an update document, which
  `Update()` can apply.
Use them for undo and redo, save states, and replay.

- [Diff( Before, After )](./jsongin/Diff.md)
  : Returns an update document which turns `Before` into `After`.
  Arrays are compared as whole values. Neither document is modified.

- [Invert( Before, Patch )](./jsongin/Invert.md)
  : Returns an update document which undoes `Patch`.
  `Patch` can use any update operator, not only the ones `Diff` writes.


JSON Schema
---------------------------------------------------------------------

These functions read JSON Schema drafts 4 through 2020-12, and MongoDB's version of it.
The document always comes first.
See the [JSON Schema](./JSON-Schema.md) guide.

- [ValidateDocument( Document, Schema, Options )](./jsongin/ValidateDocument.md)
  : Returns a list of findings, one for each rule the document breaks.
  The list is empty when the document is valid.

- [InferSchema( Documents, Options )](./jsongin/InferSchema.md)
  : Returns a schema which describes the given documents.

- [InitSchema( Document, Schema, Options )](./jsongin/InitSchema.md)
  : Returns a copy of `Document` with missing fields filled in from the schema's defaults.

- [ProjectSchema( Document, Schema, Options )](./jsongin/ProjectSchema.md)
  : Returns only the parts of `Document` which the schema's properties name.


Document Mechanics
---------------------------------------------------------------------

These functions read and change Javascript objects and arrays.
They name a field with a path in dot notation, such as `'user.address.city'`.

**Working with Paths**

- [SplitPath( Path )](./jsongin/SplitPath.md)
  : Splits a dot notation path into an array of its parts.

- [JoinPaths( Path1, Path2, ... )](./jsongin/JoinPaths.md)
  : Joins paths together into one dot notation path.

**Reading and Writing Values**

- [GetValue( Document, Path )](./jsongin/GetValue.md)
  : Returns the value at `Path`.

- [ResolveCandidates( Document, Path )](./jsongin/ResolveCandidates.md)
  : Returns every value `Path` could refer to, which is what the query operators match against.
  Unlike `GetValue`, it can tell a field holding an array apart from values collected from the
  elements of an array.

- [SetValue( Document, Path, Value )](./jsongin/SetValue.md)
  : Sets the value at `Path`, creating any missing fields along the way.

- [DeleteValue( Document, Path )](./jsongin/DeleteValue.md)
  : Removes the field at `Path`.
  The key is deleted, not set to `undefined`.

**Converting Documents**

- [Parse( Text, Options )](./jsongin/Parse.md)
  : Like `JSON.parse()`, but also reads Javascript object syntax.

- [Format( Value, Options )](./jsongin/Format.md)
  : Like `JSON.stringify()`, with more formatting options.

- [Flatten( Document )](./jsongin/Flatten.md)
  : Turns a nested document into a flat one whose keys are dot notation paths.

- [Expand( Document )](./jsongin/Expand.md)
  : The reverse of `Flatten`: turns dot notation keys back into nested fields.

- [Hybridize( Document )](./jsongin/Hybridize.md)
  : Keeps the top-level fields which are numbers, strings, booleans or `null`, and turns every
  other value (objects, arrays, dates and so on) into a JSON string.

- [Unhybridize( Document )](./jsongin/Unhybridize.md)
  : The reverse of `Hybridize`.

**Combining Documents**

- [Merge( DocumentA, DocumentB )](./jsongin/Merge.md)
  : Returns a new document with `DocumentB`'s fields merged into `DocumentA`.
  When both hold an object in the same field, the two objects are merged.
  Any other value in `DocumentB`, including an array or `null`, replaces the value in `DocumentA`.
  Neither document is modified, and a missing document counts as `{}`.
  Use this to apply a partial set of options over a set of defaults.

> See [Document Manipulation](./Document-Manipulation.md) for more on these functions.


Equality and Cloning
---------------------------------------------------------------------

- [StrictEquals( ValueA, ValueB )](./jsongin/StrictEquals.md)
  : Returns `true` if [`CompareValues()`](./jsongin/CompareValues.md) returns `0`.
  There is no type conversion, and keys and elements must be in the same order.
  This differs from `===`: two dates for the same moment are equal, two identical regular
  expressions are equal, and `null` equals `undefined`.

- [LooseEquals( ValueA, ValueB )](./jsongin/LooseEquals.md)
  : Returns `true` if the values are loosely equal.
  Numbers, strings and booleans are compared with `==`, and keys and elements may be in any order.

- [CompareValues( ValueA, ValueB )](./jsongin/CompareValues.md)
  : Returns `-1`, `0`, or `1`.
  Values of different types are ordered the way MongoDB orders them:
  `null` < numbers < strings < objects < arrays < booleans < dates < regular expressions.
  `null` and `undefined` are equal.
  `Sort()` and the expression comparison operators use this.

- [Clone( Document )](./jsongin/Clone.md)
  : Copies a document with `JSON.parse( JSON.stringify( Document ) )`.
  Dates become strings.

- [SafeClone( Document, Exceptions )](./jsongin/SafeClone.md)
  : Copies a document field by field, keeping dates as dates.
  Paths listed in `Exceptions` are shared with the original rather than copied.


Data Types and Conversions
---------------------------------------------------------------------

- [ShortType( Value )](./jsongin/ShortType.md)
  : Returns a one-letter type code for a value.
  It is shorter than `typeof`, and tells apart types which `typeof` does not, such as arrays, dates
  and `null`.

- [BsonType( Value, ReturnAlias )](./jsongin/BsonType.md)
  : Returns the MongoDB BSON type of a value, as a number or as its name.

- [AsNumber( Value )](./jsongin/AsNumber.md)
  : Returns the value as a number, or `null` if it is not a number or a numeric string.

- [AsDate( Value )](./jsongin/AsDate.md)
  : Returns the value as a `Date`, or `null` if it cannot be read as one.

- [AsBoolean( Value )](./jsongin/AsBoolean.md)
  : Returns the value as a boolean, using MongoDB's rules.
  Only `false`, `0`, `null` and `undefined` are false, so `""` and `[]` are true.


Text Functions
---------------------------------------------------------------------

These are found at `jsongin.Text`.

- [Compare( TextA, TextB, CaseSensitive )](./Text/Compare.md)
- [FindBetween( Text, StartText, EndText, ... )](./Text/FindBetween.md)
- [Matches( Text, Pattern, CaseSensitive )](./Text/Matches.md)
- [SearchReplace( Text, Search, Replace, CaseSensitive )](./Text/SearchReplace.md)
- [SearchReplacements( Text, ReplacementMap, CaseSensitive )](./Text/SearchReplacements.md)


Settings
---------------------------------------------------------------------

Pass settings to `NewJsongin( Settings )`.
The module's default export is an engine made with every setting at its default.

| **Setting** | **Description**                                                                |
|-------------|--------------------------------------------------------------------------------|
| `OpLog`     | A function, such as `console.log`, which receives ***explanations***: messages about an operation which finished but may not have done what you expected. Defaults to `null`, which sends nothing. See [OpLog](./OpLog.md). |
| `OpError`   | A function, such as `console.error`, which receives ***errors***: the message of each error `jsongin` throws. The error is still thrown. Defaults to `null`, which sends nothing. See [OpLog](./OpLog.md). |


MongoDB References
---------------------------------------------------------------------

- [MongoDB Main Site](https://www.mongodb.com/)
- [Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)
- [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)
