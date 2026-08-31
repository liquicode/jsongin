# @liquicode/jsongin


# Project History



v0.1.2 (current)
---------------------------------------------------------------------



v0.1.1 (2026-08-31)
---------------------------------------------------------------------

Nothing in the engine changed. This release is about ***reaching*** it: the package now declares
  how it is loaded, and one way of loading it which never worked now does.

- ***ESM named imports work.*** `import { Query } from '@liquicode/jsongin'` used to answer
  `Named export 'Query' not found`. The engine's surface is assigned at construction, so a static
  reader had nothing to find. `src/jsongin.mjs` re-exports the CommonJS module, which means
  `require()` and `import` reach ***one*** engine — an operator registered through either is
  visible to both.
  *CommonJS, the browser bundle, and ESM `default` import were already working and are unchanged.*
- ***`OpLog` and `OpError` are deliberately not named exports.*** They are mutable settings, and
  a named export binds at load time, so `import { OpLog }` would hand back the `null` it held
  then and go on doing so after you had set one. Reach them through the default export, where an
  assignment lands on the engine:
  `import jsongin from '@liquicode/jsongin'`, then `jsongin.OpLog = function ( Message ) { ... };`
- ***TypeScript declarations ship with the package.*** `types/jsongin.d.ts` describes the engine
  surface, and `npm run types-check` holds it against the ESM exports and the running engine, so
  the three cannot drift.
- ***Breaking — deep imports.*** The package now has an `exports` map, which names the CommonJS
  entry, the ESM entry, the declarations, `./dist/*` for the browser bundle, and
  `./package.json`. A path into the package other than those is no longer reachable, so
  `require( '@liquicode/jsongin/src/Text.js' )` and the like must go through the engine instead.
  *Nothing which imported the package itself is affected.*
- Documentation updates throughout. The Testing guide is now Testing Procedure.


v0.1.0 (2026-08-28)
---------------------------------------------------------------------

Parity with MongoDB is ***100%*** across 988 compared behaviors: Query 230, Update 127,
  Projection 56, and Aggregate 575. Run `npm run parity-report` to measure it.

Coverage of the operator surface MongoDB documents is ***86.2%***, 219 operators of 254. Run
  `npm run api-coverage` to measure that one. The two numbers answer different questions: parity
  is how faithfully what exists behaves, and coverage is how much exists.

This version carries many breaking changes. Nearly all of them correct a behavior which
  disagreed with MongoDB, so code written against MongoDB's own semantics is more likely to
  work than it was before.


### Breaking — Paths

- `jsongin`'s path syntax is MongoDB's path syntax, with no extensions and no settings.
- Reverse indexing is gone. `'a.-1'` no longer addresses the last element of an array.
  *Was: counted back from the end. Against a document a negative key is an ordinary field
  name, so `{ a: { '-1': 5 } }` is still reached by `'a.-1'`.*
- A field name which merely looks numeric is a field name again. Only canonical integer text
  such as `'0'` and `'7'` is an array index.
  *Was: `'01'`, `'1e2'`, `'0x10'`, and `'Infinity'` became array indexes, which made a field in
  any of those forms unreachable.*
- A path which reaches into an array by field name is no longer a write target. `SetValue()`
  throws and `DeleteValue()` returns `false`.
  *Was: applied the key to every element, which corrupted data through `$inc`, `$mul`, and
  `$rename`. Reading is unchanged and still traverses arrays.*


### Breaking — Queries

- A malformed query is refused with an error rather than answered with `false`. An unknown
  operator, an operator written where it cannot appear, an operator value of the wrong type, an
  `$options` which cannot be applied, and a logical operator given no conditions all throw.
  *Was: a typo was indistinguishable from an empty result. A query which simply matches nothing
  still returns `false`, and a `Document` of the wrong type still returns `false`.*
- `$not` is no longer accepted at the top level of a query. Negate a whole query with `$nor`.
- `$exists` coerces its value, so `{ $exists: 1 }` and `{ $exists: 0 }` ask the questions
  MongoDB asks.
  *Was: both answered `false`, the second one the opposite of the right answer.*
