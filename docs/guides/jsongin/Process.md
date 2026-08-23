# @liquicode/jsongin


# The Process Runtime

A ***process*** is a JSON document describing work.
A ***run*** is a JSON value describing how far that work has got.
The engine is a pure function from one run to the next, and holds nothing between calls.

```js
// docs-check: skip
let run = jsongin.ProcessStart( Process, Input );
run = jsongin.ProcessStep( Process, run );
run = jsongin.ProcessExecute( Process, run, MaxSteps );
run = jsongin.ProcessResume( Process, run, Result );
run = jsongin.ProcessResume( Process, run, undefined, Error );
```

***The process is passed alongside the run, never carried inside it.***
They are stored separately, and a caller who keeps a run must keep track of which process it
  belongs to.
The run carries the process's `Name` as a stamp, so that stepping a stored run against the
  wrong process fails at the first call instead of computing a wrong answer quietly.

This is jsongin's own language and not MongoDB's.
What an expression computes and what a query matches are still MongoDB's - they are still
  [`Evaluate()`](./Evaluate.md) and [`Query()`](./Query.md), at parity, unchanged.
Only the step sequencing, the branching, the run value, the suspension and the error
  propagation are invented here.


## A Process

```js
const checkout = {
	Name: 'Checkout',
	Steps: [
		{ $do: { total: { $add: [ '$sub', '$tax' ] } } },
		{
			$when: {
				Check: { total: { $gt: 100 } },
				Then: [ { $do: { discount: { $multiply: [ '$total', 0.1 ] } } } ],
				Else: [ { $do: { discount: 0 } } ],
			},
		},
		{ $call: { Name: 'ChargeCard', With: { amount: { $subtract: [ '$total', '$discount' ] } }, Into: 'receipt' } },
		{ $return: '$receipt' },
	],
};
```

A process is a ***document***, not a bare array, so it has somewhere to keep its name.

Each step is ***one document with one step operator***, the way a pipeline stage is.
An operator taking more than one argument ***nests*** them, which is what MongoDB does
  everywhere - `$lookup`, `$bucket`, `$let` - and what keeps "one key, one operator" true.
Argument names are PascalCase because these are jsongin operators rather than MongoDB ones.

See [Step Operators](./Step-Operators.md) for what each one does.


## A Run

```js
let run = jsongin.ProcessStart( checkout, { sub: 100, tax: 8 } );

run.Process		// returns 'Checkout'
run.Status		// returns 'ready'
run.Cursor		// returns [ 0 ]
run.State		// returns { sub: 100, tax: 8 }
```

| Field | Meaning |
|---|---|
| `Process` | The `Name` of the process this run belongs to, or `null` for a process with no name. |
| `Status`  | `ready` - a step is waiting to run. `waiting` - suspended on a `$call`. `done` - halted with a `Result`. `failed` - halted with an `Error`. |
| `Cursor`  | The position of the ***next*** step. `[ 1, 'Then', 0 ]` is the first step of the `Then` branch of step 1. A loop writes its branch element as a pair, so `[ 1, [ 'Do', 3 ], 0 ]` is the first step of the fourth pass. An empty cursor means the process is over. |
| `State`   | The document the process is working on. `ProcessStart()` sets it from `Input`, cloned. |
| `Scope`   | The variable bindings, in the stored form [`Scope.ToJSON()`](./Scope.md) writes. |
| `Waiting` | Present only while `Status` is `waiting`. `{ Name, With, Into }`. |
| `Result`  | Present only when `Status` is `done` ***and there is a value***. |
| `Error`   | Present only when `Status` is `failed`. `{ Code, Message, Cursor }`. |
| `Reentry` | Present only while the cursor has just climbed back into a loop. The branch element it came out of, which is how a loop learns which pass just ended. |

***The run has no methods.*** Everything on it is data.

***The optional fields are left off rather than set to `undefined`.***
That is a storage requirement and not a preference:
  [`Format()`](./Format.md) drops a field whose value is `undefined` and
  [`Parse()`](./Parse.md) does not put it back, so a run carrying `Result: undefined` would not
  survive being written down - and a run which cannot be written down is not a run.


## Running One

`ProcessExecute()` steps until the run is no longer `ready`.

```js
run = jsongin.ProcessExecute( checkout, run );

run.Status			// returns 'waiting'
run.Waiting.Name	// returns 'ChargeCard'
run.Waiting.With	// returns { amount: 97.2 }
run.Waiting.Into	// returns 'receipt'
```

***`$call` does not call.***
The engine performs no I/O, has no dependency, and contains no `async`.
It stops and describes what it wants; the host does the work, does the awaiting, and hands the
  answer back.

```js
run = jsongin.ProcessResume( checkout, run, { confirmation: 'abc123' } );
run.Status		// returns 'ready'

run = jsongin.ProcessExecute( checkout, run );
run.Status		// returns 'done'
run.Result		// returns { confirmation: 'abc123' }
```

