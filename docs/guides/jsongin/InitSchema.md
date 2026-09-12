# @liquicode/jsongin


# InitSchema( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        olu        | The document to fill. `null` or missing starts from an empty one. |
| Schema        |        ob         | The JSON Schema whose defaults fill it. |
| Options       |         o         | Optional. `ForceRequired`, `Dialect` and `Registry`, described below. |


## Description

Returns a copy of `Document` with every absent field the schema has a `default` for filled in.

A field the document ***has*** is left exactly as it is, whatever the schema says about it: this
  fills absences and never repairs values, which is the rule `Merge( DEFAULTS, options )`
  follows. An object filled in from a default is filled through, so nested defaults reach their
  places.

```js
let settings = {
	type: 'object',
	required: [ 'name', 'count' ],
	properties: {
		name: { type: 'string' },
		count: { type: 'integer', default: 10 },
		theme: { type: 'string', default: 'light' },
		editor: { type: 'object', default: {}, properties: { tabs: { type: 'integer', default: 4 }, wrap: { type: 'boolean', default: true } } },
	},
};

jsongin.InitSchema( {}, settings );
// returns { count: 10, theme: 'light', editor: { tabs: 4, wrap: true } }

jsongin.InitSchema( { count: 3, editor: { tabs: 2 } }, settings );
// returns { count: 3, editor: { tabs: 2, wrap: true }, theme: 'light' }
```

***The document given is never modified.***

```js
let given = { count: 3 };
jsongin.InitSchema( given, settings );
given;   // returns { count: 3 }
```

A `null` or missing document starts from an empty one, so a new document can be made from a
  schema alone:

```js
jsongin.InitSchema( null, settings );   // returns { count: 10, theme: 'light', editor: { tabs: 4, wrap: true } }
```


## Required Fields With No Default

`name` above is required and has no default, and the results above leave it absent: nothing
  says what it holds. With `ForceRequired: true` such a field is given its type's ***empty
  value*** - `''` for a string, `0` for a number or integer, `false` for a boolean, `{}` for an
  object, `[]` for an array and `null` for null - so a document built from a schema with no
  defaults is at least complete. A `type` list takes its first entry, and a field with no type
  is left absent either way.

```js
jsongin.InitSchema( null, settings, { ForceRequired: true } );
// returns { name: '', count: 10, theme: 'light', editor: { tabs: 4, wrap: true } }
```


## Options

| **Option**      | **Type** | **Description**                                                  |
|-----------------|:--------:|------------------------------------------------------------------|
| `ForceRequired` |    b     | Whether a required field with no default is given its type's empty value. `false` when absent. |
| `Dialect`       |    s     | The draft to read the schema in when its `$schema` does not say. `'2020-12'` when absent. |
| `Registry`      |    o     | Schemas a `$ref` may reach, keyed by URI, as for [`ValidateDocument()`](./ValidateDocument.md). |

The schema is read through its `$ref` references and its `allOf` branches. An `anyOf` or a
  `oneOf` is not guessed at, since nothing says which branch the document is meant to satisfy.

```js
let composed = {
	$defs: { Base: { properties: { kind: { default: 'base' } } } },
	allOf: [ { $ref: '#/$defs/Base' }, { properties: { size: { default: 1 } } } ],
	properties: { own: { default: true } },
};
jsongin.InitSchema( {}, composed );   // returns { own: true, kind: 'base', size: 1 }
```


## Errors

`InitSchema` throws when `Document` is anything but an object, `null` or `undefined`.

```js
jsongin.InitSchema( 'abc', settings );   // throws
```


## See Also

- [`Merge( DocumentA, DocumentB )`](./Merge.md), the same idiom with a hand-written defaults document.
- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./InferSchema.md)
- [`ProjectSchema( Document, Schema )`](./ProjectSchema.md)
