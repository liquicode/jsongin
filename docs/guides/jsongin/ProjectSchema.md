# @liquicode/jsongin


# ProjectSchema( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to project from.            |
| Schema        |        ob         | The JSON Schema whose `properties` name the fields to keep. |
| Options       |         o         | Optional. `Dialect` and `Registry`, as for [`ValidateDocument()`](./ValidateDocument.md). |


## Description

Returns the subset of `Document` the schema defines: the fields its `properties` name, at every
  depth.

The names are turned into an inclusion projection in dot notation and handed to
  [`Project()`](./Project.md), so what comes back is what MongoDB would return for that
  projection. A property whose own schema names properties is projected field by field; one
  which does not is taken whole. A field the schema names and the document lacks is simply
  absent.

```js
let document = { id: 1, user: { name: 'Alice', location: 'East', secret: 'x' }, tags: [ 'a' ], extra: true };
let schema = { properties: { id: {}, user: { properties: { name: {}, location: {} } }, tags: {} } };

let result = jsongin.ProjectSchema( document, schema );
Object.keys( result ).length === 3
result.id === 1
result.user.name === 'Alice'
result.user.location === 'East'
typeof result.user.secret === 'undefined'
typeof result.extra === 'undefined'
result.tags.length === 1
```

Properties under `items` reach into each element of an array, the way a dotted path does in a
  projection:

```js
let orders = { items: [ { sku: 'A', qty: 1, cost: 5 }, { sku: 'B', qty: 2, cost: 6 } ] };
let projected = jsongin.ProjectSchema( orders, { properties: { items: { items: { properties: { sku: {}, qty: {} } } } } } );
projected.items.length === 2
projected.items[ 0 ].sku === 'A'
projected.items[ 1 ].qty === 2
typeof projected.items[ 0 ].cost === 'undefined'
```

The schema is read through its `$ref` references and its `allOf` branches.

***The document given is never modified.***


## A Schema Which Names Nothing

A schema with no `properties` defines no subset, and the result is an empty document. A schema
  which merely says `type: 'object'` describes every document and names no field of any.

```js
jsongin.ProjectSchema( document, { type: 'object' } );   // returns {}
jsongin.ProjectSchema( document, true );                 // returns {}
```

This is the deliberate opposite of a reader which preserves every field it does not define.
  Use it where the fields a schema names are the fields which may leave: a response, an export,
  a document handed to something which must not see the rest.


## Errors

`ProjectSchema` throws when `Document` is not an object.

```js
jsongin.ProjectSchema( [ 1 ], schema );   // throws
```


## See Also

- [`Project( Document, Projection )`](./Project.md), which this function calls.
- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./InferSchema.md)
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md)
