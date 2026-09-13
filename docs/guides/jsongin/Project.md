# @liquicode/jsongin


# Project( Document, Projection )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Projection    |         o         | The fields to include, exclude, or compute. |


## Description

`jsongin.Project( Document, Projection )` returns a new document built from the fields of
  `Document`, the way a MongoDB projection does.

Each field in `Projection` has one of four kinds of value:

- ***Include*** : `true` or any number other than `0` keeps the field.
- ***Exclude*** : `0` or `false` removes the field.
- ***Nested*** : an object of field names applies to the fields inside that field, so
  `{ o: { p: 1 } }` means the same as `{ 'o.p': 1 }`.
- ***Compute*** : anything else is an expression. It is evaluated against `Document` with
  [`Evaluate()`](./Evaluate.md), and the result becomes the field's value.

Field names can be dot notation paths.


## Nested Projections

An object value is not stored. It is a projection for the fields inside that field, and the
  values still come from `Document`:

```js
let document = { o: { p: 99, q: 2 }, n: 5 };

jsongin.Project( document, { o: { p: 1 } } );    // { o: { p: 99 } }
jsongin.Project( document, { 'o.p': 1 } );       // { o: { p: 99 } }   the same thing

jsongin.Project( document, { o: { p: 0 } } );    // { o: { q: 2 }, n: 5 }
```

`{ o: { p: 1 } }` and `{ 'o.p': 1 }` are the same projection, and every rule on this page applies
  to both.

An object value is ***not*** a nested projection in three cases:

- It has one key which is a projection operator, such as `{ $slice: 2 }`.
- It has a key starting with `$`, which makes it an expression.
- It is empty, which throws, because `{}` names no field.

```js
jsongin.Project( { o: { p: 1 } }, { o: {} } );
// throws: An empty sub-projection is not a valid value at [o]
```

An empty projection at the top level is allowed; see below.

A field name cannot be an empty string:

```js
jsongin.Project( { a: 1 }, { '': 1 } );
// throws: A projection field name cannot be empty
```

MongoDB has both of these rules.


## Inclusion and Exclusion

A projection either includes fields or excludes them.
Mixing the two ***throws***, as it does in MongoDB.

`_id` is the exception.
It is included unless you exclude it with `_id: 0`, and you can do that in either kind of
  projection.

A computed field counts as an inclusion.
So a projection with a computed field returns only `_id`, the included fields, and the computed
  fields, and adding an exclusion to it throws.

An ***empty*** projection excludes nothing, so it returns the whole document:

```js
jsongin.Project( { a: 1, b: 2 }, {} );  // { a: 1, b: 2 }
```

