# @liquicode/jsongin — Codebase Review

> Reviewed: 2026-08-14
> Version: 0.1.0 (commit 57df4ae, branch main, clean tree)
> Scope: correctness, consistency, comprehensiveness

Every finding below was reproduced against the working tree. Repro output is quoted verbatim.


## Baseline

| Check | Result |
|-------|--------|
| `npm test` | 989 passing |
| `node build/docs-check.js` | 285 js fences, 249 local links, 52 pages — passed |
| `node build/coverage.js` | 106 source files exercised, 42 fully covered, 172 uncovered blocks |
| Public engine members without a doc page | 0 |
| Doc pages without an engine member | 0 |
| Registered operators | 76 (25 query, 22 expression, 12 update, 9 stage, 8 accumulator) |

The suite is green and the tooling is genuinely useful. The findings below are things the
suite does not currently reach.


---

## Correctness

### C1 — `Unhybridize()` silently drops any string that parses as JSON

`src/jsongin/Unhybridize.js:20-52`

`JSON.parse()` succeeds on the field, `value.type` is `undefined`, no `case` matches, and the
`break` at line 48 leaves the case block without ever assigning `complicated[ key ]`.

```
Unhybridize( { a: '123' } )     => {}
Unhybridize( { a: 'true' } )    => {}
Unhybridize( { a: '[1,2]' } )   => {}
Unhybridize( { a: 'hello' } )   => { a: 'hello' }    // only survives because JSON.parse throws
```

A field is silently deleted. Any document carrying a numeric string, a boolean string, or
embedded JSON loses it.

### C2 — `Unhybridize()` reads the envelope fields off the raw string

`src/jsongin/Unhybridize.js:36,39,42`

The `'d'`, `'o'`, `'a'`, and `'r'` cases correctly read from the parsed `value`. The `'e'`,
`'f'`, and `'y'` cases read from `Document[ key ]`, which is still the JSON *string*.

```js
complicated[ key ] = new Error( Document[ key ].message );   // undefined
complicated[ key ] = new Function( Document[ key ].source ); // undefined
complicated[ key ] = Symbol( Document[ key ].source );       // undefined
```

Round trip verified: `Unhybridize( Hybridize( { a: new Error( 'boom' ) } ) ).a.message` is `''`.

### C3 — `Format()` emits invalid JSON for quotes, backslashes, and control characters

`src/jsongin/Format.js:73`

```js
value = value.replace( StringifyOptions.literal_quote, '\\' + StringifyOptions.literal_quote );
```

