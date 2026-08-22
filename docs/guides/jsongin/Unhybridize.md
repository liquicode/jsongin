# @liquicode/jsongin


# Unhybridize( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | The hybrid document to restore.          |


## Description

Takes a document produced by [`Hybridize()`](./Hybridize.md) and returns it to its original form.

`Hybridize()` stores every value which JSON cannot represent — a `Date`, a `RegExp`, an `Error`,
  a function, a `Symbol` — as a string holding a small envelope describing it.
`Unhybridize()` reads those envelopes back and rebuilds the values, so a document survives a
  round trip through JSON with its types intact.

The two functions are exact counterparts:

```js
let document = { when: new Date( '2024-01-02T03:04:05Z' ), pattern: /ab+c/i, n: 42 };

let restored = jsongin.Unhybridize( jsongin.Hybridize( document ) );

jsongin.StrictEquals( document, restored ) === true
```


## A String Which Looks Like JSON Is Still a String

Only a string holding a recognized envelope is rebuilt.
A field whose text merely happens to parse as JSON is returned as the string it was, so a
  document which was never hybridized survives the call unchanged.

```js
jsongin.Unhybridize( { s: '123', t: 'true', u: '[1,2]' } );
// returns { s: '123', t: 'true', u: '[1,2]' }
```


## Notes

`Document` should be an object. A value of another type is not rejected: it is walked key by
  key, which gives a meaningless result rather than an error.

```js
jsongin.Unhybridize( 5 );
// returns {}
```


## See Also

- [`Hybridize( Document )`](./Hybridize.md), which produces the documents this restores.
- [`Clone( Document )`](./Clone.md) and [`SafeClone( Document )`](./SafeClone.md), which copy a
  document without converting it.
- [`Parse( JsonString, Options )`](./Parse.md) and [`Format( Value, Options )`](./Format.md)


## Examples

### It restores a date
```js
let hybrid = jsongin.Hybridize( { when: new Date( '2024-01-02T03:04:05Z' ) } );
let restored = jsongin.Unhybridize( hybrid );

jsongin.ShortType( restored.when ) === 'd'
restored.when.getTime() === 1704164645000
```

### It restores a regular expression
```js
let restored = jsongin.Unhybridize( jsongin.Hybridize( { pattern: /ab+c/i } ) );

restored.pattern.source === 'ab+c'
restored.pattern.flags === 'i'
```

### It restores nested objects and arrays
```js
let document = { o: { x: 1 }, a: [ 1, 2 ] };
let restored = jsongin.Unhybridize( jsongin.Hybridize( document ) );

jsongin.StrictEquals( document, restored ) === true
```

### It leaves primitive values alone
```js
jsongin.Unhybridize( { n: 42, s: 'text', b: true, l: null } );
// returns { n: 42, s: 'text', b: true, l: null }
```

### A document which was never hybridized survives
```js
jsongin.Unhybridize( { a: 1, s: 'plain' } );
// returns { a: 1, s: 'plain' }
```
