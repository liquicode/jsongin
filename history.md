# @liquicode/jsongin


# Project History


v0.1.0 (???)
---------------------------------------------------------------------

- Fixed a minor error in the documentation.
- Added the `Evaluate( Document, Expression )` function, which evaluates a MongoDB aggregation
  expression against a document. See the [Evaluate](docs/guides/jsongin/Evaluate.md) document.
- Added 22 expression operators, available in `jsongin.ExpressionOperators`:
  `$literal`, `$add`, `$subtract`, `$multiply`, `$divide`, `$mod`, `$abs`, `$min`, `$max`,
  `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$cmp`, `$and`, `$or`, `$not`,
  `$cond`, `$ifNull`, and `$switch`.
- Added the `$expr` query operator, which allows a query to compare one document field to
  another. e.g. `Query( entity, { $expr: { $gt: [ '$dmg', '$armor' ] } } )`
- Added the `$exprx` query operator, a jsongin extension of `$expr` which can also appear
  within a field of a query, where it evaluates its expression against the sub-document found
  at that field.
- Added the `AsBoolean( Value )` function.
- Fixed the `$noop` query operator, which could not do the one thing it is documented to do.
  It was marked as not allowed at the top level of a query, which is exactly where a commented
  out clause sits, so `Query( doc, { a: 1, $noop: { b: 2 } } )` returned `false` instead of
  ignoring the `$noop` clause. It now works at the top level and within a field.
- `Project( Document, Projection )` now supports computed fields. A projection field whose
  value is neither `1`/`true` nor `0`/`false` is an expression, evaluated against the document
  with `Evaluate()`. e.g. `Project( entity, { net: { $subtract: [ '$dmg', '$armor' ] } } )`
  A projection containing a computed field is an inclusion projection, as it is in MongoDB.
  An expression which evaluates to `null` sets the field, while one which evaluates to a
  missing value omits it.
  `Project` also now accepts `true` and `false` in place of `1` and `0`.
- Fixed several `Project( Document, Projection )` defects:
  - A projection combining `_id: 0` with a computed field inverted into an exclusion and
    returned the ***entire document***.
  - Excluded fields were removed from the output's JSON but their keys remained, holding
    `undefined`, so `Object.keys()` and the `in` operator still reported them.
  - An inclusion projection always produced an `_id` key, even when the source document had
    no `_id`, leaving a key holding `undefined`.
  - Dates were converted to strings, because the function cloned with `Clone()`. It now
    clones with `SafeClone()`.
  - Using an expression within an exclusion projection is now rejected, matching MongoDB.
  Projection behavior was verified case by case against a MongoDB 8.0 server.
- ***Breaking***: `Date` values now have their own short type `d`. `ShortType( aDate )` returns
  `d` where it previously returned `o`, and `BsonType( aDate )` returns `9` / `'date'` where it
  previously returned `3` / `'object'`. Code which switches on these values is affected.
  A date is recognized by its type only, never by parsing: a number which would be a valid
  timestamp is still `n`, and a string which would parse as a date is still `s`.
  This repairs a family of defects which all had the same cause. A `Date` has no enumerable
  own properties, so any function which saw `o` and walked the value member-wise found nothing
  and silently produced an empty object:
  - `LooseEquals( dateA, dateB )` returned `true` for ***any*** two dates.
  - `Flatten()` dropped date fields entirely.
  - `Format()` emitted `{}` for a date. It now emits an ISO string, matching `JSON.stringify`.
  - `Evaluate()` destroyed a literal date within an expression.
  - `Query()` could not compare dates with `$gt`, `$gte`, `$lt`, `$lte`, `$in`, or `$nin`.
  - `$type: 'date'` and `$type: 9` never matched anything.
  - `GetValue()` descended into a `Date` and returned its methods.
  - `Hybridize()` recorded a date as an object, so the round trip could not restore it.
  Date equality, ranges, sets, `$type`, and `$expr` were verified case by case against a
  MongoDB 8.0 server.
- Fixed `SafeClone( Document, Exceptions )`, which silently destroyed dates. A `Date` has the
  short type `o` but has no enumerable own properties, so cloning it member-wise returned an
  empty object `{}` and the value was lost. Dates are now cloned by value.
  This also repairs `Merge( DocumentA, DocumentB )`, which clones with `SafeClone` and was
  therefore destroying any date in either document.
  Note that `Clone( Document )` is unchanged: it converts dates to ISO strings, which is
  inherent to the stringify/parse approach it documents.
