# @liquicode/jsongin


# Format( Value, Options )


## Parameters

| **Parameter**  | **Allowed Types** | **Description**                          |
|----------------|:-----------------:|------------------------------------------|
| Value          |       (any)       | The value to format.                     |
| Options        |       o, b        | The options document below. A boolean is read as the older `WithWhitespace` parameter. |

### Options

| **Option**     | **Type** | **Default** | **Description**                     |
|----------------|:--------:|:-----------:|-------------------------------------|
| Whitespace     |    b     |   `false`   | Adds whitespace formatting to the output. |
| LikeJavascript |    b     |   `false`   | Doesn't quote identifiers and aligns values. Requires `Whitespace`. |
| TypedValues    |    b     |   `false`   | Writes the values JSON cannot hold, rather than dropping them. See [Typed Values](#typed-values). |
| Strict         |    b     |   `false`   | Throws on a value which has no representation, rather than leaving it out. |

The older positional form, `Format( Value, WithWhitespace, LikeJavascript )`, still works.
A boolean in the second position is read as `WithWhitespace`, and a document is read as the
  options above.


## Description

`jsongin.Format()` emulates Javascript's `JSON.stringify()` function which generates a text string representation
  (JSON) of a Javascript object.

When calling `jsongin.Format()` with default parameters, it will return a string identical to the output
  obtained from `JSON.stringify()`.
When using the option `Whitespace`, it will also provide output identical to
  `JSON.stringify( Value, null, '    ' )`.
The `LikeJavascript` option provides additional formatting of the output such that identifiers (field names) are not
  enclosed in quotes (`"`) and field values are left-aligned with each other.


## See Also

- [`Parse( JsonString, Options )`](./Parse.md)


## Values Which JSON Cannot Hold

***The output is always parseable JSON.***
Four types have nothing to write: `undefined`, a symbol, a function, and a `BigInt`, which is
  the one of the four that does have a representation.

By default the other three follow the `JSON.stringify()` rule, which is not the same rule in
  both places.
A field is ***left out*** of a document, and an array element ***becomes `null`***, because
  dropping an element would renumber every element after it.

```js
jsongin.Format( { a: 1, gone: undefined, b: 2 } )
// returns '{"a":1,"b":2}'
```

```js
jsongin.Format( [ 1, undefined, 3 ] )
// returns '[1,null,3]'
```

Set `Strict` when a value with no representation should be an error rather than an omission.

```js
// jsongin.Format( { fn: function () { return; } }, { Strict: true } )
// throws: Format: A value of type [function] has no JSON representation.
```


## Typed Values

`TypedValues` writes the values JSON has no form for, so that [`Parse()`](./Parse.md) can read
  them back as what they were.
The forms are MongoDB's [Extended JSON](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/),
  with the two differences noted below.

| Type | Written as |
|------|------------|
| `Date` | `{ "$date": "<ISO string>" }`, or `{ "$date": { "$numberLong": "<ms>" } }` before 1970 |
| `undefined` | `{ "$undefined": true }` |
| `RegExp` | `{ "$regularExpression": { "pattern": "...", "options": "..." } }` |

```js
jsongin.Format( { created: new Date( 1700000000000 ) }, { TypedValues: true } )
// returns '{"created":{"$date":"2023-11-14T22:13:20Z"}}'
```

***The milliseconds are dropped when there are none***, and kept when there are.
This is the driver's formatting rule rather than `toISOString()`'s.

```js
jsongin.Format( { created: new Date( 1700000000010 ) }, { TypedValues: true } )
// returns '{"created":{"$date":"2023-11-14T22:13:20.010Z"}}'
```

***A time before the epoch is written the other way.***
The readable form is an ISO-8601 string, which the driver does not use for a negative
  timestamp, so those fall back to the canonical form.
[`Parse()`](./Parse.md) reads both, because an Extended JSON document written anywhere else
  may hold either.

```js
jsongin.Format( { created: new Date( -1 ) }, { TypedValues: true } )
// returns '{"created":{"$date":{"$numberLong":"-1"}}}'
```

```js
jsongin.Format( { r: /ab+c/i }, { TypedValues: true } )
// returns '{"r":{"$regularExpression":{"pattern":"ab+c","options":"i"}}}'
```

***An undefined value is kept apart from a null one.***
Extended JSON maps `undefined` onto `null`, because BSON has no such value.
`jsongin` does have one, so it writes the tag instead.

```js
jsongin.Format( { a: undefined, b: null }, { TypedValues: true } )
// returns '{"a":{"$undefined":true},"b":null}'
```

***A regular expression keeps every Javascript flag, including `g`.***
MongoDB's regex options are `imxlsu` and its driver refuses `g` outright.
Dropping the flag would change what the expression matches, so the wire form is MongoDB's and
  the flag set is `jsongin`'s.


## Dates

A `Date` is written as an ISO string by default, which is what `JSON.stringify()` does.

```js
jsongin.Format( { created: new Date( 1700000000000 ) } )
// returns '{"created":"2023-11-14T22:13:20.000Z"}'
```

Note that [`Parse()`](./Parse.md) reads that value back as a string, not as a `Date`, exactly
  as `JSON.parse()` would.
The default `Format` and `Parse` round trip preserves the date's value but not its type.

Use `TypedValues` on both ends when the round trip must restore an actual `Date`, or
  [`Hybridize()`](./Hybridize.md) and [`Unhybridize()`](./Hybridize.md) when the value has to
  stay readable as plain JSON.


## Examples

### It provides output identical to JSON.stringify()
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

**Compact format with no whitespace:**
```js
console.log( jsongin.Format( document ) );
```
outputs:
```bat
{"id":1001,"user":{"name":"Alice","location":"East"},"profile":{"login":"alice","role":"admin"},"tags":["Staff","Dept. A"]}
```

**Human readable format with whitespace:**
```js
console.log( jsongin.Format( document, true ) );
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

**Improved human readable format:**
```js
console.log( jsongin.Format( document, true, true ) );
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

**The same, written as options:**
```js
console.log( jsongin.Format( document, { Whitespace: true, LikeJavascript: true } ) );
```
