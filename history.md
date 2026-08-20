# @liquicode/jsongin


# Project History



v0.1.0 (current)
---------------------------------------------------------------------

Parity with MongoDB is ***100%*** across 841 compared behaviors: Query 230, Update 89,
  Projection 51, and Aggregate 471. Run `npm run parity-report` to measure it.

Coverage of the operator surface MongoDB documents is ***83.5%***, 212 operators of 254. Run
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
- The `PathExtensions` setting is gone.
  *Was: declared but never read by any released version, so nothing responds differently.*
- A field name which merely looks numeric is a field name again. Only canonical integer text
  such as `'0'` and `'7'` is an array index.
  *Was: `'01'`, `'1e2'`, `'0x10'`, and `'Infinity'` became array indexes, which made a field in
  any of those forms unreachable.*
- A path which reaches into an array by field name is no longer a write target. `SetValue()`
  throws and `DeleteValue()` returns `false`.
  *Was: applied the key to every element, which corrupted data through `$inc`, `$mul`, and
  `$rename`. Reading is unchanged and still traverses arrays.*
- Aggregation expressions and projections no longer index arrays. A field path applies every
  key to the array's elements, so `'$a.2'` gathers the field `2` from each one.
  *Was: `Evaluate( { a: [ 1, 2, 3 ] }, '$a.2' )` returned `3` and now returns `[]`. Use
  `$arrayElemAt` for position. Query paths are unchanged and still index.*


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


### Breaking — Projection and Aggregation

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
- The empty array rule applies to a field which produces ***no*** sort key at all, not to a sort
  key which happens to be an empty array. `{ v: [] }` still sorts below every value including
  `null`, but `{ v: [ [] ] }` sorts by the array type rank.


### Breaking — Engine Functions

- `Date` values have their own short type `d`. `ShortType( aDate )` returns `d` and
  `BsonType( aDate )` returns `9` / `'date'`.
  *Was: `o` and `3` / `'object'`. A `Date` has no enumerable own properties, so every function
  which walked it member-wise silently produced an empty object. Code which switches on these
  values is affected.*
- `BsonType()` no longer reports a number as a `long`. A number is `int` between `-2147483648`
  and `2147483647`, and `double` everywhere else, including `NaN` and the infinities.
  *Was: classified by `Number.isSafeInteger()`, which is not an int32 range test.*
- `CompareValues()` orders `NaN`, below every other number and equal to itself.
  *Was: reported as equal to every number, which made any ordering containing one arbitrary.*
- `StrictEquals()` is symmetric, comparing with `CompareValues()`.
  *Was: called the `$eq` query operator, whose two parameters are not peers, so
  `StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] )` and its reverse disagreed. This also repairs
  `Diff()`, which reported an empty patch for two documents which differed.*
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
- `DeleteValue()` reports whether it removed anything, returning `false` when nothing was
  removed.
  *Was: returned `true` for any path whose parent resolved, because the Javascript `delete`
  operator does. `$unset` treats that as a successful no-op, which is what MongoDB reports.*
- `OperatorType` and `ArgCount` were removed from every operator. Both were declared everywhere
  and read nowhere, and neither could make the engine refuse anything. An operator checks its
  own operand count.
- The two browser globals are one instance. The module publishes its own export rather than
  building a second engine.
  *Was: an operator registered through one global was invisible through the other. A browser
  sees this once `dist/jsongin.min.js` is rebuilt.*


### Added

- The 2 ***filling pipeline stages***, in `jsongin.StageOperators`: `$fill` and `$densify`. See
  [Stage Operators](./docs/guides/jsongin/Stage-Operators.md).
- ***`$fill` treats a null as a value which is not there***, which is unusual: almost everywhere
  else in this engine a null is a value and only a missing field is absent. It replaces both.
- ***A `$fill` method writes its field for every document***, even where it has nothing to
  write. A gap before the first observed value, or at either end of a `linear` series, becomes a
  `null` rather than staying missing. `linear` refuses a `sortBy` field holding repeated values,
  since the interpolation has nothing to advance along.
