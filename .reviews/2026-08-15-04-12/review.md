# @liquicode/jsongin — Codebase Review

> Reviewed: 2026-08-15
> Version: 0.1.0 (commit a1fd7b1, branch main, clean tree)
> Scope: parity, consistency, conciseness, test coverage, documentation coverage

Every finding below was reproduced against the working tree. Output is quoted verbatim.

MongoDB behavior is stated from the documented and well established semantics of the query,
  update, projection, and aggregation languages. Where a case is genuinely ambiguous it is
  marked as needing a live sweep rather than asserted.


## Baseline

| Check | Result |
|-------|--------|
| `npm test` | 1212 passing |
| `node build/docs-check.js` | 316 js fences, 271 local links, 53 pages — passed |
| `node build/coverage.js` | 108 source files exercised, 46 fully covered, 161 uncovered blocks |
| Registered operators | 75 (24 query, 22 expression, 12 update, 9 stage, 8 accumulator) |
| Operators absent from `Operator-Reference.md` | 0 |
| Operators marked `Yes` in the reference but not registered | 0 |
| `dist/jsongin.min.js` | current (built 2026-08-15, carries `Aggregate` and `ResolveCandidates`) |

The 2026-08-14 review's findings are, with two exceptions, fixed and verified fixed. `C1`–`C5`,
  `C7`, `C10`–`C14`, `S1`–`S6`, `S9`–`S13`, and `P1`–`P4` all reproduce clean now. `S8` (the
  unregistered `Path/` modules) and `S11` (uneven `/*md` blocks) are still open and reappear
  below.

The `ResolveCandidates` migration is the substantial piece of work since that review, and it is
  good work. The findings below are largely about the operators that migration has not reached
  yet, and about the metadata and documentation that did not move with it.


---

## 1. Parity

### P1 — `$inc` and `$mul` write `NaN` into a missing field, and never check the field's type

`src/Operators/Update/Field/inc.js:31-39`, `src/Operators/Update/Field/mul.js:24-32`

```js
let value = jsongin.GetValue( Document, field );   // undefined when the field is absent
let inc = jsongin.AsNumber( UpdateFields[ field ] );
value += inc;                                      // undefined + 5  =>  NaN
```

The operand is validated. The stored value never is.

```
Update( {},                 { $inc: { a: 5 } } )   => { a: NaN }     MongoDB: { a: 5 }
Update( {},                 { $mul: { a: 5 } } )   => { a: NaN }     MongoDB: { a: 0 }
Update( {},                 { $inc: { 'x.y': 5 } } ) => { x: { y: NaN } }   MongoDB: { x: { y: 5 } }
Update( { a: 'str' },       { $inc: { a: 1 } } )   => { a: 'str1' }  MongoDB: error
Update( { a: true },        { $inc: { a: 1 } } )   => { a: 2 }       MongoDB: error
Update( { a: new Date(0) }, { $inc: { a: 1 } } )   => { a: 'Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)1' }
Update( { a: 1 },           { $inc: { a: '5' } } ) => { a: 6 }       MongoDB: error
```

Incrementing a field that is not there is the single most common `$inc` in real use — it is how
  a counter is created. It currently poisons the document with a `NaN`, which then serializes to
  `null` through `JSON.stringify` and is unrecoverable.

This is the last unmigrated pair in `Update/Field/`. `$min` and `$max` were rebuilt onto
  `_minmax.js` and `CompareValues` in commit `1677ecc` and are correct in every case tested:

```
Update( {},          { $min: { a: 5 } } )  => { a: 5 }      correct
Update( { a: null }, { $min: { a: 5 } } )  => { a: null }   correct
Update( { a: 5 },    { $max: { a: 'str' } } ) => { a: 'str' }   correct, BSON order
```

`$inc` and `$mul` were left on the old model. See also **R2**.

### P2 — `$in` and `$nin` were never migrated to the candidate model

`src/Operators/Query/Comparison/in.js:21,54`

`$in` is the only comparison query operator still calling `GetValue` and still carrying its own
  hand rolled equality (`array.includes( value )`, which is `===`). Every other one now resolves
  candidates and compares through `$eq`.

