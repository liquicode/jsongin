# @liquicode/jsongin


# Testing

`jsongin` claims accurate compatibility with MongoDB.
That claim is only worth as much as the tests behind it, so the suite is organized to make it
  checkable rather than merely asserted.


## Running the Tests

```bash
npm test
```

This runs every test file at the top level of `test/`.

```bash
npm run coverage
```

This reports the parts of `src/` which the test suite never executes.


## How the Tests are Organized

The top-level test files are numbered, and the number is the point: the suite runs from the
  foundations upward, so the first failure you see is the most fundamental one.

| **Range** | **Covers**                                                                  |
|-----------|------------------------------------------------------------------------------|
| `0xx`     | Javascript compatibility. Assumptions the library makes about the language. |
| `1xx`     | Core engine functions, the `Text` helpers, date handling, error handling.   |
| `2xx`     | Operators, one file per kind: comparison, logical, expression, accumulator, stage, update. |
| `3xx`-`6xx` | The public mechanics end to end: query, update, projection, aggregate.     |

A failure in a `2xx` file usually explains several failures in the `5xx` files, which is why
  the order matters.


## The Drivers

`test/Drivers/` holds a small adapter for each engine the suite can run a test against:

- `jsongin-Driver.js`
- `MongoDB-Driver.js`
- `NeDB-Driver.js`
- `Seald-NeDB-Driver.js`
- `Json-Criteria-Driver.js`

Each driver exposes the same interface — `SetData`, `Find`, `Update`, `Aggregate`, and so on —
  so the ***same test suite*** can be pointed at `jsongin` or at a real database.

This is how compatibility is established rather than assumed.
When the v0.1.0 date handling, sort ordering, and projection behavior were reworked, each case
  was run against a MongoDB 8.0 server through this harness and the results compared.

The shared suites live under `test/Query Tests/test-suite/`, `test/Update Tests/`,
  `test/Projection Tests/`, and `test/Aggregate Tests/`.

> ***Note*** : `npm test` matches `test/*.js` and therefore runs only the top level.
  The comparison suites in the subfolders are ***not*** part of the default run, because most
  of them need a database that is not there. Run one deliberately:
>
> ```bash
> npx mocha -u bdd "test/Query Tests/Query Tests - MongoDB.js" --timeout 0
> ```


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
