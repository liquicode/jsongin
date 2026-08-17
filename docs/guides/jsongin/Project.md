# @liquicode/jsongin


# Project( Document, Projection )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Projection    |         o         | The set of fields to include/exclude in the output. |


## Description

`jsongin` supports the MongoDB projection mechanic with the function `jsongin.Project( Document, Projection )`.
This function returns a new document built from the fields of `Document`.

Each field in `Projection` is one of four things:

- ***Include*** : a value of `1` or `true` includes that field in the output.
- ***Exclude*** : a value of `0` or `false` removes that field from the output.
- ***Specify*** : a document whose keys are ordinary field names is a projection specification
  for the field it sits under, so `{ o: { p: 1 } }` means the same as `{ 'o.p': 1 }`.
- ***Compute*** : any other value is an expression, evaluated against `Document` with
  [`Evaluate()`](./Evaluate.md), whose result becomes the field's value.

Field names may be document paths in dot notation, both when reading from `Document` and when
  writing to the output.


## Nested Specifications

A projection value which is a document is read as a ***specification for the field it sits
  under***, not as a value to store. The value in the output comes from `Document`:

```js
let document = { o: { p: 99, q: 2 }, n: 5 };

jsongin.Project( document, { o: { p: 1 } } );    // { o: { p: 99 } }
jsongin.Project( document, { 'o.p': 1 } );       // { o: { p: 99 } }   the same thing

jsongin.Project( document, { o: { p: 0 } } );    // { n: 5, o: { q: 2 } }
```

A nested specification is flattened into dot notation before anything else happens, so it
  inherits every rule below without exception, and a nested inclusion makes the whole projection
  an inclusion in the ordinary way.

A document value is a specification ***unless*** it is one of three other things:

- a single key naming a projection operator, such as `{ $slice: 2 }`
- any key beginning with `$`, which makes the value an expression
- ***empty***, which throws: there is no field for `{}` to name

```js
jsongin.Project( { o: { p: 1 } }, { o: {} } );
// throws: An empty sub-projection is not a valid value at [o]
```

An empty projection at the ***top*** level is a different matter and is perfectly legal; see
  below.

A field name may not be the empty string, at any level, because no field is named by it:

```js
jsongin.Project( { a: 1 }, { '': 1 } );
// throws: A projection field name cannot be empty
```

Both rules match MongoDB, verified against MongoDB 6.0.1.
`jsongin` used to hand a nested specification to [`Evaluate()`](./Evaluate.md) as a computed
  field, which evaluated the specification as an expression and returned the specification
  itself — so `{ o: { p: 0 } }` projected a document containing `{ o: { p: 0 } }`, a value the
  source document never held.


## Inclusion and Exclusion

A projection is either an inclusion projection or an exclusion projection, never both.
Combining them ***throws***, because there is no sensible meaning for it, and MongoDB rejects
  the same combination with an error.
This used to return `null`, which is a value a caller carries on with.
A projection which cannot mean anything is now refused the same way a malformed query or update
  document is; `null` is reserved for a `Document` or `Projection` parameter of the wrong type.

The `_id` field is the one exception. It is included by default and can be suppressed with
  `_id: 0` alongside either kind of projection.

A projection which contains a computed field is an ***inclusion*** projection.
Only `_id`, the included fields, and the computed fields appear in the output.
Using an expression within an exclusion projection ***throws***, because a computed field is an
  inclusion and that is the combination above in disguise.

An ***empty*** projection names nothing to exclude, so it is an exclusion projection and returns
  the whole document:

```js
jsongin.Project( { a: 1, b: 2 }, {} );  // { a: 1, b: 2 }
```

This matches MongoDB, verified against MongoDB 6.0.1, and it is the same rule which makes
  `{ _id: 0 }` return every field but `_id`.
Note that the [`$project`](../Operator-Reference.md) aggregation stage has the ***opposite***
  rule and refuses an empty specification, which MongoDB does too.


## Paths Which Cross an Array

A projection path which reaches into an array ***keeps the array***, producing one object per
  element rather than one gathered value.

```js
let document = { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] };

jsongin.Project( document, { 'a.x': 1 } );
// { a: [ { x: 1 }, { x: 3 } ] }

jsongin.Project( document, { 'a.x': 0 } );
// { a: [ { y: 2 }, { y: 4 } ] }
```

Two fields taken from the same array arrive in one object per element:

