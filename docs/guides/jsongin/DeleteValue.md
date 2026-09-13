# @liquicode/jsongin


# DeleteValue( Document, Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       o, a        | The document to remove a field from.     |
| Path          |       s, n        | The path of the field to remove.         |


## Description

Removes the field at `Path` from `Document`, and returns `true`.
Returns `false` if there was nothing to remove: the path is empty, part of it does not exist, or
  the field itself does not exist.

`Document` is changed in place.

The key is ***deleted***, not set to `undefined`, so `Object.keys()` and the `in` operator no
  longer see it.

`DeleteValue` throws when `Document` is not an object or array, or `Path` is not a string or
  number.
Other problems send a message to the [`OpLog`](../OpLog.md) and return `false`.


## Array Elements

Deleting an array element leaves a ***hole***.
The array keeps its length, the same as with Javascript's `delete`.

```js
let document = { a: [ 1, 2, 3 ] };
jsongin.DeleteValue( document, 'a.1' ) === true
document.a.length === 3   // still three
// document.a is now [ 1, <hole>, 3 ]
```

To remove elements and shorten an array, use the `$pop`, `$pull` or `$pullAll` update operators.
See [`Update()`](./Update.md).

A ***negative index*** does nothing and returns `false`.
There is no counting from the end: `-1` is just a field name, and an array has no field called
  `-1`.

```js
let document = { a: [ 1, 2, 3 ] };

jsongin.DeleteValue( document, 'a.-1' ) === false
// document is unchanged
```


## Field Names Against an Array

A field name used against an array does nothing and returns `false`.
It is not applied to each element:

```js
let document = { a: [ { x: 1 }, { x: 2 } ] };

jsongin.DeleteValue( document, 'a.x' ) === false
// document is unchanged
```

To remove a field from every element, use `$unset` with the `$[]` path element:
  `jsongin.Update( document, { $unset: { 'a.$[].x': '' } } )`.

MongoDB's `$unset` behaves the same way in both cases above.


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [`SplitPath( Path )`](./SplitPath.md)
- [`Update()`](./Update.md) and its `$unset` and `$rename` operators, which use this function.


## Examples


### It removes a field and its key
```js
let document = { a: { b: 1 } };

jsongin.DeleteValue( document, 'a.b' ) === true
// document is { a: {} }
// Object.keys( document.a ) returns []
```


### It returns false when part of the path does not exist
```js
let document = { a: 1 };

jsongin.DeleteValue( document, 'x.y' ) === false
// document is { a: 1 } (unchanged)
```


### It returns false when the field does not exist
```js
let document = { a: 1 };

jsongin.DeleteValue( document, 'nope' ) === false
// document is { a: 1 } (unchanged)
```

A field holding `undefined` does exist, so deleting it returns `true`.


### It returns false for an empty path
```js
let document = { a: 1 };

jsongin.DeleteValue( document, '' ) === false
// document is { a: 1 } (unchanged)
```


### It throws when the document is not an object or array
```js
jsongin.DeleteValue( 'a string', 'a' )
// throws: Document must be an object or array.
```