- Added the `CompareValues( ValueA, ValueB )` function, which compares two values using
  MongoDB's comparison order and returns `-1`, `0`, or `1`.
  This is the comparison used by the expression comparison operators and by `Sort()`.
- ***Breaking***: `Sort()` now orders documents the way MongoDB does. It previously compared
  values with Javascript's `>` and `<` operators, which report every comparison against a
  missing field as equal. A single document missing the sort field made the comparison
  inconsistent and the resulting order arbitrary. Sorting complete, same-typed documents is
  unchanged. Specifically:
  - A document missing the sort field now sorts as `null`, at the beginning of an ascending sort.
  - Values of different types are ordered `null` < numbers < strings < objects < arrays <
    booleans < dates < regular expressions.
  - A sort field holding an array is sorted by that array's smallest element when ascending,
    and by its largest element when descending.
  - A sort field holding an empty array sorts below every other value, including `null`.
  - `Sort()` still sorts in place and still returns the array which was passed to it.
  - These orderings were verified case by case against a MongoDB 8.0 server.
- Fixed `AsNumber( Value )` and `AsDate( Value )`, which were testing their parameter for
  falsiness and so rejected legitimate values. `AsNumber( 0 )` returned `null` instead of `0`
  and `AsDate( 0 )` returned `null` instead of the epoch.
- This also fixes the `$mul`, `$min`, and `$max` update operators, which silently performed no
  update when given a value of `0`. For example, `Update( { hp: 5 }, { $max: { hp: 0 } } )`
  now correctly clamps `hp` to `0` rather than leaving the document unchanged.
- ***Breaking***: `AsNumber` no longer applies Javascript's own type coercion to non-numeric
  values. `AsNumber( true )` now returns `null` rather than `1`, and `AsNumber( [ 5 ] )` now
  returns `null` rather than `5`. Only numbers and numeric strings are converted.
  Consequently, update operators like `$inc: { count: true }` no longer modify the field.
- Added tests for `AsNumber` and `AsDate`.
- Added the `Aggregate( Documents, Pipeline )` function, which runs an array of documents
  through a MongoDB aggregation pipeline.
  See the [Aggregate](docs/guides/jsongin/Aggregate.md) document.
  e.g. `Aggregate( players, [ { $match: { alive: true } }, { $group: { _id: '$team', score: { $sum: '$points' } } } ] )`
- Added 9 pipeline stages, available in `jsongin.StageOperators`:
  `$match`, `$project`, `$addFields`, `$set`, `$unwind`, `$group`, `$sort`, `$limit`, and
  `$skip`. As in MongoDB, `$set` is an alias of `$addFields`.
- Added 8 accumulators, available in `jsongin.AccumulatorOperators`:
  `$sum`, `$avg`, `$min`, `$max`, `$count`, `$push`, `$first`, and `$last`.
  Note that `$sum` and `$avg` ignore non-numeric values rather than throwing on them, which is
  what MongoDB does and is deliberately unlike the expression operator `$add`.
- `Aggregate` never modifies the array it is given, nor the documents within it. The stages
  which only select or reorder documents (`$match`, `$sort`, `$limit`, `$skip`) pass the
  original documents along, and the stages which produce documents clone with `SafeClone()`
  before writing. Dates therefore survive a pipeline as dates.
- `$group` emits its groups in the order they were first seen. MongoDB does not guarantee an
  order here; jsongin's is deterministic so that a pipeline result is testable.
- Added an `Aggregate` method to the test drivers, so that the same pipelines can be run
  against a real MongoDB server.
- Added the `Diff( Before, After )` function, which describes the changes between two documents
  as a `jsongin` update document, so that a change is expressed in the same shape that `Update()`
  already applies. See the [Diff](docs/guides/jsongin/Diff.md) document.
  e.g. `Diff( { hp: 10, n: 1 }, { hp: 7 } )` returns `{ $set: { hp: 7 }, $unset: { n: '' } }`
  - Arrays are atomic: a change anywhere inside an array replaces the whole array. Describing
    an array element-wise would need a way to shorten one, which the update operators cannot
    express.
  - `Diff` compares content and ignores key order, so two documents whose fields appear in a
    different order produce an empty patch. Note that applying a patch restores content and not
    key order, because an update document cannot reposition a key.
  - Values are compared strictly, so a value which changed type is a change. `null` is a value
    rather than an absence, so a field which changed to `null` is `$set` rather than `$unset`.