```
Query( { a: { x: 1 } },       { a: { $in: [ { x: 1 } ] } } )    => false   MongoDB: true
Query( { a: [ 1, 2 ] },       { a: { $in: [ [ 1, 2 ] ] } } )    => false   MongoDB: true
Query( { a: [ [ 1 ] ] },      { a: { $in: [ [ 1 ] ] } } )       => false   MongoDB: true
Query( { b: 1 },              { a: { $in: [ null ] } } )        => false   MongoDB: true
Query( { b: 1 },              { a: { $nin: [ null ] } } )       => true    MongoDB: false
Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $in: [ 5 ] } } )  => false   MongoDB: true
Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $in: [ [ 5, 6 ] ] } } ) => false   MongoDB: true
```

Two of these are ordinary usage, not edge cases: `$in` against a list of sub-documents, and
  `$in: [ null ]` as the idiom for "missing or null".

`$all` shows what the fix looks like — it delegates each match value to `$eq` and inherits the
  candidate semantics for free (`all.js:53-66`), and every `$all` case tested is correct. `$in`
  is the same operator with `OR` instead of `AND` between the values.

### P3 — `$regex` does not implement `$options`

`src/Operators/Query/Evaluation/regex.js`

`$options` appears nowhere in `src/`, `test/`, or `docs/`. It is not merely unsupported: because
  it is not a registered operator, `Query()` falls through to the implicit-`$eq` branch
  (`Query.js:84-99`) and tests the field `a.$options` against the string, which fails, taking the
  whole query with it.

```
Query( { a: 'FOO' }, { a: { $regex: 'foo', $options: 'i' } } )  => false   MongoDB: true
```

So the query returns `false` rather than reporting anything. `Operator-Reference.md:44` marks
  `$regex` as fully supported with no qualification.

### P4 — `$regex` is stateful across documents when the pattern carries the `g` flag

`src/Operators/Query/Evaluation/regex.js:47`

`RegExp.test()` advances `lastIndex` on a global pattern, and the caller's `RegExp` object is
  used directly rather than being rebuilt.

```js
let documents = [ { a: 'xx' }, { a: 'xx' }, { a: 'xx' }, { a: 'xx' } ];
jsongin.Filter( documents, { a: /x/g } ).length      // => 3, expected 4

let re = /x/g;
jsongin.Query( { a: 'xx' }, { a: re } )   // true
jsongin.Query( { a: 'xx' }, { a: re } )   // true
jsongin.Query( { a: 'xx' }, { a: re } )   // false
```

The same identical document matches or does not depending on how many documents preceded it. A
  string pattern is already rebuilt with `new RegExp( pattern )` on line 34; a `RegExp` object
  needs the same treatment, or `lastIndex` needs resetting before each `test()`.

`$in` has the same construction at `in.js:38`.

### P5 — `Project()` with an empty projection returns an empty document

`src/jsongin/Project.js:207-212`

An empty projection object leaves `projection_type` at `'include'` with nothing to include.

```
Project( { a: 1, b: 2 }, {} )        => {}              MongoDB: { a: 1, b: 2 }
Project( { _id: 9, a: 1 }, { _id: 0 } ) => { a: 1 }     correct
Project( { _id: 9, a: 1 }, { _id: 1 } ) => { _id: 9 }   correct
```

The `{ _id: 0 }` case is already handled by switching to `'exclude'`, so the fix is the same
  switch when the projection has no keys at all.

Note that the aggregation `$project` stage has the opposite rule — MongoDB rejects an empty
  specification there — so this should be fixed in `Project()` without also making
  `[ { $project: {} } ]` legal.

### P6 — `$not` is accepted at the top level of a query

`src/Operators/Query/Logical/not.js:12` declares `TopLevel: true`.

MongoDB's top level operators are `$and`, `$or`, `$nor`, `$expr`, `$text`, `$where`, `$comment`,
  and `$jsonSchema`. `$not` is not among them; `{ $not: { ... } }` is rejected with "unknown top
  level operator".

```
Query( { a: 1 }, { $not: { a: 2 } } )   => true    MongoDB: error
```

`Query.js:44-51` already has the machinery to reject this. The flag is simply set wrong.

### P7 — `$exists` rejects the non-boolean values MongoDB accepts

`src/Operators/Query/Element/exists.js:13` (`ValueTypes: 'b'`) and the operator's own check at
  line 22.

```
Query( { a: 1 }, { a: { $exists: 1 } } )   => false   MongoDB: true
Query( { b: 1 }, { a: { $exists: 0 } } )   => false   MongoDB: true
```

