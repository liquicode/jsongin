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

  - ***The two browser globals are now one instance.*** The module published
    `window.liquicode.jsongin` by building a second engine, while the bundle publishes this
    module's export as `window.jsongin`. The Browser Usage document said the two were the same
    instance; they were not. Because the operator registries belong to an instance, an operator
    registered through one global was invisible through the other. The module now publishes its
    own export. Note that a browser only sees this once `dist/jsongin.min.js` is rebuilt.

  - ***`$push` and `$addToSet` now support their modifiers.*** Neither implemented `$each`, and
    neither rejected it: a modifier document was stored as a literal array element, so
    `{ $push: { a: { $each: [ 3, 4 ] } } }` appended the object `{ $each: [ 3, 4 ] }` rather
    than `3` and `4`. Valid MongoDB syntax silently corrupted the array.

    `$push` now supports `$each`, `$position`, `$sort`, and `$slice`, applied in the order
    MongoDB applies them, and `$addToSet` supports `$each`. A modifier written without `$each`
    is rejected, as MongoDB rejects it, and so is an unrecognized `$` field within a modifier
    document. The whole modifier document is checked before the first element is inserted, so
    a rejected modifier leaves the array untouched.

    A document with no `$each` is still a value rather than a modifier, so
    `{ $push: { a: { n: 1 } } }` appends `{ n: 1 }` as before.

    Both operators are no longer marked *(partially implemented)* in the Operator Reference.

  - Two published statements which were not true were corrected:
      - The Library Guide described `StrictEquals` as requiring values to match `===`. It is
        `CompareValues()` asked whether its result is zero, so two `Date` objects holding the
        same instant are equal, as are two equal regular expressions, and `null` equals a
        missing value. The `StrictEquals` page already described this correctly; only the
        one-line summary in the guide did not.
      - The Browser Usage document's claim about the two globals, described above, was made
        true by changing the code rather than the document.

    The readme's claim that "each MongoDB feature that is implemented here operates accurately
    and in accordance with MongoDB" was contradicted by `$push` and `$addToSet`. Rather than
    weaken the claim, those two were finished, so it stands. It now also points at the Operator
    Reference for which operators are implemented at all.

  - ***Breaking: `BsonType()` no longer reports a number as a `long`.*** It tested
    `Number.isSafeInteger()`, which is not an `int32` range test, so every safe integer was an
    `int` and everything above one was a `long`. A Javascript number is a double, and the BSON
    serializer stores it as an `int32` only when it is a whole number inside that range, so a
    number is never a `long`. It is now `int` between `-2147483648` and `2147483647`, and
    `double` everywhere else, including `NaN` and the infinities.

    Verified against MongoDB 6.0.1 by inserting each value and reading back `$type`: `42` and
    `2147483647` store as `int`, while `2147483648`, `3000000000`, and `9007199254740991` store
    as `double`. A `$type: 'long'` query matched none of them. The `$type` query operator is
    built directly on this, so `{ a: { $type: 'int' } }` and `{ a: { $type: 'double' } }` now
    select the same documents MongoDB selects.

  - ***Breaking: a field name which merely looks numeric is a field name again.*** `SplitPath()`
    converted a path element to a number whenever `AsNumber()` accepted it, and `AsNumber()`
    accepts `'01'`, `'1e2'`, `'0x10'`, and `'Infinity'`. A field in any of those forms became an
    array index, which made its data unreachable: `GetValue( { '01': 'x' }, '01' )` returned
    `undefined`, and `SetValue( {}, 'a.01', 'x' )` built `{ a: [ null, 'x' ] }`.

    Only canonical integer text now converts, which is `'0'`, `'7'`, and the documented negative
    index `'-1'`. MongoDB 6.0.1 resolves `'a.01'` as a field name and finds
    `{ a: { '01': 'x' } }`, and so does `jsongin` now. Array indexing and reverse indexing are
    unchanged.

  - `Flatten()` dropped empty objects and arrays, because an empty container holds no leaf to
    descend to, so `Flatten( { a: {}, b: [] } )` returned `{}` and the round trip through
    `Expand()` lost both fields. An empty container is now emitted as a value at its own path,
    and a new one rather than the one from the document, so the flattened result does not alias
    its source.

    Two round trip limitations which cannot be fixed this way are now documented rather than
    left to be discovered: a document which is itself an array expands back as an object, and an
    object whose keys are canonical integers expands back as an array. Dot notation paths do not
    record which of the two a container was, and `Flatten( { a: { '0': 'x' } } )` and
    `Flatten( { a: [ 'x' ] } )` produce identical results.

  - `$eq` and `$ne` compared two regular expressions with `===`, which is never true for
    distinct objects, so `{ a: { $eq: /ell/ } }` did not match `{ a: /ell/ }`. Regular
    expressions are now compared by their source and flags, the same trap dates already had a
    branch for.

    Note that `{ a: { $eq: /ell/ } }` still does ***not*** pattern match the string `'hello'`,
    while the implicit form `{ a: /ell/ }` does. That asymmetry is MongoDB's own, verified
    against MongoDB 6.0.1: the explicit form matches only a field which is itself that regular
    expression, and a regular expression is not even a legal argument to `$ne` there. Use
    `$regex` to pattern match.

  - ***Breaking: `DeleteValue()` reports whether it removed anything.*** It returned `true` for
    any path whose parent resolved, because the Javascript `delete` operator returns `true` for
    a property which was never there. Deleting a field which does not exist, a path into an
    array by field name, and an out of range array index all reported success while changing
    nothing. It now returns `false` when nothing was removed.

    `$unset` treats that as a successful no-op rather than a failure, which is what MongoDB
    reports: unsetting an absent field is an update with `modifiedCount` 0 and no error.

  - The `$query` query operator was removed. It was registered, returned `true` for any input
    regardless of its match value, and appeared in no document. `$query` was a MongoDB
    ***query modifier*** which wrapped a whole filter alongside `$orderby` and `$hint`,
    deprecated in MongoDB 3.2 and removed in 4.4 with the `OP_QUERY` wire protocol; it was never
    a field level operator, and this implementation did not do what the modifier did either.

    Because it was registered, `{ a: { $query: true } }` silently matched every document where
    an unrecognized operator returns `false`. `$noop` fills the same role, is documented, and
    works at the top level of a query where `$query` did not.

  - `Text.Matches()` validates its parameters as the rest of the module does. A non string
    pattern surfaced as a raw `TypeError` from `String.replace()` rather than as a described
    error.

  - ***Breaking: a path which reaches into an array by field name is no longer a write
    target.*** `GetValue`, `SetValue`, and `DeleteValue` all applied a non numeric key against
    an array to every element of that array. MongoDB does this for reads, and does not do it
    for writes: `{ $set: { 'a.x': 9 } }` against `{ a: [ { x: 1 }, { x: 2 } ] }` is rejected
    outright, and `{ $unset: { 'a.x': '' } }` modifies nothing. Reaching through an array there
    requires the all positional operator, `'a.$[].x'`.

    The write side is now off by default, behind the `PathExtensions` engine setting, which
    until now was declared and never read. `SetValue` throws and `DeleteValue` returns `false`,
    which is what makes `$set`, `$inc`, `$mul`, `$rename`, and `$unset` agree with MongoDB.
    Passing `{ PathExtensions: true }` to `NewJsongin()` restores the previous behavior.

    Reading is deliberately ***not*** gated, because MongoDB does traverse arrays when it
    resolves a query path. `GetValue( doc, 'users.id' )` and `{ 'users.id': 101 }` are
    unchanged.

    Three of the affected operators were corrupting data rather than merely differing: through
    an array, `$inc` wrote the string `"1,21"`, `$mul` wrote `null`, and `$rename` copied the
    gathered array into every element.

  - ***Breaking: `$min` and `$max` are no longer numeric operators.*** Both forced their operand
    through `AsNumber()` and rejected anything else, then compared with the raw `<` and `>`
    operators, which coerce. They now compare by the BSON ordering through `CompareValues()`,
    the same order `Sort()` uses, so strings, dates, booleans, and comparisons between
    different types all work:

        jsongin.Update( { s: 'xyz' }, { $min: { s: 'abc' } } );  // { s: 'abc' }
        jsongin.Update( { n: 5 }, { $max: { n: 'abc' } } );      // { n: 'abc' }
        jsongin.Update( { n: 5 }, { $min: { n: null } } );       // { n: null }

    A field which is not present is now set to the given value rather than left alone, since
    there is nothing to compare against. A field holding `null` is compared rather than treated
    as missing. Code which relied on either operator quietly doing nothing to a non numeric
    field will see it change.

    Measured against MongoDB 6.0.1, the two went from 14 of 26 cases matching to 26 of 26.
    `min.js` and `max.js` now share one implementation in `_minmax.js`, differing only in which
    direction of comparison replaces the value, following the `_arithmetic.js` and
    `_accumulator.js` helper convention.

  - ***A query path which crosses an array now means what it means in MongoDB.***
    Twelve measured divergences were closed, across `$eq`, `$ne`, `$not`, `$gt`, `$gte`,
    `$lt`, `$lte`, `$exists`, `$type`, `$size`, `$all`, `$regex`, and the implicit
    `{ field: value }` form.

    All of them had one cause. A path was resolved with `GetValue`, which returns a single
    value, and for a path crossing an array that value is every element's value gathered into
    one array. That gathered array is indistinguishable from a field which genuinely holds an
    array:

        { a: [ { x: 1 }, { x: 2 } ] }   at 'a.x' gathered to [ 1, 2 ]
        { a: [ { x: [ 1, 2 ] } ] }      at 'a.x' gathered to [ 1, 2 ] as well

    Every operator downstream saw the same shape for both and could not apply the right rule.
    `$size` shows the damage plainly: `{ 'a.x': { $size: 2 } }` matched the first document,
    whose `x` is not an array at all, and missed the second, whose `x` really is a two element
    array. One line producing both a false positive and a false negative.

    The new [`ResolveCandidates( Document, Path )`](http://jsongin.liquicode.com/#/guides/jsongin/ResolveCandidates.md)
    returns the ***list of values*** a path can mean instead of one gathered value. An array
    offers itself and each of its elements, one level deep; traversal happens at every path
    element, so two array levels work where one used to; and an array directly inside another
    is not descended into without an index. An operator matches when any candidate satisfies
    it. A missing field yields an empty list, which is what lets `$exists` tell it from a field
    holding `undefined`.

    `GetValue` is unchanged. It is a published function with its own documented behavior, and
    nothing here required changing it.

    Behavior changes worth calling out individually:

    - `$lt` and `$lte` had a ***false positive***. `{ 'a.x': { $lt: 'zzz' } }` matched a field
      holding `[ 5, 6 ]`, because comparing an array to a string in Javascript compares the
      text `'5,6'` to `'zzz'`. The range operators now compare only values of the same type,
      which is how MongoDB brackets them: `{ $gt: 1 }` never matches a string, however the BSON
      ordering ranks the two.
    - `$all` is no longer an array operator. MongoDB defines it as an AND of the given values,
      each tested as ordinary equality, which is why it works against a field that is not an
      array: `{ 'qty.num': { $all: [ 50 ] } }` selects a document whose `num` is `50`. An empty
      match array now selects nothing, as MongoDB does, rather than matching every array.
    - `$regex` handed the field to `RegExp.test()`, which converts whatever it is given to a
      string, so a field holding the regexp `/MongoDB/i` was tested as the text `'/MongoDB/i'`
      and matched the pattern `/MongoDB/`. The pattern now applies only to strings, and a field
      which is itself a regexp matches when its source and flags are the same. MongoDB matches
      a field holding `/MongoDB/` against `{ $regex: /MongoDB/ }` and does not match one
      holding `/MongoDB/i`.
    - `$exists` now reports a field holding `undefined` as ***present***. `GetValue` could not
      tell that from a missing field, since both read as `undefined`; a candidate list can.
      This follows `DeleteValue`, which removes a key rather than setting it to `undefined`
      precisely so the two states stay distinguishable, and it agrees with `Object.keys()` and
      the `in` operator. MongoDB has no say here, as BSON cannot store `undefined`.
    - `$type: 'array'` now finds an array field. It previously tested that field's elements and
      so never saw the array itself.

    `ImplicitEq` was a dispatch table over every pairing of the field's type with the match
    value's type, each array pairing carrying its own traversal. Those pairings collapse once
    equality resolves candidates, so it now only decides which operator the match value calls
    for. `$gt`, `$gte`, `$lt`, and `$lte` likewise share one implementation, differing in the
    comparison and in whether an equal value counts.

  - The test suite grew from 989 to 1172 tests, and the uncovered blocks which
    `npm run coverage` reports fell from 172 to 149. Every fix above landed with tests, and
    `Parse` and `Distinct` are now fully covered. A duplicated copy of the `Parse` tests was
    removed from the `Format` test block.

- ***Breaking***: `Sort( Documents, SortCriteria )` now builds a sort key by gathering candidates
  along the sort path, rather than by reducing the single value which `GetValue()` returns.
  A path which crosses an array reduces through every array level it crosses, so
  `{ a: [ { x: [ 0, 7 ] } ] }` sorted by `a.x` now sorts as `0` ascending and `7` descending.
  It previously stopped one level short, sorted by the whole `[ 0, 7 ]` array, and landed above
  every number because an array outranks one. `GetValue()` gathers the values along a path into
  one array which is indistinguishable from a field that genuinely holds an array, so sorting
  could not tell the two shapes apart. A field holding `[ [ 3, 4 ], [ 1, 2 ] ]` sorted by `v`
  crosses nothing, still expands one level only, and still sorts by `[ 1, 2 ]`.

  The empty array rule changed with it. It applies to a field which produces ***no*** sort key
  candidate at all, not to a sort key which happens to be an empty array. `{ v: [] }` still
  sorts below every value including `null` and below documents missing the field, but
  `{ v: [ [] ] }` now sorts by the array type rank, and `{ v: [ 3, [] ] }` now sorts above every
  number when descending, because the empty array wins the descending maximum. An empty array
  which the path merely crosses, as in `{ a: [] }` sorted by `a.x`, contributes `null` and sorts
  with the other nulls.

  Verified against MongoDB 6.0.1 across 30 orderings. The parity cases are kept at
  `test/Aggregate Tests/test-suite/Sort Parity Tests.js` and run against both `jsongin` and a
  live server. The `$sort` aggregation stage delegates to `Sort()` and inherits all of this.

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

