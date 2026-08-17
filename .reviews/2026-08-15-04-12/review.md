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

## Parity findings are now measured

> Added 2026-08-16.

Every parity finding below is now a ***test***, in the shared parity suites, verified against a
  live MongoDB 6.0.1 server before being trusted. Each one passes under MongoDB and fails under
  `jsongin`, which is what makes it a finding rather than an opinion.

```
npm run parity-report      =>  parity 90.3%   (224 of 248 compared behaviors agree)
```

| Finding | Where it is tested | Tests |
|---------|--------------------|------:|
| P1 `$inc`/`$mul` on a missing field | `Update Tests/test-suite/Update Operator Tests.js` | 3 |
| P1 `$inc`/`$mul` type validation | `Update Tests/test-suite/Update Rejection Tests.js` | 3 |
| P2 `$in`/`$nin` | `Query Tests/test-suite/Comparison Operator Tests.js` | 5 |
| P3 `$regex` `$options` | `Query Tests/test-suite/Comparison Operator Tests.js` | 1 |
| P4 `$regex` global flag statefulness | `Query Tests/test-suite/Comparison Operator Tests.js` | 1 |
| P5 empty projection | `Projection Tests/test-suite/Projection Shape Tests.js` | 1 |
| P6 `$not` at the top level | `Query Tests/test-suite/Query Rejection Tests.js` | 1 |
| P7 `$exists` non-boolean value | `Query Tests/test-suite/Comparison Operator Tests.js` | 1 |
| P8 `$elemMatch` through an array | `Query Tests/test-suite/Comparison Operator Tests.js` | 1 |
| P9 update documents which cannot apply | `Update Tests/test-suite/Update Rejection Tests.js` | 2 |
| P10 lossy deep equality | `Query Tests/test-suite/Comparison Operator Tests.js` | 1 |

Two notes on what the tests found that this review did not:

- ***`$rename` leaves the source key behind***, holding `undefined`, so a renamed field still
  satisfies `{ $exists: true }`. ***`$unset` on an array element leaves a sparse hole*** rather
  than a `null`. Both were invisible to the unit tests because those compare with
  `JSON.stringify`, which renders a hole as `null` and drops an `undefined` member. Neither is
  in the findings below. ***`$push` on a missing field creates nothing*** where MongoDB creates
  the array, which is a fourth case of P1's shape in an operator P1 does not name.
- Of P9's two halves, only the conflicting-path half is a gap. An unknown operator leaves the
  document unchanged, which is a refusal even without an error, so the test passes.

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


---

## Work Notes

A running record of what has been done against this review, newest entry first.
The ***Current Status*** block is rewritten in place each session. The ***Log*** below it is
  append-only: entries are never edited after the fact, so that a wrong turn stays visible.


### Next Session: Start Here

> Written 2026-08-17 at the end of the T3 sweep, and again after the dead branch removal.

1. ***Run every check in the Current Status table below.*** All six pass right now.
   `git status` will show ***33 modified files and no new commits*** — that is expected, see
   *Where this lives*.
2. ***The whole review is closed.*** Every finding P1–P10, S1–S8, R1–R4, T1–T5, D1–D3 is done,
   and there are no Open Decisions left. Parity is 100% of 475 with `test bugs: 0`.
3. ***The ten dead branches are gone***, removed 2026-08-17 on the user's instruction after they
   were reported with evidence. In-scope uncovered blocks are ***0***: logic branches 9 → 2 and
   validation throws 1 → 0, and the two remaining are ***empty regions with no statement in
   them***, not code. See *Finding Status*.
4. ***The sweep is uncommitted.*** If the user wants it committed, one commit for the whole
   sweep is the right shape.

There is no half-finished work and nothing in flight. Anything beyond the above is new work.


### Current Status

> As of 2026-08-17, after the T3 coverage sweep.

| Check | Command | Result |
|-------|---------|--------|
| Unit tests | `npm test` | 1161 passing, ***green*** |
| Parity baseline | `npm run parity-test-mongodb` | 475 passing, ***0 failing*** (needs a server) |
| Parity under test | `npm run parity-test-jsongin` | 475 passing, ***0 failing*** |
| Parity measurement | `npm run parity-report` | ***100.0%*** — 475 of 475 agree |
| Coverage | `npm run coverage` | 122 files exercised, ***79 fully covered***, 76 uncovered blocks |
| Docs | `npm run check-docs` | 340 fences, 285 links, 53 pages, ***85 operators*** — passed |

***T3 is finished, and it was the most productive finding of the review.*** Chasing uncovered
  branches found ***nine real defects*** in code that was already at 100% parity — because a
  branch nothing executes is a branch nothing measures. Coverage was the instrument that found
  them; parity was the instrument that proved them. Details in the Log below.

***Every in-scope block is now either covered or gone.*** Logic branches ***81 → 9 → 2***,
  validation throws ***12 → 1 → 0***: the ten dead branches were reported, then removed on
  2026-08-17 once the user asked for it. The two logic blocks left are ***not code*** — each is
  the empty tail of a loop body whose every path returns, continues or throws, so there is no
  statement in the range to delete. Uncovered blocks 160 → 84 → 76, of which ***74 are error
  plumbing***, which is out of scope by decision. Fully covered files ***60 → 79***.

The surface grew throughout: ***430 → 475 parity comparisons and 1126 → 1161 unit tests***,
  and parity finished at 100% of the larger number. Nine times the report went red and was
  brought back by fixing the engine, never by removing a test.

***Parity is 100%, and there are no gaps left to explain.*** Query 214/214, Update 86/86,
  Projection 51/51, Aggregate 124/124. `test bugs` is 0, so every assertion also passes against
  the live server.

***`parity-report` exits zero*** — first achieved on 2026-08-17 and held since, across the T3
  sweep which added 45 comparisons and nine engine fixes. Standing Decision 6 said the report is
  expected to be non-zero while any deliberate gap remains; none remain, so it gates a release
  without qualification.

***S6 is closed*** — the readme's accuracy claim is true as written, and the sentence was never
  edited. ***Open Decision 1 is closed***, which was the last one.

***The suite has only ever grown.*** 248 comparisons at the start of this review, 397 after the
  operator sweep was migrated in, 403 after the path syntax work, 430 at the end of the S7 work,
  ***475 now***. Every rise in the percentage was measured against a larger surface than the one
  before it, never a smaller one. Reaching and holding 100% did not come from removing anything:
  the two `Unimplemented` suites were retired only because richer tests for the same operators
  replaced them in the real suites.

***The Parity Tests are the whole of the parity evidence.*** The operator sweep which found
  five of this session's defects was a throwaway harness comparing two engines' output; it has
  been migrated into the suites and no longer exists. That was the right trade: a suite states
  its expectation, which a reader can check and which survives MongoDB being absent, where the
  harness only asked whether two engines agreed — and would have called both being wrong the
  same way a pass. The suite grew from 248 comparisons to 389 in the process.

The migration also closed a real hole. ***Only 3 of the 22 expression operators appeared
  anywhere in the suite***, so most of the expression layer was unmeasured; all 22 are now
  covered and all agree. `$currentDate` had no parity coverage either. Both were invisible
  precisely because nothing measured them.

***Where this lives.*** The 2026-08-16 work landed in two commits: `f10ea6f` for the P1 update
  operator group, and one commit for everything after it. The 2026-08-17 work landed in
  `2aa6320`, `d8e7138`, `22bf978`, `cdfa748`, and `15d9233`, then the three commits which took
  parity to 100%:

| Commit | What closed |
|--------|-------------|
| `2bd54c9` | S6 — both path extensions removed, and an operator's refusal raised by `Update()`. |
| `7a92187` | Open Decision 1 — the thirteen missing operators, and D3. First 100%. |
| `8a60e1c` | S7 — every operator documented, `check-docs` enforcing it, and the `$regex` `x` option. |

