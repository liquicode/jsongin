# @liquicode/jsongin


# Clone( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The document to clone.                   |


## Description

Returns a deep copy of `Document`, made by converting it to JSON and back:

```js
Clone = function ( Document ) { return JSON.parse( JSON.stringify( Document ) ); };
```

It is simple and fast, but anything JSON cannot hold is lost or changed.

***If your document holds dates, use [`SafeClone()`](./SafeClone.md) instead.***


## What Is Lost

| **Value**    | **Becomes**            | **Why**                                        |
|--------------|------------------------|------------------------------------------------|
| `Date`       | an ISO string          | `JSON.stringify` writes dates as strings.      |
| `RegExp`     | `{}`                   | JSON has no regular expressions.               |
| `undefined`  | the key is removed     | `JSON.stringify` skips undefined fields.       |
| `function`   | the key is removed     | JSON has no functions.                         |
| `NaN`, `Infinity` | `null`            | JSON has no way to write these.                |

A document which refers to itself throws.

```js
// jsongin.Clone( { d: new Date( 0 ) } ) returns { d: '1970-01-01T00:00:00.000Z' }
// jsongin.Clone( { r: /^abc/ } ) returns { r: {} }
// jsongin.Clone( { a: undefined, b: 1 } ) returns { b: 1 }
```


## Clone or SafeClone?

|                        | **`Clone`**                | **`SafeClone`**                    |
|------------------------|----------------------------|------------------------------------|
| Method                 | JSON round trip            | field-by-field copy                |
| Dates                  | become ISO strings         | ***kept as dates***                |
| Regular expressions    | become `{}`                | ***kept***                         |
| Share some fields with the original | no            | yes, with the `Exceptions` parameter |

`Project()`, `Update()`, `Merge()` and the aggregation stages all use `SafeClone()`.
If you are copying documents which came out of `jsongin`, use `SafeClone()` too.


## See Also

- [`SafeClone( Document, Exceptions )`](./SafeClone.md)
- [`Format( Value, Options )`](./Format.md)
- [`Parse( JsonString, Options )`](./Parse.md)


## Examples


### It makes a deep copy
```js
let document = { a: { b: 1 } };
let copy = jsongin.Clone( document );

copy.a.b = 2;
document.a.b === 1   // the original is unchanged
```


### It turns dates into strings
```js
let copy = jsongin.Clone( { when: new Date( 0 ) } );

typeof copy.when === 'string'
copy.when === '1970-01-01T00:00:00.000Z'

// SafeClone keeps the Date:
let safe = jsongin.SafeClone( { when: new Date( 0 ) } );
( safe.when instanceof Date ) === true
```
