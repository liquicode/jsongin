# @liquicode/jsongin


# ValidateDocument( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The value to validate. Usually a document, but a schema can describe any value. |
| Schema        |        ob         | A JSON Schema, or `true` or `false`.     |
| Options       |         o         | Optional. `Dialect`, `Registry` and `FormatAssertion`, described below. |


## Description

Validates a value against a JSON Schema and returns the ***findings***: one for each assertion
  the value failed, and an empty array for a value which satisfies the schema.

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

A finding is written in the specification's own ***basic output*** form, so it says which
  keyword failed, where that keyword is in the schema, and where the value is in the document:

```js
let findings = jsongin.ValidateDocument( { age: -1 }, schema );
findings.length === 2
findings[ 0 ].keywordLocation === '/required'
findings[ 0 ].error === 'The property [name] is required.'
findings[ 1 ].keywordLocation === '/properties/age/minimum'
findings[ 1 ].instanceLocation === '/age'
```

Each finding carries `valid` (always `false`), `keywordLocation`, `absoluteKeywordLocation`,
  `instanceLocation` and `error`. The member names are the specification's, which is why they
  are not written the way the rest of `jsongin` is.

The schema is read in the draft its `$schema` names, or in the `Dialect` option's draft when it
  names none, or in draft 2020-12 when neither says. Every draft from 4 to 2020-12 is read, and
  the evaluator is measured against the specification's own test suite. See the
  [JSON Schema guide](../JSON-Schema.md) for what each draft reads and how a value which JSON
  has no form for, such as a `Date`, is treated.


## Options

| **Option**        | **Type** | **Description**                                                  |
|-------------------|:--------:|------------------------------------------------------------------|
| `Dialect`         |    s     | The draft to read the schema in when its `$schema` does not say: `'2020-12'`, `'2019-09'`, `'draft-07'`, `'draft-04'` or `'mongodb'`. `'2020-12'` when absent. |
| `Registry`        |    o     | Schemas a `$ref` may reach, keyed by the URI they are reached at. Nothing is ever fetched. |
| `FormatAssertion` |    b     | Whether `format` refuses a string which does not have the format, rather than annotating it. `false` when absent, which is what the specification says a validator does unless asked. |

A `$schema` naming a known draft always wins over the `Dialect` option:

```js
let draft4 = { maximum: 5, exclusiveMaximum: true };
let draft4_declared = { $schema: 'http://json-schema.org/draft-04/schema#', maximum: 5, exclusiveMaximum: true };
jsongin.ValidateDocument( 5, draft4, { Dialect: 'draft-04' } ).length === 1
jsongin.ValidateDocument( 5, draft4_declared ).length === 1
jsongin.ValidateDocument( 5, draft4_declared, { Dialect: '2020-12' } ).length === 1
```

A reference to another document is answered from the `Registry`, and a reference nothing
  answers throws:

```js
let registry = { 'https://example.com/schemas/name.json': { type: 'string', minLength: 1 } };
let referencing = { properties: { name: { $ref: 'https://example.com/schemas/name.json' } } };

jsongin.ValidateDocument( { name: '' }, referencing, { Registry: registry } ).length === 1
jsongin.ValidateDocument( { name: 'Bo' }, referencing, { Registry: registry } ).length === 0
jsongin.ValidateDocument( { name: 'Bo' }, referencing );   // throws, nothing answers the reference
```

A format is an annotation until asked to assert:

```js
jsongin.ValidateDocument( 'not an address', { format: 'ipv4' } ).length === 0
jsongin.ValidateDocument( 'not an address', { format: 'ipv4' }, { FormatAssertion: true } ).length === 1
jsongin.ValidateDocument( '10.0.0.1', { format: 'ipv4' }, { FormatAssertion: true } ).length === 0
```


## Values JSON Has No Form For

A `jsongin` document may hold a `Date`, a `RegExp` or an `undefined`, and a JSON Schema speaks
  only of JSON. In the drafts of the specification a `Date` is a string, its ISO form, so
  `type: 'string'` and `format: 'date-time'` both describe it; a `RegExp` is a string, its
  source; and an `undefined` is absent, the way `Merge()` and `Diff()` read it.

```js
let when = new Date( 1700000000000 );
jsongin.ValidateDocument( when, { type: 'string', format: 'date-time' }, { FormatAssertion: true } ).length === 0
jsongin.ValidateDocument( { a: undefined }, { required: [ 'a' ] } ).length === 1
```

The `mongodb` dialect reads them as MongoDB does instead: a date is a `date` and never a
  string, and is asked for with `bsonType`.

```js
jsongin.ValidateDocument( { d: when }, { properties: { d: { bsonType: 'date' } } }, { Dialect: 'mongodb' } ).length === 0
jsongin.ValidateDocument( { d: when }, { properties: { d: { type: 'string' } } }, { Dialect: 'mongodb' } ).length === 1
```


## Errors

A schema which cannot be evaluated throws rather than answering: a dialect the engine does not
  know, a reference nothing answers, a schema which is neither an object nor a boolean, and, in
  the `mongodb` dialect, any schema MongoDB would refuse.

```js
jsongin.ValidateDocument( 1, { type: 'string' }, { Dialect: 'draft-99' } );   // throws
jsongin.ValidateDocument( { a: 1 }, { properties: { a: 42 } } );               // throws
jsongin.ValidateDocument( { a: 1 }, { properties: { a: { const: 1 } } }, { Dialect: 'mongodb' } );   // throws, MongoDB has no const
```


## See Also

- [JSON Schema guide](../JSON-Schema.md), for the drafts, the instance model and the formats.
- [`InferSchema( Documents, Options )`](./InferSchema.md), which writes a schema from documents.
- [`InitSchema( Document, Schema, Options )`](./InitSchema.md), which fills a document from a schema.
- [`ProjectSchema( Document, Schema )`](./ProjectSchema.md), which keeps the fields a schema names.
- [`$jsonSchema`](./Query-Operators.md#$jsonSchema), the query operator, which reads a schema as MongoDB does.
- [`ValidateQuery( Criteria )`](./ValidateQuery.md), which checks a criteria rather than a document.
