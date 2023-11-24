# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin)


# SafeClone( Document, Exceptions )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The document to clone.                   |
| Exceptions    |       ulsa        | A document path or array of paths to copy by reference rather than by value. |


## Description

Creates and returns a member-wise clone of `Document`.
Nested documents and arrays are (deep) copied by value unless they are listed in `Exceptions`.
Avoids pitfalls of the stringify/parse approach to cloning which silently fails when attempting to
  clone documents that contain functions or regular expressions.

`Document` can be anything.
If it is an object or array, then a member-wise clone is performed
If `Document` is anything else, it is simply returned as-is.

The `Exceptions` parameter can be `undefined`, `null`, a document path, or an array of document paths in dot-notation.
Any fields listed in `Exceptions` are copied by reference rather than by value.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)


## Examples


### It can clone a simple object
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let clone = jsongin.SafeClone( doc );
clone.b === true
clone.n === 3.14
clone.s === 'abc'
```

### It can clone nested objects
```js
let doc = { o: { b: true, n: 3.14, s: 'abc' } };

let clone = jsongin.SafeClone( doc );
clone.o.b === true
clone.o.n === 3.14
clone.o.s === 'abc'
```

### It can clone an array
```js
let doc = { a: [ 1, 2, 3 ] };

let clone = jsongin.SafeClone( doc );
clone.a.length === 3
clone.a[ 0 ] === 1
clone.a[ 1 ] === 2
clone.a[ 2 ] === 3
```

### It can clone an array of objects
```js
let doc = { a: [ { one: 1 }, { two: 2 } ] };

let clone = jsongin.SafeClone( doc );
clone.a.length = 2
clone.a[ 0 ].one === 1
clone.a[ 1 ].two === 2
```

### It can clone non-value fields
```js
let doc = { l: null, r: /test/, e: new Error( 'hello' ), f: function () { }, u: undefined };

let clone = jsongin.SafeClone( doc );
clone.l === null
// The following fail with json stringify/parse
( clone.r instanceof RegExp ) === true
( clone.e instanceof Error ) === true
( typeof clone.f === 'function' )
( typeof clone.u === 'undefined' )
```

### It can selectively clone with the Exceptions parameter
```js
let doc = { id: 42, ref: { name: 'Alice' } };

let clone = jsongin.SafeClone( doc, [ 'ref' ] );
clone.ref.name = 'Bob' // Changed in both doc and clone
doc.ref.name === 'Bob'
```

### It should throw an error if an invalid Exceptions paramter is provided
```js
jsongin.SafeClone( { a: 1 }, 42 ) // throws 'The Exceptions parameter must be a document path ...'
```