***The T3 sweep is NOT committed.*** The commit map above ends at `8a60e1c`. Everything from
  the T3 sweep — nine engine fixes, the new tests, the documentation corrections, the removal of
  the ten dead branches, and this review file — is sitting in the working tree as ***33 modified
  files, no new commits***. The numbers in the table above are the numbers of ***the dirty
  tree***, not of `8a60e1c`.
  *(No commit was made because none was asked for.)*

  So the old advice is inverted for this handoff: `git status` will ***not*** be clean, and that
  is expected rather than a sign something went wrong. ***Start by running every check in the
  Current Status table*** — they are the fastest way to confirm the tree is where these notes
  say it is, and all six should pass exactly as tabulated. If they do, nothing was lost in the
  reset.

  What is modified, by group:

  | Group | Files |
  |-------|-------|
  | Engine fixes | `src/jsongin/Project.js`, `src/jsongin/Query.js`, `src/Operators/Query/Array/elemMatch.js`, `src/Operators/Query/Comparison/in.js`, `src/Operators/Expression/Arithmetic/_arithmetic.js`, `src/Operators/Accumulator/sum.js`, `src/Operators/Accumulator/avg.js` |
  | Dead branch removal | `src/jsongin/SetValue.js`, `src/jsongin/DeleteValue.js`, `src/jsongin/SafeClone.js`, `src/jsongin/Update.js`, `src/Operators/Query/Extension/noop.js`, `src/Operators/Update/Field/rename.js`, `src/Operators/Update/Field/set.js`, `src/Operators/Update/Field/unset.js` |
  | Documentation | `docs/guides/jsongin/Project.md`, `docs/guides/Operator-Reference.md` |
  | Parity tests | 10 files under `test/Parity Tests/*/test-suite/` |
  | Unit tests | `110)`, `130)`, `150)`, `260)`, `510)` |
  | This review | `.reviews/2026-08-15-04-12/review.md` |

  ***A single commit for the whole sweep is the right shape***, since the fixes and the tests
  which prove them belong together and every check in the table passes.

