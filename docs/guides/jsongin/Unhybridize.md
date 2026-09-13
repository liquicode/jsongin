# @liquicode/jsongin


# Unhybridize( Document )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |        o          | The hybrid document to restore.          |


## Description

Turns a document made by [`Hybridize()`](./Hybridize.md) back into the original.

`Hybridize()` writes each object, array, date, regular expression, error, function, symbol and
  `undefined` as a JSON string which records its type.
`Unhybridize()` reads those strings and rebuilds the values.

```js
let document = { when: new Date( '2024-01-02T03:04:05Z' ), pattern: /ab+c/i, n: 42 };

let restored = jsongin.Unhybridize( jsongin.Hybridize( document ) );

jsongin.StrictEquals( document, restored ) === true
```

Only strings written by `Hybridize` are rebuilt.
A string which just happens to be valid JSON stays a string, and every non-string value is copied
  as it is, so a document which was never hybridized comes back unchanged:

```js
jsongin.Unhybridize( { s: '123', t: 'true', u: '[1,2]' } );
// returns { s: '123', t: 'true', u: '[1,2]' }
```


## Notes

A ***function*** is rebuilt from its source code.
Anything it used from outside its own code is lost, and a method written in shorthand, such as
  `{ m() {} }`, cannot be rebuilt and throws.

A ***symbol*** comes back as a new symbol, not the original one.

`Document` should be an object. Other values are not refused, but give a meaningless result:

```js
jsongin.Unhybridize( 5 );
// returns {}
```


## See Also

- [`Hybridize( Document )`](./Hybridize.md)
- [`SafeClone( Document )`](./SafeClone.md), which copies a document without converting it.
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

### It restores objects and arrays
```js
let document = { o: { x: 1 }, a: [ 1, 2 ] };
let restored = jsongin.Unhybridize( jsongin.Hybridize( document ) );

jsongin.StrictEquals( document, restored ) === true
```

### It leaves simple values alone
```js
jsongin.Unhybridize( { n: 42, s: 'text', b: true, l: null } );
// returns { n: 42, s: 'text', b: true, l: null }
```

### A document which was never hybridized comes back unchanged
```js
jsongin.Unhybridize( { a: 1, s: 'plain' } );
// returns { a: 1, s: 'plain' }
```