- ***An output field naming neither a `value` nor a `method` fills nothing***, and is accepted;
  naming both is refused. `partitionBy` takes a document rather than a path.
- ***`$densify` only ever adds documents.*** A value which does not sit on the series is kept
  where it is, so a step which skips over existing values leaves them alone. A date field
  requires a `unit` and a numeric field must not have one.
- ***`$redact` and `$documents` are not implemented***, and for two different reasons. `$redact`
  answers with `$$DESCEND`, `$$PRUNE`, or `$$KEEP`, and `Evaluate()` has no expression system
  variables; it is measured as a gap and becomes buildable with the same change that brings
  `$let` and `$map`. `$documents` is a source stage of a ***database-level*** aggregation, and
  `Aggregate()` always takes the documents it works on, so there is no position for it.
- The 2 ***bucketing pipeline stages***, in `jsongin.StageOperators`: `$bucket` and
  `$bucketAuto`. See [Stage Operators](./docs/guides/jsongin/Stage-Operators.md).
- ***Bucket ranges are half open.*** A value equal to a boundary belongs to the bucket above it,
  so `[ 0, 10, 20 ]` makes `0 <= n < 10` and `10 <= n < 20`. A value outside every bucket needs
  a `default` and throws without one.
- ***A bucket nothing fell into is left out entirely***, rather than reported with a count of
  zero, and so is the `default` bucket.
- ***`$bucketAuto` gives an odd document to the earlier bucket***, and never splits documents
  which share a value across a boundary, which is why fewer buckets than asked for can come
  back. A bucket's `_id` is a `{ min, max }` range rather than a single boundary.
- ***The two stages disagree about an empty `output`***, and that is reproduced rather than
  tidied: `$bucket` takes it literally and answers the `_id` alone, while `$bucketAuto` reads it
  as no output at all and falls back to counting.

- The 6 ***reshaping pipeline stages***, in `jsongin.StageOperators`: `$unset`, `$replaceRoot`,
  `$replaceWith`, `$sortByCount`, `$sample`, and `$facet`. See
  [Stage Operators](./docs/guides/jsongin/Stage-Operators.md).
- ***`$unset` takes a path and `$unsetField` takes a name***, which is the same distinction the
  object expression operators draw. The stage removes `'sub.q'` by stepping into `sub`; the
  expression operator removes a field literally called `sub.q`. `$unset` now carries three
  meanings — an update operator, a pipeline stage, and `$unsetField` as the expression form.
- ***`$replaceRoot` and `$replaceWith` fail the pipeline*** when the new root is missing or is
  not a document, rather than dropping that document, which is why `$ifNull` is the usual guard.
  `_id` does not survive either stage unless the new root carries one.
- ***`$replaceWith` takes any expression and only the result has to be a document***, so over an
  empty stream there is nothing for it to object to. `$replaceRoot` is refused up front when its
  argument document is malformed, because that is wrong whatever flows through.
- ***`$sortByCount` takes a narrower argument than an expression***: a `$`-prefixed path or a
  document naming an operator. `{ $sortByCount: { team: 1 } }` is refused rather than gathering
  every document under one key, which is what a plain `$group` would do with it.
- ***`$sample` truncates a fractional size*** rather than refusing it, unlike the N accumulators,
  which require a whole number. It draws without replacement, and the order of the result is not
  specified.
- ***Every `$facet` branch is given the whole input***, not what another branch left behind, and
  the stage emits exactly one document however many went in.
- The 11 ***remaining accumulators***, in `jsongin.AccumulatorOperators`: `$stdDevPop`,
  `$stdDevSamp`, `$mergeObjects`, `$firstN`, `$lastN`, `$minN`, `$maxN`, `$top`, `$bottom`,
  `$topN`, and `$bottomN`. See
  [Accumulator Operators](./docs/guides/jsongin/Accumulator-Operators.md).
