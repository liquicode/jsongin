# @liquicode/jsongin


# JSON Schema


`jsongin` reads JSON Schema, the specification at [json-schema.org](https://json-schema.org),
  in every draft from 4 to 2020-12, and MongoDB's own reading of it as well. Four functions and
  one query operator use it:

| **Function**                                                       | **What it does**                                          |
|--------------------------------------------------------------------|-----------------------------------------------------------|
| [`ValidateDocument( Document, Schema, Options )`](./jsongin/ValidateDocument.md) | Says whether a document satisfies a schema, and why not.  |
| [`InferSchema( Documents, Options )`](./jsongin/InferSchema.md)    | Writes a schema which describes a set of documents.       |
| [`InitSchema( Document, Schema, Options )`](./jsongin/InitSchema.md) | Fills a document's absent fields from a schema's defaults. |
| [`ProjectSchema( Document, Schema )`](./jsongin/ProjectSchema.md)  | Keeps the fields a schema names.                          |
| [`$jsonSchema`](./jsongin/Query-Operators.md#$jsonSchema)          | Matches a document against a schema in a query, as MongoDB does. |

Every function takes the ***document first*** and the schema second, the way `Query()`,
  `Project()` and `Update()` take the document first.

```js
let schema = { type: 'object', required: [ 'name' ], properties: { name: { type: 'string' }, age: { type: 'integer' } } };

jsongin.ValidateDocument( { name: 'Alice', age: 30 }, schema );   // returns []
jsongin.ValidateDocument( { age: 'thirty' }, schema ).length === 2
jsongin.Query( { name: 'Alice', age: 30 }, { $jsonSchema: { required: [ 'name' ] } } ) === true
```


## Drafts

A schema is read in the draft its `$schema` names, or in the `Dialect` option's draft when it
  names none, or in draft 2020-12 when neither says.

| **Dialect**  | **`$schema`**                                     | **Notes**                                              |
|--------------|---------------------------------------------------|--------------------------------------------------------|
| `2020-12`    | `https://json-schema.org/draft/2020-12/schema`    | The default. `$dynamicRef`, `prefixItems`, `unevaluatedProperties`. |
| `2019-09`    | `https://json-schema.org/draft/2019-09/schema`    | `$recursiveRef`, `items` as a list, `additionalItems`. |
| `draft-07`   | `http://json-schema.org/draft-07/schema#`         | `definitions`, `$id` as an anchor, `$ref` alone.       |
| `draft-04`   | `http://json-schema.org/draft-04/schema#`         | `id`, boolean `exclusiveMaximum`.                      |
| `mongodb`    | none                                              | MongoDB's `$jsonSchema`: draft 4 with `bsonType`, no references, and a refusal for every other keyword. Chosen by the `Dialect` option only. |

Every keyword of every draft is read, including the full reference machinery - `$id`,
  `$anchor`, `$defs`, `$ref`, `$dynamicRef` with its dynamic scope - and the annotation rules
  the `unevaluated` keywords depend on. A meta-schema's `$vocabulary` is honoured, so a custom
  meta-schema which leaves a vocabulary out switches those keywords off.

The evaluator is measured against the specification's official test suite, every draft and
  every optional case, the way the query operators are measured against MongoDB; the one case
  the suite has which Javascript cannot satisfy - that `1.0` is not an integer - is recorded
  beside the suite as the exception it is.


## References and the Registry

A `$ref` is resolved against the base URI of the resource it sits in, as the specification
  says, and a reference to another document is answered from the `Registry` option: an object
  of schemas keyed by the URI they are reached at. ***Nothing is ever fetched***, in Node or in
  the browser. The meta-schemas of the four drafts are always present, so a schema may `$ref`
  into one.

```js
let registry = { 'https://example.com/schemas/id.json': { type: 'string', minLength: 3 } };
let schema_with_ref = { properties: { id: { $ref: 'https://example.com/schemas/id.json' } } };

jsongin.ValidateDocument( { id: 'abc' }, schema_with_ref, { Registry: registry } );   // returns []
jsongin.ValidateDocument( { id: 'ab' }, schema_with_ref, { Registry: registry } ).length === 1
```


## Formats

A `format` is an ***annotation*** by default: it names what a string is meant to look like and
  refuses nothing, which is what the specification says a validator does unless asked. Pass
  `FormatAssertion: true` to make it refuse, or write the schema against a meta-schema which
  selects the format-assertion vocabulary.

Every format the specification names is checked when asked: `date`, `time`, `date-time`,
  `duration`, `email`, `idn-email`, `hostname`, `idn-hostname`, `ipv4`, `ipv6`, `uri`,
  `uri-reference`, `iri`, `iri-reference`, `uri-template`, `uuid`, `json-pointer`,
  `relative-json-pointer` and `regex`. A format not in that list is an annotation whatever the
  option says, since an unknown format asserts nothing.

```js
jsongin.ValidateDocument( '2024-02-30', { format: 'date' } ).length === 0
jsongin.ValidateDocument( '2024-02-30', { format: 'date' }, { FormatAssertion: true } ).length === 1
```


## Values JSON Has No Form For

A `jsongin` document may hold a `Date`, a `RegExp` or an `undefined`, and JSON Schema speaks
  only of JSON. Each is given a form rather than refused:

| **Value**   | **In the JSON drafts**                                   | **In the `mongodb` dialect**            |
|-------------|----------------------------------------------------------|-----------------------------------------|
| `undefined` | Absent. A field holding one is not a property.           | Absent.                                 |
| `Date`      | A string, its ISO form: `type: 'string'` and `format: 'date-time'` both describe it. | `bsonType: 'date'`, and never a string. |
| `RegExp`    | A string, its source.                                    | `bsonType: 'regex'`, and never a string. |

A whole number is an `integer` in every dialect which has one, since Javascript has one number
  type and `1.0` is `1`. In the `mongodb` dialect `type` has no `integer`; `bsonType: 'int'`
  and `bsonType: 'double'` tell numbers apart the way MongoDB stores them.


## The MongoDB Dialect

The `$jsonSchema` query operator reads a schema exactly as MongoDB does, and every behaviour of
  that reading was measured on a running MongoDB before it was written. The same reading is
  reached from `ValidateDocument()` with `Dialect: 'mongodb'`, which also says ***why*** a
  document failed.

Three things differ from the specification there, and each is MongoDB's rule: a date is a
  `date` rather than a string, `type` has no `integer`, and a ***dotted name*** in `required`
  or `properties` is a path through the document, through arrays, the way a dotted name is
  everywhere else in a query. A schema MongoDB would refuse is refused rather than answered.


## See Also

- [`ValidateDocument( Document, Schema, Options )`](./jsongin/ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./jsongin/InferSchema.md)
- [`InitSchema( Document, Schema, Options )`](./jsongin/InitSchema.md)
- [`ProjectSchema( Document, Schema )`](./jsongin/ProjectSchema.md)
- [Query Operators](./jsongin/Query-Operators.md#$jsonSchema), for `$jsonSchema`.
- [Testing Procedure](./Testing-Procedure.md), for how the evaluator is measured.
