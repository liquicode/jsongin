# @liquicode/jsongin


# DeleteValue( Document, Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       o, a        | The document to remove a field from.     |
| Path          |       s, n        | The path of the field to remove.         |


## Description

Removes the field at `Path` from `Document` and returns `true`.
Returns `false` when the path could not be resolved.

The `Document` is modified in place.

The key is ***removed***, not set to `undefined`.
This distinction matters: a key holding `undefined` is invisible in JSON but still reported by
  `Object.keys()` and by the `in` operator, so the two views of the document disagree with each
  other. `DeleteValue` leaves them in agreement.

`DeleteValue` throws when `Document` is not an object or an array, or when `Path` is not a
  string or a number.
Every other failure is reported to the `OpLog` and returns `false`.


## Array Elements

A path which addresses an array element leaves a ***hole*** in the array rather than shortening
  it, which is what the Javascript `delete` operator does.

```js
let document = { a: [ 1, 2, 3 ] };
jsongin.DeleteValue( document, 'a.1' ) === true
document.a.length === 3   // still three
// document.a is now [ 1, <hole>, 3 ]
```

To shorten an array, use the `$pop` or `$pullAll` update operators instead.
See [`Update()`](./Update.md).


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [`SplitPath( Path )`](./SplitPath.md)
- [`Update()`](./Update.md) and its `$unset` operator, which uses this function.
- [`Project()`](./Project.md), which uses this function to exclude fields.


## Examples


### It removes a field and its key
```js
let document = { a: { b: 1 } };

jsongin.DeleteValue( document, 'a.b' ) === true
// document is { a: {} }
// Object.keys( document.a ) returns []
```


### It returns false when the path does not exist
```js
let document = { a: 1 };

jsongin.DeleteValue( document, 'x.y' ) === false
// document is { a: 1 } (unchanged)
```


### It returns false for an empty path
```js
let document = { a: 1 };

jsongin.DeleteValue( document, '' ) === false
// document is { a: 1 } (unchanged)
```


### It throws when the document is not a document
```js
jsongin.DeleteValue( 'a string', 'a' )
// throws: Document must be an object or array.
```