A call which failed is reported through the fourth parameter rather than through a fifth
  function:

```js
let failing = jsongin.ProcessExecute( checkout, jsongin.ProcessStart( checkout, { sub: 100, tax: 8 } ) );
failing = jsongin.ProcessResume( checkout, failing, undefined, new Error( 'the card was declined' ) );

failing.Status			// returns 'failed'
failing.Error.Code		// returns 'StepFailed'
failing.Error.Message	// returns 'the card was declined'
failing.Error.Cursor	// returns [ 2 ]
```

A host with a code of its own may pass `{ Code: 'CardDeclined', Message: '...' }` instead.


## How a Step Reads Its Data

Inherited from MongoDB rather than invented, which is the point of building this on jsongin:

- ***`'$field'` reads the state document.***
  The state is `$$CURRENT` and `$$ROOT`, so a bare field path is the shorthand it already is
  everywhere else in the engine.
- ***`'$$name'` reads a variable binding.***
  `$let`, `$map`, `$filter` and `$reduce` behave inside a step exactly as they do anywhere.
- ***`$$NOW` is fixed for the whole run***, not re-read per step, the way it is fixed for a
  whole aggregation pipeline.
  A run resumed an hour later keeps the instant it started with.

```js
const stamped = { Name: 'Stamped', Steps: [ { $do: { at: '$$NOW' } } ] };
let stamped_run = jsongin.ProcessStart( stamped, {} );

let started_at = stamped_run.Scope.Variables.NOW.getTime();
stamped_run = jsongin.ProcessExecute( stamped, stamped_run );

let stamped_matches = ( stamped_run.State.at.getTime() === started_at );
stamped_matches		// returns true
```


## Stepping

`ProcessStep( Process, Run )` runs exactly one step:

1. If `Status` is not `ready`, ***the run comes back unchanged.***
   Stepping a halted run is a no-op rather than an error, which is what lets `ProcessExecute()`
   be a plain loop.
2. Read the step at `Cursor`. If there is none, halt.
3. Execute it, producing a new `State`, `Status` and `Cursor`.
4. Return a ***new*** run. The one passed in is never modified.

***Advancing the cursor.***
Increment the last element.
If that runs past the end of the branch, drop it along with the branch name above it and
  increment the element before.
Repeat. An empty cursor means the process is over.