- `$in` and `$nin` match the way the implicit form does. Each value in the list goes through
  `$ImplicitEq`, so a regexp pattern matches and everything else goes through `$eq`.
  *Was: `Array.includes()`, which is `===`, so a sub-document, an array, a date, a missing
  field against `null`, and any path crossing an array all failed to match.*
- `$eq` compares structured values with `CompareValues()` rather than by their `JSON.stringify`
  text.
  *Was: stringifying discarded the type, so an object holding a `Date` equalled one holding the
  equivalent ISO string.*
- `$eqx` and `$nex` resolve candidates, the way `$eq` and `$ne` do.
  *Was: `{ tags: { $eqx: 'a' } }` did not match `{ tags: [ 'a', 'b' ] }`.*
- `$gt`, `$gte`, `$lt`, and `$lte` compare objects and arrays, within the operand's own type
  bracket.
  *Was: refused both outright, and compared with the raw `>` operator.*
- A query path which crosses an array means what it means in MongoDB, across `$eq`, `$ne`,
  `$not`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$type`, `$size`, `$all`, `$regex`, and the
  implicit form. Specifically:
  - `$all` is no longer an array operator. It is an AND of the given values, each tested as
    ordinary equality, so it works against a field which is not an array. An empty match array
    selects nothing.
  - `$regex` applies only to strings. A field which is itself a regexp matches when its source
    and flags are the same.
  - `$exists` reports a field holding `undefined` as ***present***.
  - `$type: 'array'` finds an array field rather than testing its elements.
  - `$lt` and `$lte` no longer match a numeric array against a string.
- A regular expression matches an array field when ***any*** one element matches.
  *Was: required every element to match, so the defect only showed on arrays of two or more.*
- The `$query` query operator was removed. It matched every document whatever its value, and
  appeared in no document. `$noop` fills the same role and works at the top level of a query.


### Breaking — Updates

- A malformed update is refused with an error. An unknown operator, an update document which is
  not made of operators, an operator value of the wrong type, and two operators which write to
  the same path or to a path and one below it all throw. The whole update document is checked
  before any of it is applied.
- An update operator which cannot apply itself raises an error — `$inc` against a string,
  `$push` against a scalar, a malformed `$currentDate` or `$push` modifier.
  *Was: reported to the `OpLog` and left the field alone, which a caller could not tell from an
  update that had nothing to do. A field which is not there is still a no-op, not a refusal.*
- `$inc` and `$mul` are strictly numeric on both sides. A field holding a string, a boolean, a
  date, or a `null` is refused rather than coerced, and a numeric string operand is refused.
  *Was: `{ n: 'abc' }` incremented by 1 became `'abc1'`, and `{ n: true }` became `2`.*
- `$rename` removes the source key.
  *Was: left it in place holding `undefined`, so a renamed field still answered
  `{ $exists: true }`. A source field which is not there is now left alone.*
- `$unset` removes a field rather than setting it to `undefined`, and sets an array element to
  `null` rather than leaving a hole.
  *Was: `Object.keys()` still reported an unset field, and a hole is not representable in JSON.*
- `$min` and `$max` are no longer numeric operators. They compare by the BSON ordering through
  `CompareValues()`, so strings, dates, booleans, and comparisons between different types all
  work. A field which is not present is set to the given value.
  *Was: forced through `AsNumber()`, so both quietly did nothing to a non-numeric field.*
- `$addToSet` compares values by content rather than by reference, so it is a set operation for
  every value and not only for primitives. It also stores a copy of the value.
  *Was: not idempotent for an object, an array, or a date.*
- `$push` stores a modifier document which has no `$each` as a plain value.
  *Was: refused it. `$each` is what makes a document a modifier document.*
- `$currentDate` stores a `Date` object for `true` and for `{ $type: 'date' }`.
  *Was: stored `Date.toISOString()` and `Date.toDateString()` strings, which did not answer a
  `{ $type: 'date' }` query. Code which read these fields as strings must change.*
- `Update()` no longer converts dates to strings.
- `SetValue()` fills a gap with `null` when it writes past the end of an array, so
  `{ $set: { 'a.3': 9 } }` against `{ a: [ 1 ] }` gives `[ 1, null, null, 9 ]`.
  *Was: left Javascript array holes.*
- `SetValue()` creates a document for a path which is not there, whatever the next key looks
  like, so `{ $set: { 'a.0': 9 } }` against a document with no `a` gives `{ a: { '0': 9 } }`.
  *Was: a numeric key created an array. Pass the new `CreateArrays` parameter for the old
  behavior. An array which already exists is still indexed by a numeric key.*


### Breaking — Projection and Sorting

- `Project( Document, {} )` returns the whole document.
  *Was: returned an empty one. The `$project` stage has the opposite rule and refuses an empty
  specification.*
- An invalid projection throws rather than returning `null`. `null` is reserved for a
  `Document` or `Projection` parameter of the wrong type.
- `Sort()` builds its sort key by gathering candidates along the sort path, so a path which
  crosses an array reduces through every level it crosses.
  *Was: stopped one level short and sorted by the gathered array, which outranks every number.
  The `$sort` stage delegates to `Sort()` and inherits this.*
- `Sort()` orders documents the way MongoDB does. A document missing the sort field sorts as
  `null`; types order `null` < numbers < strings < objects < arrays < booleans < dates <
  regular expressions; and an array field sorts by its smallest element ascending and its
  largest descending.
  *Was: compared with `>` and `<`, which report every comparison against a missing field as
  equal, so one such document made the whole order arbitrary.*


### Breaking — Engine Functions

- `Date` values have their own short type `d`. `ShortType( aDate )` returns `d` and
  `BsonType( aDate )` returns `9` / `'date'`.
  *Was: `o` and `3` / `'object'`. A `Date` has no enumerable own properties, so every function
  which walked it member-wise silently produced an empty object. Code which switches on these
  values is affected.*
- `BsonType()` no longer reports a number as a `long`. A number is `int` between `-2147483648`
  and `2147483647`, and `double` everywhere else, including `NaN` and the infinities.
  *Was: classified by `Number.isSafeInteger()`, which is not an int32 range test.*
- `StrictEquals()` is symmetric, comparing with `CompareValues()`.
  *Was: called the `$eq` query operator, whose two parameters are not peers, so
  `StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] )` and its reverse disagreed.*
- `LooseEquals()` examines the keys of both values, and is an engine function of its own rather
  than the `$eqx` query operator applied to two whole values.
  *Was: walked the first value's keys only, so `LooseEquals( {}, { a: 1 } )` was `true` and an
  empty object loosely equalled everything.*
- `AsNumber()` no longer applies Javascript's type coercion to non-numeric values.
  `AsNumber( true )` and `AsNumber( [ 5 ] )` return `null`. Only numbers and numeric strings
  convert.
- `Merge( DocumentA, DocumentB )` descends into a field only when ***both*** documents hold a
  sub-document there. Every other value in `DocumentB` replaces the value in `DocumentA`, and
  `Merge` is idempotent.
  *Was: dispatched on `typeof`, so arrays merged by index and could not be narrowed, dates and
  regular expressions were discarded, and a value which changed type threw. Follows RFC 7386
  with one difference: `null` is a value rather than a deletion.*
- `Merge( DocumentA, DocumentB )` requires both parameters to be objects. A `null` or missing
  document is still treated as an empty one, so `Merge( DEFAULTS, options )` works when no
  options were supplied. Merging arrays at the top level is no longer supported.
- `OperatorType` and `ArgCount` were removed from every operator. Both were declared everywhere
  and read nowhere, and neither could make the engine refuse anything. An operator checks its
  own operand count.
- The two browser globals are one instance. The module publishes its own export rather than
  building a second engine.
  *Was: an operator registered through one global was invisible through the other. A browser
  sees this once `dist/jsongin.min.js` is rebuilt.*

- `Format()` leaves out a value which JSON has no representation for, rather than writing the
  field name followed by nothing. A field holding `undefined`, a symbol, or a function is left
  out of a document and becomes `null` in an array, which is what `JSON.stringify()` does.
  *Was: `Format( { a: undefined } )` returned `'{"a":}'`, which no JSON parser accepts and
  which `Parse()` read back as the punctuation following the colon. Use the new `TypedValues`
  option to carry such values rather than drop them.*


### Added

**Functions**

- `Aggregate( Documents, Pipeline )`, which runs an array of documents through a MongoDB
  aggregation pipeline. See [Aggregate](/docs/guides/jsongin/Aggregate.md).
- `Evaluate( Document, Expression, Scope )`, which evaluates an aggregation expression against
  a document. `Scope` is optional. See [Evaluate](/docs/guides/jsongin/Evaluate.md).
- `Diff( Before, After )`, which describes the changes between two documents as an update
  document, and `Invert( Before, Patch )`, which returns the update which undoes one.
- `ResolveCandidates( Document, Path )`, `DeleteValue( Document, Path )`,
  `CompareValues( ValueA, ValueB )`, and `AsBoolean( Value )`.
- `jsongin.Scope`, with `New`, `NewPipeline`, `NewDocument`, `Child`, `ForDocument`,
  `Lookup`, `RequireName`, `Require`, `ToJSON`, and `FromJSON`. See
  [Scope](/docs/guides/jsongin/Scope.md).
- An options document for `Format( Value, Options )` and `Parse( JsonString, Options )`, with
  the `TypedValues` and `Strict` options. The positional form still works. See
  [Format](/docs/guides/jsongin/Format.md) and [Parse](/docs/guides/jsongin/Parse.md).
- An optional `CreateArrays` parameter for `SetValue()`.
- Computed fields in `Project()`, which also accepts `true` and `false` for `1` and `0`.

**Expression Operators**

134 operators, in `jsongin.ExpressionOperators`. See
  [Expression Operators](/docs/guides/jsongin/Expression-Operators.md).

- Arithmetic (18) : `$abs`, `$add`, `$ceil`, `$divide`, `$exp`, `$floor`, `$ln`,
  `$log`, `$log10`, `$max`, `$min`, `$mod`, `$multiply`, `$pow`, `$round`,
  `$sqrt`, `$subtract`, `$trunc`
- Array (21) : `$arrayElemAt`, `$arrayToObject`, `$concatArrays`, `$filter`, `$first`,
  `$firstN`, `$in`, `$indexOfArray`, `$isArray`, `$last`, `$lastN`, `$map`,
  `$maxN`, `$minN`, `$range`, `$reduce`, `$reverseArray`, `$size`, `$slice`,
  `$sortArray`, `$zip`
- Comparison (7) : `$cmp`, `$eq`, `$gt`, `$gte`, `$lt`, `$lte`, `$ne`
- Conditional (3) : `$cond`, `$ifNull`, `$switch`
- Data Size (2) : `$binarySize`, `$bsonSize`
- Date (21) : `$dateAdd`, `$dateDiff`, `$dateFromParts`, `$dateFromString`,
  `$dateSubtract`, `$dateToParts`, `$dateToString`, `$dateTrunc`, `$dayOfMonth`,
  `$dayOfWeek`, `$dayOfYear`, `$hour`, `$isoDayOfWeek`, `$isoWeek`, `$isoWeekYear`,
  `$millisecond`, `$minute`, `$month`, `$second`, `$week`, `$year`
- Literal (1) : `$literal`
- Logical (3) : `$and`, `$not`, `$or`
- Miscellaneous (1) : `$rand`
- Object (5) : `$getField`, `$mergeObjects`, `$objectToArray`, `$setField`,
  `$unsetField`
- Set (7) : `$allElementsTrue`, `$anyElementTrue`, `$setDifference`, `$setEquals`,
  `$setIntersection`, `$setIsSubset`, `$setUnion`
- String (20) : `$concat`, `$indexOfBytes`, `$indexOfCP`, `$ltrim`, `$regexFind`,
  `$regexFindAll`, `$regexMatch`, `$replaceAll`, `$replaceOne`, `$rtrim`, `$split`,
  `$strLenBytes`, `$strLenCP`, `$strcasecmp`, `$substr`, `$substrBytes`, `$substrCP`,
  `$toLower`, `$toUpper`, `$trim`
- Trigonometry (15) : `$acos`, `$acosh`, `$asin`, `$asinh`, `$atan`, `$atan2`,
  `$atanh`, `$cos`, `$cosh`, `$degreesToRadians`, `$radiansToDegrees`, `$sin`,
  `$sinh`, `$tan`, `$tanh`
- Type (9) : `$convert`, `$isNumber`, `$toBool`, `$toDate`, `$toDouble`, `$toInt`,
  `$toLong`, `$toString`, `$type`
- Variable (1) : `$let`

**Expression Variables**

- Variable scope. A name beginning with `$$` resolves from the scope in effect where the
  expression is evaluated rather than from the document. See
  [Variables](/docs/guides/jsongin/Expression-Operators.md#variables).
- The system variables `$$ROOT`, `$$CURRENT`, `$$NOW`, and `$$REMOVE`.
- The `$redact` variables `$$DESCEND`, `$$PRUNE`, and `$$KEEP`.

**Pipeline Stages**

21 stages, in `jsongin.StageOperators`: `$addFields`, `$bucket`, `$bucketAuto`,
  `$count`, `$densify`, `$facet`, `$fill`, `$group`, `$limit`, `$match`,
  `$project`, `$redact`, `$replaceRoot`, `$replaceWith`, `$sample`, `$set`,
  `$skip`, `$sort`, `$sortByCount`, `$unset`, and `$unwind`. See
  [Stage Operators](/docs/guides/jsongin/Stage-Operators.md).

**Accumulators**

20 accumulators, in `jsongin.AccumulatorOperators`: `$addToSet`, `$avg`, `$bottom`,
  `$bottomN`, `$count`, `$first`, `$firstN`, `$last`, `$lastN`, `$max`, `$maxN`,
  `$mergeObjects`, `$min`, `$minN`, `$push`, `$stdDevPop`, `$stdDevSamp`, `$sum`,
  `$top`, and `$topN`. See
  [Accumulator Operators](/docs/guides/jsongin/Accumulator-Operators.md).

**Query Operators**

- `$expr`, and `$exprx` which is a `jsongin` extension of it that may also appear within a
  field of a query.
- The bitwise operators `$bitsAllSet`, `$bitsAllClear`, `$bitsAnySet`, and
  `$bitsAnyClear`.
- The query `$mod`, which takes `[ divisor, remainder ]`.
- `$comment` and `$sampleRate`.
- `$options` for `$regex`, including MongoDB's `x` mode.
- See [Query Operators](/docs/guides/jsongin/Query-Operators.md).

**Update Operators**

- `$pull`, which takes a query where `$pullAll` takes values.
- `$bit`, with `and`, `or`, and `xor`.
- The all positional operator `$[]`, which is a ***path*** element rather than an update
  operator: `'a.$[].n'` means the `n` of every element of `a`.
- Modifiers for `$push` (`$each`, `$position`, `$sort`, `$slice`) and for
  `$addToSet` (`$each`).
- See [Update Operators](/docs/guides/jsongin/Update-Operators.md).

**Projection Operators**

- `$slice` and `$elemMatch`. See
  [Projection Operators](/docs/guides/jsongin/Projection-Operators.md).


### Fixed

- ***`Format()` produced text which was not JSON, and `Parse()` read it back as the wrong
  value.*** A field with nothing to write left its name and colon behind, and `Parse()` then
  took the following comma as the value: `Parse( Format( { a: undefined, b: 1 } ) )` returned
  `{ a: ',', b: 1 }`. The two are inverses again.

- ***The expression comparison operators equated a missing value with a null; they no longer
  do.*** `{ $eq: [ '$missing', null ] }` answered `true`, which is the ***query*** language's
  rule wrongly applied to the expression language. In an expression a missing value ranks
  ***below*** a null and equals only another missing one, so `$cmp` answers `-1` rather than
  `0` and `$lt` answers `true`. This affects `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, and
  `$cmp`.
  *Was: a missing operand compared equal to a null, so `$ne` against a null answered `false`
  for a field which was not there.*
  ***`$sort` is unchanged***, and still orders a document missing the sort field as though it
  held a null. MongoDB is inconsistent between the two on purpose, and both rules are now
  measured.
