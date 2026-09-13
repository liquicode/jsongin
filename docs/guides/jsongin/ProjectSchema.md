# @liquicode/jsongin


# ProjectSchema( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to take fields from.        |
| Schema        |        ob         | The JSON Schema whose `properties` name the fields to keep. |
| Options       |         o         | Optional. `Dialect` and `Registry`, as for [`ValidateDocument()`](./ValidateDocument.md). |


## Description

Returns a new document holding only the fields named in the schema's `properties`, at every
  level.

- A property whose schema has its own `properties` keeps only those fields inside it.
- A property whose schema has no `properties` is kept whole.
- A named field which the document does not have is left out.
- `Document` is not changed.

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

`properties` inside `items` apply to each element of an array:

```js
let orders = { items: [ { sku: 'A', qty: 1, cost: 5 }, { sku: 'B', qty: 2, cost: 6 } ] };
let projected = jsongin.ProjectSchema( orders, { properties: { items: { items: { properties: { sku: {}, qty: {} } } } } } );
projected.items.length === 2
projected.items[ 0 ].sku === 'A'
projected.items[ 1 ].qty === 2
typeof projected.items[ 0 ].cost === 'undefined'
```

Properties are also found through `$ref` and `allOf`.

The named fields are turned into an inclusion projection and passed to [`Project()`](./Project.md),
  so the result follows the same rules as a projection.


## A Schema With No Properties Keeps Nothing

If the schema names no `properties`, the result is `{}`.
A schema such as `{ type: 'object' }` allows every document, but names no fields to keep.

```js
jsongin.ProjectSchema( document, { type: 'object' } );   // returns {}
jsongin.ProjectSchema( document, true );                 // returns {}
```

Use `ProjectSchema` when only the fields a schema names should be passed on, such as in a
  response or an export.


## Errors

`ProjectSchema` throws when `Document` is not an object.

```js
jsongin.ProjectSchema( [ 1 ], schema );   // throws
```


## See Also

- [`Project( Document, Projection )`](./Project.md)
- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./InferSchema.md)
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md)
