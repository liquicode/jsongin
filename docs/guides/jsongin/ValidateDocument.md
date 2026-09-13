# @liquicode/jsongin


# ValidateDocument( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The value to check. Usually a document, but a schema can describe any value. |
| Schema        |        ob         | A JSON Schema, or `true` or `false`.     |
| Options       |         o         | Optional. `Dialect`, `Registry` and `FormatAssertion`, described below. |


## Description

Checks a value against a JSON Schema and returns a list of ***findings***, one for each rule the
  value breaks.
An empty list means the value is valid.

```js
let schema = {
	type: 'object',
	required: [ 'name' ],
	properties: {
		name: { type: 'string' },
		age: { type: 'integer', minimum: 0 },
	},
};

jsongin.ValidateDocument( { name: 'Alice', age: 30 }, schema );   // returns []
```

Each finding says which rule failed, where the rule is in the schema, and where the value is in
  the document:

```js
let findings = jsongin.ValidateDocument( { age: -1 }, schema );
findings.length === 2
findings[ 0 ].keywordLocation === '/required'
findings[ 0 ].error === 'The property [name] is required.'
findings[ 1 ].keywordLocation === '/properties/age/minimum'
findings[ 1 ].instanceLocation === '/age'
```

A finding has the fields `valid` (always `false`), `keywordLocation`, `absoluteKeywordLocation`,
  `instanceLocation` and `error`.
This is the specification's "basic" output format, which is why these names are not written in
  `jsongin`'s usual style.

The schema is read using:

1. the draft named by its `$schema`, if it names one `jsongin` knows,
2. otherwise the `Dialect` option,
3. otherwise draft 2020-12.

See the [JSON Schema guide](../JSON-Schema.md) for the drafts, and for how dates and other
  non-JSON values are checked.


## Options

| **Option**        | **Type** | **Description**                                                  |
|-------------------|:--------:|------------------------------------------------------------------|
| `Dialect`         |    s     | The draft to use when the schema's `$schema` does not name one: `'2020-12'`, `'2019-09'`, `'draft-07'`, `'draft-04'` or `'mongodb'`. Defaults to `'2020-12'`. |
| `Registry`        |    o     | Schemas that `$ref` can refer to, keyed by their URI. Nothing is ever downloaded. |
| `FormatAssertion` |    b     | When `true`, `format` rejects a string in the wrong format. Defaults to `false`, where `format` checks nothing, as the specification says. |

A `$schema` naming a known draft always wins over `Dialect`:

```js
let draft4 = { maximum: 5, exclusiveMaximum: true };
let draft4_declared = { $schema: 'http://json-schema.org/draft-04/schema#', maximum: 5, exclusiveMaximum: true };
jsongin.ValidateDocument( 5, draft4, { Dialect: 'draft-04' } ).length === 1
jsongin.ValidateDocument( 5, draft4_declared ).length === 1
jsongin.ValidateDocument( 5, draft4_declared, { Dialect: '2020-12' } ).length === 1
```

A `$ref` to another document is looked up in the `Registry`.
If it is not there, `ValidateDocument` throws:

```js
let registry = { 'https://example.com/schemas/name.json': { type: 'string', minLength: 1 } };
let referencing = { properties: { name: { $ref: 'https://example.com/schemas/name.json' } } };

jsongin.ValidateDocument( { name: '' }, referencing, { Registry: registry } ).length === 1
jsongin.ValidateDocument( { name: 'Bo' }, referencing, { Registry: registry } ).length === 0
jsongin.ValidateDocument( { name: 'Bo' }, referencing );   // throws: nothing answers the reference
```

`format` only rejects values when `FormatAssertion` is `true`:

```js
jsongin.ValidateDocument( 'not an address', { format: 'ipv4' } ).length === 0
jsongin.ValidateDocument( 'not an address', { format: 'ipv4' }, { FormatAssertion: true } ).length === 1
jsongin.ValidateDocument( '10.0.0.1', { format: 'ipv4' }, { FormatAssertion: true } ).length === 0
```


## Dates, Regular Expressions and undefined

JSON Schema only knows JSON values, so `jsongin` treats these as follows:

- A `Date` is a string holding its ISO form, so `type: 'string'` and `format: 'date-time'` both
  match it.
- A `RegExp` is a string holding its pattern.
- A field holding `undefined` is missing.

```js
let when = new Date( 1700000000000 );
jsongin.ValidateDocument( when, { type: 'string', format: 'date-time' }, { FormatAssertion: true } ).length === 0
jsongin.ValidateDocument( { a: undefined }, { required: [ 'a' ] } ).length === 1
```

The `mongodb` dialect follows MongoDB instead: a date is a `date`, never a string, and is checked
  with `bsonType`.

```js
jsongin.ValidateDocument( { d: when }, { properties: { d: { bsonType: 'date' } } }, { Dialect: 'mongodb' } ).length === 0
jsongin.ValidateDocument( { d: when }, { properties: { d: { type: 'string' } } }, { Dialect: 'mongodb' } ).length === 1
```


## Errors

`ValidateDocument` throws when the schema cannot be used:

- an unknown `Dialect`
- a `$ref` which nothing answers
- a schema, or part of one, which is not an object or a boolean
- in the `mongodb` dialect, a schema MongoDB would reject

```js
jsongin.ValidateDocument( 1, { type: 'string' }, { Dialect: 'draft-99' } );   // throws
jsongin.ValidateDocument( { a: 1 }, { properties: { a: 42 } } );               // throws
jsongin.ValidateDocument( { a: 1 }, { properties: { a: { const: 1 } } }, { Dialect: 'mongodb' } );   // throws: MongoDB has no const
```


## See Also

- [JSON Schema guide](../JSON-Schema.md)
- [`InferSchema( Documents, Options )`](./InferSchema.md), which writes a schema from documents.
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md), which fills in a document from a schema.
- [`ProjectSchema( Document, Schema, Options )`](./ProjectSchema.md), which keeps the fields a schema names.
- [`$jsonSchema`](./Query-Operators.md#$jsonSchema), the query operator.
- [`ValidateQuery( Criteria )`](./ValidateQuery.md), which checks a query rather than a document.