- ***Three kinds of accumulator now read a group three different ways***, and the difference
  decides what they answer. `$first`, `$last`, `$firstN`, and `$lastN` are ***positional***:
  they read the group in the order it arrived, so they depend on a `$sort` earlier in the
  pipeline, and they report a missing value as a null. `$min`, `$max`, `$minN`, and `$maxN` are
  ***comparative***: they ignore the order entirely and leave a null or missing value out,
  having nothing to compare it with. `$top`, `$bottom`, `$topN`, and `$bottomN` are ***ranked***:
  they carry a `sortBy` of their own, and they are the only accumulators which can sort by one
  field and answer with another.
- ***`$maxN` counts down.*** It returns its values in descending order, making it the mirror of
  `$minN` rather than a sorted list of the same values, so the first element of either result is
  the most extreme one. `$bottomN` does not mirror `$topN` the same way: it returns its values in
  `sortBy` order rather than reversed.
- ***`$stdDevSamp` answers a single value with `null`*** where `$stdDevPop` answers `0`, which
  follows from the divisor: a population of one has no spread, and a sample of one cannot say
  what the spread is. Both ignore non-numeric values, the rule `$sum` and `$avg` already follow.
- ***An empty `sortBy` is accepted rather than refused.*** A specification naming no field sorts
  nothing, so the operator still answers — it just answers something the sort had no say in.
- `$median` and `$percentile` are ***not*** implemented. They were introduced in MongoDB 7.0 and
  the parity baseline is a 6.0.1 server which refuses them, so there is nothing to measure an
  implementation against. The parity suite records that refusal so the boundary is measured
  rather than remembered. `$accumulator`, which runs custom Javascript, remains out of scope.
- The 5 ***object expression operators***, in `jsongin.ExpressionOperators`: `$mergeObjects`,
  `$objectToArray`, `$getField`, `$setField`, and `$unsetField`. See
  [Object Operators](./docs/guides/jsongin/Expression-Operators.md).
- ***`$getField`, `$setField`, and `$unsetField` name a field rather than a path***, and a dot
  in that name is part of the name: `{ field: 'a.b' }` means a field literally called `a.b` and
  not the `b` of the `a`. That is the reason the three exist, since no dotted-path syntax can
  reach such a field. The name must be a ***constant***, written as a string or as a
  `$literal`; a computed name is refused however simple it is. A name beginning with a `$` is
  written `{ field: { $literal: '$price' } }`, since a bare `'$price'` is a field reference.
- ***The shorthand forms are not supported.*** `{ $getField: 'name' }` reads the field from
  `$$CURRENT` and `{ $setField: { ..., value: '$$REMOVE' } }` removes it, and both need an
  expression variable scope which `Evaluate()` does not have. Both are refused by name rather
  than read as something else. Write the `input` out, and use `$unsetField` to remove.
- ***A null input and a missing one part company in `$getField`***, which they do almost
  nowhere else in the expression language: a null answers null, while a missing input — or an
  array, or a number — answers no value at all, so the field is left out of the result.
  `$setField` and `$unsetField` answer either one with a null, and refuse any other
  non-document.
- ***`$mergeObjects` ignores a null or missing operand*** rather than making the result null,
  and answers no operands at all with an empty document, which is what makes it safe to fold
  over documents that may not all be there. The merge is ***one level deep***: a shared field
  holding a document is replaced whole rather than merged into.
- ***Field order is preserved by all five.*** An overwritten or replaced field keeps its
  original position and a new one is appended, which is observable because a document is
  compared field by field in the order it holds them.
- `$objectToArray` returns `{ k, v }` pairs ***in the order the document holds its fields***,
  not sorted, which makes it the inverse of `$arrayToObject`.
