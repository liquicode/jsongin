# @liquicode/jsongin


# Scope

The set of variables in effect where an expression is being evaluated.

A name beginning with `$$` is resolved from a scope, where a name beginning with a single `$` is
  resolved from the document.
See [Variables](./Expression-Operators.md#variables) for what the variables ***mean***; this
  page is about the object which holds them, which you only need when you are writing an
  operator or driving [`Evaluate()`](./Evaluate.md) yourself.


## A Scope Is a Value, Not Engine State

***The engine holds no "current scope" and never has one.***
A scope is created by a caller, passed into [`Evaluate()`](./Evaluate.md), and passed along to
  every operator underneath it.
That is what makes two evaluations independent of each other, and it is the property everything
  else on this page follows from.

The alternative — a stack of frames the engine pushes and pops — would have been a great deal
  less code. It was not chosen, for four reasons which only matter if you intend to go where
  this library is going:

- ***A closure captures its environment***, and a frame destroyed on pop cannot be captured.
- ***A process suspends and resumes***, which needs the environment to be data you can store.
- ***A runtime eventually awaits.*** The first `await` inside an evaluation lets two processes
  interleave through one stack. There is no `async` in the evaluator today, which is the only
  reason ambient state would have been safe at all.
- ***A runtime runs more than one process***, so the scope belongs to the process and the
  engine stays stateless.

***The frames are chained rather than flattened.***
Merging a child's bindings into a copy of its parent's would answer a lookup just as well and
  would lose the chain, which is the thing worth keeping: it is what a closure captures and
  what a reader walks to see where a name came from.
A chain also costs one small object per binding rather than a copy of every binding in scope,
  which matters when a [$map](./Expression-Operators.md#$map) makes a frame per element.

***A frame does not change after it is made.***
`New()` copies the bindings it is given, so a caller cannot reach back in and alter a frame
  something else is holding.
The values inside are shared references, as they are everywhere else in the engine.


## You Usually Do Not Need One

`Evaluate( Document, Expression )` makes a scope for the occasion when it is not given one, so
  the system variables work without a caller ever mentioning this page.

```js
jsongin.Evaluate( { a: 5 }, '$$ROOT.a' ) === 5
```

Reach for a scope when you want to ***bind a name of your own*** from outside the expression
  language, or when you are writing an operator and have to pass along the one you were given.


## Building a Scope

| **Function**                            | **Description**                                     |
|-----------------------------------------|-------------------------------------------------------|
| `jsongin.Scope.New( Variables, Parent )` | A frame of bindings, with `Parent` around it or `null`. |
| `jsongin.Scope.NewPipeline( Now )`      | The outermost frame of an aggregation run: `$$NOW` and `$$REMOVE`. |
| `jsongin.Scope.NewDocument( Document, Parent )` | A frame binding `$$ROOT` and `$$CURRENT` to one document. |

`NewPipeline` is where `$$NOW` is read, once, so that every document and every stage of one
  pipeline sees the same instant.
Reading the clock per document would be the obvious implementation and would disagree with
  MongoDB.

`NewDocument` called without a parent makes a pipeline frame for the occasion, which is what a
  bare two-argument `Evaluate()` does.

```js
let scope = jsongin.Scope.NewDocument( { a: 5 } );
jsongin.Evaluate( { a: 5 }, { $add: [ '$a', 1 ] }, scope ) === 6
```


## Using a Scope

| **Member**              | **Description**                                                |
|-------------------------|------------------------------------------------------------------|
| `Scope.Variables`       | The bindings of this frame alone, as a document.               |
| `Scope.Parent`          | The frame around this one, or `null` for the outermost.        |
| `Scope.Child( Variables )` | A new frame above this one.                                 |
| `Scope.ForDocument( Document )` | A new frame above this one which rebinds `$$ROOT` and `$$CURRENT`. |
| `Scope.Lookup( Name )`  | Resolves a name, innermost frame first.                        |

***`Lookup` reports `Found` apart from `Value`***, and the distinction is the point: a variable
  bound to nothing is not an unbound variable.
`$$REMOVE` is bound to nothing on purpose, and a misspelled name is a mistake.
One of those is a value and the other stops the expression, so they cannot share an answer.

```js
let scope = jsongin.Scope.NewDocument( { a: 5 } );
let inner = scope.Child( { doubled: 10 } );

inner.Lookup( 'doubled' );
// returns { Found: true, Value: 10 }

inner.Lookup( 'ROOT' ).Found === true      // found through the parent frame
inner.Lookup( 'REMOVE' ).Found === true    // bound, to nothing
inner.Lookup( 'REMOVE' ).Value === undefined
inner.Lookup( 'nope' );
// returns { Found: false }
```

Binding a name from outside the expression language is what `Child` is for:

```js
let scope = jsongin.Scope.NewDocument( { price: 100 } );
let with_rate = scope.Child( { rate: 0.2 } );

jsongin.Evaluate( { price: 100 }, { $multiply: [ '$price', '$$rate' ] }, with_rate ) === 20
```

***A name you bind must look like a name a caller may bind***, or it will not be reachable:
  `$$Rate` would be read as a system variable and refused.
See [Names a Caller May Bind](./Expression-Operators.md#variables).


## Writing an Operator

Two functions exist for operator authors, and
  [Operator Authoring](../Operator-Authoring.md) describes the contract they belong to.

| **Function**                                  | **Description**                          |
|-----------------------------------------------|--------------------------------------------|
| `jsongin.Scope.RequireName( Name, OperatorName )` | Refuses a name a caller may not bind, and answers it when it is allowed. |
| `jsongin.Scope.Require( Scope, OperatorName )` | Refuses a call which arrived without a scope. |

`Require` is a guard rather than a convenience.
A helper which evaluates operands is where a lost scope does its damage: called without one it
  would build a fresh root scope and quietly drop every variable the caller was holding, and
  nothing would go wrong until somebody wrote a `$$name` inside that one operator.

```js
jsongin.Scope.RequireName( 'subtotal', '$let' ) === 'subtotal'
jsongin.Scope.RequireName( 'Subtotal', '$let' );   // throws - reserved for the system variables
jsongin.Scope.Require( undefined, '$myOperator' ); // throws
```

`build/scope-check.js` checks statically that every operator and every evaluating helper
  ***declares*** a trailing `Scope`, and that no `jsongin.Evaluate(` call site passes fewer than
  three arguments.
Whether a caller actually ***passes*** the scope its helper declares cannot be read statically,
  and that is the hole `Require` closes from the other side.


## See Also

- [Variables](./Expression-Operators.md#variables) — what the variables mean
- [`Evaluate( Document, Expression, Scope )`](./Evaluate.md)
- [`Aggregate( Documents, Pipeline )`](./Aggregate.md)
- [$let](./Expression-Operators.md#$let), [$map](./Expression-Operators.md#$map),
  [$filter](./Expression-Operators.md#$filter), [$reduce](./Expression-Operators.md#$reduce)
- [$redact](./Stage-Operators.md#$redact)
- [Operator Authoring](../Operator-Authoring.md)