MongoDB coerces the value to a boolean. This is a deviation introduced *by* the `ValueTypes`
  enforcement added for the previous review's `S1` — the declared type is narrower than
  MongoDB's. Worth a pass over every `ValueTypes` string asking the same question, since
  enforcement turned them from documentation into behavior.

### P8 — `$elemMatch` was not migrated and misses through a real array field

`src/Operators/Query/Array/elemMatch.js:21`

Still on `GetValue`, which gathers a path crossing an array into one array and loses the
  distinction the candidate list exists to preserve.

```
Query( { a: [ { b: [ 1, 2 ] } ] }, { 'a.b': { $elemMatch: { $gt: 1 } } } )  => false   MongoDB: true
Query( { a: [ { b: [ 1 ] }, { b: [ 9 ] } ] }, { 'a.b': { $elemMatch: { $gt: 5 } } } )  => true   correct
```

This is exactly the `$size` failure described in `ResolveCandidates.js:14-16`, in a different
  operator.

One related case should be settled against a live server rather than assumed —
  `Query( { a: [ [ { x: 1 } ] ] }, { a: { $elemMatch: { x: 1 } } } )` returns `true` here, and
  whether MongoDB descends into an array element that is itself an array in this position is
  not something to decide from memory.

### P9 — `Update()` accepts an update document it cannot apply, and says nothing

`src/jsongin/Update.js:53-56`

```
Update( { a: 1 }, { $bogus: { a: 2 } } )            => { a: 1 }   MongoDB: error
Update( { a: 1 }, { a: 2 } )                        => { a: 1 }   MongoDB: error (or replacement)
Update( { a: 1 }, { $set: { a: 2 }, $inc: { a: 1 } } ) => { a: 3 }   MongoDB: error, conflicting paths
```

An unknown operator writes to the `OpLog` and is skipped. The caller receives a clone of the
  original document, indistinguishable from a legitimate no-op, and `Update()` reserves `null`
  for parameter errors only. A typo in an operator name is silently a no-op.

### P10 — deep equality is `JSON.stringify` and is lossy

`src/Operators/Query/Comparison/eq.js:46,53`

```
Query( { a: { d: new Date( 0 ) } }, { a: { $eq: { d: '1970-01-01T00:00:00.000Z' } } } )
=> true    MongoDB: false
```

`JSON.stringify` renders a `Date` as its ISO string, so an object holding a date compares equal
  to an object holding the equivalent string. The same collapse applies to `undefined` members,
  `NaN`, and `Infinity`. `CompareValues` already implements the type-aware comparison this
  branch needs, and `Expression/Comparison/eq.js:41` already uses it.

Low frequency, but it is the one remaining place where a value's type is discarded before
  comparison.


---

## 2. Consistency

### S1 — `LooseEquals` is not symmetric, next to a comment explaining why that is not allowed

`src/jsongin.js:223`

```js
Engine.LooseEquals = function ( DocumentA, DocumentB ) { return Engine.QueryOperators.$eqx.Query( DocumentA, DocumentB ); };
```

Eight lines below, `StrictEquals` carries this comment:

> A query operator is not symmetric: its first parameter is a document field and its second is a
> match value [...] and an equality test must not depend on the order of its arguments.

That reasoning applies verbatim to `LooseEquals`, which was defined directly on a query operator
  anyway.

```
LooseEquals( { a: 1 }, { a: 1, b: 2 } )   => true
LooseEquals( { a: 1, b: 2 }, { a: 1 } )   => false
StrictEquals( { a: 1 }, { a: 1, b: 2 } )  => false
```

The cause is `eqx.js:66`, which iterates the keys of the *document* side only, so any key
  present in the match value but absent from the document is not examined:

```
jsongin.QueryOperators.$eqx.Query( {}, { a: 1 } )   => true
```

An empty object loosely equals everything. This is the same shape as the date bug
  `LooseEquals.md:38-42` records as fixed in v0.1.0 — member-wise iteration finding nothing to
  disagree about — and it was fixed for dates only.

`LooseEquals.md` presents the function as comparing "two documents by ***content***" and gives
  symmetric examples throughout. Nothing in it suggests argument order matters.

### S2 — `ResolveCandidates.js` says it is unused and unregistered; it is neither

`src/jsongin/ResolveCandidates.js:24-27`

```
NOT YET USED. This lands ahead of the operators which will use it [...]
It is deliberately not registered on the engine: it becomes public API, with a documentation
page, when the operators move onto it.
```