- The 14 ***array expression operators which bind no variables***, in
  `jsongin.ExpressionOperators`: `$isArray`, `$reverseArray`, `$range`, `$indexOfArray`,
  `$slice`, `$sortArray`, `$zip`, `$arrayToObject`, `$first`, `$last`, `$firstN`, `$lastN`,
  `$minN`, and `$maxN`. See [Array Operators](./docs/guides/jsongin/Expression-Operators.md).
  `$map`, `$filter`, and `$reduce` are still missing: each binds a variable over the elements
  of an array, and `Evaluate()` has no variable scope to bind one in.
- ***`$slice` and the projection `$slice` are two operators sharing a name, and the stage
  decides which.*** Inside a `$project` stage there is no projection operator called `$slice`:
  the name is the expression operator, so `{ $project: { t: { $slice: 2 } } }` is refused for
  having only one operand, exactly as MongoDB refuses it. The projection form still applies in
  a projection handed to `Project()` or to a find. ***This is a fix***: the projection form
  used to shadow the expression form everywhere, so the expression `$slice` could not be
  reached from a pipeline at all.
- `$first` and `$last` now exist as ***expression*** operators as well as accumulators. Which
  one applies is decided by where it is written.
- ***`$firstN`, `$lastN`, `$minN`, and `$maxN` refuse a null input***, where most of the array
  family propagates one. `$zip` requires its `inputs` to be written as an array rather than as
  an expression which produces one. Both are MongoDB's behavior.
- The 7 ***set expression operators***, in `jsongin.ExpressionOperators`: `$setEquals`,
  `$setIsSubset`, `$setUnion`, `$setIntersection`, `$setDifference`, `$allElementsTrue`, and
  `$anyElementTrue`. See [Set Operators](./docs/guides/jsongin/Expression-Operators.md).
- ***These read an array as a set***, so order stops mattering and repeats stop counting:
  `[ 1, 1, 2 ]` and `[ 2, 1 ]` are the same set. Elements are compared by content, the same way
  `$eq` and `Sort()` compare, so two documents are the same element when their contents are —
  though `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` are not, because a document is compared field by
  field in the order it holds them.
- ***A set is returned in BSON order***, not in the order its elements were written, since a
  set has no order of its own.
- ***The family disagrees with itself about a null operand, and that is reproduced.***
  `$setUnion`, `$setIntersection`, and `$setDifference` answer a null with a null, while
  `$setEquals`, `$setIsSubset`, `$allElementsTrue`, and `$anyElementTrue` refuse one.
- The 21 ***date expression operators***, in `jsongin.ExpressionOperators`: `$year`, `$month`,
  `$dayOfMonth`, `$dayOfWeek`, `$dayOfYear`, `$hour`, `$minute`, `$second`, `$millisecond`,
  `$week`, `$isoWeek`, `$isoDayOfWeek`, `$isoWeekYear`, `$dateToParts`, `$dateFromParts`,
  `$dateToString`, `$dateFromString`, `$dateAdd`, `$dateSubtract`, `$dateDiff`, and
  `$dateTrunc`. See [Date Operators](./docs/guides/jsongin/Expression-Operators.md).
- ***Every one of them reads a date in UTC unless given a `timezone`.*** Javascript's
  `getFullYear()` and its relatives read a date in the machine's own zone, which would make the
  same stored document answer differently on a laptop in New York than on a server in London.
  A `timezone` is either an IANA zone name such as `'America/New_York'` or an offset such as
  `'+05:30'`. A null `timezone` is not the same as no `timezone`: leaving it out means UTC, and
  writing `null` makes the whole result null.
- ***The ISO 8601 week operators do not agree with the calendar ones, on purpose.*** `$week`
  begins its weeks on Sunday and calls the days before the year's first Sunday week 0, while
  `$isoWeek` begins on Monday and puts a week entirely in the year holding its Thursday. So
  `2021-01-01` is week 53 of ***2020*** by `$isoWeek` and `$isoWeekYear`, and week 0 of 2021
  by `$week`.
- ***`$dateAdd` and `$dateSubtract` add calendar units to the calendar***, not as a length of
  time, and a day of the month which the target month does not have is pulled back to the last
  day it does: the 31st of January plus one month is the 28th or 29th of February.