```js
jsongin.Project( { a: [ { x: 1, y: 2, w: 3 } ] }, { 'a.x': 1, 'a.y': 1 } );
// { a: [ { x: 1, y: 2 } ] }
```

An element which does not have the field contributes an ***empty object***, so the array keeps
  its length. An element which cannot carry a field at all, such as a number or a `null`, is
  ***dropped***:

```js
jsongin.Project( { a: [ { x: 1 }, { y: 9 } ] }, { 'a.x': 1 } );
// { a: [ { x: 1 }, {} ] }

jsongin.Project( { a: [ 1, 2, 3 ] }, { 'a.x': 1 } );
// { a: [] }
```

A path element which looks numeric is a ***field name***, not an array index:

```js
jsongin.Project( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.0': 1 } );
// { a: [ {}, {} ] }   no element has a field named '0'
```

***This differs from a computed field.***
A computed field is an expression, and an expression which crosses an array ***gathers*** the
  values, which is what MongoDB's aggregation expressions do:

```js
let document = { a: [ { x: 1 }, { x: 2 } ] };

jsongin.Project( document, { 'a.x': 1 } );      // { a: [ { x: 1 }, { x: 2 } ] }
jsongin.Project( document, { copy: '$a.x' } );  // { copy: [ 1, 2 ] }
```

Both match MongoDB. They are different mechanisms with different rules, not an inconsistency.

Note also that projection descends into an array which sits directly inside another array,
  which a ***query*** path does not.
See [`ResolveCandidates( Document, Path )`](./ResolveCandidates.md) for the query side.


## Computed Fields

```js
let document = { _id: 1, name: 'Alice', dmg: 8, armor: 5 };

// Compute a new field from an expression.
jsongin.Project( document, { name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } )
// returns { _id: 1, name: 'Alice', net: 3 }

// Rename a field with a field reference.
jsongin.Project( document, { alias: '$name' } )
// returns { _id: 1, alias: 'Alice' }

// Build a nested output field.
jsongin.Project( document, { 'stats.net': { $subtract: [ '$dmg', '$armor' ] } } )
// returns { _id: 1, stats: { net: 3 } }
```

An expression which evaluates to `null` sets the field to `null`.
An expression which evaluates to a ***missing*** value omits the field entirely.
These are different outcomes, and the distinction is the same one `Evaluate()` makes.

```js
jsongin.Project( document, { net: { $subtract: [ '$dmg', '$missing' ] } } )
// returns { _id: 1, net: null }        the arithmetic yielded null

jsongin.Project( document, { alias: '$nothere' } )
// returns { _id: 1 }                   the field reference was missing
```

Note that an invalid expression throws, rather than returning `null`.
An unrecognized operator or a bad argument count is an authoring mistake, and `Evaluate()`
  makes it visible instead of quietly producing an empty result.
An invalid ***projection*** now throws for the same reason, so the two agree.


## Notes

Fields are ***removed*** from the output rather than being set to `undefined`, so
  `Object.keys()` and the `in` operator agree with the document's contents.

An `_id` is only added to the output when the source document actually has one, so projecting
  plain objects does not introduce a field which was never there.

Dates are preserved. `Project` clones with [`SafeClone()`](./SafeClone.md), so a `Date` in the
  source is a `Date` in the output.

The projected document never shares structure with the source, so modifying the result cannot
  affect the document it came from.


## See Also

- [`Evaluate( Document, Expression )`](./Evaluate.md)
- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- MongoDB Reference: [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)


## Examples

```js
let document = {
	_id: 1,
	name: 'Alice',
	dmg: 8,
	armor: 5,
	user: { name: 'alice', role: 'admin' },
};

// Include certain fields. _id is included by default.
jsongin.Project( document, { name: 1 } )
// returns { _id: 1, name: 'Alice' }

// Include a nested field.
jsongin.Project( document, { 'user.name': 1 } )
// returns { _id: 1, user: { name: 'alice' } }

// Exclude certain fields.
jsongin.Project( document, { dmg: 0, armor: 0 } )
// returns { _id: 1, name: 'Alice', user: { name: 'alice', role: 'admin' } }

// Suppress the _id field.
jsongin.Project( document, { name: 1, _id: 0 } )
// returns { name: 'Alice' }

// Inclusion and exclusion cannot be combined.
jsongin.Project( document, { name: 1, dmg: 0 } )
// returns null
```
