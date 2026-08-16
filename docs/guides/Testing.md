# @liquicode/jsongin


# Testing

`jsongin` claims accurate compatibility with MongoDB.
That claim is only worth as much as the tests behind it, so the suite is organized to make it
  checkable rather than merely asserted.


## Running the Tests

```bash
npm test
```

This runs the unit tests and the parity suites under `jsongin`. It needs nothing but Node.

```bash
npm run parity-test-mongodb
```

This runs the shared suites against a real MongoDB server, establishing the baseline of what
  MongoDB actually does. It needs a server at `localhost:27017`.

```bash
npm run parity-test-jsongin
```

This runs the same suites against `jsongin`, extensions included.

```bash
npm run parity-report
```

This runs the shared suites against ***both*** engines and reports where they disagree.

```bash
npm run coverage
```

This reports the parts of `src/` which the test suite never executes.


## How the Tests are Organized

`test/` has three folders, and they answer three different questions.

| **Folder** | **Question it answers** |
|------------|--------------------------|
| `Unit Tests/` | Is `jsongin` correct and stable? |
| `Parity Tests/` | Does `jsongin` agree with MongoDB? |
| `Browser Tests/` | Do the engine functions work in a browser? |


### Unit Tests

The files are numbered, and the number is the point: the suite runs from the foundations
  upward, so the first failure you see is the most fundamental one.

| **Range** | **Covers**                                                                  |
|-----------|------------------------------------------------------------------------------|
| `0xx`     | Javascript compatibility. Assumptions the library makes about the language. |
| `1xx`     | Core engine functions, the `Text` helpers, date handling, error handling.   |
| `2xx`     | Operators, one file per kind: comparison, logical, expression, accumulator, stage, update. |
| `3xx`-`6xx` | The public mechanics end to end: query, update, projection, aggregate.     |

A failure in a `2xx` file usually explains several failures in the `5xx` files, which is why
  the order matters.

`npm test` also runs `test/Parity Tests/jsongin-Tests.js`, which is the whole parity inventory
  under the `jsongin` driver. Those suites are the definition of correct behavior, so the
  default run should not be allowed to drift from them.


### Parity Tests

`test/Parity Tests/` is driver switchable. One shared suite, several engines.

```
Parity Tests/
	Drivers/                    one adapter per engine
	MongoDB-Tests.js            the baseline: which engine, and which areas
	jsongin-Tests.js            the engine under test
	NeDB-Tests.js               informational
	Seald-NeDB-Tests.js         informational
	Query Tests/
		Query Tests.js          which suites this area runs
		test-suite/             the shared suites themselves
	Update Tests/
	Projection Tests/
	Aggregate Tests/
```

There are three levels, and each has exactly one job:

| **Level** | **Names** |
|-----------|-----------|
| `<Engine>-Tests.js` | the driver, and which areas to run |
| `<Area>/<Area> Tests.js` | which suites the area runs |
| `<Area>/test-suite/*.js` | the tests |

Nothing below the top level names an engine, so ***adding a suite is a one line change in one
  place*** and every engine picks it up.

Every driver exposes the same interface — `SetData`, `Find`, `Update`, `Aggregate`, and so on —
  so the ***same test suite*** can be pointed at `jsongin` or at a real database.

> ***Note*** : an area file takes its `Driver` as a parameter, and it has to. `describe()` runs
  its callback while the file is being required, so the suites capture whatever `Driver` holds
  at that moment. Assigning a driver to the module afterwards cannot reach them — the suites
  have already run with what they were given.

***MongoDB is the source of truth.*** A shared suite asserts what MongoDB does, and the way to
  establish that is to run it against a server rather than to reason about it. When a new
  behavior is added or an existing one is questioned, the test is written against MongoDB
  first and only then run under `jsongin`.

***The parity run uses an unconfigured engine.*** `jsongin-Tests.js` calls the driver with no
  settings, so it takes the instance the package exports — the one a caller gets from
  `require( '@liquicode/jsongin' )`.

That is the claim being tested. Parity is a property of the ***defaults***: MongoDB behavior is
  what `jsongin` does when it is told nothing. Passing settings to the parity driver, even
  settings which only restate a default, would let a change to that default pass the one suite
  whose job is to catch it.

The defaults themselves are pinned by `Default Settings Tests` in
  `test/Unit Tests/130) Engine Function Tests.js`. Changing a default is allowed; changing one
  without noticing that it moves the parity claim is what those tests prevent.

To test a non-default configuration, pass settings to the driver deliberately:

```js
const Driver = require( './Drivers/jsongin-Driver.js' )( { PathExtensions: true } );
```

That gives each test outcome a meaning:

