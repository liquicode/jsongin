# @liquicode/jsongin


# Format( Value, Options )


## Parameters

| **Parameter**  | **Allowed Types** | **Description**                          |
|----------------|:-----------------:|------------------------------------------|
| Value          |       (any)       | The value to write as JSON.              |
| Options        |       o, b        | Optional. The options below, or `true` for `Whitespace`. |

### Options

| **Option**     | **Type** | **Default** | **Description**                     |
|----------------|:--------:|:-----------:|-------------------------------------|
| Whitespace     |    b     |   `false`   | Writes one value per line, indented four spaces. |
| LikeJavascript |    b     |   `false`   | Writes field names without quotes, lines values up, and adds trailing commas. Only works with `Whitespace`. |
| TypedValues    |    b     |   `false`   | Writes dates, regular expressions and `undefined` in a form `Parse()` can read back. See [Typed Values](#typed-values). |
| Strict         |    b     |   `false`   | Throws for a value JSON cannot hold, instead of leaving it out. |

You can also call `Format( Value, Whitespace, LikeJavascript )` with two booleans.


## Description

Writes a value as JSON text, like `JSON.stringify()`.

With no options, the output is the same as `JSON.stringify( Value )`.
With `Whitespace`, it is the same as `JSON.stringify( Value, null, '    ' )`, except that an
  empty object or array is written across two lines.

`LikeJavascript` writes something closer to Javascript source:

```js
console.log( jsongin.Format( { id: 1001, user: { name: 'Alice' } }, { Whitespace: true, LikeJavascript: true } ) );
```
outputs:
```
{
    id:   1001,
    user: 
    {
        name: "Alice",
    },
}
```

Unlike `JSON.stringify()`, `Format` writes a `bigint` as a number rather than throwing.


## Values JSON Cannot Hold

The output is always valid JSON.

`undefined`, functions and symbols have no JSON form.
By default `Format` treats them the way `JSON.stringify()` does:

- In an object, the field is ***left out***.
- In an array, the element becomes ***`null`***, so the other elements keep their positions.

```js
jsongin.Format( { a: 1, gone: undefined, b: 2 } )
// returns '{"a":1,"b":2}'
```

```js
jsongin.Format( [ 1, undefined, 3 ] )
// returns '[1,null,3]'
```

With `Strict`, these values throw instead:

```js
// jsongin.Format( { fn: function () { return; } }, { Strict: true } )
// throws: Format: A value of type [function] has no JSON representation.
```

A regular expression is written as `{}`, as `JSON.stringify()` does, unless you use
  `TypedValues`.


## Dates

By default a `Date` is written as an ISO string, as `JSON.stringify()` does:

```js
jsongin.Format( { created: new Date( 1700000000000 ) } )
// returns '{"created":"2023-11-14T22:13:20.000Z"}'
```

[`Parse()`](./Parse.md) reads that back as a ***string***, not a `Date`.

To get a `Date` back, use `TypedValues` on both `Format` and `Parse`, or use
  [`Hybridize()`](./Hybridize.md) and [`Unhybridize()`](./Unhybridize.md).


## Typed Values

With `TypedValues`, dates, regular expressions and `undefined` are written as small tagged objects.
[`Parse()`](./Parse.md) with `TypedValues` turns them back into the original values.
The tags are MongoDB's [Extended JSON](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/),
  with two differences described below.

| Type | Written as |
|------|------------|
| `Date` | `{ "$date": "<ISO string>" }`, or `{ "$date": { "$numberLong": "<ms>" } }` before 1970 |
| `undefined` | `{ "$undefined": true }` |
| `RegExp` | `{ "$regularExpression": { "pattern": "...", "options": "..." } }` |

```js
jsongin.Format( { created: new Date( 1700000000000 ) }, { TypedValues: true } )
// returns '{"created":{"$date":"2023-11-14T22:13:20Z"}}'
```

The milliseconds are left out when they are zero, as MongoDB's driver does:

```js
jsongin.Format( { created: new Date( 1700000000010 ) }, { TypedValues: true } )
// returns '{"created":{"$date":"2023-11-14T22:13:20.010Z"}}'
```

A date before 1970 is written as a number of milliseconds, as the driver does.
`Parse()` reads both forms.

```js
jsongin.Format( { created: new Date( -1 ) }, { TypedValues: true } )
// returns '{"created":{"$date":{"$numberLong":"-1"}}}'
```

```js
jsongin.Format( { r: /ab+c/i }, { TypedValues: true } )
// returns '{"r":{"$regularExpression":{"pattern":"ab+c","options":"i"}}}'
```

The two differences from Extended JSON:

- ***`undefined` is kept apart from `null`.*** Extended JSON turns `undefined` into `null`.
  `jsongin` writes a `$undefined` tag, so the difference survives.
- ***A regular expression keeps all of its flags, including `g`.*** MongoDB only accepts the
  flags `imxlsu`. Dropping `g` would change what the pattern matches.

```js
jsongin.Format( { a: undefined, b: null }, { TypedValues: true } )
// returns '{"a":{"$undefined":true},"b":null}'
```


## See Also

- [`Parse( JsonString, Options )`](./Parse.md)
- [`Hybridize( Document )`](./Hybridize.md)


## Examples

```js
let document = {
	id: 1001,
	user: {
		name: 'Alice',
		location: 'East',
	},
	profile: {
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ]
}
```

**Compact, with no whitespace:**
```js
console.log( jsongin.Format( document ) );
```
outputs:
```
{"id":1001,"user":{"name":"Alice","location":"East"},"profile":{"login":"alice","role":"admin"},"tags":["Staff","Dept. A"]}
```

**With whitespace:**
```js
console.log( jsongin.Format( document, { Whitespace: true } ) );
```
outputs:
```
{
    "id": 1001,
    "user": {
        "name": "Alice",
        "location": "East"
    },
    "profile": {
        "login": "alice",
        "role": "admin"
    },
    "tags": [
        "Staff",
        "Dept. A"
    ]
}
```

**Like Javascript:**
```js
console.log( jsongin.Format( document, { Whitespace: true, LikeJavascript: true } ) );
```
outputs:
```
{
    id:      1001,
    user:    
    {
        name:     "Alice",
        location: "East",
    },
    profile: 
    {
        login: "alice",
        role:  "admin",
    },
    tags:    
    [
        "Staff",
        "Dept. A",
    ],
}
```

**The same, with the older boolean arguments:**
```js
console.log( jsongin.Format( document, true, true ) );
```