***The one exception is a step which repeats***, which the walk lands on rather than steps past.
That single rule is the whole of what makes [`$while`](./Step-Operators.md#$while) and
  [`$forEach`](./Step-Operators.md#$forEach) loops rather than branches: every other step is
  finished with once one of its branches ends, while a loop is arrived at again and decides for
  itself whether to run its body once more or to move on.
The loop therefore lives ***in the cursor***, and a run stopped in the middle of a pass is an
  ordinary run which can be stored and picked up later - there is no call stack to write down.

```js
const branching = {
	Name: 'Branching',
	Steps: [
		{ $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ] } },
		{ $do: { seen: true } },
	],
};

let entered = jsongin.ProcessStep( branching, jsongin.ProcessStart( branching, { n: 9 } ) );
entered.Cursor		// returns [ 0, 'Then', 0 ]

let inside = jsongin.ProcessStep( branching, entered );
inside.Cursor		// returns [ 1 ]
```

***Running off the end of the top level `Steps` is the same as `{ $return: '$$ROOT' }`.***
A process which computes and never says so still hands back the work it did.

```js
let fell_off = jsongin.ProcessExecute( branching, jsongin.ProcessStart( branching, { n: 9 } ) );
fell_off.Status		// returns 'done'
fell_off.Result		// returns { n: 9, big: true, seen: true }
```

***A budget is required.***
`ProcessExecute()` is the only function here which can loop, so it is the only one which needs
  one. It defaults to ***1000 steps*** and fails with `StepLimitExceeded` when it is passed.
`ProcessStep()` takes no budget, because one step cannot loop.

```js
let out_of_budget = jsongin.ProcessExecute( branching, jsongin.ProcessStart( branching, { n: 9 } ), 2 );
out_of_budget.Status		// returns 'failed'
out_of_budget.Error.Code	// returns 'StepLimitExceeded'
```


## Failure

***Nothing here throws.***
A failure is a run with `Status: 'failed'` and an `Error` of `{ Code, Message, Cursor }`.
An operator still throws, the way every operator in this engine does; the throw is caught and
  turned into a failed run at the cursor which raised it.

That follows from what the design is for. The standing rule is that
  *an operator reports and the engine decides how loudly* - except that here there is no caller
  to raise it to, because the whole point is that a run is a value which can be stored and
  looked at later, and an error which vanished into a `throw` could not be.

| Code | Raised when |
|---|---|
| `BadProcess` | the process is not a document with a `Steps` array, a step is not a document with exactly one key, or a step operator found its own arguments malformed - a `$while` with an empty `Do`, say |
| `BadRun` | the run is not shaped as a run, or belongs to a different process |
| `NoSuchStep` | the cursor addresses a step which is not there |
| `UnknownOperator` | a step names an operator which is not registered |
| `StepFailed` | an operator refused, an expression threw, or the host reported a failed call |
| `ResumeNotWaiting` | `ProcessResume()` was called on a run which is not waiting |
| `StepLimitExceeded` | `ProcessExecute()` ran out of budget |
| `Thrown` | a [`$throw`](./Step-Operators.md#$throw) said so, and nothing caught it |

```js
const wrong = { Name: 'Wrong', Steps: [ { $nosuchthing: 1 } ] };
let refused = jsongin.ProcessStep( wrong, jsongin.ProcessStart( wrong, {} ) );

refused.Status			// returns 'failed'
refused.Error.Code		// returns 'UnknownOperator'
refused.State			// returns {}
```

A failed run keeps the state it had reached, so what the process managed to do before it broke
  is still there to look at.

***A failure may be handled instead of halting.***
[`$try`](./Step-Operators.md#$try) guards a list of steps, and a failure raised inside it sends
  the run into that step's `Catch` branch rather than halting it.
The search for a handler is ***a walk outward through the cursor***, which already records every
  step the run is inside and which branch of each it entered - so nothing has to be carried on
  the run for it, and a step entered through its own handler branch is skipped, which is what
  keeps a failure raised inside a `Catch` from being handed back to that same `Catch`.

```js
const guarded_run = {
	Name: 'GuardedRun',
	Steps: [
		{
			$try: {
				Do: [ { $throw: 'no good' } ],
				Catch: [ { $do: { recovered: true } } ],
				As: 'error',
			},
		},
	],
};

let recovered = jsongin.ProcessExecute( guarded_run, jsongin.ProcessStart( guarded_run, {} ) );
recovered.Status				// returns 'done'
recovered.State.recovered		// returns true
```

***The first four codes in the table above, along with `ResumeNotWaiting` and
  `StepLimitExceeded`, are never caught.***
A fault in the process document must not be swallowed by that document's own error handler, and
  the step budget is the caller's protection rather than the process's to defeat.
See [`$try`](./Step-Operators.md#$try) for the whole of that line.


## Storage

***A run is a value which survives being written down.***
This is the claim the whole design rests on, and the reason
  [`Format()`](./Format.md) and [`Parse()`](./Parse.md) grew a `TypedValues` option before any
  of this was built: a `Date` in `$$NOW`, a `RegExp` in the state, and the nothing
  `$$REMOVE` is bound to are all values plain JSON cannot hold.

```js
const options = { TypedValues: true };

let live = jsongin.ProcessStart( checkout, { sub: 100, tax: 8 } );
let reloaded = jsongin.Parse( jsongin.Format( live, options ), options );

let same = ( jsongin.Format( jsongin.ProcessStep( checkout, reloaded ), options )
	=== jsongin.Format( jsongin.ProcessStep( checkout, live ), options ) );
same		// returns true
```

Store the run and the name of its process. The process document itself is yours to keep
  wherever you keep your code.


## The Invariants

Six things must be true of the design, and they are checkable without any authority - MongoDB
  has no process language, so there is no server to compare a run against.
They are `build/process-check.js`, which drives twelve processes and applies all six at every
  step of each:

| | |
|---|---|
| 1 | ***Storage is transparent.*** Stepping a stored run gives what stepping the live one gives. |
| 2 | ***Stepping is deterministic.*** The same run stepped twice gives the same result. |
| 3 | ***`ProcessExecute()` equals repeated `ProcessStep()`.*** The wrapper cannot diverge from the primitive. |
| 4 | ***Runs are independent.*** Two runs stepped alternately never affect each other. |
| 5 | ***`ProcessStep()` is total.*** It always returns a run and never throws. |
| 6 | ***The input run is never modified.*** Every function returns a new value. |

```
npm run process-check
```

Rule 4 is what the [scope](./Scope.md) being a value rather than engine state bought, and it is
  tested rather than assumed.


## What Is Not Built

Named here so that nobody looks for them:

- ***`async` inside `src/`.*** The host awaits; the engine does not.
- ***Closures and user-defined procedures.***
- ***A continuation object beyond the run value itself.***
- ***A caller scope carried into [`Query()`](./Query.md)***, which is why a `$when` check cannot
  see a `$$name` the run bound.

Expected later: parallel steps.


## See Also

- [Step Operators](./Step-Operators.md)
- [Scope](./Scope.md)
- [`Evaluate()`](./Evaluate.md)
- [`Query()`](./Query.md)
- [`Format()`](./Format.md)
- [`Parse()`](./Parse.md)
