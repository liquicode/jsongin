# JSON-Schema-Test-Suite

The official JSON Schema test suite, vendored so that `npm test` runs without a network.

- Source: https://github.com/json-schema-org/JSON-Schema-Test-Suite
- Commit: `f6fd52a` (2026-09-06)
- License: MIT, see `LICENSE` in this folder.

## What is here

| Folder                | Holds                                                                  |
|-----------------------|------------------------------------------------------------------------|
| `tests/draft2020-12`  | Draft 2020-12 cases. `optional/` and `optional/format/` sit beneath.  |
| `tests/draft2019-09`  | Draft 2019-09 cases, the same layout.                                  |
| `tests/draft7`        | Draft 7 cases, the same layout.                                        |
| `tests/draft4`        | Draft 4 cases, the same layout.                                        |
| `remotes/`            | Schemas the `refRemote` cases reach at `http://localhost:1234/...`.    |

Drafts 3 and 6 are not vendored because the engine does not dispatch to them.

## How it is used

`build/json-schema-suite.js` enumerates the cases and serves `remotes/` to the evaluator
  through a registry, so nothing here is ever fetched.

`test/Unit Tests/170) JSON Schema Suite Tests.js` runs the ***claimed*** sets under mocha, so a
  regression in a claimed set fails `npm test`.

`npm run json-schema-report` runs ***every*** set and prints the pass counts, claimed or not.
  An unclaimed set is the roadmap: it is measured so that it is revisited, and it cannot make
  `npm test` red.

## Updating

Clone the upstream repository at the commit you want, copy the four draft folders, `remotes/`
  and `LICENSE` over this folder, and put the new commit and date at the top of this file.