It is registered at `src/jsongin.js:212`, has a documentation page at
  `docs/guides/jsongin/ResolveCandidates.md`, is listed in `Library-Guide.md:92` and
  `_sidebar.md:54`, and is called by six operators. The comment is the plan, left in place after
  the plan was carried out — and it is the first thing a reader of that file sees.

`test/100) Core Tests.js:787` still reaches the module through
  `require( '../src/jsongin/ResolveCandidates' )( jsongin )` rather than `jsongin.ResolveCandidates`,
  which is the same leftover: the tests are still written as though it were private.

### S3 — `OperatorType` mixes two different taxonomies and nothing reads it

The previous review's `S1` was resolved for `ValueTypes` and `ArgTypes` — both are now enforced,
  in `Query.js:64`, `Update.js:35`, `Evaluate.js:124`, and `Aggregate.js:46`. `OperatorType` was
  not part of that, and it has drifted:

| Value | Count | What it names |
|-------|------:|---------------|
| `Update`, `Stage`, `Accumulator` | 29 | the kind of operator |
| `Comparison`, `Logical`, `Arithmetic`, `Conditional`, `Array`, `Literal`, `Meta`, `Evaluation`, `Extension` | 46 | the category within a kind |

`Comparison` spans both query and expression operators, so the value alone does not identify
  which registry an operator belongs to. `$exists` and `$type` are `Meta`, while the folder they
  live in and `Operator-Reference.md:39-40` both call them `Element`. `$regex` is `Comparison`
  while the reference lists it under `Evaluation`. `$eqx`/`$nex` are `Comparison` while `$exprx`,
  beside them in the same folder, is `Extension`.

`ArgCount` is in the same position: declared on all 22 expression operators, read by nothing.
  Every one of them then hand-checks its own argument count anyway (see **R1**).

Either enforce both the way `ValueTypes` now is, or delete them. The lesson of the previous
  review is that unenforced metadata drifts, and this is the remainder of it.

### S4 — `Filter()` returns the caller's own documents; nothing says so

`Aggregate.md:45-55` is careful and explicit about this exact question:

> They return the caller's own document objects and clone nothing, which is what [...] clone
> every document they emit, with `SafeClone()`, before writing into it.

`Project`, `Update`, `Distinct`, `$group`, and `$unwind` all clone and all say so. `Filter` does
  not clone, and `Filter.md` does not mention cloning, references, or aliasing anywhere.

```js
let documents = [ { a: { n: 1 } } ];
let result = jsongin.Filter( documents, { a: { n: 1 } } );
result[ 0 ].a.n = 999;
documents[ 0 ].a.n           // => 999
```

Not returning copies is a defensible choice for a filter — it is what `Aggregate` chose, for the
  reason `Aggregate.md:53` gives. The inconsistency is that `Filter` made the same choice
  silently.

### S5 — `src/jsongin/Path/` still ships three unregistered modules

`Ancestor.js`, `Parent.js`, `Children.js`. The misspelling flagged as `S8` last review was fixed;
  the modules are still not registered in `src/jsongin.js`, not required from anywhere in `src/`,
  `test/`, `build/`, or `docs/`, not tested, and not documented. They correspond to the open
  `todo.md` item.

Dead code that looks live is worse than no code. Either register them or move them under
  `.plans/`.

### S6 — `readme.md:59` still makes the blanket accuracy claim

> Each MongoDB feature that is implemented here, operates accurately and in accordance with
> MongoDB.

This was raised as `S6` last review and marked fixed in commit `261cae1`; the sentence is still
  there. P1 through P8 above each contradict it, and `Operator-Reference.md` is the honest
  document — it marks partial support where partial support exists.

`readme.md` is generated from `docs/templates/readme.md`, so the fix belongs in the template.

### S7 — `/*md` blocks: 41 of 70 operators

Unchanged from last review's `S11`.

| Kind | With a block |
|------|-------------|
| Expression | 22 / 22 |
| Stage | 9 / 9 |
| Accumulator | 8 / 8 |
| Update | 4 / 12 |
| Query | 2 / 24 |

`Operator-Authoring.md:315` is honest that "nothing currently reads these blocks", which makes
  this low severity — but it is presented as the convention at line 299 and two whole kinds of
  operator ignore it. Deciding it is optional and saying so would settle it as cheaply as
  filling it in would.

### S8 — `module.exports = module.exports = function` in `eqx.js`

`src/Operators/Query/Extension/eqx.js:3`. The only file in `src/` with it.