- ***`$group` wrote no field at all when an accumulator produced no value; it now writes a
  null.*** `{ $first: '$missing' }` left its field out of the group's output document, on the
  analogy with `$project`, where an expression producing no value does exactly that. A `$group`
  output field is always written, and MongoDB answers such a field with a null.
  *Was: the field was absent from the result.*
- `$push` and `$addToSet` create the array when the field is not present, rather than refusing
  the update.
- `$inc` and `$mul` on a field which is not there no longer write a `NaN`. The field counts as
  zero, and the path to it is created.
- `$regex` is no longer stateful across documents. The pattern is rebuilt for each call, so a
  caller's reused object carrying the `g` flag no longer matches every other document.
- `$elemMatch` resolves candidates instead of indexing into one gathered value, so
  `{ 'a.b': { $elemMatch: { $gt: 1 } } }` matches `{ a: [ { b: [ 1, 2 ] } ] }`. An empty
  condition matches an element which can hold fields and nothing else.
- `$pullAll` matches by content rather than by reference, so it pulls more than primitives.
- `$noop` works at the top level of a query, which is where a commented out clause sits.
- An unsupported projection operator is reported as one. `$` and `$meta` used to be reported as
  unrecognized ***expression*** operators, which sent the reader to the wrong reference table.
- Six update operators threw a `ReferenceError` instead of logging, on the failure path which
  writes to the `OpLog`.
