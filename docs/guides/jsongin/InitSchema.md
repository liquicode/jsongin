# @liquicode/jsongin


# InitSchema( Document, Schema, Options )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        olu        | The document to fill in. `null` or `undefined` starts from `{}`. |
| Schema        |        ob         | The JSON Schema whose `default` values are used. |
| Options       |         o         | Optional. `ForceRequired`, `Dialect` and `Registry`, described below. |


## Description

Returns a copy of `Document` with each missing field set to the schema's `default` for it.

- A field the document already has is left alone, whatever the schema says about it.
- A default object is filled in too, so defaults inside it are applied.
- `Document` is not changed.

This is the same idea as `Merge( DEFAULTS, options )`, with the defaults taken from a schema.

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

```js
let given = { count: 3 };
jsongin.InitSchema( given, settings );
given;   // returns { count: 3 }
```

Pass `null` to build a new document from the schema alone:

```js
jsongin.InitSchema( null, settings );   // returns { count: 10, theme: 'light', editor: { tabs: 4, wrap: true } }
```


## Required Fields With No Default

`name` above is required but has no default, so it is left out.

With `ForceRequired: true`, such a field is set to an empty value for its `type`:
  `''` for a string, `0` for a number or integer, `false` for a boolean, `{}` for an object, `[]`
  for an array, and `null` for null.
If `type` is a list, the first type is used.
A field with no `type` is still left out.

```js
jsongin.InitSchema( null, settings, { ForceRequired: true } );
// returns { name: '', count: 10, theme: 'light', editor: { tabs: 4, wrap: true } }
```


## Options

| **Option**      | **Type** | **Description**                                                  |
|-----------------|:--------:|------------------------------------------------------------------|
| `ForceRequired` |    b     | When `true`, a required field with no default gets an empty value. Defaults to `false`. |
| `Dialect`       |    s     | The draft to use when the schema's `$schema` does not name one. Defaults to `'2020-12'`. |
| `Registry`      |    o     | Schemas that `$ref` can refer to, as for [`ValidateDocument()`](./ValidateDocument.md). |

Defaults are also found through `$ref` and `allOf`.
`anyOf` and `oneOf` are ignored, because there is no way to know which choice the document is
  meant to follow.

```js
let composed = {
	$defs: { Base: { properties: { kind: { default: 'base' } } } },
	allOf: [ { $ref: '#/$defs/Base' }, { properties: { size: { default: 1 } } } ],
	properties: { own: { default: true } },
};
jsongin.InitSchema( {}, composed );   // returns { own: true, kind: 'base', size: 1 }
```


## Errors

`InitSchema` throws when `Document` is not an object, `null` or `undefined`.

```js
jsongin.InitSchema( 'abc', settings );   // throws
```


## See Also

- [`Merge( DocumentA, DocumentB )`](./Merge.md), which applies a defaults document you write yourself.
- [`ValidateDocument( Document, Schema, Options )`](./ValidateDocument.md)
- [`InferSchema( Documents, Options )`](./InferSchema.md)
- [`ProjectSchema( Document, Schema, Options )`](./ProjectSchema.md)