---

## 3. Conciseness

### R1 — The seven expression comparison operators are one implementation written seven times

`src/Operators/Expression/Comparison/{eq,ne,gt,gte,lt,lte,cmp}.js`

Each is ~55 lines. All seven contain, character for character apart from the operator name:

```js
function compare( ValueA, ValueB ) { return jsongin.CompareValues( ValueA, ValueB ); }
...
if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `$xx: requires an array of two arguments.` ); }
if ( Args.length !== 2 ) { throw new Error( `$xx: requires exactly two arguments but found ${Args.length} instead.` ); }
let value_a = jsongin.Evaluate( Document, Args[ 0 ] );
let value_b = jsongin.Evaluate( Document, Args[ 1 ] );
return ( compare( value_a, value_b ) ??? 0 );
```

They differ only in the final test: `=== 0`, `!== 0`, `> 0`, `>= 0`, `< 0`, `<= 0`, and the raw
  value for `$cmp`. The `compare()` wrapper is a one-line forward to `jsongin.CompareValues` that
  adds nothing, redeclared in each file.

The project has already established the answer to this, four times over:

- `Operators/Query/Comparison/_range.js` — one body for query `$gt`/`$gte`/`$lt`/`$lte`
- `Operators/Update/Field/_minmax.js` — one body for `$min`/`$max`
- `Operators/Expression/Arithmetic/_arithmetic.js` — shared operand handling
- `Operators/Accumulator/_accumulator.js`

`Expression/Comparison/_compare.js` is the missing fifth, and it would remove roughly 300 lines.
  `_range.js` is the closest model: a `helper.Query( ..., OperatorName, Test, ... )` taking the
  comparison as a parameter.

### R2 — `$inc` and `$mul` are the same 40 lines twice

`src/Operators/Update/Field/inc.js` and `mul.js` are identical apart from `+=` versus `*=` and
  the operator name in three strings. `_minmax.js` already exists in that folder as the pattern
  for exactly this, and P1's fix — validating the stored value, defaulting a missing field —
  has to be written into both files unless they share one.

An `_arith.js` beside `_minmax.js`, taking the operator name and a `( Value, Operand )` function
  plus the missing-field default (`0` for `$inc`, `0` for `$mul`), covers both and puts the
  parity rules in one place.

### R3 — `is_query()` is duplicated verbatim, including the commented-out block

`src/jsongin/Query.js:109-128` and `src/jsongin.js:315-334` are the same function, down to the
  same seven-line `//TODO: This needs more thought/work:` comment.

Both copies are live. `Query.js:87` calls its local one; `ImplicitEq.js:37` calls
  `jsongin.IsQuery`. They are two paths into the same decision, and if the TODO is ever resolved
  it has to be resolved twice.

Delete the local copy and call `jsongin.IsQuery`.

### R4 — `ArgCount` is declared 22 times and enforced by 22 hand-written checks

Every expression operator declares `ArgCount`, and then separately validates its own argument
  count — either inline (`Comparison/*.js`, the `Args.length !== 2` line) or by passing explicit
  min/max to `arithmetic.Operands( ..., 2, 2 )`. The declaration and the check always agree and
  are always written twice.

`Evaluate.js:124` already enforces `ArgTypes` from the declaration. Enforcing `ArgCount` the same
  way retires all 22 checks, and turns S3's dead metadata into live metadata. It needs a
  convention for variadic (`null` is already in use) and for the operators that accept a bare
  non-array argument.


---

## 4. Test Coverage

### T1 — The tests that encode parity claims cannot be run against MongoDB

The suite has two kinds of test, and the split does not fall where it should.

**Driver-based, runnable against a real server** — `test/{Query,Update,Projection,Aggregate} Tests/test-suite/`,
  wired to `jsongin`, `MongoDB`, `NeDB`, `Seald-NeDB`, and `json-criteria` drivers. The wiring is
  symmetric and correct, and `Aggregate Tests - MongoDB.js:6-10` documents how to run it.

**jsongin-only** — the numbered files, `test/*.js`, which are what `npm test` runs.

The problem is the sizes:

| Driver-based suite | Lines |
|--------------------|------:|
| Query — MongoDB Reference | 1256 |
| Query — MongoDB Tutorials | 774 |
| Query — Rainbow | 565 |
| Aggregate — Sort Parity | 227 |
| Aggregate — Ad-Hoc | 202 |
| Projection — Ad-Hoc | 190 |
| **Update — Ad-Hoc** | **51** |
| **Query — Ad-Hoc** | **41** |