For the same reason, `{ _id: 0 }` returns every field except `_id`.
Both match MongoDB.
The [`$project`](./Stage-Operators.md#$project) pipeline stage is different: it refuses an empty
  projection, as MongoDB does.

A `Projection` of `null` or `undefined` returns a copy of the whole document.
`Project` returns `null` when `Document` is not an object, or when `Projection` is some other type
  which is not an object.


## Paths Into Arrays

When a path goes into an array, the output ***keeps the array***, with one object for each
  element:

```js
let document = { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] };

jsongin.Project( document, { 'a.x': 1 } );
// { a: [ { x: 1 }, { x: 3 } ] }

jsongin.Project( document, { 'a.x': 0 } );
// { a: [ { y: 2 }, { y: 4 } ] }
```

Two fields from the same array end up together in each element's object:

```js
jsongin.Project( { a: [ { x: 1, y: 2, w: 3 } ] }, { 'a.x': 1, 'a.y': 1 } );
// { a: [ { x: 1, y: 2 } ] }
```

An element without the field becomes an ***empty object***, so the array keeps its length.
An element which cannot have fields, such as a number or `null`, is ***dropped***:

```js
jsongin.Project( { a: [ { x: 1 }, { y: 9 } ] }, { 'a.x': 1 } );
// { a: [ { x: 1 }, {} ] }

jsongin.Project( { a: [ 1, 2, 3 ] }, { 'a.x': 1 } );
// { a: [] }
```

A number in the path is a ***field name***, not an array index:

```js
jsongin.Project( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.0': 1 } );
// { a: [ {}, {} ] }   no element has a field named '0'
```

***A computed field works differently.***
An expression which goes into an array ***collects*** the values into one array, as MongoDB's
  aggregation expressions do:

```js
let document = { a: [ { x: 1 }, { x: 2 } ] };

jsongin.Project( document, { 'a.x': 1 } );      // { a: [ { x: 1 }, { x: 2 } ] }
jsongin.Project( document, { copy: '$a.x' } );  // { copy: [ 1, 2 ] }
```

Both results match MongoDB.

A projection path also goes into an array nested directly inside another array.
A ***query*** path does not; see [`ResolveCandidates( Document, Path )`](./ResolveCandidates.md).


## Computed Fields

```js
let document = { _id: 1, name: 'Alice', dmg: 8, armor: 5 };

// Compute a new field from an expression.
jsongin.Project( document, { name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } )
// returns { _id: 1, name: 'Alice', net: 3 }

// Rename a field by referring to it.
jsongin.Project( document, { alias: '$name' } )
// returns { _id: 1, alias: 'Alice' }

// Write the result into a nested field.
jsongin.Project( document, { 'stats.net': { $subtract: [ '$dmg', '$armor' ] } } )
// returns { _id: 1, stats: { net: 3 } }
```

If the expression gives `null`, the field is set to `null`.
If the expression gives nothing (`undefined`), the field is left out.

```js
jsongin.Project( document, { net: { $subtract: [ '$dmg', '$missing' ] } } )
// returns { _id: 1, net: null }        $subtract gave null

jsongin.Project( document, { alias: '$nothere' } )
// returns { _id: 1 }                   the field does not exist
```

An invalid expression, such as an unknown operator or the wrong number of arguments, throws.


## Notes

Removed fields are deleted, not set to `undefined`.

`_id` is only added to the output when `Document` has one.

Dates stay dates, because `Project` copies with [`SafeClone()`](./SafeClone.md).

The result shares nothing with `Document`, so changing one never changes the other.


## Operator Summary

| **Operator**                                            | **Supported** | **Usage**                             |
|---------------------------------------------------------|:-------------:|---------------------------------------|
| [`$slice`](./Projection-Operators.md#$slice)            |      Yes      | `{ field: { $slice: count } }`        |
| [`$elemMatch`](./Projection-Operators.md#$elemMatch)    |      Yes      | `{ field: { $elemMatch: criteria } }` |
| [`$`](./Projection-Operators.md#$)                      |       -       | `{ 'field.$': 1 }`                    |
| [`$meta`](./Projection-Operators.md#$meta)              |       -       | `{ field: { $meta: 'textScore' } }`   |

[Projection Operators](./Projection-Operators.md) describes each operator, with examples.

A value which is none of these, and is not an include or exclude, is a computed field.
See [Computed Fields](#computed-fields) above and [Expression Operators](./Expression-Operators.md).


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

// Include some fields. _id is included unless excluded.
jsongin.Project( document, { name: 1 } )
// returns { _id: 1, name: 'Alice' }

// Include a nested field.
jsongin.Project( document, { 'user.name': 1 } )
// returns { _id: 1, user: { name: 'alice' } }

// Exclude some fields.
jsongin.Project( document, { dmg: 0, armor: 0 } )
// returns { _id: 1, name: 'Alice', user: { name: 'alice', role: 'admin' } }

// Leave out _id.
jsongin.Project( document, { name: 1, _id: 0 } )
// returns { name: 'Alice' }

// Inclusion and exclusion cannot be mixed.
jsongin.Project( document, { name: 1, dmg: 0 } )   // throws
```