- `$push` reported success no matter what happened, so pushing onto a field which is not an
  array reported that it had worked.
- `$mul`, `$min`, and `$max` silently did nothing when given a value of `0`.
- `AsNumber( 0 )` returned `null` instead of `0`, and `AsDate( 0 )` returned `null` instead of
  the epoch. Both were testing their parameter for falsiness.
- `SafeClone()` destroyed dates, cloning them member-wise into an empty object. This also
  repairs `Merge()`, which clones with it.
- `Flatten()` dropped empty objects and arrays, so a round trip through `Expand()` lost them.
  Two round trip limitations which cannot be fixed this way are now documented.
- `Format()` escaped only the first quote in a string and did not escape the backslash or the
  control characters, so its output could not be read back by `JSON.parse()`.
- `Parse()` dropped the backslash of an escape sequence, turning `\n` into the letter `n`, and
  threw a raw `TypeError` on truncated input. It is now a forgiving parser which never throws.
- `Distinct()` built its key by concatenating stringified values with nothing between them, so
  `{ a: 1, b: 23 }` and `{ a: 12, b: 3 }` produced the same key and one was lost. Its results
  are cloned, and it no longer reports its failures under the name `Sort`.
- `Unhybridize()` dropped any string field whose text happened to parse as JSON, and returned
  `undefined` for the `message` and `source` of an `Error`, a function, and a `Symbol`.
- `BsonType()` threw whenever it was called as anything other than a method of the engine, as
  did `Text.SearchReplace()`. The `Text` functions are declared at module scope now, so any of
  them can be detached or passed as a callback.
- `Text.SearchReplace()` and `Text.SearchReplacements()` built a regular expression from the
  search text without escaping it, so searching for `a.b` also matched `axb` and searching for
  `(` threw. `Text.Matches()` validates its parameters.
- `$eq` and `$ne` compared two regular expressions with `===`, which is never true for distinct
  objects. They are compared by their source and flags now.
- Derived values no longer alias the data they came from — a computed field in `Project()`, a
  field added by the `$addFields` and `$set` stages, and the `$set` and `$push` update
  operators.
- The types an operator declares, as `ValueTypes` or `ArgTypes`, are checked by `Query()`,
  `Evaluate()`, `Update()`, and `Aggregate()` before dispatching. Nothing read them before.
- `$group` emits its groups in the order they were first seen. MongoDB does not guarantee an
  order here; `jsongin`'s is deterministic so that a pipeline result is testable.
- Every operator carries a documentation block, which `check-docs` enforces.


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

