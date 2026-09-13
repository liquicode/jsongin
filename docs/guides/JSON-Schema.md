# @liquicode/jsongin


# JSON Schema


`jsongin` reads JSON Schema, the specification at [json-schema.org](https://json-schema.org),
  in every draft from 4 to 2020-12, and also MongoDB's version of it.
These functions and one query operator use it:

| **Function**                                                       | **What it does**                                          |
|--------------------------------------------------------------------|-----------------------------------------------------------|
| [`ValidateDocument( Document, Schema, Options )`](./jsongin/ValidateDocument.md) | Checks a document against a schema, and lists what is wrong. |
| [`InferSchema( Documents, Options )`](./jsongin/InferSchema.md)    | Writes a schema describing a set of documents.            |
| [`InitSchema( Document, Schema, Options )`](./jsongin/InitSchema.md) | Fills in a document's missing fields from a schema's defaults. |
| [`ProjectSchema( Document, Schema, Options )`](./jsongin/ProjectSchema.md) | Keeps only the fields a schema names.              |
| [`$jsonSchema`](./jsongin/Query-Operators.md#$jsonSchema)          | Matches documents against a schema in a query, as MongoDB does. |

The document always comes first and the schema second, as in `Query()`, `Project()` and `Update()`.

```js
let schema = { type: 'object', required: [ 'name' ], properties: { name: { type: 'string' }, age: { type: 'integer' } } };

jsongin.ValidateDocument( { name: 'Alice', age: 30 }, schema );   // returns []
jsongin.ValidateDocument( { age: 'thirty' }, schema ).length === 2
jsongin.Query( { name: 'Alice', age: 30 }, { $jsonSchema: { required: [ 'name' ] } } ) === true
```


## Drafts

A schema is read using the draft its `$schema` names.
If it names none, the `Dialect` option is used, and if that is not given, draft 2020-12.

| **Dialect**  | **`$schema`**                                     | **Notes**                                              |
|--------------|---------------------------------------------------|--------------------------------------------------------|
| `2020-12`    | `https://json-schema.org/draft/2020-12/schema`    | The default. Has `$dynamicRef`, `prefixItems`, `unevaluatedProperties`. |
| `2019-09`    | `https://json-schema.org/draft/2019-09/schema`    | Has `$recursiveRef`, `items` as a list, `additionalItems`. |
| `draft-07`   | `http://json-schema.org/draft-07/schema#`         | Has `definitions`, and `$ref` ignores the keywords beside it. |
| `draft-04`   | `http://json-schema.org/draft-04/schema#`         | Has `id`, and `exclusiveMaximum` as a boolean.         |
| `mongodb`    | none                                              | MongoDB's `$jsonSchema`. Only chosen with the `Dialect` option. See below. |

Every keyword of every draft is supported, including `$id`, `$anchor`, `$defs`, `$ref`,
  `$dynamicRef` and the `unevaluated` keywords.
If a schema's meta-schema turns a vocabulary off with `$vocabulary`, those keywords are ignored.

`jsongin` is tested against the specification's official test suite for every draft.
The one difference: in draft 4, `1.0` is not supposed to be an integer, but Javascript cannot tell
  `1.0` from `1`, so `jsongin` treats it as an integer.


## References and the Registry

A `$ref` is resolved against the URI of the schema it is in, as the specification says.
A `$ref` to another document is looked up in the `Registry` option, an object of schemas keyed by
  their URI.
***Nothing is ever downloaded.***
The meta-schemas of the four drafts are always available, so a schema can `$ref` them.

```js
let registry = { 'https://example.com/schemas/id.json': { type: 'string', minLength: 3 } };
let schema_with_ref = { properties: { id: { $ref: 'https://example.com/schemas/id.json' } } };

jsongin.ValidateDocument( { id: 'abc' }, schema_with_ref, { Registry: registry } );   // returns []
jsongin.ValidateDocument( { id: 'ab' }, schema_with_ref, { Registry: registry } ).length === 1
```


## Formats

By default, `format` checks nothing. It only describes what a string should look like, as the
  specification says.
To make `format` reject bad strings, pass `FormatAssertion: true`, or use a meta-schema which
  turns on the format-assertion vocabulary.

When checking is on, these formats are checked: `date`, `time`, `date-time`, `duration`, `email`,
  `idn-email`, `hostname`, `idn-hostname`, `ipv4`, `ipv6`, `uri`, `uri-reference`, `iri`,
  `iri-reference`, `uri-template`, `uuid`, `json-pointer`, `relative-json-pointer` and `regex`.
Any other format is never checked.

```js
jsongin.ValidateDocument( '2024-02-30', { format: 'date' } ).length === 0
jsongin.ValidateDocument( '2024-02-30', { format: 'date' }, { FormatAssertion: true } ).length === 1
```


## Dates, Regular Expressions and undefined

JSON Schema only knows JSON values. A `jsongin` document can also hold a `Date`, a `RegExp` or
  `undefined`, which are read like this:

| **Value**   | **In the JSON drafts**                                   | **In the `mongodb` dialect**            |
|-------------|----------------------------------------------------------|-----------------------------------------|
| `undefined` | Missing. A field holding it does not count as present.   | Missing.                                |
| `Date`      | A string holding its ISO form, so `type: 'string'` and `format: 'date-time'` match it. | `bsonType: 'date'`. Never a string. |
| `RegExp`    | A string holding its pattern.                            | `bsonType: 'regex'`. Never a string.    |

A whole number is an `integer` in every draft.
The `mongodb` dialect's `type` has no `integer`. Use `bsonType: 'int'` or `bsonType: 'double'` to
  tell numbers apart, as MongoDB stores them.


## The MongoDB Dialect

The `$jsonSchema` query operator reads a schema the way MongoDB does.
`ValidateDocument()` with `Dialect: 'mongodb'` reads it the same way, and also tells you why a
  document failed.

It is draft 4 with these differences, all of them MongoDB's:

- `bsonType` is available, and a date is a `date`, not a string.
- `type` has no `integer`.
- Only draft 4's keywords and `bsonType` are allowed, and of those, `$ref`, `$schema`, `default`,
  `definitions`, `format` and `id` are not. A schema using any other keyword throws.
- A dotted name in `required` or `properties`, such as `'user.name'`, is a path into the
  document, and goes through arrays like any query path.


## See Also

- [`ValidateDocument( Document, Schema, Options )`](./jsongin/ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./jsongin/InferSchema.md)
- [`InitSchema( Document, Schema, Options )`](./jsongin/InitSchema.md)
- [`ProjectSchema( Document, Schema, Options )`](./jsongin/ProjectSchema.md)
- [Query Operators](./jsongin/Query-Operators.md#$jsonSchema), for `$jsonSchema`.
- [Testing Procedure](./Testing-Procedure.md), for how `jsongin` is tested.