- ***`$dateDiff` counts boundaries crossed, not elapsed time.*** One second before midnight to
  one second after is one day.
- The 4 ***bitwise query operators***, in `jsongin.QueryOperators`: `$bitsAllSet`,
  `$bitsAllClear`, `$bitsAnySet`, and `$bitsAnyClear`. The bits are given either as a bitmask
  or as an array of bit positions. ***The arithmetic is done in `BigInt`***, so a position
  beyond the 32nd is not lost and a negative field is read as two's complement.
  See [Bitwise Operators](./docs/guides/jsongin/Query-Operators.md).
- The ***query `$mod`***, which takes `[ divisor, remainder ]` and matches. This is not the
  expression `$mod`, which shares the name and returns a remainder instead.
- `$comment` and `$sampleRate`, in `jsongin.QueryOperators`. A `$comment` selects everything,
  and `$sampleRate` selects a random fraction: 0 selects nothing, 1 selects everything.
- `$rand`, in `jsongin.ExpressionOperators`. ***It is an expression and not a query operator***,
  as it is in MongoDB, so a criteria reaches it through `$expr`:
  `{ $expr: { $lt: [ { $rand: {} }, 0.5 ] } }`.
- `$binarySize` and `$bsonSize`, in `jsongin.ExpressionOperators`. `$bsonSize` counts what a
  document would occupy once encoded, following the encoding's own arithmetic, and an array is
  counted as a document whose keys are `'0'`, `'1'`, and so on.
- The ***`$bit` update operator***, in `jsongin.UpdateOperators`, with `and`, `or`, and `xor`.
  A field which is not there counts as a zero, as it does for `$inc`. A field holding a
  fractional number or anything which is not a number is refused rather than coerced.
- The 9 ***type expression operators***, in `jsongin.ExpressionOperators`: `$type`,
  `$isNumber`, `$convert`, `$toString`, `$toBool`, `$toDate`, `$toInt`, `$toLong`, and
  `$toDouble`. See [Type Operators](./docs/guides/jsongin/Expression-Operators.md).
- ***These follow MongoDB's conversion rules, not Javascript's***, which disagree more often
  than they agree. A numeric string must be numeric in its entirety, so `' 5'` and `''` are
  refused where `Number()` reads them as `5` and `0`. Every string converts to `true`,
  including the empty one. `$toInt` truncates a fractional number but refuses a fractional
  string. A date string carrying no time zone is read as ***UTC***, where `Date.parse()` would
  read it as local time and give a different instant on every machine.
- `$convert` adds `onError` and `onNull`, which the `$toX` shorthands cannot express. A null
  input takes the `onNull` path even when an `onError` is also given, and a `to` which names no
  type throws rather than being caught by `onError`.
- ***One boundary is worth knowing before relying on `$type`.*** MongoDB has `int`, `long`, and
  `double` as separate BSON types and tags a converted number with the one it was converted to,
  so `{ $type: { $toLong: 42 } }` is `'long'` there and `'int'` here. jsongin holds JSON, which
  has one number kind, and reports a number's type from its value. The converted values agree
  in every case; only what `$type` says about a number afterwards differs. `$toDecimal` and
  `$toObjectId` are absent for the same reason.
- The 15 ***trigonometry expression operators***, in `jsongin.ExpressionOperators`: `$sin`,
  `$cos`, `$tan`, `$asin`, `$acos`, `$atan`, `$atan2`, `$sinh`, `$cosh`, `$tanh`, `$asinh`,
  `$acosh`, `$atanh`, `$degreesToRadians`, and `$radiansToDegrees`.
  See [Trigonometry Operators](./docs/guides/jsongin/Expression-Operators.md).
- 6 more ***arithmetic expression operators***: `$sqrt`, `$pow`, `$exp`, `$ln`, `$log`, and
  `$log10`.
