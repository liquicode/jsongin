# @liquicode/jsongin


# Project History


v0.1.0 (current)
---------------------------------------------------------------------

- A code review of the whole library was run and its findings worked through. The review is kept
  at `.reviews/2026-08-14-03-35/review.md`. What it turned up, and what was done about it:

  - ***Breaking:*** `$currentDate` now stores a `Date` object for `true` and for
    `{ $type: 'date' }`, rather than a `Date.toISOString()` string and a `Date.toDateString()`
    string. `{ $type: 'timestamp' }` still stores a number, because there is no BSON Timestamp
    type to store. The stored value now answers a `{ $type: 'date' }` query, which its own
    output previously did not. Code which read these fields as strings has to change.
    Each field also gets its own `Date` rather than every field in one operation sharing a
    single object.

  - `Unhybridize()` silently dropped any string field whose text happened to parse as JSON.
    `'123'`, `'true'`, and `'[1,2]'` all parse without being one of `Hybridize()`'s envelopes,
    matched none of the type cases, and left the field unwritten. The parsed value is now
    checked for an envelope before it is used, and anything else is returned as the string it
    was. A value which is not a string is carried across unchanged rather than dropped, so a
    document which was never hybridized survives the call.

  - `Unhybridize()` read the `message` and `source` of an `Error`, a function, and a `Symbol`
    off the raw JSON string rather than off the parsed envelope, so all three came back
    `undefined`. Rebuilding a function also passed a whole function declaration to
    `new Function()`, which takes a body; the source is now evaluated as an expression.

  - `Distinct()` built its key by concatenating the stringified field values with nothing
    between them, so `{ a: 1, b: 23 }` and `{ a: 12, b: 3 }` produced the same key and one of
    the two was lost. Each field's key now carries its short type and the parts are combined
    through `JSON.stringify()`, which is what the `$group` stage already did. The returned
    values are also cloned, so the result no longer aliases the given documents.

  - `Format()` escaped only the first quote in a string and did not escape the backslash or the
    control characters at all, so its output could not be read back by `JSON.parse()`. It now
    escapes exactly what `JSON.stringify()` escapes, including lone surrogates, and it does so
    for field names as well as for values.

  - `Parse()` dropped the backslash of an escape sequence and took the next character
    literally, turning `\n` into the letter `n`. It now decodes `\b`, `\f`, `\n`, `\r`, `\t`,
    `\uXXXX`, and the quote, backslash, and slash escapes; any other escape stands for the
    character which follows it.

  - `Parse()` threw a raw `TypeError` on truncated input, from reading a token which was not
    there. It is now a forgiving parser which ***never throws***: a string it cannot read is
    returned unchanged, as is an argument which is not a string, and the reason is reported to
    the `OpLog`.

  - Derived values no longer alias the data they came from. A computed field in `Project()` and
    a field added by the `$addFields` and `$set` stages were stored without being cloned, but a
    field reference such as `'$user'` evaluates to the value inside the document rather than to
    a copy of it, so writing to the result reached back into the input. The `$set` and `$push`
    update operators had the same problem with the update document itself.

  - `$pullAll` matched with `Array.includes()`, which compares objects, arrays, and dates by
    reference, so it could only ever pull primitives. It now matches by content, which is what
    `$addToSet` already did.

  - `Text.SearchReplace()` and `Text.SearchReplacements()` built a regular expression from the
    search text without escaping it. Searching for `a.b` also matched `axb` and then wrote the
    text `undefined` into the result, and searching for `(` threw a `SyntaxError`. The search
    text is now matched as the literal text it is, an empty replacement map returns the text
    unchanged rather than matching at every position, and both functions validate their
    parameters as the rest of the module does.

  - ***The types an operator declares are now checked.*** Every operator has always declared
    which [ShortTypes](http://jsongin.liquicode.com/#/guides/jsongin/ShortType.md) it takes, as
    `ValueTypes` or `ArgTypes`, and the authoring guide has always said a value of any other
    type is rejected. Nothing read those declarations. `Query()`, `Evaluate()`, `Update()`, and
    `Aggregate()` now check the value against the declaration before dispatching.

    Turning the check on first meant correcting the declarations, which had drifted out of true
    precisely because nothing read them:
      - `$all` declared `o` while its own code required `a`, so enforcing it as written would
        have broken the operator outright.
      - `$ne` declared a narrower set than the `$eq` it negates, and `$eqx` a wider set than
        the `$nex` which negates it. A negation cannot accept a different set from what it
        negates.
      - `$expr` and `$exprx` declared `o` while passing anything to `Evaluate()`.
      - The arithmetic and logical expression operators declared `a` while also accepting a
        single operand written without the enclosing array, which is a documented form.
      - Seven accumulators omitted `d` from an otherwise complete set.
      - `$noop` ignores its value, so it now says it takes anything.

    An operator still validates its own value, because the engine's check only runs when the
    operator is reached through the engine, and an operator can be called directly.

  - The authoring guide was corrected alongside it: it listed `ValueTypes` for stage operators,
    which declare `ArgTypes`, and said to write `0` for a variable `ArgCount`, which is `null`.
    It now also states that `ArgTypes` describes the argument itself rather than the operands
    inside it, and that `ArgCount` is checked by the operator rather than by the engine.

  - The test suite grew from 989 to 1051 tests, and the uncovered blocks which
    `npm run coverage` reports fell from 172 to 155. Every fix above landed with tests, and
    `Parse` and `Distinct` are now fully covered. A duplicated copy of the `Parse` tests was
    removed from the `Format` test block.

- Documentation was brought up to date with this release:
  - Fixed three passages which did not work as written. The `OpLog` document initialized the
    library with `require( '@liquicode/jsongin' )( Settings )`, which has thrown since v0.0.19
    when the module's export became an instance rather than a factory. The `$currentDate`
    update operator was documented as taking the bare strings `'timestamp'` and `'date'`; it
    takes `{ $type: 'timestamp' }`, so the documented form silently did nothing. The browser
    guide linked to an UNPKG URL which serves a file browser page rather than the script.
  - Added pages for the functions which had none: `DeleteValue`, `CompareValues`, `AsBoolean`,
    `AsNumber`, `AsDate`, `BsonType`, `Clone`, `LooseEquals`, `StrictEquals`, and `IsQuery`.
  - Documented the `$expr` and `$exprx` query operators, which were added in this version but
    never written up in the [Query](http://jsongin.liquicode.com/#/guides/jsongin/Query.md) document.
  - Added an [Operator Authoring](http://jsongin.liquicode.com/#/guides/Operator-Authoring.md) guide, describing the
    operator contract and how to register one. Extensibility was an advertised feature with no
    document behind it.
  - Added a [Testing](http://jsongin.liquicode.com/#/guides/Testing.md) guide covering `npm test`, `npm run coverage`,
    and the driver harness which runs the same suite against a real MongoDB server.
  - Linked the `Merge` document, which existed but was unreachable from the sidebar, the
    library guide, and the readme.
  - Rewrote the `Merge` document for the behavior described below.
  - Added `npm run check-docs`, which asserts that every ` ```js ` block parses as Javascript,
    that every local link resolves, and that every page is reachable from another page.
    It runs as the last step of `build docs`, so any of those failing now halts the docs build
    and, through it, a release. It uses only Node's own modules and adds no dependency.
  - ***What goes inside a code fence is now code.*** A result is written as a comment rather
    than as a bare expression, e.g. `// merged matches doc`. `===` is kept only where it is
    literally true, which is scalars and booleans, and not for objects or arrays where
    reference equality does not hold. A block which is not Javascript — program output, the
    shape of a value, a method signature — no longer claims to be.
  - Fixed the defects that enforcing the above uncovered: the `Query` document named the
    equality operator `eq$` rather than `$eq` in its first three examples, omitted the colon
    between a field and its operator document in the `$or` example, declared an array of
    documents with braces, and gave four headline examples in the form
    `{ $gte: { id: 100 } }`. That last one is inverted — `$gte` is not a top level operator —
    so all four returned `false` where the document claimed `true`. They are now written
    `{ id: { $gte: 100 } }` and were verified against the library.
  - Fixed the documentation links. The site resolved links from the docs root while the files
    were written relative to each other, so roughly half of the cross-references were broken in
    any given context, the readme's own links included.
- ***Breaking***: `Merge( DocumentA, DocumentB )` now descends into a field only when ***both***
  documents hold a sub-document there. Every other value in `DocumentB` replaces the value in
  `DocumentA`. See the [Merge](http://jsongin.liquicode.com/#/guides/jsongin/Merge.md) document.
  `Merge` dispatched on Javascript's `typeof`, which reports `object` for arrays, dates,
  regular expressions, and `null` alike, so it walked all of them member-wise. That one mistake
  produced four separate defects:
  - An array in `DocumentB` was merged into `DocumentA`'s array ***by index*** rather than
    replacing it, so a shorter array could not narrow a longer one and an empty array could not
    clear one at all. `Merge( { tags: [ 'a', 'b', 'c' ] }, { tags: [ 'a' ] } )` returned all
    three tags. This is the case that matters for a defaults document, where an override has to
    be able to narrow a list and not only extend it.
  - A `Date` or `RegExp` in `DocumentB` was ***silently discarded***, leaving `DocumentA`'s
    value in place, because neither has any enumerable own properties to walk.
    `Merge( { w: dateA }, { w: dateB } )` returned `dateA`.
  - A value which changed type either threw or produced nonsense.
    `Merge( { a: 'c' }, { a: [ 'b' ] } )` threw a `TypeError`, and
    `Merge( { a: { x: 1 } }, { a: [ 1, 2 ] } )` returned `{ a: { '0': 1, '1': 2, x: 1 } }`.
  - `Merge` is now idempotent. Applying the same overrides twice gives the same result as
    applying them once, so settings can be layered without the result depending on how many
    times a layer was applied.
  This follows RFC 7386, JSON Merge Patch, with one deliberate difference: `null` is a value
  and sets the field to `null` rather than removing it. The RFC spends `null` on deletion
  because a merge patch has no other way to express removal; `jsongin` has `$unset` and
  `DeleteValue`. This also keeps `Merge` consistent with `ShortType()`, which gives `null` its
  own type `l`, and with `Diff()`, which reports a change to `null` as `$set`.
  ***`Merge` adds and overwrites fields, but never removes one.***
- ***Breaking***: `Merge( DocumentA, DocumentB )` now requires both parameters to be objects.
  A `null` or missing document is still treated as an empty one, so that
  `Merge( DEFAULTS, options )` works when no options were supplied, but any other type throws.
  Merging arrays at the top level is no longer supported.
  This also removes a falsiness test which treated a legitimate value as an absent one:
  `Merge( 0, { a: 1 } )` ignored the `0`. The parameters are checked with `ShortType()` now.
- ***Breaking***: `CompareValues( ValueA, ValueB )` now orders `NaN`, which it previously
  reported as ***equal to every number***. It compared numbers with `<` and then `>` and fell
  through to returning `0`. Every comparison against `NaN` is false, so `NaN` took that path.
  `NaN` now sorts below every other number and equal to itself, which is where MongoDB puts it.
  This is the same failure this version already repaired for missing fields: a value which
  compares equal to everything makes the ordering inconsistent, and one such value is enough to
  make the whole result arbitrary. `Sort( [ 3, NaN, 1, 2 ] )` returned `[ 3, NaN, 1, 2 ]`.
  It also repairs the expression comparison operators, where `{ $eq: [ 1, NaN ] }` was `true`.
- ***Breaking***: `StrictEquals( DocumentA, DocumentB )` is now symmetric.
  It called the `$eq` query operator, whose two parameters are not peers: the first is a
  document field and the second is a match value, and `$eq` lets a match value equal an
  ***element*** of a document array. That is correct for querying — `{ tags: [ 1, 2 ] }` should
  match a document whose `tags` holds `[ [ 1, 2 ], 'x' ]` — but an equality test must not depend
  on the order of its arguments. `StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] )` returned `true` while
  the reverse returned `false`.
  It now compares with `CompareValues()`, which is symmetric and reflexive.
  This also repairs `Diff( Before, After )`, which compares with `StrictEquals` and so reported
  an ***empty patch*** for two documents which differed, losing the change on a round trip.
  Note that the `$eq` query operator itself is unchanged. Its behavior is MongoDB's.
  One further difference: two equivalent regular expressions are now equal, where the reference
  comparison inherited from `$eq` reported `/a/` and `/a/` as different.
- Fixed `BsonType( Value, ReturnAlias )`, which reported `NaN`, `Infinity`, and `-Infinity` as
  `18` / `'long'`. None has a decimal point in its text and none is a safe integer, so
  classifying by text alone sent all three down the long branch. All three are `1` / `'double'`,
  which is what BSON calls them.
- ***Breaking***: the `$addToSet` update operator now compares values by ***content*** rather
  than by reference, so it is a set operation for every value and not only for primitives.
  It tested for membership with Javascript's `Array.includes()`, which compares objects,
  arrays, and dates by identity. A value of one of those types was therefore appended again on
  every call, no matter what it contained, and `$addToSet` was not idempotent.
  e.g. `Update( { a: [ { id: 1 } ] }, { $addToSet: { a: { id: 1 } } } )` returned
  `{ a: [ { id: 1 }, { id: 1 } ] }` and now returns `{ a: [ { id: 1 } ] }`.
  Comparison is by `CompareValues()`, so it remains type strict: `1` and `'1'` are different
  values, as are `0` and `false`, and two documents whose fields appear in a different order
  are different documents, which is what MongoDB does.
  `$addToSet` also stores a copy of the value now, rather than a reference to the one inside
  the update document, and a `Date` survives as a `Date`.
- Fixed `BsonType( Value, ReturnAlias )`, which threw whenever it was called as anything other
  than a method of the engine. It read the engine through `this` rather than through the
  instance it was built with, so detaching it or passing it as a callback threw a `TypeError`.
  e.g. `const BsonType = jsongin.BsonType; BsonType( 42 )` now returns `16`.
- Fixed `Text.SearchReplace( Text, Search, Replace, CaseSensitive )`, which had the same defect.
  It called its sibling `Text.SearchReplacements` through `this`, so it threw whenever it was
  called as anything other than a member of the `Text` object.
  The `Text` functions are now declared at module scope and call each other directly, so every
  one of them can be detached or passed as a callback.
  These two were the only places in `src` which reached for `this`.
- Added the `Evaluate( Document, Expression )` function, which evaluates a MongoDB aggregation
  expression against a document. See the [Evaluate](http://jsongin.liquicode.com/#/guides/jsongin/Evaluate.md) document.
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
  See the [Aggregate](http://jsongin.liquicode.com/#/guides/jsongin/Aggregate.md) document.
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
  already applies. See the [Diff](http://jsongin.liquicode.com/#/guides/jsongin/Diff.md) document.
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
  `Patch`. See the [Invert](http://jsongin.liquicode.com/#/guides/jsongin/Invert.md) document.
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
- ***Breaking***: fixed matching a regular expression against an array field, which required
  ***every*** element to match instead of any one of them. An array field matches when any one
  of its elements matches, which is what MongoDB does and what every other array comparison in
  `jsongin` already did. A single element array happened to work, so the defect only showed on
  arrays of two or more.
  e.g. `Query( { tags: [ 'staff', 'x' ] }, { tags: /^st/ } )` returned `false` and now returns
  `true`. Queries which relied on the old all-must-match behavior will match more documents.
- Fixed `Distinct( Documents, DistinctCriteria )`, which reported its failures to the `OpError`
  log under the name `Sort`.
- The `$set` aggregation stage now reports errors under its own name. It shares its
  implementation with `$addFields`, of which it is an alias, and was reporting
  `$addFields requires an object.` for a malformed `$set`.
- Added `npm run coverage`, which reports the parts of `src` that the test suite never executes.
  It uses Node's own coverage collector, so it adds no dependency.
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

