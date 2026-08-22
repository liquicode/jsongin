# @liquicode/jsongin


# Step Operators

The steps of a process, read by the [process runtime](./Process.md).
A process is a document with a `Steps` array, and each step is one document with one step
  operator in it.

| **Step**                   | **Usage**                                                          |
|----------------------------|--------------------------------------------------------------------|
| [`$do`](#$do)              | `{ $do: { field: expression, ... } }`                              |
| [`$when`](#$when)          | `{ $when: { Check: query, Then: [ steps ], Else: [ steps ] } }`    |
| [`$call`](#$call)          | `{ $call: { Name: 'name', With: { ... }, Into: 'path' } }`         |
| [`$return`](#$return)      | `{ $return: expression }`                                          |

***These are jsongin operators, not MongoDB ones.***
MongoDB has no process language, so there is nothing to be at parity with here and nothing for
  `build/api-coverage.js` to count.
Their argument names are PascalCase for the same reason.


<a id="$do"></a>$do
---------------------------------------------------------------------

Usage: `$do: { field: expression, ... }`

Changes the state of a running process.
Each field is computed from the current state and written to it, leaving the other fields in
  place.

```js
const totals = {
	Name: 'Totals',
	Steps: [
		{ $do: { total: { $add: [ '$sub', '$tax' ] } } },
		{ $do: { rounded: { $round: [ '$total', 0 ] } } },
	],
};

let run = jsongin.ProcessExecute( totals, jsongin.ProcessStart( totals, { sub: 100, tax: 8.4 } ) );
run.State		// returns { sub: 100, tax: 8.4, total: 108.4, rounded: 108 }
```

***This is the aggregation `$set` stage, not the update operator of the same name***, and the
  difference is the reason the operator exists at all.
The stage family ***computes***; the update family ***stores***.
The same document handed to [`Update()`](./Update.md) keeps `{ $add: [ ... ] }` as a literal
  value, which is correct MongoDB behavior for classic update syntax and useless to a process.

```js
let computed = jsongin.Aggregate( [ { sub: 100, tax: 8 } ], [ { $set: { total: { $add: [ '$sub', '$tax' ] } } } ] );
computed		// returns [ { sub: 100, tax: 8, total: 108 } ]

let stored = jsongin.Update( { sub: 100, tax: 8 }, { $set: { total: { $add: [ '$sub', '$tax' ] } } } );
stored.total	// returns { $add: [ '$sub', '$tax' ] }
```

***The cost of that choice, stated plainly:***
`$inc`, `$mul`, `$push` and `$pop` have no stage equivalent, so a counter is incremented by
  writing the arithmetic out.
MongoDB made the same trade in its own update-with-pipeline form.

```js
const counter = { Name: 'Counter', Steps: [ { $do: { n: { $add: [ '$n', 1 ] } } } ] };
let counted = jsongin.ProcessExecute( counter, jsongin.ProcessStart( counter, { n: 41 } ) );
counted.State.n		// returns 42
```

***An expression which produces nothing removes the field***, exactly as it does in
  [`$addFields`](./Stage-Operators.md#$addFields).

```js
const dropping = { Name: 'Dropping', Steps: [ { $do: { secret: '$$REMOVE' } } ] };
let dropped = jsongin.ProcessExecute( dropping, jsongin.ProcessStart( dropping, { keep: 1, secret: 2 } ) );
dropped.State		// returns { keep: 1 }
```

Every expression in one `$do` sees the state as it was at the top of the step, which is what
  the aggregation stage does.


<a id="$when"></a>$when
---------------------------------------------------------------------

Usage: `$when: { Check: query, Then: [ steps ], Else: [ steps ] }`

Runs one of two lists of steps, according to whether the state matches a query.

```js
const sized = {
	Name: 'Sized',
	Steps: [
		{
			$when: {
				Check: { n: { $gt: 100 } },
				Then: [ { $do: { size: 'large' } } ],
				Else: [ { $do: { size: 'small' } } ],
			},
		},
	],
};

let large = jsongin.ProcessExecute( sized, jsongin.ProcessStart( sized, { n: 500 } ) );
large.State.size		// returns 'large'

let small = jsongin.ProcessExecute( sized, jsongin.ProcessStart( sized, { n: 5 } ) );
small.State.size		// returns 'small'
```

***`Check` is a query, not an expression.***
A query is what a MongoDB user reaches for first, [`Query()`](./Query.md) is at parity, and a
  query can already hold `$expr` when an expression is wanted - which is MongoDB's own answer
  to this same question.

```js
const compared = {
	Name: 'Compared',
	Steps: [ { $when: { Check: { $expr: { $gt: [ '$a', '$b' ] } }, Then: [ { $do: { bigger: 'a' } } ], Else: [ { $do: { bigger: 'b' } } ] } } ],
};

let comparison = jsongin.ProcessExecute( compared, jsongin.ProcessStart( compared, { a: 9, b: 2 } ) );
comparison.State.bigger		// returns 'a'
```

`Else` is optional.
A check which fails with no `Else` advances past the step, and so does a branch which is
  present but empty.

Branches ***nest***, and the cursor records where in them the run is - `[ 0, 'Then', 1 ]` is
  the second step of the `Then` branch of step 0.
That is what makes a run suspended inside a branch storable: the position is data, not a call
  stack.

***A query does not carry the run's variables.***
[`Query()`](./Query.md) takes no scope, so a `$$name` the run bound is not visible inside
  `Check`, not even within an `$expr`.
Compute the value into the state with `$do` first, and check the field.


<a id="$call"></a>$call
---------------------------------------------------------------------

Usage: `$call: { Name: 'name', With: { field: expression, ... }, Into: 'path' }`

Suspends the run so that the host can do something the engine cannot.

```js
const charging = {
	Name: 'Charging',
	Steps: [
		{ $call: { Name: 'ChargeCard', With: { amount: '$total' }, Into: 'receipt' } },
		{ $return: '$receipt' },
	],
};

let waiting = jsongin.ProcessExecute( charging, jsongin.ProcessStart( charging, { total: 42 } ) );
waiting.Status			// returns 'waiting'
waiting.Waiting.Name	// returns 'ChargeCard'
waiting.Waiting.With	// returns { amount: 42 }
```

***`$call` does not call.***
The engine performs no I/O, has no dependency, and contains no `async`.
The host reads the descriptor, does the work, does the awaiting, and hands the answer back
  with `ProcessResume()`.

```js
let resumed = jsongin.ProcessExecute( charging, jsongin.ProcessResume( charging, waiting, { paid: true } ) );
resumed.Status		// returns 'done'
resumed.Result		// returns { paid: true }
```

`With` is evaluated against the state ***when the step runs***, so the descriptor the host
  receives holds values rather than expressions.
A run stored while it waits and resumed a day later hands over the amount computed at the
  moment the step ran.

`Into` names a path in the state where the result is written, and is optional: a call whose
  result is not wanted omits it.
A result of nothing removes the field at `Into` rather than setting it to `undefined`, which is
  the same rule `$do` follows and the same reason - a run has to stay storable.


<a id="$return"></a>$return
---------------------------------------------------------------------

Usage: `$return: expression`

Halts the run, and names what it produced.

```js
const answering = { Name: 'Answering', Steps: [ { $return: { sum: { $add: [ '$a', '$b' ] } } } ] };
let answer = jsongin.ProcessExecute( answering, jsongin.ProcessStart( answering, { a: 1, b: 2 } ) );

answer.Status		// returns 'done'
answer.Result		// returns { sum: 3 }
```

The steps after it do not run.

***Running off the end of the top level `Steps` does the same thing as `{ $return: '$$ROOT' }`.***
A process which computes and never says so still hands back the work it did.

```js
const implicit = { Name: 'Implicit', Steps: [ { $do: { doubled: { $multiply: [ '$n', 2 ] } } } ] };
let implied = jsongin.ProcessExecute( implicit, jsongin.ProcessStart( implicit, { n: 21 } ) );

implied.Status		// returns 'done'
implied.Result		// returns { n: 21, doubled: 42 }
```

***An expression which produces nothing leaves the run with no `Result` at all***, rather than
  with a `Result` of `undefined`.
A field set to `undefined` does not survive being written down and read back, and a run which
  cannot be stored is not a run.

```js
const empty_handed = { Name: 'EmptyHanded', Steps: [ { $return: '$nope' } ] };
let nothing = jsongin.ProcessExecute( empty_handed, jsongin.ProcessStart( empty_handed, {} ) );

nothing.Status						// returns 'done'
Object.keys( nothing ).includes( 'Result' )		// returns false
```


## See Also

- [The Process Runtime](./Process.md)
- [Stage Operators](./Stage-Operators.md)
- [Expression Operators](./Expression-Operators.md)
- [Query Operators](./Query-Operators.md)