- ***Each of the 21 has a domain, and an operand outside it throws.*** `$sqrt` refuses a
  negative, `$asin` and `$acos` refuse anything beyond -1 through 1, `$acosh` refuses anything
  below 1, and `$sin`, `$cos`, and `$tan` refuse an infinite angle. Two boundaries return an
  infinity instead of throwing: `$atanh` at -1 and 1, and `$exp` on overflow.
- ***The logarithms refuse zero***, where Javascript's `Math.log( 0 )` answers `-Infinity`.
  This is MongoDB's behavior and the one place in the family where the operator is not simply
  the `Math` function underneath.
- The 20 ***string expression operators***, in `jsongin.ExpressionOperators`: `$concat`,
  `$split`, `$toLower`, `$toUpper`, `$strcasecmp`, `$trim`, `$ltrim`, `$rtrim`, `$substr`,
  `$substrBytes`, `$substrCP`, `$strLenBytes`, `$strLenCP`, `$indexOfBytes`, `$indexOfCP`,
  `$regexMatch`, `$regexFind`, `$regexFindAll`, `$replaceOne`, and `$replaceAll`.
  See [String Operators](./docs/guides/jsongin/Expression-Operators.md).
- ***The string family's operand rules are MongoDB's, inconsistencies included.*** A null makes
  the result null in most of them, is read as an empty string in `$toLower`, `$toUpper`,
  `$strcasecmp` and the three substring operators, and is refused by `$strLenBytes` and
  `$strLenCP`. The operators which predate MongoDB 3.4 also render a number where the newer
  ones refuse it. None of this was made consistent, because a query written against MongoDB has
  to mean the same thing here.
- ***Byte forms and code point forms are genuinely different.*** `$substrBytes`,
  `$strLenBytes`, and `$indexOfBytes` count UTF-8 bytes; `$substrCP`, `$strLenCP`, and
  `$indexOfCP` count characters. A byte range which starts or ends inside a character is
  refused, since those bytes do not spell a string.
- `npm run api-coverage`, which reports how much of the documented operator surface is
  implemented, per section. It reads `docs/guides/Operator-Reference.md` and needs no server.
- `Aggregate( Documents, Pipeline )`, which runs an array of documents through a MongoDB
  aggregation pipeline.
- 10 pipeline stages, in `jsongin.StageOperators`: `$match`, `$project`, `$addFields`, `$set`,
  `$unwind`, `$group`, `$sort`, `$limit`, `$skip`, and `$count`. As in MongoDB, `$set` is an
  alias of `$addFields`, and the `$count` stage produces no document at all for an empty stream.
- 9 accumulators, in `jsongin.AccumulatorOperators`: `$sum`, `$avg`, `$min`, `$max`, `$count`,
  `$push`, `$first`, `$last`, and `$addToSet`. `$sum` and `$avg` ignore non-numeric values
  rather than throwing, which is what MongoDB does and is deliberately unlike `$add`. The order
  of the `$addToSet` result is not specified.
- `Evaluate( Document, Expression )`, which evaluates a MongoDB aggregation expression against
  a document.
- 30 expression operators, in `jsongin.ExpressionOperators`: `$literal`, `$add`, `$subtract`,
  `$multiply`, `$divide`, `$mod`, `$abs`, `$ceil`, `$floor`, `$round`, `$trunc`, `$min`, `$max`,
  `$size`, `$arrayElemAt`, `$concatArrays`, `$in`, `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`,
  `$cmp`, `$and`, `$or`, `$not`, `$cond`, `$ifNull`, and `$switch`.
  - `$round` rounds ***half to even***, so `{ $round: [ 2.5 ] }` is `2` while
    `{ $round: [ 3.5 ] }` is `4`, which is what MongoDB does and not what `Math.round()` does.
    `$round` and `$trunc` take an optional decimal place, which may be negative.
  - `$arrayElemAt` is the only way to index an array in an expression. A negative position
    counts back from the end there, because it is an operand rather than a path element.
  - The expression `$in` takes the value first and the array second, which is the reverse of the
    query operator of the same name, and compares by content.
