# @liquicode/jsongin


# InferSchema( Documents, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Documents     |        oa         | One document, or an array of documents.  |
| Options       |         o         | Optional. `RequiredThreshold`, `MaxDistinct` and `Dialect`, described below. |


## Description

Returns a JSON Schema describing the given documents.

A single document only shows the fields it happens to have, so pass all the documents you have.
The schema describes all of them together:

- A field is `required` when every object at that place has it.
- A field seen with more than one type gets a list of types.
- An array's `items` describes every element of every array at that place.
- A number is an `integer` unless some value at that place has a fraction.
- A `Date` is a string with `format: 'date-time'`, which is how
  [`ValidateDocument()`](./ValidateDocument.md) reads a date.

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

The documents are valid against the schema made from them:

```js
jsongin.ValidateDocument( documents[ 0 ], schema );   // returns []
jsongin.ValidateDocument( documents[ 2 ], schema );   // returns []
```

```js
jsongin.InferSchema( { when: new Date( 1700000000000 ) } ).properties.when;   // returns { type: 'string', format: 'date-time' }
```


## Options

| **Option**          | **Type** | **Description**                                                  |
|---------------------|:--------:|------------------------------------------------------------------|
| `RequiredThreshold` |    n     | The fraction of objects, from 0 to 1, a field must appear in to be `required`. Defaults to `1`, meaning every object. `0` makes no field required. |
| `MaxDistinct`       |    n     | When given, a field whose values are simple (not objects or arrays) and have at most this many different values gets an `enum` listing them, in the order first seen. |
| `Dialect`           |    s     | The draft to name in `$schema`. Defaults to `'2020-12'`. |

```js
jsongin.InferSchema( documents, { RequiredThreshold: 0.5 } ).required;   // returns [ 'id', 'name', 'tags', 'role', 'note' ]
jsongin.InferSchema( documents, { MaxDistinct: 3 } ).properties.role.enum;   // returns [ 'admin', 'user' ]
```


## A Description, Not a Rule

The schema only describes the documents you passed.
It is useful as a summary for a prompt or a field picker, or as a first draft of a schema you
  then write yourself.
Do not treat it as the rule for future documents: a field's type in it only reflects what was in
  the documents it saw.


## Errors

`InferSchema` throws when `Documents` is not an object or array, or when `Dialect` is unknown or
  is `'mongodb'`, which has no `$schema` to name.

```js
jsongin.InferSchema( 42 );                           // throws
jsongin.InferSchema( {}, { Dialect: 'mongodb' } );   // throws
```


## See Also

- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md)
- [`ProjectSchema( Document, Schema, Options )`](./ProjectSchema.md)
- [JSON Schema guide](../JSON-Schema.md)