***S6 was not a documentation task, and it was closed by doing the work.*** The readme claims
  that each implemented MongoDB feature operates in accordance with MongoDB.
  *(User decision, 2026-08-17, in response to a proposal to replace it with a measured claim:
  "the whole point of our work is to make that claim true, so lets do the work rather than
  trying to change the goalpost.")*

  ***The sentence was never edited.*** What falsified it was three implemented behaviors — the
  Known Deviations — and all three are gone. The 13 remaining gaps are operators which are
  ***not implemented***, and the sentence excludes those itself by saying "that is
  implemented".

  The claim is made in four places, not the one the finding names:
  `docs/templates/readme.md:59` and `docs/templates/_coverpage.md:15`, which generate
  `readme.md` and the docs site front page, plus `Document-Manipulation.md:70` and
  `Testing.md:6`, which are both already honestly hedged. ***None of the four needed
  changing***, which is the whole point. And `Testing.md` carries a sample `parity-report`
  output showing 90.3% of 248, which is deliberate narrative about the number falling as the
  suite sharpened, not a stale status line.


### Standing Decisions

Decisions made in session, which later work should not silently reverse:

1. ***`npm test` runs unit tests only, and is expected to be green.*** Parity gaps are a state
   this project expects to be in while they are being closed, so a red `npm test` always means
   a regression in `jsongin` itself. Parity is measured by `parity-report`, which exits
   non-zero and can gate a release when that is wanted. *(User decision, 2026-08-16.)*
2. ***The parity run uses an unconfigured engine.*** `jsongin-Tests.js` calls the driver with
   no settings, so it takes the instance the package exports. Parity is a claim about the
   defaults. `Default Settings Tests` in `130)` pins those defaults.
3. ***A test belongs in Parity Tests only if MongoDB has an opinion about it.*** Extensions,
   engine functions with no MongoDB counterpart, and statements about the `jsongin` API are
   unit tests. There is no "not compared" category in the parity report.
4. ***Parity tests are written against MongoDB first.*** Every assertion is run against the
   server before it is trusted. A test which fails under MongoDB is a test bug, not a finding.
5. ***Rejection is behavior.*** The drivers rethrow rather than logging. Rejection tests assert
   only *that* an operation was refused, never the wording.
   *(***Retired 2026-08-17***, as its own note predicted. An update used to count as refused if
   it threw ***or*** left the document unchanged, because an operator which could not apply
   itself declined quietly. `Update()` now raises that refusal, so every refusal throws and the
   lenient reading is no longer a state the engine can be in. `refused()` and `threw()`
   collapsed into one helper, which asserts a throw. The first half of this decision — the
   drivers rethrow, the wording is never asserted — still stands.)*
6. ***A parity test may be expected to fail.*** A behavior which is deliberately not MongoDB's,
   and a feature which is not implemented, are both recorded as failing parity tests rather
   than left out of the suite. A gap nothing measures is a gap nobody revisits, so
   `parity-report` is expected to be non-zero while any remain. What must always hold is
   `test bugs: 0` — every test passes against the live server. *(User decision, 2026-08-16.)*
   *(Qualified 2026-08-17: ***none remain***, so the report exits zero and can gate a release
   without qualification. The decision still stands and is the reason a future gap should be
   written down as a failing test rather than left out — but it is no longer the reason the
   report is red, because it is not red. A non-zero report now means a regression.)*


### Finding Status

| Group | Open | Notes |
|-------|-----:|-------|
| P1–P10 parity | 0 | ***All ten fixed***, and nine more defects the review never named: five from the operator sweep, one from migrating it into the suites, three from the path syntax work. |
| S1–S8 consistency | 0 | ***All eight fixed.*** S6 closed 2026-08-17 by removing the last three behavioral deviations, without editing the sentence. ***S7 closed 2026-08-17***: all 85 operators carry an `/*md` block and `check-docs` enforces it. |
| R1–R4 conciseness | 0 | ***All four fixed.*** R1 as `_compare.js`, R2 as `_arith.js`, R3 with the refusal work, R4 by deleting `ArgCount` rather than enforcing it. |
| T1–T5 test coverage | 0 | T1, T2, T5 addressed. ***T4 closed*** — the aliasing tests now cover `Filter` and `Sort` as well, with S4. ***T3 closed 2026-08-17***: every in-scope block is covered or removed, logic branches 81 → 2, and ***nine defects*** fell out of it. The ten dead branches were removed the same day. |
| D1–D3 documentation | 0 | ***All three closed.*** D3 closed 2026-08-17: `$` and `$meta` are refused by name as projection operators, and `$slice` and `$elemMatch` are implemented, so nothing reaches the expression evaluator by accident any more. |

***The shortest list of what is actually left***, for a session picking this up cold:

- **T3** uncovered blocks. ***Nothing is left.*** Every in-scope block is covered, and the ten
  which were dead have been removed. Compare the ***logic branch*** count (2, both of them empty
  regions rather than statements), not the raw block count and not `fully covered` — see the
  Current Status block for why.

  Scope, by decision: the ***81 logic branches and 12 validation throws***, not the 74 error
  plumbing blocks (`if ( jsongin.OpLog )` guards and `catch` bodies), which are reached only
  when something already covered has failed. *(User decision, 2026-08-17.)*

  ***Dead branches are reported before they are removed***, with the evidence for each.
  *(User decision, 2026-08-17.)*

  ***Removed so far***: in `Project.js`, a scalar guard redundant with the `undefined` test
  below it and three guards against an empty path which the new empty-field-name refusal made
  unreachable; `Query.js:43`, which guarded `SplitPath` returning `null` — it never does, it
  returns `[]` or throws; and `Query.js:238`, which re-refused a `$regex` the `ValueTypes: 'sr'`
  check already refuses first.

  ***Reported, then removed 2026-08-17*** on the user's instruction — all ten in-scope blocks,
  with the evidence each was reported on:

  | Branch | Why it could not execute |
  |--------|--------------------------|
  | `noop.js:38` `ToMongoQuery` | No caller in `src/`, `test/`, `build/` or `docs/`. `$noop` is the only one of the 85 operators with this member, so it is an interface with one implementor and no consumer — the shape S5 flagged for the `Path/` modules. |
  | `noop.js:44` `ToSql` | The same. |
  | `Update.js:48` | Skips an operator whose value is not a document. All twelve update operators declare `ValueTypes: 'o'` and the dispatcher enforces it ***before*** `check_for_conflicts` runs. A comment now records why the values are known to be documents. |
  | `SafeClone.js:77` | The `default:` throw for an unrecognized ShortType. `ShortType` returns exactly the twelve types `clone_node` has a case for, or throws itself. A comment now records why the switch needs no default. |
  | `SetValue.js:147`, `:149` | Marked `// Code should be inaccessible` by the author. |
  | `DeleteValue.js:98` | Marked `// Code should be inaccessible: the loop returns on its last element.` |
  | `rename.js:78`, `set.js:54`, `unset.js:118` | Each a `return; // Code should be inaccessible.` after a try/catch whose every path returns or throws. |

  ***Two logic blocks survive the removal, and neither is code.*** `SetValue.js:148` and
  `DeleteValue.js:98` are now the closing brace of a loop, reported because the range they end
  is unreachable — every path through those loop bodies returns, continues or throws. There is
  no statement inside either range to delete. They were previously reported as ***two*** blocks
  each because a dead `return` sat in the same region; removing it left the empty tail behind.
  ***Removing these would mean restructuring working loops to satisfy the coverage tool***,
  which is the tail wagging the dog, so they stay.

  ***The recurring shape is worth naming.*** Of the fifteen dead branches found, most were a
  guard compensating for validation that was added later — `ValueTypes` enforcement accounts for
  three of them on its own — or a defence against a return value the callee never produces.
  ***When a branch will not execute, ask what made it redundant***; the answer has been a later,
  better check nearly every time. The rest are `// Code should be inaccessible` markers, which
  are honest and correct and simply need deleting.

***Everything else is closed.*** No open Open Decisions, no parity gaps, and `parity-report`
  exits zero.

Three findings were discovered by the tests and were ***not*** written up in the sections above.
***All three are now fixed***, together with P1:

- `$rename` left the source key behind holding `undefined`, so a renamed field still
  satisfied `{ $exists: true }`.
- `$unset` on an array element left a sparse hole rather than a `null`.
- `$push` on a missing field created nothing, where MongoDB creates the array.

All three were invisible to the unit tests because those compare with `JSON.stringify`, which
  renders a hole as `null` and drops an `undefined` member.


### Open Decisions

Four of the five previous decisions were taken and carried out: `Query()` and `Update()` refuse
  a malformed statement by throwing, the evaluation option was threaded so `$elemMatch` can
  resolve an element without array semantics, and Decisions 2 and 3 below were settled on
  2026-08-17. ***Only Decision 1 remains***, and it is the only failing parity test left.

1. ***Should the unimplemented operators be implemented?*** — ***SETTLED 2026-08-17: yes, all
   thirteen.*** *(User decision: "lets implement the missing operators.")*
   Ten in aggregation: `$ceil`, `$floor`, `$round`, `$trunc`, `$size`, `$arrayElemAt`,
   `$concatArrays`, `$in` as expressions, `$addToSet` as an accumulator, and `$count` as a
   stage. Three more in projection: `$slice` and `$elemMatch`.
   The two `Unimplemented` suites were retired, replaced by richer tests for the same operators
   in the suites which measure the implemented ones.

2. ***Should a negative array index be refused on write?*** — ***SETTLED 2026-08-17: yes, and
   removed everywhere, not only on write.***
   The premise turned out to be wrong. MongoDB has no negative-index rule at all: it reads
   `-1` as a field name, which is why the write fails (a field cannot be created on an array)
   and why the read matches nothing. So reverse indexing diverged on ***both*** sides, not
   just the write side, and the question was never really about writes.
   *(User decision: remove the extension entirely rather than gate it — "keep your eyes on the
   prize: 100% parity across a significant surface area.")*

3. ***How loudly should an operator refuse a document it does not suit?*** — ***SETTLED
   2026-08-17: out loud, raised by the engine.***
   `Update()` now raises the refusal an operator reports. The operators are unchanged and
   still do not throw: an operator reports that it could not apply, and the engine decides how
   loudly to say so.
   *(User decision: "an error should be thrown at the engine level. operator refusals can
   update OpLog/OpError but should not throw errors.")*
   This retired Standing Decision 5 and collapsed `refused()` and `threw()` into one helper,
   exactly as that decision's own note predicted.


### Log

#### 2026-08-17 — the ten dead branches, removed

The user gave the go-ahead, so the ten branches reported under T3 were deleted: `$noop`'s
  `ToMongoQuery` and `ToSql`, the `ShortType` guard in `check_for_conflicts`, `SafeClone`'s
  `default:` throw, and the six `// Code should be inaccessible` returns. Eight files, and the
  numbers moved as predicted — logic branches ***9 → 2***, validation throws ***1 → 0***,
  uncovered blocks ***84 → 76***, fully covered files ***77 → 79***. Unit tests 1161 and parity
  475 both still pass, and `check-docs` still passes with 85 operators.

Two of the removals left a comment behind rather than nothing, because the reason the code was
  safe to delete is not obvious from what remains: `Update.js` now says the dispatcher has
  already checked `ValueTypes`, and `SafeClone.js` says `ShortType` throws on anything the
  switch does not have a case for. ***A deleted guard is only an improvement if the invariant it
  guarded is written down somewhere.***

***The count did not reach zero, and that is the honest answer rather than a shortfall.*** Two
  logic blocks remain, both the closing brace of a loop whose body always returns, continues or
  throws. There is no statement in either range. Reaching zero would mean rewriting working
  loops to please the tool, so the notes above say plainly what the two are.

The confirmation-first rule was worth keeping. `SafeClone.js:77` was a `default:` throw — the
  kind of defensive guard that looks reckless to delete on a whim — and it was only removed
  after checking that `ShortType`'s twelve return values and `clone_node`'s twelve cases are the
  same twelve, and that `ShortType` itself throws on anything else.

#### 2026-08-17 — T3 sweep, part two: the tail, and three more defects

The long tail behaved differently from the three concentrations. Most of it was ***unmeasured
  but correct***: null propagation through the arithmetic operators, the stage validations, the
  `$elemMatch` logical branches, the engine's handling of symbols and BigInt. Those became 45
  new parity comparisons and 27 new unit tests and agreed on the first run. ***Three did not.***

- ***`$in` silently skipped a query operator nested inside it, where MongoDB refuses.***
  `{ a: { $in: [ { $gt: 5 } ] } }` returned false. The code already carried a comment saying
  MongoDB refuses this, and skipped it anyway. Worse, the check sat ***inside the matching
  loop***, so `{ $in: [ 9, { $gt: 5 } ] }` against `{ a: 9 }` returned true without ever
  reaching the bad element. Hoisted to run over the whole list before any of it is matched —
  the same fix, and the same reasoning, as the `$elemMatch` one in part one.
- ***NaN was refused by the arithmetic operators.*** `{ $add: [ NaN, 1 ] }` threw. NaN is an
  ordinary BSON double and MongoDB computes with it. The cause was `AsOperandNumber` passing an
  operand it had ***already established was a number*** through `AsNumber()`, which returns null
  for NaN, and then reading that null as "not a number".
- ***`$sum` and `$avg` skipped NaN.*** They ignored it alongside the genuinely non-numeric
  values, which quietly produced a total that looked sound. MongoDB takes it into the total, so
  a NaN anywhere in the stream takes the result with it — which is the point.

***The `AsNumber` bug is the one worth remembering.*** Two checks in sequence, each correct on
  its own, that together rejected a valid value: the ShortType test established the operand was
  a number, and then the conversion re-decided it was not. A test with only well behaved numbers
  can never see it, which is why it survived to now.

***A stale claim in the operator reference, found by verifying prose against the engine.***
  `Operator-Reference.md` recorded "one known deviation remains" for `$elemMatch` against an
  element which is itself an array. It has not been true since the `ResolveCandidates` work.
  The parity tests covered `$eq`, `$in`, `$all`, `$type` and `$regex` for that rule but never
  the range operators — exactly the pair the claim named. ***The documentation was understating
  the engine***, which is the opposite of the failure S6 was about and just as much a defect.

***On reading the coverage tool.*** The reported line is where an uncovered V8 ***range***
  begins, which is often the line ***before*** the code that never runs — a `}` or a `{` rather
  than a statement. Read the block after it, not the line itself. Twice this sent the first
  guess to the wrong branch: `Project.js:204` looked like the `$slice` pair form, which was
  already tested, and was really the malformed-argument refusal after it.

***And on probing before asserting.*** `Sort.js:136` needs two documents which offer ***no sort
  key at all***. A missing field does not do it, and neither does an empty array crossed by a
  longer path — both contribute a null candidate. Only an empty array ***at the end of the
  path*** contributes nothing. Three wrong guesses, each of which produced a passing test that
  covered nothing, before instrumenting the function settled it. When a test does not move the
  count, the belief behind it was wrong.

#### 2026-08-17 — T3 sweep, part one: coverage found six defects at 100% parity

***The headline: a suite at 100% parity still had six real defects, and uncovered branches are
  where they were.*** Parity was 100% of 430 before this session and is 100% of ***452*** after
  it. Nothing regressed; the surface grew and the engine was wrong on the new part of it.

The method was the same each time, and it is the reason this worked. Take an uncovered branch,
  ask what input reaches it, and then ask ***who decides what that input should do***. If
  MongoDB has an opinion, it becomes a parity test written against the server ***first***; if it
  is a statement about the jsongin API, it becomes a unit test. The branch being uncovered was
  only ever the prompt. What found the defects was asking what the behavior ***should*** be.

***`Project.js` — three defects, from six uncovered branches.***

- ***Nested projection specifications were not implemented, and fabricated data.***
  `{ o: { p: 1 } }` means `{ 'o.p': 1 }` in MongoDB. jsongin fell through to `Evaluate()` as a
  computed field, which evaluated the specification as an expression and returned ***the
  specification itself***, so `{ o: { p: 0 } }` projected a document containing `{ o: { p: 0 } }`
  — a value the source never held. This is ordinary usage (`{ user: { name: 1 } }`) and it is the
  worst thing found in this review: not a missing feature but an invented value.
  ***It hid behind a coincidence.*** The first probe, `{ o: { p: 1 } }` against `{ o: { p: 1 } }`,
  agreed with MongoDB — because the literal being returned happened to equal the value being
  projected. Only a document whose value differed from its specification separated them. A
  test whose expected value is also its input cannot fail.
- ***`$elemMatch` beside an exclusion was refused, and MongoDB accepts it.*** The rule is that
  `$elemMatch`, like `$slice`, only ***decides*** the projection type when nothing else has; it
  does not force an inclusion. `{ n: 0, a: { $elemMatch: {...} } }` is an exclusion with the
  match applied inside it. The refusal was written from the reasonable-sounding premise that an
  inclusion and an exclusion cannot combine, which is true of the other three cases beside it
  and not of this one.
- ***Two things MongoDB refuses were silently accepted***: an empty sub-projection `{ o: {} }`
  and an empty field name `{ '': 1 }`.

  The fix is one `flatten_projection()` pass which rewrites nested specifications into dotted
  paths ***before*** the existing scan, so the include, exclude and computed field machinery
  below it is untouched and only ever sees paths. Refusing the empty field name up front then
  made three defensive guards unreachable, and they were removed with it — the guards had been
  compensating for validation that did not exist.

***`elemMatch.js` — two defects, from seven uncovered branches.***

- ***A malformed criteria inside `$elemMatch` returned `false` instead of refusing.***
  `{ $or: 5 }`, `{ $or: [ 5 ] }`, `{ $not: 5 }` all quietly reported no match. This is exactly
  the defect the review's own refusal work fixed at the top level of a query, surviving one
  level down: reporting `false` gives the caller no way to tell a typo from an empty result.
- ***The refusal that did exist depended on the data.*** Validation ran while matching, so it
  needed an element to reach it: `{ v: [] }`, a field which is not an array, and a field which
  is not there all returned `false` for a criteria MongoDB refuses to run at all. Being
  malformed has nothing to do with the data, so validation was hoisted into a
  `validate_criteria()` which runs once, up front, against the criteria alone. That also made
  `logical_matches()` purely evaluative, which is the better shape.

***One stale documentation claim, found by verifying prose against the engine.***
  `Operator-Reference.md` recorded "one known deviation remains" for `$elemMatch` — that a
  comparison operator applied to an element which is itself an array still looks inside it. It
  does not, and has not since the `ResolveCandidates` work; the parity tests covered `$eq`,
  `$in`, `$all`, `$type` and `$regex` for that rule but never the range operators, which is
  exactly the pair the claim named. ***The documentation was understating the engine.*** The
  four range operators are now tested and the claim is gone.

***What this says about the finding.*** T3 read as bookkeeping — a block count to grind down,
  the last item on a closed list. It was the finding that proved 100% parity is a statement
  about ***the surface you measure***, not about the engine. Every one of these six defects sat
  in code that no test executed, which is precisely why no parity test had an opinion about it.
  Coverage does not verify behavior; it tells you where nobody has looked.

***Method note, for the next session.*** Two of the six were found only because the probe was
  designed to ***distinguish*** rather than confirm. Choose inputs where the wrong answer and
  the right answer differ visibly — a projected value that differs from the projection, a
  criteria applied to an empty array — or the test will pass for the wrong reason.

#### 2026-08-17 — S7 closed: every operator documented, and the convention enforced

All 85 operators now carry an `/*md` block, up from 56, and ***`check-docs` fails the build
  when one is missing***. The review offered "decide it is optional, or fill them in"; filling
  them in without enforcement would have left the same convention to drift again, which is
  exactly what `OperatorType` and `ArgCount` did before they were deleted. The check was
  verified by removing a block and watching it fail, then restoring it.

***Writing the blocks was worth more than the blocks are.*** Every factual claim in the 29 new
  ones was checked against the engine rather than asserted from memory, and ***five were
  wrong***:

- ***`$eqx` was described completely wrongly.*** It is a ***loose*** (`==`) value comparison —
  `1` equals `'1'`, `true` equals `1` — not "compares only the members named in the match
  value". The draft even had a top level `$eqx` in its example, which the engine refuses.
- ***`$and`, `$or`, and `$nor` refuse an empty list***, as MongoDB does. The draft said they
  match everything or nothing.
- ***`$currentDate: { $type: 'timestamp' }` is supported***, storing a number. The draft said it
  was refused. It is a real deviation — MongoDB stores a BSON `Timestamp`, which has no JSON
  representation — and is now written down as one, in the same class as having no `ObjectId`.
- ***`$options: 'x'` was not supported, and now is.*** See below.

  The verification is a throwaway, and deliberately so: these are statements about the jsongin
  API and its own behavior, not about MongoDB, so they belong in unit tests rather than the
  parity suite. What survives is the corrected prose. ***The one claim which turned out to be
  about MongoDB became a parity test instead.***

***A real feature gap fell out of it.*** `$options` was handed straight to `new RegExp`, so it
  accepted the ***Javascript*** flag set rather than MongoDB's, and `x` was rejected as an
  unknown flag. Nothing measured it: `$options` had one parity test, for `m`.

  Written as a parity test first, per Standing Decision 4, and MongoDB passed all four
  assertions on the first run — the reading of `x` was right, jsongin simply did not have it.
  Extended mode is now applied by rewriting the pattern, since Javascript has no such flag,
  leaving escaped whitespace and character classes alone as PCRE does. Parity 428 → ***430***,
  still 100%.

***What this says about the finding.*** S7 read as the lowest severity item on the list —
  cosmetic, since nothing reads the blocks. It was the one that found a missing feature and
  four wrong beliefs about the engine. Writing documentation against the code is a form of
  measurement.

#### 2026-08-17 — 100% parity: the thirteen missing operators implemented, D3 closed

***`parity-report` exits zero for the first time.*** 428 of 428, across Query 199, Update 81,
  Projection 40, and Aggregate 108. Open Decision 1 is settled and there are none left.
  *(User decision: "lets implement the missing operators.")*

***The contract was written as parity tests before any operator existed***, which is the whole
  reason this went in one pass. *(User, mid-session: "use parity tests!" — the first draft of
  the semantics had been gathered with a throwaway probe, which is exactly the harness Standing
  Decision 3 exists to prevent. The probe was deleted and the same ground written as tests.)*

  The order was: write the tests, run them against the live server, fix the ***tests*** where
  the server disagreed, and only then implement. The server disagreed once — the projection
  `$elemMatch` is an ***inclusion***, so a non-match returns `{}` rather than leaving the other
  fields in place. That was a test bug caught before a line of `Project.js` was touched, which
  is the cheapest place to catch it.

  ***All ten aggregation operators passed on their first run against the suite.*** Aggregate
  went from 79/89 to 108/108 without a debugging cycle. That is the argument for this order.

***What the measurement taught, which guessing would not have:***

- ***`$round` rounds half to even.*** `{ $round: [ 2.5 ] }` is `2` and `{ $round: [ 3.5 ] }` is
  `4`. `Math.round()` gives `3` and `4`, and is also asymmetric about zero, so it cannot be
  repaired by handling the sign. There is a dedicated `RoundHalfToEven` for this.
- ***The decimal shift cannot be done by multiplying.*** `1.005 * 100` is `100.49999999999999`,
  which would round the wrong way. `_rounding.js` moves the decimal point through the number's
  own text instead.
- ***`$size` does not tolerate a missing field***, unlike almost every other expression
  operator: it is an error rather than a null.
- ***`$arrayElemAt` out of range is *missing*, not null***, so the projected field is omitted.
- ***A single null takes the whole of `$concatArrays`***, rather than being skipped.
- ***`$slice` is neutral about the projection type and `$elemMatch` is not.*** `$slice` does not
  make a projection an inclusion, which is what lets it sit beside exclusions, and a
  `$slice`-only projection therefore returns the whole document. Once something else has made
  the projection an inclusion, a sliced field is one of the fields included. That distinction
  is the only subtle part of `Project.js`, and it is now three tests.

***D3 closed on the way.*** A projection operator is recognized by its ***position*** — a
  projection value which is a document holding exactly one `$` key — rather than by name, so
  `$` and `$meta` are refused as projection operators instead of falling through to `Evaluate()`
  and being reported as unrecognized ***expression*** operators. `$elemMatch` was the worst of
  those, being a registered query operator, which made the old message arguably false.

***One mistake worth recording.*** The operator reference table was edited with an inline shell
  script, and the shell expanded the `$` in the operator names, so the pattern matched nothing
  and flipped ***35 rows*** instead of 12 — including operators which are still unimplemented.
  Caught by reading the diff, reverted with `git checkout`, and redone as a script file with a
  guard that requires each target to match exactly one row and writes nothing otherwise. The
  guard is the actual fix: the first version had no way to notice it was wrong.

#### 2026-08-17 — S6 closed: the path extensions removed, and the refusal raised

***Open Decisions 2 and 3 are settled, and with them S6.*** Parity is ***96.8%***, and every
  one of the 13 remaining gaps is an operator which is not implemented. ***There are no
  behavioral deviations left.*** The suite grew from 397 comparisons to 403 in the process, so
  the rise was measured against more surface, not less.

***The review's framing of Decision 2 was wrong, and measuring it is what showed that.*** The
  Known Deviation said "MongoDB refuses a negative index in an update". It does not have such a
  rule. It reads `-1` as a ***field name***, which is why the write fails — a field cannot be
  created on an array — and why `{ 'a.-1': 3 }` matches nothing, and why
  `{ $set: { 'a.-1': 9 } }` against a ***document*** succeeds and gives `{ a: { '-1': 9 } }`.
  The old test could not have caught this: its `refused()` helper accepted a throw ***or*** an
  unchanged document, so it only ever proved the two engines disagreed, never how.

  That reframing mattered, because it showed reverse indexing diverged on the ***read*** side
  too — `Query( { a: [ 1, 2, 3 ] }, { 'a.-1': 3 } )` returned `true` where MongoDB matches
  nothing. Nothing measured it, and Query was 197/197 only because nobody had written the test.
  Fixing the write alone would have closed the failing test and left the claim false.

***Both path extensions were removed rather than gated.*** *(User decision, after being shown
  that removing `PathExtensions` costs no parity and that reverse indexing was the more
  embedded of the two: "take both removals, remove reverse indexing everywhere.")*

- ***`PathExtensions` is gone.*** It gated the write-side implicit iterator, defaulted to off,
  and ***no released version ever responded to it*** — it was declared and never read before
  v0.1.0, and activated and removed within it. Removing it cost nothing and deleted three
  gates.
- ***Reverse indexing is gone from all eight sites*** — `GetValue`, `SetValue`, `DeleteValue`,
  `Sort`, `Evaluate`, `Project`, `ResolveCandidates`, and `$unset`. This one ***was*** a real
  break: shipped and documented since v0.0.10 (2023-11-23), 14 releases.

***Two defects were found in the code the removal touched, and neither was about negative
  indices.*** Both are cases where jsongin applied the ***query*** path rule to a language that
  does not use it, and both were fixed by ***deleting*** the numeric branch, so the code got
  smaller:

- ***Aggregation expressions do not index arrays.*** `'$a.2'` gathers the field `2` from each
  element and finds none, giving `[]`. jsongin returned `3`. Positional access is
  `$arrayElemAt`.
- ***Projection exclusions do not index arrays.*** `{ 'a.1': 0 }` removes nothing. jsongin
  deleted the element and ***left a sparse hole***, which JSON cannot represent — the same
  defect class as the `$unset` holes fixed earlier.

  Blast radius was measured before committing to either: one test depended on the projection
  behavior and none on the expression behavior.

***Decision 3 exposed a conflation the moment it was implemented.*** `Update()` now raises what
  an operator reports, and two parity tests went red immediately: `$pop` and `$pullAll` against
  a ***missing*** field. Both returned `false` for "nothing to do" and for "cannot apply",
  sharing one branch, and MongoDB treats a missing field as a successful no-op. Separating the
  two is the actual content of the fix. ***The suite caught this, not review*** — which is the
  argument for having written the tests first.

***What was verified, and how.*** Every behavior above was measured against a live MongoDB
  6.0.1 server before any code changed, then again after. The six new parity tests were run
  against the server first, per Standing Decision 4, and all six pass there — `test bugs` is
  still 0. The probes lived in `~temp/` and were deleted; what survives is the tests.

***One stale artifact fixed in passing.*** `tests.md` still showed 1212 passing, the review's
  own baseline, so it had not been regenerated in several sessions. It now shows 1124. `dist/`
  was rebuilt too, since `src/` changed.

#### 2026-08-17 — S6 examined and deliberately left open

No code changed. S6 was analyzed and the analysis produced the wrong proposal, which is worth
  recording because the next session will be tempted by the same one.

***The proposal was to replace the blanket accuracy claim with a measured, checkable one*** —
  no number, a pointer to the parity suites and the gap list, on the reasoning that even at
  100% the sentence extrapolates from a 397-comparison sample. ***That was rejected, correctly.***
  *(User: "the whole point of our work is to make that claim true. so lets do the work rather
  than trying to change the goalpost.")* Rewording retires the finding by lowering the bar. The
  finding is a statement about `jsongin`, not about the sentence.

What the analysis was good for: ***S6's real dependency is now known and small.*** 13 of the 16
  gaps are unimplemented operators, which the sentence excludes itself. Only the three Known
  Deviations falsify it, so S6 closes with Open Decisions 2 and 3. Also found: the same claim
  is made in four places, two of them generated, which matters whenever it does close.

#### 2026-08-16 — S5 closed: the three `Path/` sketches moved to `.plans/`

`src/jsongin/Path/` is gone. `Ancestor.js`, `Parent.js`, and `Children.js` are preserved in
  `.plans/2026-08-16/path-navigation-functions.md`, together with what they actually did and
  the decisions which have to be settled before they are written again.

***Registering them was not an available option***, which is what settled the review's
  either/or. Running the three showed they are the beginning of a design rather than an
  implementation with bugs in it:

- `Children( doc, 'a.b' )` returns `[ 'a.b.c' ]`, whole paths, while `Parent( doc, 'a.b.c' )`
  returns `'b'`, a bare key. The parent of that path is `'a.b'`. A family of navigation
  functions whose results cannot be handed to each other is not a family.
- `Ancestor` and `Parent` require a `Document` and throw without one, then never read it. Both
  are pure path arithmetic.
- All three split with `Path.split( '.' )` rather than `jsongin.SplitPath()`, so they do not
  follow the engine's own path rules.

***They were also shipping.*** `package.json` publishes `src` whole, so three files that no
  engine registered and no guide named reached every consumer of the package looking like part
  of the library. That is the concrete cost behind the review's "dead code that looks live is
  worse than no code", and it is why this got a `history.md` entry when S4 did not: what the
  package contains changed.

`todo.md` keeps the twelve-function item and now points at the plan. Six of the twelve — the
  ordinal ones, `FirstChild` through `LastDescendant` — turn out to need a decision nobody has
  made: over an object they depend on key order, which is insertion order in Javascript and
  which the engine promises nowhere else. That is recorded in the plan rather than discovered
  again later.

Unit tests 1124, coverage 161/50, docs green — all unchanged, since nothing referenced these
  files. That is the same evidence the deletion rests on.

#### 2026-08-16 — S4 closed: the aliasing contracts are pinned by tests, not just described

***Most of S4 was already fixed, and the finding as written is stale.*** It says `Filter.md`
  "does not mention cloning, references, or aliasing anywhere". It does now, in as many words —
  "a ***new array*** holding the ***original documents***, not copies of them" — and a unit test
  at `130)` already asserted `filtered[ 0 ] === documents[ 0 ]`. An earlier session fixed the
  documentation half without the Work Notes recording it, which is why T4's entry still called
  Filter the one gap left.

What was actually missing was the source and the edges around it:

- ***`Filter.js` said nothing.*** `Aggregate.md` names Filter as the convention the pass-through
  stages follow, so a maintainer who "helpfully" adds a `SafeClone` to it changes a documented
  promise while reading a file that never mentions one. It now carries the rule and the reason.
- ***The consequence was untested.*** Identity implies it, but a caller meets the rule as
  "writing into the result writes into my document", which is how the review states it and how
  the test now states it.
- ***`Sort()`'s contract was only implied.*** It sorts the caller's array in place, which
  `Sort.md` does say, but the tests only relied on it — they assert against the array they
  passed in. There is now one test which states it: same array object back, caller's order
  changed.
- ***The `$sort` stage's copy was genuinely unpinned.*** It sorts `Documents.slice()` so that a
  pipeline leaves its input alone.

***Two mistakes made while working, both caught by measuring rather than reasoning.***
First, `Sort.md` was read as silent about in-place sorting because the grep pattern looked for
  "copies" and the page says "no copy is made". Second, and more usefully: the new stage test
  was written believing the bundled Input Immutability test already covered a `$sort` mutation.
  Removing `Documents.slice()` from the stage broke ***nothing***. The reason is that the
  protection is doubled and the two halves guard different callers — `Aggregate.js:19` copies
  the array before the first stage, which is what protects a pipeline caller, and the stage's
  own slice only protects someone invoking the stage directly. Each is now pinned by the test
  which names it, verified by removing each slice in turn: one failure each, and the suite
  green again when restored. The bundled test catches neither on its own, because either copy
  alone is enough.

Unit tests 1119 → ***1124***. Parity, coverage, and docs unchanged, as expected for a change
  which alters no behavior — nothing here is user visible, so `history.md` gets no entry.

#### 2026-08-16 — S3 and R4 settled: both fields deleted, and the refusal measured instead

`OperatorType` is gone from all 75 operators and `ArgCount` from all 22 expression operators.
  The review offered "either enforce both the way `ValueTypes` now is, or delete them"; the
  measurement said enforcement was not available for either.
  *(User frame, 2026-08-16: keep them only if they can enforce correctness or parity, and
  `Operator-Authoring.md` is not a published contract. Analysis was delegated.)*

***`ArgCount` could not be enforced, and was wrong twice.*** An audit of all 22 operators, run
  before anything was changed, asked what the field catches that the operators do not already
  catch. The answer was nothing:

| Audit result | Count |
|--------------|------:|
| Own check already enforces exactly the declared count | 13 |
| Variadic — declares `null`, claims nothing | 6 |
| `$literal` — declares `1`, accepts any length, and ***must*** | 1 |
| `$switch` — declares `1`, accepts no array length; its `Args` is an object | 1 |

A central check would have been a second check of what the operator already does, could not
  reach the operators whose `Args` is not an array, and would have needed `$literal` carved
  out — where the declaration is the false part. MongoDB returns `[ 1, 2 ]` for
  `{ $literal: [ 1, 2 ] }`, measured, so the behavior is right and the metadata was wrong.

***`OperatorType` could not be enforced at all***, being a label rather than a constraint. There
  is nothing for a dispatcher to do with it, and nothing in `src`, `test`, or `build` read it.
  The kind of an operator was already settled by its registry, which the authoring guide has
  always said. The review's complaint that it mixes two taxonomies is true and is beside the
  point: a correct label that nothing reads is still dead.

***The lesson was inverted, and that is the real result.*** S3's premise is that unenforced
  metadata drifts. The answer here is not to declare the count but to ***measure the refusal***.
  MongoDB rejects a wrong operand count — `Expression $divide takes exactly 2 arguments` — and
  jsongin rejects the same cases, and ***nothing had ever compared the two***: the aggregate
  parity suites held no refusal coverage whatsoever. They do now.
  `Aggregate Tests/test-suite/Expression Rejection Tests.js` covers 41 assertions across 8
  tests, every one run against the live server first. ***All 41 agree***, which is also what
  makes the deletion safe: the behavior the field purported to describe is now pinned by tests
  that fail if it ever changes.

Suite 389 → ***397*** comparisons, parity 95.9% → ***96.0%***, the same 16 deliberate gaps, and
  `test bugs` still 0. Unit tests 1119, unchanged, which is itself the evidence that 97
  declarations were read by nothing. Coverage 163 → ***161*** uncovered blocks, fully covered
  49 → ***50***.

`Operator-Authoring.md` lost both members and gained the rule which replaces `ArgCount`: check
  the operand count in the operator, because the count means something different for each one.

#### 2026-08-16 — R1 fixed: the seven expression comparison operators share `_compare.js`

`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, and `$cmp` were the same body seven times, differing
  only in what they made of the comparison. The shared body is now
  `Expression/Comparison/_compare.js`, modelled on `_range.js` as the review suggested: the
  operator passes its name and a `Test` function which receives the `CompareValues` result.
  Each operator keeps its own `/*md` block, its metadata, and its own `try`/`catch` with its
  `OpError` prefix, which is exactly what the four existing helpers leave in place.

Nothing changed behaviorally: 1119 unit tests still pass, parity holds at 95.9% with the same 16
  deliberate gaps and `test bugs: 0`, and the error messages are byte identical — checked
  directly, including `'$eq: requires an array of two arguments.'`, which is reachable only by
  calling the operator rather than going through `Evaluate()`, since the dispatcher's `ArgTypes`
  check refuses a non-array first. Coverage is unchanged at 163 uncovered blocks and the new
  file arrived fully covered, taking fully covered files from 48 to ***49***.

***The review's estimate was wrong and is worth correcting where a later session will see it.***
  R1 says the helper "would remove roughly 300 lines". The measured result is ***+10***: the
  seven files went 359 → 323 and `_compare.js` costs 46. Only about five lines per file were
  duplicated *logic* — two validation lines, two evaluate lines, and the one-line `compare`
  wrapper. The rest of each file is the `/*md` block, four metadata fields, the module wrapper,
  and the try/catch, none of which this pattern removes. The win is that the validation and the
  comparison exist once, not that the tree got smaller.

***A version which does cut ~150 lines was declined, deliberately.*** Having `_compare.js` build
  the operator object would centralize the metadata and the try/catch as well, and would make
  these seven operators' `ArgCount` enforcement central, which overlaps **R4**. It was not done
  because it is a new pattern: all four existing helpers share only the body, and it would put
  these seven out of step with the other 15 expression operators. *(User decision, 2026-08-16:
  keep the shape that matches the existing helpers.)* Worth revisiting only if R4 is settled by
  centralizing argument enforcement generally, in which case this becomes part of that change
  rather than a local exception.

#### 2026-08-16 — S1 fixed: `LooseEquals` is symmetric, and `$eqx` is `$eq` with a loose comparison

The last correctness-shaped finding is closed. Unit tests 1108 → ***1119***, coverage 165 →
  ***163*** uncovered blocks despite a new source file, parity unchanged at 95.9% with the same
  16 deliberate failures — `$eqx` is a jsongin extension and has no MongoDB counterpart, so no
  parity test speaks to any of this.

***The fix was measured before it was chosen.*** A fuzz over a 37 value corpus — 1332 ordered
  pairs — found ***13 asymmetric pairs, every one of them from the object branch*** the review
  names at `eqx.js:66`. The date, regexp, array, and primitive branches were already symmetric,
  and the regexp one only looked suspect: `$eq` does not pattern match a bare regexp match
  value, so it answers `false` in both directions.

***The rule came from `$eq` rather than from a decision.*** *(User: "`$eqx` should function in a
  manner similar to `$eq`, all it is intended to do is perform loose comparisons rather than
  strict comparisons.")* That settled the open question — whether `{ a: null }` should loosely
  equal `{}` — without a judgement call. `$eq` compares objects with `CompareValues`, which
  requires the whole object on both sides, so the loose counterpart compares every key appearing
  in either value; a key which is not there reads as `undefined`, and the operator's own
  `null == undefined` rule then makes a null member and a missing member equal. One rule applied
  one level down, not a second rule.

It also exposed a second divergence the review never named, in the same subject. ***`$eqx`
  called `GetValue` where every other comparison operator calls `ResolveCandidates`***, leaving
  it the only one with path semantics of its own: `{ tags: { $eqx: 'a' } }` missed
  `{ tags: [ 'a', 'b' ] }`, and a path crossing an array found nothing. Three measured cases.
  *(User decision: fix that too, since under the definition above they are defects.)*

***What the shape of the fix had to be.*** Making `$eqx` array aware makes it *necessarily*
  asymmetric — a match value equals an element of a document array — so `LooseEquals` could not
  stay defined on it. The codebase already had the pattern: `StrictEquals` is `CompareValues`
  applied to two values, and `$eq` is candidates plus `CompareValues`. The loose side was
  missing its `CompareValues`. So `src/jsongin/LooseEquals.js` is now the symmetric comparison,
  `eqx.js` is candidates plus that function and is otherwise `eq.js`, and `Engine.LooseEquals`
  calls the module. `$nex` inherits all of it and gained the `ExpandArrays` passthrough `$ne`
  has. ***S8*** — `module.exports = module.exports` — went with the rewrite of `eqx.js`.

The check was then rewritten to assert the contract rather than to print a list: `LooseEquals`
  is symmetric for every one of the corpus's 1369 pairs, `$eqx` is asymmetric ***only*** where
  one side is an array, which is the licensed cause, and the S1 cases answer as stated. A
  784 pair symmetry sweep is now a unit test at `130)`, so the property cannot rot.

No existing test flipped, which is worth stating plainly: the 11 new tests are all new ground.
  Six `$eqx` tests already passed under both behaviors because they compared two whole values,
  which is exactly the job that moved to `LooseEquals`.

#### 2026-08-16 — Swept every operator, then reached 100% parity

Parity 98.8% → ***100.0%***, with the suite grown from 256 to 281 comparisons.

***The sweep came first.*** Every registered operator was run against the live server — 317
  cases across queries, updates, projections, and aggregation — rather than only the cases this
  review names. It cost an hour and found five defects the review never mentioned:

- The range operators refused object and array operands outright: `ValueTypes` did not admit
  either, and the comparison used the raw `>`, which cannot order them. They now compare
  through `CompareValues` inside the operand's own type bracket.
- `SetValue` left Javascript array holes when writing past the end of an array; MongoDB writes
  nulls. The same class as the `$unset` hole fixed earlier that day, in the other direction.
- `SetValue` created an array for a numeric key on a path which was not there; MongoDB creates
  a document, and only the array operators ever create an array. `Expand()` genuinely wants the
  old rule, so `SetValue` took a `CreateArrays` parameter and `Expand()` is its one caller.
- `$addToSet` did not create the array for a missing field — the exact defect `$push` had, in
  its sibling, unnoticed because the fix for `$push` was made from the finding list rather than
  from a sweep.
- `$push` refused a modifier document written without `$each`; MongoDB stores it as data.
  `push.js` documented the refusal as MongoDB's behavior, which it never was.

***The `$elemMatch` threading, and a correction.*** The estimate given for this was wrong in an
  instructive way. A boolean threaded through the whole sub-evaluation would have broken
  correct cases: the rule applies at the element's own level, and ordinary array semantics must
  resume below it, so `$elemMatch: { x: 1 }` against `{ v: [ { x: [ 1, 2 ] } ] }` still has to
  match. What works is narrower — operators take an `ExpandArrays` argument used only for their
  own resolution, and `$elemMatch` evaluates `$and`/`$or`/`$nor`/`$not` itself rather than
  handing them to `Query()`, which would restart their branches with ordinary path semantics.
  20 of 20 measured `$elemMatch` shapes now agree.

***Refusals.*** MongoDB refuses all 17 malformed queries probed; `jsongin` answered "nothing
  matched" for every one of them. `Query()` and `Update()` now throw for a statement which
  cannot mean anything, while a well formed statement which simply does not match still returns
  `false`. `IsQuery()` treats any `$` key as a query, which is what carries a misspelled
  operator to the refusal rather than to a field comparison — and deleting `Query.js`'s
  duplicate copy of it closed **R3**.

Six unit tests asserted the old silent behavior and were rewritten with the reason. Two of them
  — `$and: []` defaulting to true, `$or: []` to false — had been written as intended features.

***Then failing parity tests were added on purpose.*** Having reached 100%, the things which
  are neither defects nor parity would have disappeared from view entirely. They are now
  `Unimplemented Operator Tests.js`, `Unimplemented Projection Tests.js`, and a Known
  Deviations block in `Update Rejection Tests` — all passing under MongoDB and failing under
  `jsongin`, which is what makes them gaps rather than broken tests.
  *(User decision: the failures should force attention in later sessions.)*

#### 2026-08-16 — The sweep migrated into the Parity Tests

The operator sweep was a throwaway harness. Everything it covered is now a parity test with a
  stated expectation, and the harness is gone. Suite 294 → ***389*** comparisons; parity 95.9%
  with 16 deliberate failures and `test bugs: 0`.
  *(User decision: the Parity Tests are the authority of correctness and the evidence behind
  the parity claim, and parity covers how jsongin ***fails*** as much as how it succeeds.)*

Migrating was not a copy. The harness compared two engines' output with no expected value
  written down, which would call both engines being wrong the same way a pass; a parity test
  states what the answer should be. Duplication was avoided by inventorying the existing suites
  first, which is what exposed the hole below.

- ***Only 3 of the 22 expression operators appeared anywhere in the suite*** — `$cond`,
  `$divide`, `$subtract`. The whole expression layer was effectively unmeasured. All 22 are now
  covered by `Aggregate Tests/test-suite/Expression Operator Tests.js`, and all agree.
- `Stage and Accumulator Tests.js` takes each stage option and each accumulator on its own,
  where `Ad-Hoc Tests` had only exercised them in combination.
- `$currentDate` had no parity coverage at all, and now has a block of its own.
- `Projection Tests/test-suite/Computed Field Tests.js` covers computed fields, nested path
  inclusion and exclusion, and the two projections MongoDB refuses.
- `Query Tests/test-suite/Path Semantics Tests.js` covers the cases where the document's shape
  decides what a path means — `'a.0'` as an index and as a field name.

***One more defect fell out of it.*** `Project()` returned `null` for a projection combining
  inclusion and exclusion, where MongoDB errors — the same defect class as the query and update
  refusals, in the third dispatcher, and missed earlier because nothing measured it. It throws
  now, and `null` is reserved for a parameter of the wrong type.

#### 2026-08-16 — Query and projection findings fixed

Eight of the ten parity findings are now closed. Parity 94.8% → ***98.8%***, and the suite grew
  from 248 to 256 comparisons, all of the new ones verified against the server first.

- **P2.** `$in` delegates each match value to `$ImplicitEq`, which is MongoDB's own definition
  of it: a regexp in the list pattern matches, everything else is `$eq`. It had its own
  comparison built on `array.includes()`, which is `===`. `$nin` is `!$in` and inherited the
  fix. A query operator nested inside `$in` is refused rather than run, which stops
  `$ImplicitEq` from quietly treating `{ $in: [ { $gt: 5 } ] }` as `$gt`.
- **P3, P4.** `$options` is folded into its sibling `$regex` by `Query()`, since it is not an
  operator and cannot see its siblings from inside one. The pattern is rebuilt per call, which
  fixes the `g` flag statefulness and leaves the caller's `RegExp` untouched. `in.js:38`, which
  the review paired with this, no longer constructs a pattern at all.
- **P5.** An empty projection is an exclusion which excludes nothing. The `$project` stage now
  refuses an empty specification itself, so the opposite MongoDB rule still holds there — the
  review called for exactly that split.
- **P7.** `$exists` coerces through `AsBoolean`, which already implemented MongoDB's rule.
- **P10.** `$eq` compares objects and arrays with `CompareValues` instead of `JSON.stringify`.
- **P8, and a bug the review only suspected.** Settled against the live server first, since the
  review said not to decide it from memory. MongoDB answers ***false*** for
  `{ a: [ [ { x: 1 } ] ] }` against `{ a: { $elemMatch: { x: 1 } } }`, where `jsongin` answered
  true. `$elemMatch` now takes candidates without array expansion — a new optional
  `ExpandArrays` parameter on `ResolveCandidates`, defaulting to the old behavior — and treats
  an element which is an array as a value rather than a container. 24 cases were probed against
  MongoDB 6.0.1 and 22 now agree; 8 of them became parity tests.
- **S2.** The `ResolveCandidates` header no longer claims the module is unused and unregistered.

Two unit tests asserted the old `$in` behavior (an object and an array never matching) and one
  asserted `$exists` rejecting a non-boolean. All three were the defect written down as an
  expectation, and were rewritten with the reason.

Coverage 158 → 162 uncovered blocks. The new branches are the `$options` validation paths, and
  they are unit tested; the rest of the rise is error plumbing.

#### 2026-08-16 — P1 and the update operator group fixed

The first findings actually fixed. Parity 90.3% → ***94.8%***, Update 33/45 → 44/45, with 11
  gaps closed and no unit regression.

- **R2 first, so P1 is fixed once.** `Update/Field/_arith.js`, following `_minmax.js`, takes the
  operator name and a `( Value, Operand )` function. `$inc` and `$mul` are now 50 lines each of
  wiring and documentation instead of 40 lines of duplicated body.
- **P1.** A missing field counts as a zero, which gives `$inc` the operand and `$mul` a `0` from
  one rule, and the path is created. The stored value is type checked, not just the operand,
  so `{ a: 'str' }` is refused rather than becoming `'str1'`. The operand must be a real number:
  `AsNumber` is deliberately not used to read it, because it converts `'5'` and MongoDB does
  not. Every field is checked before any field is written, so a refusal leaves the whole
  document untouched — the rule `push.js` already followed.
- **`$rename`** removes the source key with `DeleteValue` instead of `SetValue( ..., undefined )`,
  and leaves a missing source alone rather than creating the target. Absence is checked with
  `GetValue` rather than read from `DeleteValue`'s result, because that result reports "was
  never there" and "removal failed" identically and only one of them is a no-op — which the
  failing-engine test at `250)` would have caught either way.
- **`$unset`** writes `null` into an array element. ***Decided in session:*** this is
  special-cased in `unset.js` rather than changed in `DeleteValue`, which keeps its documented
  contract of mirroring the Javascript `delete` operator. The cost is a parent walk inside the
  operator; it walks rather than calling `GetValue` because `GetValue` gathers an
  array-by-field-name descent into a new array, and a write into that copy would vanish
  silently.
- **`$push`** creates the array when the field is not there.

Coverage went 161 → 167 uncovered blocks on the first pass, all of it the new branches, and
  then to ***158*** once tested — below the starting point despite a new source file. The new
  unit tests are the ones MongoDB has no opinion about: which paths count as an array element
  (a field named `'1'` is not one), and how a refusal is reported through the OpLog.

***Deferred, deliberately:*** P9's conflicting-path rejection, the last Update gap. It needs a
  pre-pass in `Update.js` and settles whether a bad update throws or returns a no-op, which
  touches every operator's refusal path. That decision should be made once, on its own.

`Operator-Reference.md` gained an `$inc`/`$mul` note in the shape of the `$min`/`$max` one, and
  the `$unset`, `$rename`, and `$push` rows now state the behaviors above. The note says plainly
  that MongoDB raises an error where `jsongin` returns the document unchanged and logs, rather
  than claiming the two match — which is the S6 habit this review is trying to break.

#### 2026-08-16 — Parity findings expressed as tests

Every P item is now a test in the shared parity suites. 7 were directly expressible; 3 (P1's
  type validation, P6, P9) needed the drivers to stop swallowing errors, which is T5.

- Added `Query Tests/test-suite/Comparison Operator Tests.js`, migrated from `200)`.
- Added `Update Tests/test-suite/Update Operator Tests.js`, migrated from `250)`.
- Added `Query Tests/test-suite/Query Rejection Tests.js` and
  `Update Tests/test-suite/Update Rejection Tests.js`.
- Added `Projection Tests/test-suite/Projection Shape Tests.js`.
- `jsongin-Driver.js` and `MongoDB-Driver.js` now rethrow instead of `console.error` — **T5**.
- `build/coverage.js` no longer crashes when a test fails. `execSync` throws on a non-zero
  exit, so a single failing test took the whole coverage report with it.

Parity 100% → 96.0% → 90.3% as the suites grew. Nothing regressed; the measurement sharpened.

Not migrated, deliberately: `$eqx`/`$nex`, cases built on `undefined`/functions/symbols (no
  BSON counterpart, so they do not survive a round trip), and assertions about aliasing or
  about calling an operator directly.

#### 2026-08-16 — Parity Tests as a first class citizen

Restructured `test/` into `Unit Tests/`, `Parity Tests/`, `Browser Tests/` and made the parity
  run measurable.

- Fixed the fallout from the folder move: `npm test` matched nothing, `300`–`500` pointed at
  paths that no longer existed, `130):35` kept an old `require.resolve`.
- Fixed a real bug in `MongoDB-Driver.js`: `Update` called `.toArray()` on `updateMany()`,
  which returns counts. The entire MongoDB update baseline was failing.
- Consolidated the runners: `<Engine>-Tests.js` names the driver and the areas,
  `<Area>/<Area> Tests.js` names the suites, `test-suite/*.js` holds the tests. An area file
  takes its `Driver` as a parameter because `describe()` runs at require time — a driver
  assigned to the module afterwards can never reach the suites.
- Deleted `Unit Tests/300`–`600`, which were exact duplicates of `jsongin-Tests.js`.
- Added `build/parity.js` and `npm run parity-report`.
- Wired `Expr Tests.js` into the MongoDB runner. `$expr` is real MongoDB and had a baseline all
  along; it was simply never listed. **T1** and **T2** are addressed by this and the entry
  above.
- Moved `$exprx` to `Unit Tests/260) Extension Operator Tests.js` and removed the
  `Options.Extensions` machinery it required across six files.
- Made the parity run use the unconfigured engine, and added `Default Settings Tests` to
  `130)`. Verified by flipping `PathExtensions` to `true`: `npm test` caught it, and
  `parity-report` did ***not*** — the parity suites have no coverage of PathExtensions
  sensitive behavior, which is why the guard test is needed.

#### 2026-08-15 — Review written

`.reviews/2026-08-15-04-12/review.md`. Baseline at the time: 1212 passing, 161 uncovered
  blocks, docs clean, 75 registered operators.


### Re-establishing Context

```bash
npm test                        # unit tests, must be green
npm run parity-report           # the gap list, and the number
npm run coverage                # where the untested code is
npm run check-docs              # fences, links, orphans
```

`parity-report` prints every gap by name, so it is the fastest way back into what is open.
  It needs a MongoDB server at `localhost:27017`; the project has one running locally, and it
  is version 6.0.1, which is the version the source comments cite.

***Read this before reacting to the report.***

`parity-report` ***exits zero, and that is now the expected state.*** It has since 2026-08-17.
  ***A non-zero report means a regression*** — it no longer means a deliberate gap.

*(This paragraph used to say the opposite. Sixteen parity tests were written to fail on purpose,
  in two `Unimplemented` suites and a `Known Deviations` section, holding open the work listed
  under **Open Decisions**. All sixteen are gone: the thirteen operators were implemented and
  the three deviations removed, so the tests which named them were replaced by richer ones in
  the suites that measure the implemented operators. None was deleted to make the report green.)*

***Should a deliberate gap ever open again, write it down as a failing parity test*** rather
  than leaving it out of the suite — Standing Decision 6, which still stands. And do not make a
  failing parity test pass by deleting or weakening it: the only correct way to remove one is to
  implement the operator, or settle the decision, that it names.

The number which must always be zero is ***`test bugs`***: every parity test passes against the
  live server, so a test failing under MongoDB is a broken test rather than a jsongin finding.
  Check that first — `npm run parity-test-mongodb` should report 0 failing.

***What to read, in order:*** *Current Status* for where things stand, *Open Decisions* for what
  is waiting on a choice, then the *Log* for how it got here. The numbered sections above the
  Work Notes are the review ***as written on 2026-08-15*** and are not maintained; every P, R,
  and D finding in them is closed, so treat them as history rather than as a task list. The
  *Finding Status* table is the current word on what remains.
