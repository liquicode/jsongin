# @liquicode/jsongin


# Format( Value, WithWhitespace, LikeJavascript )


## Parameters

| **Parameter**  | **Allowed Types** | **Description**                          |
|----------------|:-----------------:|------------------------------------------|
| Value          |       (any)       | The value to format.                     |
| WithWhitespace |         b         | Adds whitespace formatting to the output when `true`. Defaults to `false`. |
| LikeJavascript |         b         | Doesn't quote identifiers and aligns values. Defaults to `false`. |


## Description

`jsongin.Format()` emulates Javasciprt's `JSON.stringify()` function which generates a text string representation
  (JSON) of a Javascript object.

When calling `jsongin.Format()` with default parameters, it will return a string identical to the output
  obtained from `JSON.stringify()`.
When using the parameter `WithWhitespace`, it will also provide output identical to
  `JSON.stringify( Value, null, '    ' )`.
The `LikeJavascript` parameter provides additional formatting of the output such that identifiers (field names) are not
  enclosed in quotes (`"`) and field values are left-aligned with each other.


## See Also

- [`Parse( JsonString )`](./Parse.md)


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
```js
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
```js
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




## Dates

A `Date` is written as an ISO string, which is what `JSON.stringify()` does.

```js
jsongin.Format( { created: new Date( 1700000000000 ) } )
// === { "created": "2023-11-14T22:13:20.000Z" }
```

Note that [`Parse()`](./Parse.md) reads that value back as a string, not as a `Date`, exactly
  as `JSON.parse()` would.
The `Format` and `Parse` round trip preserves the date's value but not its type.

Use [`Hybridize()`](./Hybridize.md) and [`Unhybridize()`](./Hybridize.md) when the round trip
  must restore an actual `Date`.