| **MongoDB** | **jsongin** | **What it means** |
|:-----------:|:-----------:|--------------------|
| pass | pass | The behavior is verified identical. |
| pass | fail | A ***parity gap***. `jsongin` is wrong. |
| fail | — | A ***test bug***. The test asserts something MongoDB does not do. |

A suite which exercises a `jsongin` extension has no MongoDB counterpart and so has no
  baseline. Those are guarded by `Options.Extensions`, which only `jsongin-Tests.js` turns on.
  `Exprx Tests.js` is the only one today. `build/parity.js` reports how many tests that
  excludes rather than silently skipping them.

The `NeDB` and `Seald-NeDB` runners are informational. Those engines diverge from MongoDB on
  their own account, and their failures are facts about them, not about `jsongin`. They list
  only the query area, because their drivers implement `Find` and not `Update` or `Aggregate`.


## Measuring Parity

```bash
npm run parity-report
npm run parity-report -- --verbose
```

This generates a runner for each engine over the same suite list, runs both, and matches the
  results test by test:

```
   area          compared   agree   gaps   test bugs
   ----------------------------------------------------
   Query              102     102      0           0
   Update               1       1      0           0
   Projection           8       8      0           0
   Aggregate           21      21      0           0
   ----------------------------------------------------
   total              132     132      0           0

   parity   100.0%   (132 of 132 compared behaviors agree)
```

It exits non-zero when there is a gap, so it can gate a build.

Read the number for what it is. It is the share of ***shared-suite assertions*** the two
  engines agree on, so it cannot speak for behavior no shared suite exercises yet. A high score
  means "nothing known is broken", not "nothing is broken". Growing the shared suites is what
  makes the number mean more, which is why a new parity test is worth more than a new unit
  test for the same behavior.


## Coverage

```bash
npm run coverage

# Detail for the files which match a name:
npm run coverage -- --file CompareValues
```

Coverage uses Node's own V8 collector, so it adds no dependency.
`NODE_V8_COVERAGE` tells Node to dump raw coverage, mocha runs the suite, and
  `build/coverage.js` merges the dumps and maps the uncovered ranges back to lines.

Uncovered blocks are grouped into three kinds, because they deserve different amounts of
  attention:

| **Kind**     | **What it is**                                                             |
|--------------|-----------------------------------------------------------------------------|
| `plumbing`   | A catch block, or a call to `OpError` or `OpLog`.                          |
| `validation` | A throw which rejects a malformed argument. Covering it pins the message.  |
| `logic`      | Everything else. Read these one at a time.                                 |

***`plumbing` is where the defects hide.***
A message which is only built when something has gone wrong is never built by a test which
  asserts success. The v0.1.0 release found a `ReferenceError` sitting in the failure path of
  six update operators for exactly this reason: the code only ran when a store failed ***and***
  an `OpLog` was configured, which no test did at the same time.

Some `logic` blocks are genuinely unreachable defensive code and are not worth chasing.


## Checking the Documentation

```bash
npm run check-docs

# List every finding rather than the first few:
npm run check-docs -- --verbose
```

Three things are checked, all of them cheap to detect and expensive to find by reading:

| **Check**  | **Asserts**                                                                 |
|------------|------------------------------------------------------------------------------|
| `fences`   | Every ` ```js ` block parses as Javascript.                                 |
| `links`    | Every local markdown link resolves to a file which exists.                  |
| `orphans`  | Every page under `docs/` is reachable from another page.                    |

***What goes inside a ` ```js ` fence must be code.***
A result belongs in a comment rather than in a bare expression:

```js
let merged = jsongin.Merge( doc, null );
// merged matches doc (effectively, a clone)
```

Use `returns` after a call, `is` for a variable's value, and `matches` for same-content-as.
`===` is kept only where it is literally true, as in
  `jsongin.Query( document, { id: 1001 } ) === true`; it is not used for objects or arrays,
  where reference equality does not hold.

A block which is ***not*** Javascript — program output, the shape of a value, a method
  signature — carries no language tag and is not checked.

This check is worth more than it looks.
Enforcing it is what found a wrong operator name (`eq$` for `$eq`), a missing colon, an array
  declared with braces, and four headline examples in the `Query` guide which inverted operator
  and field and therefore returned `false` where the document claimed `true`.

The check runs as the last step of `npm run "build docs"`, so a broken fence, a dead link, or an
  unlinked page halts the docs build.
Because `publish version` runs `build docs`, it also blocks a release.


## Test Output

`npm run "run tests"` runs the suite and captures its output into `tests.md`, which is
  published as [Testing Output](../external/tests.md).
This is a build task, not a test run — see `build/build.tasks.js`.


## See Also

- [Operator Authoring](./Operator-Authoring.md)
- [OpLog](./OpLog.md), which is what the `plumbing` coverage category is about.
- [Testing Output](../external/tests.md)