`test/Update Tests/test-suite/Ad-Hoc Tests.js` contains one test.

Meanwhile the parity work of the last two days lives in `250) Update Operator Tests.js` (+462
  lines) and `200) Comparison Operator Tests.js` (+522 lines) — both jsongin-only. Every one of
  the `$min`/`$max` rules that `_minmax.js:24-34` says was "verified against MongoDB 6.0.1" is
  asserted only against jsongin. The verification happened; it was not captured anywhere a
  regression could be caught.

The Sort parity work went the other way — `Sort Parity Tests.js` is driver-based, 227 lines, and
  runs against both engines. That is the model. The comparison and update operator tests should
  follow it.

### T2 — `$in` and `$nin` are the least tested comparison operators, and the only broken ones

That is not a coincidence. Across the whole test tree:

```
$in:   8 occurrences
$nin:  4 occurrences
$eq:  61 occurrences
$gt:  60 occurrences
```

`120) Date Handling Tests.js:131-132` and `130) Engine Function Tests.js:149` are essentially the
  whole of it — three assertions, all against flat scalar fields. Not one `$in` test uses an
  object match value, an array match value, `null`, or a path that crosses an array. P2's six
  failures are all in that untested space.

Similarly thin, at 2-3 occurrences each: `$rename`, `$mul`, `$pop`, `$pullAll`, `$currentDate`,
  `$addToSet`.

### T3 — The uncovered blocks and the findings are the same places

`build/coverage.js` reports 161 uncovered blocks, led by `Project.js` (15), `SetValue.js` (9),
  `Query.js` (8), `DeleteValue.js` (7), `SafeClone.js` (6), `Text.js` (6), `Sort.js` (5),
  `Format.js` (5), `eqx.js` (5), `in.js` (4).

`in.js` and `eqx.js` carry P2 and S1. This was true of the previous review too, and the coverage
  tool is pointing accurately at where the defects are.

### T4 — No test observes the engine's own aliasing rules

`Aggregate.md:45-55` and `Project.md` both state cloning guarantees as contracts. No test asserts
  them. S4's `Filter` aliasing, and the `Project` computed-field aliasing fixed last review as
  `C8`, are both invisible to the suite. A handful of "mutate the result, assert the source is
  untouched" tests would cover a class of defect that has already occurred twice.

### T5 — The `jsongin` driver swallows errors

`test/Drivers/jsongin-Driver.js:47,68,89` — `catch ( error ) { console.error( error ); }` and
  return `undefined`. A throw becomes an undefined result rather than a reported failure. The
  assertion downstream usually fails anyway, but on the reason "expected undefined to be truthy"
  rather than on the actual error.


---

## 5. Documentation Coverage

Surface area is complete and verified in both directions — every registered operator appears in
  `Operator-Reference.md`, nothing marked `Yes` is unregistered, every public engine member has a
  page. That has held since the previous review. What follows is depth, not coverage.

### D1 — Behavior documented at two very different depths

`Operator-Reference.md:465-480` on `$min`/`$max` is the standard the rest of the file should meet:
  it states the rule (BSON order, not numeric), gives three worked examples, covers the missing
  field and the `null` field separately, and names the version it was verified against.
  `Project.md` and `Aggregate.md` are the same quality — `Project.md:88-99` explaining why a
  projection path and a computed field give different answers for the same input, and asserting
  both match MongoDB, is genuinely hard-won documentation.

Against that, `$inc` and `$mul` get one table row each and no note. Their actual behavior (P1) is
  undocumented and wrong. `$regex` gets a row marked `Yes` with no mention of `$options` (P3) or
  of the global-flag statefulness (P4). `$in` gets a row, and the "Note on dates" mentions it,
  but nothing describes what it matches.

The pattern to fix: the operators with the good documentation are the ones that were recently
  worked on. Documentation is being written as part of the fix, which is right — it just means
  the un-fixed operators are also the un-documented ones.

### D2 — Known limitations that are not written down

| Limitation | Documented? |
|------------|-------------|
| `$regex` ignores `$options` | no |
| `Project( doc, {} )` returns `{}` | no |
| `$inc`/`$mul` on a missing field | no |
| `LooseEquals` is not symmetric | no |
| `Filter` returns the caller's documents | no |
| `$count` aggregation stage unsupported | yes, absent from the stage table |
| `$$ROOT` and system variables unsupported | thrown at runtime with a clear message; not in the docs |
| Projection `$slice`/`$elemMatch`/`$`/`$meta` unsupported | yes, `Operator-Reference.md:424-430` |