- The `$expr` query operator, which compares one document field to another.
  e.g. `Query( entity, { $expr: { $gt: [ '$dmg', '$armor' ] } } )`
- The `$exprx` query operator, a `jsongin` extension of `$expr` which may also appear within a
  field of a query, where it evaluates against the sub-document found there.
- `Diff( Before, After )`, which describes the changes between two documents as an update
  document. Arrays are atomic, key order is ignored, and a field changed to `null` is `$set`.
  e.g. `Diff( { hp: 10, n: 1 }, { hp: 7 } )` returns `{ $set: { hp: 7 }, $unset: { n: '' } }`
- `Invert( Before, Patch )`, which returns the update document that undoes `Patch`. It inverts
  any update document, not only the `$set` and `$unset` which `Diff` writes.
- `ResolveCandidates( Document, Path )`, which returns the list of values a path can mean rather
  than one gathered value. It takes an optional `ExpandArrays` parameter.
- `DeleteValue( Document, Path )`, which removes the field at a document path.
- `CompareValues( ValueA, ValueB )`, which compares two values using MongoDB's comparison order
  and returns `-1`, `0`, or `1`.
- `AsBoolean( Value )`.
- `Project()` supports computed fields. A projection field whose value is neither `1`/`true` nor
  `0`/`false` is an expression, evaluated against the document. Such a projection is an
  inclusion, as it is in MongoDB. `Project()` also accepts `true` and `false` in place of `1`
  and `0`.
  e.g. `Project( entity, { net: { $subtract: [ '$dmg', '$armor' ] } } )`
- The projection operators `$slice` and `$elemMatch`. `$slice` does not make a projection an
  inclusion, which is what lets it sit beside exclusions, while `$elemMatch` does. `$slice`
  accepts a count or a `[ skip, limit ]` pair, and leaves a field which is not an array alone.
- `$push` and `$addToSet` support their modifiers. `$push` takes `$each`, `$position`, `$sort`,
  and `$slice`, applied in the order MongoDB applies them, and `$addToSet` takes `$each`. The
  whole modifier document is checked before the first element is inserted.
- `$regex` accepts `$options`, including MongoDB's `x` mode, which ignores unescaped whitespace
  in a pattern and everything from an unescaped `#` to the end of the line. An escaped space and
  whitespace inside a character class are left alone.
  e.g. `Query( { s: 'ab' }, { s: { $regex: 'a b # a note\n', $options: 'x' } } )` is `true`
- `SetValue()` takes an optional `CreateArrays` parameter.
- `npm run coverage`, which reports the parts of `src` the test suite never executes.
- `npm run check-docs`, which asserts that every code fence parses as Javascript, that every
  local link resolves, that every page is reachable, and that every operator carries a
  documentation block. It runs as the last step of `build docs`.
- `npm run parity-report`, which runs the same suites against `jsongin` and a live MongoDB
  server and reports where the two disagree.
- Documentation pages for the functions which had none, an Operator Authoring guide, and a
  Testing guide.


### Fixed

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
- The `$set` stage reports errors under its own name rather than under `$addFields`.
- The types an operator declares, as `ValueTypes` or `ArgTypes`, are checked by `Query()`,
  `Evaluate()`, `Update()`, and `Aggregate()` before dispatching. Nothing read them before.
- `$group` emits its groups in the order they were first seen. MongoDB does not guarantee an
  order here; `jsongin`'s is deterministic so that a pipeline result is testable.
- `Aggregate()` never modifies the array it is given, nor the documents within it. Dates survive
  a pipeline as dates.
- Every operator carries a documentation block, which `check-docs` enforces.
- Three documented passages which did not work as written, and the documentation links, roughly
  half of which were broken in any given context.
- `src/jsongin/Path/` no longer ships. It held three unfinished sketches which were registered
  on no engine and required from nowhere, but reached every consumer of the package.


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

