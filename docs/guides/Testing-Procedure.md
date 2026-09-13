# @liquicode/jsongin


# Testing Procedure

`jsongin` aims to behave exactly like MongoDB.
This page describes how that is tested, and how to run the tests.


## Running the Tests

```bash
npm test
```

Runs the unit tests and the ***parity tests*** against `jsongin`. It needs only Node, and should
  always pass. ***If `npm test` fails, something in `jsongin` is broken.***

`npm test` does not run the ***gap*** tests, described below, which are expected to fail.

```bash
npm run parity-test-mongodb
```

Runs the parity tests, and the gap tests, against a real MongoDB server, to confirm what MongoDB
  does. It looks for a server at `localhost:27017`.
To use a server somewhere else, set `JSONGIN_MONGODB_URL`:

```bash
export JSONGIN_MONGODB_URL=mongodb://dbhost:27017
```

`parity-report` uses the same variable.

```bash
npm run parity-test-jsongin
```

Runs the parity tests against `jsongin`.

```bash
npm run parity-report
```

Runs the parity tests against both MongoDB and `jsongin`, and reports where they disagree.
See [Measuring Parity](#measuring-parity).

```bash
npm run coverage
```

Reports the parts of `src/` which no test runs. See [Coverage](#coverage).

```bash
npm run scope-check
```

Reads the source, without running it, to check that every operator passes its `Scope` on.
See [The Scope Rules](./Operator-Authoring.md#the-scope-contract).

```bash
npm run api-coverage
```

Reports how many of MongoDB's operators `jsongin` has, by counting the rows of the
  [Operator Reference](./Operator-Reference.md).

```bash
npm run types-check
```

Checks that the type declarations in `types/` and the ES module wrapper match the engine.


## How the Tests Are Organized

`test/` has three folders:

| **Folder** | **Checks** |
|------------|--------------------------|
| `Unit Tests/` | That `jsongin` works as documented. |
| `Parity Tests/` | That `jsongin` behaves like MongoDB. |
| `Browser Tests/` | That the engine works in a browser. |

***Which folder does a new test go in?*** Ask whether MongoDB has the same behavior.

- If it does, write a ***parity*** test, so it can be run against MongoDB too.
- If it does not, such as a `jsongin` extension, a function MongoDB has no match for, or a rule
  about the `jsongin` API, write a ***unit*** test.

For example, `$eq` on an array field is a parity test. `$eqx`, `Flatten`, `Diff`, and "this
  function does not change its argument" are unit tests.

A parity test is better than a unit test for the same behavior, because it can be checked
  against MongoDB.


### Unit Tests

The files are numbered so that the most basic tests run first. When several tests fail, the
  first failure is usually the cause of the rest.

| **Numbers** | **Cover**                                                                  |
|-------------|------------------------------------------------------------------------------|
| `0xx`       | Javascript features the library relies on.                                  |
| `1xx`       | The engine functions, text helpers, dates, errors, scopes, and JSON Schema. |
| `2xx`       | The operators, one file per kind.                                           |
| `5xx`       | Projection.                                                                 |

`npm test` also runs `test/Parity Tests/jsongin-Tests.js`, the parity tests against `jsongin`.


### Parity Tests

The same tests can be run against different engines.

```
Parity Tests/
	Drivers/                    one adapter per engine
	MongoDB-Tests.js            runs the tests against MongoDB
	jsongin-Tests.js            runs the tests against jsongin
	NeDB-Tests.js               for information only
	Seald-NeDB-Tests.js         for information only
	Query Tests/
		Query Tests.js          lists this area's test files
		Query Gaps.js           this area's gap tests
		test-suite/             the tests
	Update Tests/
	Projection Tests/
	Aggregate Tests/
```

| **File** | **Decides** |
|-----------|-----------|
| `<Engine>-Tests.js` | which driver, and which areas to run |
| `<Area>/<Area> Tests.js` | which test files the area runs |
| `<Area>/test-suite/*.js` | the tests themselves |

Only the top level names an engine, so a new test file is added in one place and every engine
  runs it.

Every driver has the same functions, such as `SetData`, `Find`, `Update` and `Aggregate`, so one
  test can run against `jsongin` or a real database.

***MongoDB is the authority.*** A parity test states what MongoDB does, and is run against MongoDB
  before it is trusted. Each result means:

| **MongoDB** | **jsongin** | **Means** |
|:-----------:|:-----------:|--------------------|
| pass | pass | The behavior matches. |
| pass | fail | A ***parity gap***: `jsongin` is wrong. |
| fail | — | A ***test bug***: the test does not describe what MongoDB does. |

Some notes for writing parity tests and drivers:

- ***Test refusals too.*** A driver throws errors instead of logging them, so a test can check
  that something was refused. Check only that it was refused, not the error message, which
  differs between engines.
- ***The parity tests use the default engine***, with no settings, because the claim is that the
  defaults behave like MongoDB. `test/Unit Tests/130) Engine Function Tests.js` checks the
  defaults. To test other settings, pass them to the driver:

  ```js
  // docs-check: skip - the path is relative to the test suite, not to this page.
  const Driver = require( './Drivers/jsongin-Driver.js' )( { OpLog: console.log } );
  ```

- ***An area file receives its driver as a parameter.*** Mocha runs `describe()` while the file
  is loaded, so a driver assigned afterwards would be too late.
- ***Open one database connection for the whole run.*** A `MongoClient` is already a connection
  pool. Opening one per call can use up the machine's network ports, and tests then fail with
  `EADDRINUSE`.
- ***Extensions do not belong here.*** `$exprx` is tested in
  `test/Unit Tests/260) Extension Operator Tests.js`, and `$eqx`, `$nex` and `$noop` in the `2xx`
  files beside the operators they resemble.

The NeDB runners are only for information. Those engines differ from MongoDB in their own ways,
  and only run the query tests.


### Gap Tests

A ***gap test*** describes something MongoDB does which `jsongin` does not, on purpose or not
  yet. It passes against MongoDB and fails against `jsongin`.

Gap tests live in each area's `<Area> Gaps.js` file.
`MongoDB-Tests.js` and `parity-report` run them, and report them apart from the parity results.
`jsongin-Tests.js` does not run them, so `npm test` stays green.

Some gaps are deliberate, such as `jsongin` accepting an empty update document `{}`. Each one says
  why beside its test.
When a missing behavior is built, its gap test passes, `parity-report` marks it `IMPLEMENTED`,
  and the test moves into `test-suite/`.


## Measuring Parity

```bash
npm run parity-report
npm run parity-report -- --verbose
```

Runs the same tests against MongoDB and `jsongin` and compares the results, test by test:

```
   area          compared   agree   gaps   test bugs
   ----------------------------------------------------
   Query              ...     ...      0           0
   Update             ...     ...      0           0
   Projection         ...     ...      0           0
   Aggregate          ...     ...      0           0
   ----------------------------------------------------
   total              ...     ...      0           0

   parity     100.0%   (... of ... compared behaviors agree)

   coverage   ...%     (... of ... documented operators are implemented)
```

It exits with an error when there is a gap, so it can stop a build.

- ***Parity*** is the share of parity tests on which the two engines agree. It should be 100%.
  It only covers what the tests cover, so add tests to make it mean more.
- ***Coverage*** is the share of MongoDB's operators `jsongin` has at all. It is expected to be
  below 100%.


## Measuring the JSON Schema Functions

```bash
npm run json-schema-report
npm run json-schema-report -- --verbose
npm run json-schema-report -- --draft 2020-12 --set required
```

The JSON Schema functions are tested against the specification's official test suite, which is
  kept in `test/json-schema-test-suite/`, so nothing is downloaded.
The report runs every case of every draft and prints how many pass in each set:

```
   draft     set                passed  excepted   total  claimed
   --------------------------------------------------------------
   2020-12   required              ...         0     ...      yes
   2020-12   optional              ...         0     ...      yes
   ...
```

A set is ***claimed*** by listing it in `CLAIMED` in `build/json-schema-suite.js`.
`test/Unit Tests/170) JSON Schema Suite Tests.js` checks every claimed set, so a claimed case
  which fails makes `npm test` fail. Claim a set once the report shows it fully passing.

A claim can list ***exceptions***: cases `jsongin` cannot pass, each with a reason. An exception
  is checked to still fail, so it is noticed if it starts passing.
The only exception is draft 4's `zeroTerminatedFloats`, which says `1.0` is not an integer.
  Javascript cannot tell `1.0` from `1`.

The `$jsonSchema` query operator is tested against MongoDB like the other operators.


## Coverage

```bash
npm run coverage

# Details for files whose names match:
npm run coverage -- --file CompareValues
```

Coverage uses Node's built-in coverage, so it needs nothing extra.

Parts of the code no test runs are sorted into three kinds:

| **Kind**     | **What it is**                                                             |
|--------------|-----------------------------------------------------------------------------|
| `plumbing`   | A `catch` block, or a call to `OpError` or `OpLog`.                        |
| `validation` | A `throw` for a bad argument.                                              |
| `logic`      | Everything else. Look at each one.                                         |

***Check `plumbing` carefully.*** Error messages are only built when something goes wrong, so a
  broken one can go unnoticed for a long time.

Some `logic` blocks are safety checks which can never run, and are not worth chasing.


## Checking the Documentation

```bash
npm run check-docs

# List every problem, not just the first few:
npm run check-docs -- --verbose
```

It checks:

| **Check**   | **Checks that**                                                            |
|-------------|-----------------------------------------------------------------------------|
| `fences`    | Every ` ```js ` block is valid Javascript.                                 |
| `links`     | Every local link points to a file which exists.                            |
| `anchors`   | Every link to a `#section` finds that section.                             |
| `orphans`   | Every page under `docs/` is linked from another page.                      |
| `operators` | Every operator file has an `/*md` comment.                                 |
| `inventory` | Every `Yes` row of the [Operator Reference](./Operator-Reference.md) is a real operator, and every operator has a row. |
| `llm`       | The [LLM Context](./Llm-Context.md) page and the operators agree.         |
| `shared`    | The Operator Reference's tables of shared names agree with the operators.  |
| `examples`  | Every ` ```js ` block runs, and every `===` claim in it is true.           |

An anchor can be an `<a id="...">` tag or a heading, in the form docsify gives it.

***Write results as comments*** in a ` ```js ` block, not as bare values:

```js
let doc = { a: 1 };
let merged = jsongin.Merge( doc, null );
// merged matches doc
```

Use `returns` after a call, `is` for a variable, and `matches` for "same content as".
Use `===` only where it is really true, such as `jsongin.Query( document, { id: 1001 } ) === true`.
It cannot be used to compare objects or arrays.

A block which is not Javascript, such as output or a function signature, has no language tag and
  is not checked.

`npm run "build docs"` runs this check last, so a broken example, link or page stops the build,
  and so stops a release.


## Test Output

`npm run "run tests"` runs the tests and saves the output to `tests.md`, which is published as
  [Testing Output](../external/tests.md).


## See Also

- [Operator Authoring](./Operator-Authoring.md)
- [OpLog](./OpLog.md)
- [Testing Output](../external/tests.md)
