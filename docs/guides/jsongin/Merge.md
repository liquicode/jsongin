# @liquicode/jsongin


# Merge( DocumentA, DocumentB )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| DocumentA       |       (any)       | The document to merge into.              |
| DocumentB       |       (any)       | The document to merge from. Values from DocumentB overwrite values in DocumentA. |


## Description

Merges two documents and returns the merged document.


## See Also

- [`SafeClone( Document, Exceptions )`](./SafeClone.md)


## Examples


### It can merge with null objects
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, null );
merged === doc // effectively, a clone

merged = jsongin.Merge( null, doc );
merged === doc // effectively, a clone
```

### It can merge with empty objects
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, {} );
merged === doc // effectively, a clone

merged = jsongin.Merge( {}, doc );
merged === doc // effectively, a clone
```

### It can add new fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { x: 42 } );
merged === { b: true, n: 3.14, s: 'abc', x: 42 } // new field x

merged = jsongin.Merge( { x: 42 }, doc );
merged === { b: true, n: 3.14, s: 'abc', x: 42 } // New fields b, n, and s
```

### It can update existing fields
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let merged = jsongin.Merge( doc, { n: 42 } );
merged === { b: true, n: 42, s: 'abc' } // new value for n

merged = jsongin.Merge( { n: 42 }, doc );
merged === { b: true, n: 3.14, s: 'abc' } // new value for n, new fields b and s
```

### It can add new sub-fields
```js
let merged = jsongin.Merge( { A: { B: 2 } }, { A: { C: 3 } } );
merged === { A: { B: 2, C: 3 } }

merged = jsongin.Merge( { A: { C: 3 } }, { A: { B: 2 } } );
merged === { A: { B: 2, C: 3 } }
```