The last two rows are how it should work. The first five are behavior a user will hit before
  they hit anything in the docs.

### D3 — Unsupported projection operators fail with the wrong error

`Project( { a: [ 1, 2, 3, 4 ] }, { a: { $slice: 2 } } )` throws
  `Unrecognized expression operator [$slice].` — because an unrecognized projection value falls
  through to `Evaluate()` as a computed field.

The reference documents `$slice` as an unsupported *projection* operator, which is accurate, but
  the error tells the user it is an unrecognized *expression* operator, which sends them to the
  wrong table. `$elemMatch` is worse, because it is a registered query operator, so the message
  is arguably false.

`Project.md:126-128` states the convention — an invalid expression throws, an invalid projection
  returns `null` and writes to the OpLog. These four operators are invalid projections being
  reported as invalid expressions.


---

## What is solid

- **The `ResolveCandidates` migration is the right fix, done the right way.** The mechanism
  landed with tests before any operator moved onto it, the header documents the rule and the
  measurement, and each migrated operator carries a comment saying what it used to do and why
  that was wrong. `$eq`, `$gt`/`$gte`/`$lt`/`$lte`, `$regex`, `$size`, `$exists`, `$type`, and
  `$all` are all correct through arrays now, including nested arrays, which is where most
  implementations of this stop.
- **`ImplicitEq` collapsing from a type-pair dispatch table to three cases** is the clearest
  evidence the abstraction was the right one.
- **Aggregation is in excellent shape.** Every `$unwind` option, `$group` with compound keys and
  all eight accumulators, and all nine stages match MongoDB in every case tested — including
  `$unwind` on a missing field versus an empty array versus a non-array, which is a common
  source of divergence.
- **Sort and `CompareValues` are correct**, including the BSON type ordering and the array
  sort-key rule (minimum element ascending, maximum descending) that most implementations miss.
  And the parity tests for it are driver-based.
- **`_range.js`, `_minmax.js`, `_arithmetic.js`, `_accumulator.js`** — the shared-helper pattern
  is established, well-commented, and demonstrably keeps siblings from drifting. R1 and R2 are
  requests to apply a pattern that already works here, not to invent one.
- **`ValueTypes`/`ArgTypes` enforcement** closed the previous review's largest consistency
  finding properly: enforced in all four dispatchers, with the guide updated to match.
- **Documentation surface area has not drifted at all**, across two rounds of substantial
  change, and `docs-check.js` parses 316 code fences rather than just counting them.
- **Every fix from the previous review is verifiably fixed**, and most came with the test that
  proves it.


## Suggested order of work

1. **P1** — `$inc`/`$mul` writing `NaN` into a missing field. Silent data corruption on the most
   common form of the most common update operator. Fix it via **R2** so it is fixed once.
2. **P2** — migrate `$in`/`$nin` to `$eq` the way `$all` already delegates, and **T2** — write
   the `$in` tests that would have caught it, driver-based.
3. **P3, P4** — `$regex`: implement `$options`, and rebuild the pattern per call so a global flag
   is not stateful across documents. Fix `in.js:38` at the same time.
4. **P5, P6, P7** — three small parity corrections: empty projection, `$not` at the top level,
   `$exists` value types.
5. **P8** — migrate `$elemMatch` to the candidate list. Settle the nested-array case against a
   live server first.
6. **S1** — `LooseEquals` symmetry. Decide whether it is an equality function or a query
   operator; the documentation says the former and the implementation is the latter.
7. **T1** — move the comparison and update operator parity assertions into the driver-based
   suites, so "verified against MongoDB 6.0.1" becomes something the suite can re-verify.
   `Sort Parity Tests.js` is the template.
8. **R1, R3, R4** — the expression comparison helper, the duplicated `is_query`, and `ArgCount`
   enforcement. Roughly 350 lines removed and one class of drift closed.
9. **S2, S3, S5, S6, S8** — the stale `ResolveCandidates` header, `OperatorType`, the dead
   `Path/` modules, the readme claim, the double `module.exports`.
10. **P9, P10, D1, D2, D3, S4, S7, T3, T4, T5** — the remainder.
