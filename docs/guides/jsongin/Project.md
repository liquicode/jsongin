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

Each field in `Projection` is one of three things:

- ***Include*** : a value of `1` or `true` includes that field in the output.
- ***Exclude*** : a value of `0` or `false` removes that field from the output.
- ***Compute*** : any other value is an expression, evaluated against `Document` with
  [`Evaluate()`](./Evaluate.md), whose result becomes the field's value.

Field names may be document paths in dot notation, both when reading from `Document` and when
  writing to the output.


## Inclusion and Exclusion

A projection is either an inclusion projection or an exclusion projection, never both.
Combining them returns `null` and writes to the OpLog, because there is no sensible meaning
  for it. MongoDB rejects the same combination with an error.

The `_id` field is the one exception. It is included by default and can be suppressed with
  `_id: 0` alongside either kind of projection.

A projection which contains a computed field is an ***inclusion*** projection.
Only `_id`, the included fields, and the computed fields appear in the output.
Using an expression within an exclusion projection returns `null`.


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
