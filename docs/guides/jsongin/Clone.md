# @liquicode/jsongin


# Clone( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The document to clone.                   |


## Description

Returns a deep copy of `Document`, made with a JSON round trip:

```js
Clone = function ( Document ) { return JSON.parse( JSON.stringify( Document ) ); };
```

This is simple and fast, and it is exactly as lossy as JSON is.
Anything JSON cannot represent does not survive the trip.

***Use [`SafeClone()`](./SafeClone.md) instead when your document holds dates.***


## What Does Not Survive

| **Value**    | **Becomes**            | **Why**                                        |
|--------------|------------------------|------------------------------------------------|
| `Date`       | an ISO string          | `JSON.stringify` calls `toJSON()`.             |
| `RegExp`     | `{}`                   | A regular expression has no own properties.    |
| `undefined`  | the key is dropped     | `JSON.stringify` omits undefined fields.       |
| `function`   | the key is dropped     | Functions are not JSON.                        |
| `NaN`, `Infinity` | `null`            | JSON has no representation for these.          |

A circular reference throws.

```js
// jsongin.Clone( { d: new Date( 0 ) } ) returns { d: '1970-01-01T00:00:00.000Z' }
// jsongin.Clone( { r: /^abc/ } ) returns { r: {} }
// jsongin.Clone( { a: undefined, b: 1 } ) returns { b: 1 }
```


## Clone or SafeClone?

|                        | **`Clone`**                | **`SafeClone`**                    |
|------------------------|----------------------------|------------------------------------|
| Method                 | JSON round trip            | member-wise copy                   |
| Dates                  | become ISO strings         | ***preserved***                    |
| Regular expressions    | become `{}`                | ***preserved***                    |
| Copy some fields by reference | no                  | yes, via the `Exceptions` parameter |

`Clone`'s behavior is unchanged and intentional: converting dates to strings is inherent to the
  stringify/parse approach it documents.
The `jsongin` functions which need to preserve values — `Project()`, `Update()`, `Merge()`, and
  the aggregation stages — all clone with `SafeClone()`.

> ***Note*** : several v0.1.0 fixes came from functions using `Clone` where they needed
  `SafeClone`. If you are cloning documents that came out of `jsongin`, prefer `SafeClone`.


## See Also

- [`SafeClone( Document, Exceptions )`](./SafeClone.md)
- [`Format( Document, WithWhitespace, LikeJavascript )`](./Format.md)
- [`Parse( JsonString )`](./Parse.md)


## Examples


### It deep copies a document
```js
let document = { a: { b: 1 } };
let copy = jsongin.Clone( document );

copy.a.b = 2;
document.a.b === 1   // the original is untouched
```


### It converts dates to strings
```js
let copy = jsongin.Clone( { when: new Date( 0 ) } );

typeof copy.when === 'string'
copy.when === '1970-01-01T00:00:00.000Z'

// Use SafeClone to keep the Date:
let safe = jsongin.SafeClone( { when: new Date( 0 ) } );
( safe.when instanceof Date ) === true
```