`String.replace()` with a string pattern replaces only the **first** occurrence, and nothing
escapes `\`, `\n`, or `\t` at all.

```
Format( { a: 'x"y"z' } )      => {"a":"x\"y"z"}     JSON.parse throws
Format( { a: 'a\nb' } )       => {"a":"a<LF>b"}     JSON.parse throws (bad control character)
Format( { a: 'back\\slash' } )=> {"a":"back\slash"} JSON.parse throws (bad escaped character)
```

### C4 — `Parse()` discards string escape sequences

`src/jsongin/Parse.js:65-76`

The tokenizer consumes the backslash and takes the next character literally, so escapes decode
to their own letters.

```
jsongin.Parse( '{"a":"x\ny"}' )      => { a: 'xny' }        JSON.parse gives { a: 'x\ny' }
jsongin.Parse( '{"a":"xAy"}' )  => { a: 'xu0041y' }    JSON.parse gives { a: 'xAy' }
```

`Parse` is documented as "similar to `JSON.parse()` but able to read Javascript as well as JSON",
so a valid JSON string it decodes wrongly is a defect rather than a documented limitation.

### C5 — `Parse()` crashes with a raw `TypeError` on truncated input

`src/jsongin/Parse.js:126,138`

The `while ( Tokens[ 0 ].token !== ']' )` loops do not test for an exhausted token array.

```
jsongin.Parse( '[' )  => TypeError: Cannot read properties of undefined (reading 'token')
jsongin.Parse( '' )   => undefined
```

Every other entry point in the library reports a described error. This one reports a Javascript
internal.

### C6 — `Distinct()` concatenates group keys with no separator

`src/jsongin/Distinct.js:21`

```js
document_key += JSON.stringify( value );
```

Two genuinely distinct documents collide.

```
jsongin.Distinct( [ { a: 1, b: 23 }, { a: 12, b: 3 } ], { a: 1, b: 1 } )
=> [ { a: 12, b: 3 } ]      // both key to "123"; one result is lost
```

`Operators/Stage/group.js:35` already solves exactly this problem correctly, by prefixing the
short type and building one key per value. `Distinct` should use the same construction.

Separately, line 20 writes the source value into the result by reference:

```
let result = jsongin.Distinct( docs, { a: 1 } );
result[ 0 ].a.n = 999;      // docs[ 0 ].a.n is now 999
```

### C7 — `BsonType()` reports `int` for every safe integer

`src/jsongin/BsonType.js:39-46`

`Number.isSafeInteger()` is not an int32 range test, but the branch it guards returns `16`
(int32) and the comment says `int32`.

```
BsonType( 3000000000, true )              => 'int'     MongoDB: 'long'
Query( { a: 3000000000 }, { a: { $type: 'int'  } } )  => true    should be false
Query( { a: 3000000000 }, { a: { $type: 'long' } } )  => false   should be true
```

The `$type` query operator (`Operators/Query/Element/type.js:41,52`) is built directly on this,
so the deviation is user-visible.

### C8 — `Project()` computed fields alias the source document

`src/jsongin/Project.js:119`

Included fields are cloned on the way out (line 104). Computed fields are not, and
`Evaluate()` returns live references for field references.

```
let doc = { user: { name: 'Alice' } };
let p = jsongin.Project( doc, { copy: '$user' } );
p.copy.name = 'MUTATED';
doc.user.name       // => 'MUTATED'
```

`Operators/Stage/group.js:122-124` clones on output with a comment stating the rule —
"derived data must never alias what it came from". `Project` is the outlier.

### C9 — `$set` and `$push` alias the update document

`src/Operators/Update/Field/set.js`, `src/Operators/Update/Array/push.js:32`

`Update()` clones the *document* (`Update.js:14`) but the values come from the update spec by
reference.

```
let spec = { $set: { obj: { n: 1 } } };
let out = jsongin.Update( {}, spec );
out.obj.n = 999;
spec.$set.obj.n     // => 999
```

`$addToSet` clones correctly and does not have this problem, so sibling operators disagree.

### C10 — `Text.SearchReplace` / `SearchReplacements` build a RegExp from unescaped keys

`src/Text.js:74,81`

```js
var regex = new RegExp( Object.keys( ReplacementMap ).join( '|' ), 'g' );
```

Regex metacharacters in the search text are interpreted, and a wildcard match then fails the
`ReplacementMap[ matched ]` lookup and interpolates the literal string `"undefined"`.

```
Text.SearchReplace( 'a.b axb', 'a.b', 'X' )  => 'X undefined'    expected 'X axb'
Text.SearchReplace( 'c(d)', '(', '[' )       => SyntaxError: Invalid regular expression
Text.SearchReplace( 'a+b', '+', '-' )        => SyntaxError: Invalid regular expression
```

`Text.Matches` (line 59) already escapes its pattern. These two do not.

### C11 — `$eq` and `$ne` do not handle a RegExp match value

`src/Operators/Query/Comparison/eq.js:29`

`'r'` is in the primitive branch, so two RegExp objects are compared with `===` and never match.
The implicit form routes to `$regex` (`ImplicitEq.js:132-137`), the explicit form does not.

```
Query( { a: 'hello' }, { a: /ell/ } )            => true
Query( { a: 'hello' }, { a: { $eq: /ell/ } } )   => false   MongoDB: true
Query( { a: 'hello' }, { a: { $ne: /ell/ } } )   => true    MongoDB: false
```

### C12 — `$currentDate` never stores a Date

`src/Operators/Update/Field/currentDate.js:32,42,46`

```
Update( {}, { $currentDate: { f: true } } ).f              => '2026-08-14T07:30:39.309Z'  (string)
Update( {}, { $currentDate: { f: { $type: 'date' } } } ).f => 'Fri Aug 14 2026'           (time lost)
```

The value fails a `$type: 'date'` query against its own output. `Update.js:13` deliberately uses
`SafeClone` "so that dates survive an update", which reads as an intent that dates be real Dates.

Also, an object spec with no `$type` string falls through lines 35-55 with `value` still `null`:
no field is written, no `OpLog` is emitted, and `true` is returned.

```
jsongin.UpdateOperators.$currentDate.Update( d, { f: {} } )  => true, and d is still {}
```

`Operator-Reference.md:447` does disclose the string behaviour, so C12's first half is a known
deviation; the silent-success path is not disclosed anywhere.

### C13 — `SplitPath` converts any numeric-*looking* element to a number

`src/jsongin/SplitPath.js:30`

`AsNumber()` accepts `'1e2'`, `'01'`, `'0x10'`, and `'Infinity'`, so field names in those forms
become array indices.

```
GetValue( { '01': 'x' }, '01' )    => undefined
GetValue( { '1e2': 'x' }, '1e2' )  => undefined
SetValue( {}, 'a.01', 'x' )        => { a: [ null, 'x' ] }   expected { a: { '01': 'x' } }
```

Only canonical integer text (plus the documented negative-index extension) should become an index.

### C14 — `Flatten` / `Expand` lose empty objects and arrays

`src/jsongin/Flatten.js:13-32`

An empty container has no leaf to emit, so it disappears rather than round-tripping.

```
Flatten( { a: {}, b: [] } )            => {}
Expand( Flatten( { a: {}, b: [] } ) )  => {}
```

### C15 — Stray circular `require` at the top of three modules

`src/jsongin/GetValue.js:3`, `src/jsongin/Parse.js:3`, `src/jsongin/Format.js:3`

```js
const jsongin = require( '../jsongin' );
```

`src/jsongin.js` assigns `module.exports` only after building the engine, so this resolves to the
partially-initialized `{}`. It is inert today because the factory parameter of the same name
shadows it inside every function — but it is a load-order landmine and reads as intentional.


---

## Consistency

### S1 — `ValueTypes` / `ArgTypes` / `ArgCount` are declared everywhere and read nowhere

`Operator-Authoring.md:91` states that `ValueTypes` is "The ShortTypes this operator accepts as
its `MatchValue`. A query which gives it anything else is rejected."

A scan of `src/`, `test/`, and `build/` finds exactly one read of any operator metadata member —
`TopLevel`, at `src/jsongin/Query.js:46`. Nothing reads `ValueTypes`, `ArgTypes`, `ArgCount`, or
`OperatorType`.

```
$size ValueTypes = 'n'
Query( { a: [ 1, 2 ] }, { a: { $size: 'two' } } )  => false, not rejected
```

Either enforce it in `Query()` / `Evaluate()` or stop documenting it as enforcement. This is
worth deciding before more operators are written against the claim.

### S2 — The unenforced metadata has already drifted

| Operator | ValueTypes | Negation | ValueTypes |
|----------|-----------|----------|-----------|
| `$eq`  | `bnsdloaru` | `$ne`  | `bnsdloau` |
| `$eqx` | `bnsdloaru` | `$nex` | `bnsdloau` |

`$ne` is implemented as `!$eq` and `$nex` as `!$eqx`, so they cannot legitimately accept a
narrower set. This is what unenforced metadata does over time.

### S3 — Stage operators declare `ArgTypes`; the guide says `ValueTypes`

`Operator-Authoring.md:69` lists `ValueTypes` as the extra member for `StageOperators`. All nine
`src/Operators/Stage/*.js` declare `ArgTypes` instead.

### S4 — `StrictEquals` is documented as `===`

`Library-Guide.md:137` — "Values must match exactly (`===`)".

It is `CompareValues( A, B ) === 0`:

```
StrictEquals( null, undefined )              => true
StrictEquals( new Date( 0 ), new Date( 0 ) ) => true
StrictEquals( { a: 1 }, { a: 1 } )           => true
```

The comment at `src/jsongin.js:213-219` explains the real rule well. The guide should say what
that comment says.

### S5 — `Usage-Browser.md` claims the two globals are the same instance

`Usage-Browser.md:31-44` — "Both refer to the same library", "the bundle's global, which is the
same instance".

`window.jsongin` is webpack's UMD export, which is the instance built at `src/jsongin.js:3`.
`window.liquicode.jsongin` is a **second** engine from `NewJsongin()` at `src/jsongin.js:332`.
Verified distinct: an operator registered on one is not visible on the other. Since
`Operator-Authoring.md:201` specifically warns that registries are per-instance, this matters.

Note also that `src/jsongin.js:333` has `// window.jsongin = jsongin;` commented out — the global
the doc describes comes from webpack, not from that line.

### S6 — `readme.md` makes a blanket MongoDB-accuracy claim the reference contradicts

`readme.md:59` — "Each MongoDB feature that is implemented here, operates accurately and in
accordance with MongoDB."

`Operator-Reference.md:447` discloses that `$currentDate` stores strings, and line 451 marks
`$push` "*(partially implemented)*". The reference is the honest document; the readme should be
softened to match it.

### S7 — `$query` is a registered operator that always returns true and is documented nowhere

`src/Operators/Query/Extension/query.js:18` — `Query: function () { return true; }`, regardless of
`MatchValue`. It is absent from `Operator-Reference.md`. `$noop` already fills this role and *is*
documented.

Both `$query` and `$noop` also carry `ToMongoQuery` and `ToSql` members that no code path calls;
`query.js:30` throws "ToSql() is not implemented."

### S8 — `src/jsongin/Path/` ships three unregistered modules

`Anscestor.js`, `Parent.js`, `Children.js` — not registered in `src/jsongin.js`, not tested, not
documented, and unreachable by any caller. They correspond to an open `todo.md:12-24` item. The
name is also misspelled (`Anscestor` → `Ancestor`), in both the file and the TODO.

### S9 — Style-guide deviations

`CLAUDE.md` says "Don't use arrow `=>` functions, plainly declare all functions."

- `src/Text.js:76,89` — arrow functions, and `var` throughout the module.
- `src/jsongin/Format.js:165` — `keys.map( ( key ) => { ... } )`.

Factory parameter naming also splits: `Project.js`, `Update.js`, and `BsonType.js` take `Engine`;
every other module takes `jsongin`.

### S10 — `Text.Matches` does not validate its parameters

`src/Text.js:56`. Every other function in the module throws a described error on a bad parameter.

```
Text.Matches( 'abc', 123 )  => TypeError: Pattern.replace is not a function
```

### S11 — `/*md` doc blocks are applied unevenly

Complete on expression (22/22), stage (9/9), and accumulator (8/8) operators. Sparse on query
(3/22) and update (2/12). `Operator-Authoring.md:266` presents the block as the convention.

### S12 — Typo: "dpecification"

`src/Operators/Update/Field/currentDate.js:50,58`.

### S13 — `DeleteValue` has no implicit-iterator branch

`src/jsongin/DeleteValue.js:42-53` walks the path with plain indexing. `GetValue` and `SetValue`
both implement an implicit iterator for a non-numeric key against an array node. Deleting through
an array by field name silently fails where getting and setting succeed.


---

## Comprehensiveness and packaging

### P1 — `dist/jsongin.min.js` predates most of v0.1.0

Last modified 2024-08-31. Scanning the bundle for the current feature set:

| Symbol | In bundle |
|--------|-----------|
| `Aggregate` | absent |
| `Diff` | absent |
| `Invert` | absent |
| `StageOperators` | absent |
| `AccumulatorOperators` | absent |
| `unwind` | absent |
| `Distinct`, `Merge`, `SafeClone` | present |

`readme.md:308` advertises "Single minified file (~35k) for web deployment" and
`Usage-Browser.md:24` pins `@0.1.0/dist/jsongin.min.js` on unpkg. A browser user following the
docs for v0.1.0 gets a v0.0.x engine with none of the aggregation pipeline.

### P2 — A failed bundle cannot stop a release

`build/build.tasks.js:94` — `run_webpack` sets `halt_on_error: false`, and it is the first step of
`publish_version` (line 178). This is the mechanism by which P1 shipped.

### P3 — The browser bundle is configured for Node

`build/webpack.config.js:21` — `target: 'node'`, plus `webpack-node-externals`, for the file the
docs present as the web deployment artifact. `webpack-node-externals` is a no-op here (the library
has no dependencies), but `target: 'node'` is wrong for a browser build.

### P4 — The npm package is 8.4 MB

`npm pack --dry-run`: 241 files, 8.4 MB packed, 9.6 MB unpacked, for a zero-dependency library
with roughly 200 KB of source. `docs/media/*.png` accounts for about 8 MB of it.

`package.json` has no `files` field and there is no `.npmignore`. Adding
`"files": [ "src", "dist", "readme.md", "license.md" ]` cuts this by ~98%.

### P5 — Coverage gaps are concentrated in error paths

`build/coverage.js` reports 172 uncovered blocks: 60 error plumbing, 8 validation throws, 104
logic branches. `Query.js` (8), `SetValue.js` (9), `Project.js` (8), `Unhybridize.js` (7) lead the
list — and C1, C2, C8, and C13 all live in those uncovered branches.


---

## What is solid

Worth stating plainly, because it is the larger part of the picture.

- **The docs and code do not drift on surface area.** Every public engine member has a page under
  `docs/guides/jsongin/`, and every page has a member. Verified in both directions, zero
  mismatches. That is rare.
- **The tooling is real.** `docs-check.js` validates 285 code fences by parsing them, 249 local
  links, and orphaned pages, and it is wired into `build_docs` as a halting step.
  `coverage.js` classifies uncovered blocks by kind rather than just counting lines.
- **The operator architecture is consistent.** 76 modules, one per file, uniform factory shape,
  per-instance registries, uniform `OpLog`/`OpError` plumbing. Adding an operator is obvious.
- **`Aggregate` gets immutability right.** `Aggregate.js:19` slices, `$group` and `$unwind` clone
  on output, and both say so in their `/*md` blocks. The caller's array and documents are
  verified untouched.
- **`Diff` / `Invert` round-trip correctly** across nested objects, arrays, dates, and additions
  and removals. `Invert` computing the inverse from the observed result rather than from the
  patch operators is a good design call, and the comment explains why.
- **`CompareValues` handles the NaN ordering trap explicitly**, with a comment explaining why
  falling through would make sorts arbitrary. `Sort` correctly separates MongoDB's array
  sort-key rule from element-wise array comparison — a subtlety most implementations miss, and
  it is documented in the source.
- **The tricky semantics are commented where they are decided**, not just in the guides:
  `StrictEquals` vs `$eq` asymmetry, `Merge` vs RFC 7386 null handling, `SafeClone` vs `Clone`
  for dates.


## Suggested order of work

1. **C1, C2, C6** — silent data loss. These return wrong answers with no error.
2. **C3, C4, C5** — `Parse`/`Format` neither round-trip with each other nor with `JSON`.
3. **C8, C9, C10, C12** — aliasing, the `Text` regex escaping, and `$currentDate`.
4. **P1, P2, P3** — rebuild the bundle, make the build halt, fix the webpack target. Then **P4**.
5. **S1** — decide whether `ValueTypes` is enforcement or documentation, and make the code and the
   guide agree. S2 and S3 fall out of that decision.
6. **S4, S5, S6** — three doc statements that are currently false.
7. **C7, C11, C13, C14, S7, S8** and the remaining consistency items.
