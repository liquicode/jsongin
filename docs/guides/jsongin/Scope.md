# @liquicode/jsongin


# Scope

A scope holds the variables an expression can read.

A name starting with `$$`, such as `$$ROOT`, is read from the scope.
A name starting with one `$`, such as `$price`, is read from the document.

See [Variables](./Expression-Operators.md#variables) for what each variable means.
This page is about the scope object itself. You only need it when you want to supply variables
  to [`Evaluate()`](./Evaluate.md) yourself, or when you are writing an operator.


## You Usually Do Not Need One

If you do not pass a scope, `Evaluate` and `Aggregate` make one for you, so the system variables
  always work:

```js
jsongin.Evaluate( { a: 5 }, '$$ROOT.a' ) === 5
```

Use a scope when you want to ***define a variable of your own*** from outside the expression, or
  when you are writing an operator and need to pass along the scope you were given.


## A Scope Is a Value

The engine does not keep a "current scope".
You make a scope, pass it to [`Evaluate()`](./Evaluate.md), and it is passed down to every
  operator inside the expression.
So two evaluations never affect each other, and a scope can be saved and read back later.

The variables themselves, and the rules for their names, are MongoDB's.
The scope object is `jsongin`'s, because MongoDB has no public expression evaluator to pass one to.


## Building a Scope

| **Function**                            | **Description**                                     |
|-----------------------------------------|-------------------------------------------------------|
| `jsongin.Scope.New( Variables, Parent )` | A scope holding `Variables`, inside `Parent` (or `null` for none). |
| `jsongin.Scope.NewPipeline( Now )`      | The outermost scope of a pipeline run, holding `$$NOW` and `$$REMOVE`. `Now` is optional. |
| `jsongin.Scope.NewDocument( Document, Parent )` | A scope setting `$$ROOT` and `$$CURRENT` to `Document`. Without a `Parent`, a pipeline scope is made for it. |

`$$NOW` is read from the clock once, in `NewPipeline`, so every document and stage in one
  pipeline run sees the same time, as in MongoDB.

```js
let scope = jsongin.Scope.NewDocument( { a: 10 } );
jsongin.Evaluate( { a: 5 }, { $add: [ '$a', 1 ] }, scope ) === 6         // $a comes from the document
jsongin.Evaluate( { a: 5 }, { $add: [ '$$ROOT.a', 1 ] }, scope ) === 11  // $$ROOT comes from the scope
```


## Using a Scope

| **Member**              | **Description**                                                |
|-------------------------|------------------------------------------------------------------|
| `Scope.Variables`       | The variables defined in this scope only, as an object.        |
| `Scope.Parent`          | The scope this one is inside, or `null`.                       |
| `Scope.Child( Variables )` | A new scope inside this one, adding `Variables`.            |
| `Scope.ForDocument( Document )` | A new scope inside this one, setting `$$ROOT` and `$$CURRENT` to `Document`. |
| `Scope.Lookup( Name )`  | Finds a variable, looking in this scope first and then outward. |

A scope does not change after it is made. `Child` and `ForDocument` return new scopes.

`Lookup` returns `{ Found: true, Value: ... }` or `{ Found: false }`.
`Found` is separate from `Value` because a variable can be defined with no value.
`$$REMOVE` is like that on purpose, while a misspelled name is not defined at all.

```js
let scope = jsongin.Scope.NewDocument( { a: 5 } );
let inner = scope.Child( { doubled: 10 } );

inner.Lookup( 'doubled' );
// returns { Found: true, Value: 10 }

inner.Lookup( 'ROOT' ).Found === true      // found in the outer scope
inner.Lookup( 'REMOVE' ).Found === true    // defined, with no value
inner.Lookup( 'REMOVE' ).Value === undefined
inner.Lookup( 'nope' );
// returns { Found: false }
```

Use `Child` to define your own variables:

```js
let scope = jsongin.Scope.NewDocument( { price: 100 } );
let with_rate = scope.Child( { rate: 0.2 } );

jsongin.Evaluate( { price: 100 }, { $multiply: [ '$price', '$$rate' ] }, with_rate ) === 20
```

***A variable name you define must start with a lowercase letter.***
Names starting with an uppercase letter belong to the system variables, so `$$Rate` would not
  find your variable.
See [Variables](./Expression-Operators.md#variables).


## Which Operators Use a Scope

Almost every expression operator, stage and accumulator is passed a scope, but nearly all of them
  only pass it along.

- `$let`, `$map`, `$filter` and `$reduce` add variables of their own.
- Stages and accumulators which work on one document at a time, such as `$addFields`, `$group` and
  `$redact`, set `$$ROOT` and `$$CURRENT` to that document.
- Only `Evaluate()` looks variables up.

Query and update operators are not passed a scope.
`$expr` and `$exprx` make their own when they evaluate an expression.


## Writing an Operator

Two functions are for operator authors.
See [Operator Authoring](../Operator-Authoring.md) for how an operator receives and passes on its
  scope.

| **Function**                                  | **Description**                          |
|-----------------------------------------------|--------------------------------------------|
| `jsongin.Scope.RequireName( Name, OperatorName )` | Throws if `Name` is not a name a caller may define. Otherwise returns `Name`. |
| `jsongin.Scope.Require( Scope, OperatorName )` | Throws if `Scope` is missing. Otherwise returns `Scope`. |

Use `Require` in any helper which evaluates expressions.
If a helper is called without a scope and makes a new one instead, every variable the caller
  defined is silently lost, and the problem only shows up when someone uses a `$$` variable inside
  that operator.

```js
jsongin.Scope.RequireName( 'subtotal', '$let' ) === 'subtotal'
jsongin.Scope.RequireName( 'Subtotal', '$let' );   // throws: starts with an uppercase letter
jsongin.Scope.Require( undefined, '$myOperator' ); // throws
```


## Saving a Scope

A scope can be written as JSON and read back.

| **Function**                       | **Description**                          |
|------------------------------------|------------------------------------------|
| `jsongin.Scope.ToJSON( Scope )`    | Returns a plain object holding each scope's variables and its parent. |
| `jsongin.Scope.FromJSON( Document )` | Rebuilds a working scope from that object. |

Only the variables are saved. The functions (`Child`, `Lookup` and so on) are added back by
  `FromJSON`.

***Use [`TypedValues`](./Format.md#typed-values) with both `Format` and `Parse`.***
A pipeline scope holds a `Date` in `$$NOW` and no value in `$$REMOVE`.
Plain JSON turns the date into a string and drops `$$REMOVE` completely.

```js
const options = { TypedValues: true };

let scope = jsongin.Scope.NewPipeline().ForDocument( { price: 10 } ).Child( { discount: 0.5 } );
let text = jsongin.Format( jsongin.Scope.ToJSON( scope ), options );

let restored = jsongin.Scope.FromJSON( jsongin.Parse( text, options ) );
jsongin.Evaluate( { price: 10 }, { $multiply: [ '$price', '$$discount' ] }, restored )
// returns 5
```

With `TypedValues`, a variable with no value is still defined after it is read back:

```js
const options = { TypedValues: true };

let scope = jsongin.Scope.New( { nothing: undefined }, null );
let restored = jsongin.Scope.FromJSON( jsongin.Parse( jsongin.Format( jsongin.Scope.ToJSON( scope ), options ), options ) );

restored.Lookup( 'nothing' )       // returns { Found: true, Value: undefined }
restored.Lookup( 'neverBound' )    // returns { Found: false }
```

Reading a scope saved without `TypedValues` does not throw.
It just gives back a `$$NOW` which is a string, and no `$$REMOVE`.


## See Also

- [Variables](./Expression-Operators.md#variables), what the variables mean
- [`Format( Value, Options )`](./Format.md) and [`Parse( JsonString, Options )`](./Parse.md)
- [`Evaluate( Document, Expression, Scope )`](./Evaluate.md)
- [`Aggregate( Documents, Pipeline, Scope )`](./Aggregate.md)
- [$let](./Expression-Operators.md#$let), [$map](./Expression-Operators.md#$map),
  [$filter](./Expression-Operators.md#$filter), [$reduce](./Expression-Operators.md#$reduce)
- [$redact](./Stage-Operators.md#$redact)
- [Operator Authoring](../Operator-Authoring.md)
