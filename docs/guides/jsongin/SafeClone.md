# @liquicode/jsongin


# SafeClone( Document, Exceptions )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       (any)       | The value to copy.                       |
| Exceptions    |       ulsa        | Optional. A path, or an array of paths, to share with the original instead of copying. |


## Description

Returns a deep copy of `Document`, made field by field.

Unlike [`Clone()`](./Clone.md), nothing is lost:

- Objects and arrays are copied all the way down.
- ***Dates*** are copied as new `Date` objects with the same moment.
- Numbers, strings, booleans, `null` and `undefined` are copied as they are.
- Regular expressions, errors, functions and symbols are kept, but ***not copied***: the copy
  holds the same object as the original.

`Document` can be any value. A value which is not an object, array or date is returned as it is.

`Exceptions` lists dot notation paths, such as `'ref'` or `'a.0'`, whose values are shared with
  the original instead of copied.
Changing a shared value changes it in both.

`SafeClone` throws when `Exceptions` is not a string, an array, `null` or `undefined`.


## See Also

- [`Clone( Document )`](./Clone.md)
- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)


## Examples


### It copies a simple object
```js
let doc = { b: true, n: 3.14, s: 'abc' };

let clone = jsongin.SafeClone( doc );
clone.b === true
clone.n === 3.14
clone.s === 'abc'
```

### It copies nested objects
```js
let doc = { o: { b: true, n: 3.14, s: 'abc' } };

let clone = jsongin.SafeClone( doc );
clone.o.b === true
clone.o.n === 3.14
clone.o.s === 'abc'
( clone.o !== doc.o ) === true
```

### It copies arrays
```js
let doc = { a: [ { one: 1 }, { two: 2 } ] };

let clone = jsongin.SafeClone( doc );
clone.a.length === 2
clone.a[ 0 ].one === 1
clone.a[ 1 ].two === 2
```

### It keeps values which JSON would lose
```js
let doc = { l: null, r: /test/, e: new Error( 'hello' ), f: function () { }, u: undefined };

let clone = jsongin.SafeClone( doc );
clone.l === null
( clone.r instanceof RegExp ) === true
( clone.e instanceof Error ) === true
( typeof clone.f === 'function' ) === true
( typeof clone.u === 'undefined' ) === true
```

### It copies dates
```js
let doc = { d: new Date( 1700000000000 ) };

let clone = jsongin.SafeClone( doc );
( clone.d instanceof Date ) === true
clone.d.getTime() === 1700000000000

// The date is a new object, so changing one does not change the other.
( clone.d !== doc.d ) === true
```

### Exceptions are shared, not copied
```js
let doc = { id: 42, ref: { name: 'Alice' } };

let clone = jsongin.SafeClone( doc, [ 'ref' ] );
clone.ref.name = 'Bob'; // changes both doc and clone
doc.ref.name === 'Bob'
```

### It throws for Exceptions of the wrong type
```js
jsongin.SafeClone( { a: 1 }, 42 ) // throws 'The Exceptions parameter must be a document path ...'
```
