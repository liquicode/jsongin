# @liquicode/jsongin


# DeleteValue( Document, Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |       o, a        | The document to remove a field from.     |
| Path          |       s, n        | The path of the field to remove.         |


## Description

Removes the field at `Path` from `Document` and returns `true`.
Returns `false` when nothing was removed, which covers a path whose parent does not resolve
  and a field which was never there.

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

A ***negative index*** addresses nothing and returns `false`:

```js
let document = { a: [ 1, 2, 3 ] };

jsongin.DeleteValue( document, 'a.-1' ) === false
// document is unchanged
```

There is no reverse indexing. A negative number is read as a field name like any other, and an
  array has no field called `-1`.
This matches MongoDB, where `$unset: { 'a.-1': '' }` reports a successful update which modified
  nothing, verified against MongoDB 6.0.1.


## Reaching Into An Array

A ***non numeric key against an array*** does nothing, and returns `false`:

```js
let document = { a: [ { x: 1 }, { x: 2 } ] };

jsongin.DeleteValue( document, 'a.x' ) === false
// document is unchanged
```

This matches MongoDB, where `$unset: { 'a.x': '' }` reports a successful update which modified
  nothing.
Reaching through an array there requires the all positional operator,
  `$unset: { 'a.$[].x': '' }`.

Deleting from every element instead used to be a ***path extension***, enabled with a
  `PathExtensions` engine setting.
There is no such setting: jsongin's path syntax is MongoDB's path syntax, so there is nothing
  to turn on.


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


### It returns false when the field was never there
```js
let document = { a: 1 };

jsongin.DeleteValue( document, 'nope' ) === false
// document is { a: 1 } (unchanged)
```

A field holding `undefined` still counts as present, because its key is there to remove.


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
