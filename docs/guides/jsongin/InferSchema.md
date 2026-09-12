# @liquicode/jsongin


# InferSchema( Documents, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        oa         | One document, or an array of documents to describe together. |
| Options       |         o         | Optional. `RequiredThreshold`, `MaxDistinct` and `Dialect`, described below. |


## Description

Writes a JSON Schema which describes the documents given.

One document hides every field it happens not to have, so give every document you have: the
  schema describes their ***union***. A field is `required` when every document which reached
  its object carried it, a field seen with two types gets a `type` array, an array's `items` is
  the union of every element of every array at that path, and a whole number is an `integer`
  until a fraction is seen.

```js
let documents = [
	{ id: 1, name: 'Alice', tags: [ 'a', 'b' ], role: 'admin' },
	{ id: 2, name: 'Bob', tags: [], role: 'user', note: null },
	{ id: 3, name: null, tags: [ 'c' ], role: 'user', note: 'x' },
];

let schema = jsongin.InferSchema( documents );
schema.$schema.endsWith( '/draft/2020-12/schema' ) === true
schema.type === 'object'
schema.required;                 // returns [ 'id', 'name', 'tags', 'role' ]
schema.properties.id;            // returns { type: 'integer' }
schema.properties.name.type;     // returns [ 'string', 'null' ]
schema.properties.note.type;     // returns [ 'null', 'string' ]
schema.properties.tags;          // returns { type: 'array', items: { type: 'string' } }
```

The documents satisfy the schema written from them:

```js
jsongin.ValidateDocument( documents[ 0 ], schema );   // returns []
jsongin.ValidateDocument( documents[ 2 ], schema );   // returns []
```

A `Date` is described as a string with the `date-time` format, which is how
  [`ValidateDocument()`](./ValidateDocument.md) reads one:

```js
jsongin.InferSchema( { when: new Date( 1700000000000 ) } ).properties.when;   // returns { type: 'string', format: 'date-time' }
```


## Options

| **Option**          | **Type** | **Description**                                                  |
|---------------------|:--------:|------------------------------------------------------------------|
| `RequiredThreshold` |    n     | The share of objects a field must appear in to be `required`, from 0 to 1. `1` when absent, so only a field present everywhere is required; `0` makes no field required. |
| `MaxDistinct`       |    n     | When given, a scalar field with no more distinct values than this gets an `enum` of them, in the order they were first seen. No `enum` is written when absent. |
| `Dialect`           |    s     | The draft the result declares in `$schema`. `'2020-12'` when absent. |

```js
jsongin.InferSchema( documents, { RequiredThreshold: 0.5 } ).required;   // returns [ 'id', 'name', 'tags', 'role', 'note' ]
jsongin.InferSchema( documents, { MaxDistinct: 3 } ).properties.role.enum;   // returns [ 'admin', 'user' ]
```

An `enum` cap is a concern of whoever reads the schema - a prompt has to be short, a picker has
  to be complete - which is why it is an option rather than a number chosen here.


## The Schema Describes, It Never Decides

The result is a description of documents already seen: for a prompt, a field picker, or the
  first draft of a schema you then write by hand. It is not a contract, and nothing should read
  it to build a table or type a column. The first document holding a field would decide that
  field's type forever, and the schema would be an accident of insertion order.


## Errors

`InferSchema` throws when `Documents` is neither an object nor an array, and when the dialect
  named is not one which declares a `$schema`.

```js
jsongin.InferSchema( 42 );                           // throws
jsongin.InferSchema( {}, { Dialect: 'mongodb' } );   // throws, MongoDB's dialect has no meta-schema
```


## See Also

- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md)
- [`ProjectSchema( Document, Schema )`](./ProjectSchema.md)
- [`ShortType( Value )`](./ShortType.md), which every type here is read from.