- Added the `Invert( Before, Patch )` function, which returns the update document that undoes
  `Patch`. See the [Invert](docs/guides/jsongin/Invert.md) document.
  It applies the patch and diffs the result back toward the original, so it inverts ***any***
  update document rather than only the `$set` and `$unset` which `Diff` writes. `$inc`, `$push`,
  `$rename`, and the rest all invert.
- Added the `DeleteValue( Document, Path )` function, which removes the field at a document
  path. It replaces two private copies of the same helper, in `Project()` and in the `$unwind`
  stage.
- ***Breaking***: `Update( Document, Updates )` no longer converts dates to strings. It cloned
  the document with `Clone()`, a stringify/parse round trip, so every `Date` in an updated
  document came back as an ISO string. It clones with `SafeClone()` now, the same repair
  `Project()` received earlier in this version.
- ***Breaking***: the `$unset` update operator now ***removes*** a field rather than setting it
  to `undefined`. The key previously remained, so `Object.keys()` and the `in` operator still
  reported a field which had been unset. This is the same defect which was fixed in `Project()`
  earlier in this version.
- Fixed a latent `ReferenceError` in six update operators. `$set`, `$unset`, `$addToSet`, `$pop`,
  `$pullAll`, and `$push` each referred to an undefined `Engine` variable on the failure path
  which is meant to write to the `OpLog`, so a failed field update threw a `ReferenceError`
  instead of logging, but only when `OpLog` was enabled.
  `$addToSet` carried a second undefined reference on the same statement, to a `value` variable
  which its loop never declared, and now logs the array it was storing.
  This path needs a failed store and a configured `OpLog` at the same time, which is why it went
  unnoticed. All twelve update operators are now tested for it.
- Fixed the `$push` update operator, which returned `true` no matter what happened. It tracked
  its own success in a variable and then ignored it, so pushing onto a field which is not an
  array reported success while doing nothing. It now returns the result, as the other eleven
  update operators already did.
  e.g. `Update( { n: 5 }, { $push: { n: 1 } } )` no longer reports that it worked.


v0.0.23 (2024-08-31)
---------------------------------------------------------------------

- Included `dist/jsongin.min.js` in distribution.


v0.0.22 (2024-08-31)
---------------------------------------------------------------------

- Added browser loading compatability. (i.e. window.jsongin)
- Added function `Text.SearchReplacements( Text, ReplacementMap, CaseSensitive = true )`
- Added function `Text.SearchReplace( Text, Search, Replace, CaseSensitive = true )`
- Added documentation for the `Text` module.


v0.0.21 (2024-05-29)
---------------------------------------------------------------------

- Added the `Merge( DocumentA, DocumentB )` function. Merges DocumentB into DocumentA and returns the merged object.


v0.0.20 (2023-12-17)
---------------------------------------------------------------------

- Fixed `build/prod/devops.tasks.js`.


v0.0.19 (2023-12-16)
---------------------------------------------------------------------

- Fixes to `Distinct()` function.
- Changed the main module's return value to an actual instance of jsongin rather than a factory method.
  e.g. `const jsongin = require( '@liquicode/jsongin' );`
- jsongin now includes a factory method `NewJsongin( Settings )` to create instances with custom settings.
- jsongin now has a `Library` field containing the library's name and version number.


v0.0.18 (2023-12-09)
---------------------------------------------------------------------

- Added `Distinct()` function.


v0.0.17: (2023-12-09)
---------------------------------------------------------------------

- `Parse()` function fixes and tests.


v0.0.16: (2023-12-09)
---------------------------------------------------------------------

- `Sort()` function fixes and tests.


v0.0.15: (2023-12-09)
---------------------------------------------------------------------

- Added `Text` helper functions.
- Added `Filter()` function.
- Added `Sort()` function.


v0.0.14 (2023-11-29)
---------------------------------------------------------------------

- More docs and tests.
- Added `Parse` and `Format` functions.


v0.0.13 (2023-11-27)
---------------------------------------------------------------------

- No modifications of import.


v0.0.12 (2023-11-27)
---------------------------------------------------------------------

- Fixed docs
- Added the `Hybridize` and `Unhybridize` functions.


v0.0.11 (2023-11-24)
---------------------------------------------------------------------

- Refactoring and validation. Especially with regards to handling arrays.
- Added docs

v0.0.10 (2023-11-23)
---------------------------------------------------------------------

- The more cogent first release
- Refactoring and validation. Especially with regards to handling arrays.


v0.0.9 (2023-11-22)
---------------------------------------------------------------------

- first cogent release

