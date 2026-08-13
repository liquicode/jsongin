# @liquicode/jsongin


# Diff( Before, After )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                              |
|---------------|:-----------------:|------------------------------------------------|
| Before        |      object       | The document as it was.                      |
| After         |      object       | The document as it should be.                |


## Description

Describes the changes between two documents and returns them as a `jsongin` ***update
document***.

That is the whole design of this function: a change is expressed in the same shape that
  [`Update( Document, Updates )`](./Update.md) already applies, so nothing new is needed to use
  the result.

```js
let patch = jsongin.Diff( before, after );   // { $set: { ... }, $unset: { ... } }
jsongin.Update( before, patch );             // holds the content of after
```

Neither document is modified, and nothing in the patch aliases either of them.
Two identical documents produce an empty patch `{}`, and `Update( document, {} )` returns a
  clone, so the round trip still holds.
An operator with nothing in it is omitted, so a patch is never `{ $set: {}, $unset: {} }`.

Use [`Invert( Before, Patch )`](./Invert.md) to obtain the patch which undoes this one.


## How a Difference Is Described

`Diff` walks both documents together. At each key:

| **Case**                                  | **Emitted**                              |
|-------------------------------------------|---------------------------------------------|
| The field is missing from `After`         | `$unset[ path ] = ''`                    |
| The field is missing from `Before`        | `$set[ path ] = <the value>`             |
| Both values are objects                   | Descend into them                        |
| The values differ                         | `$set[ path ] = <the value>`             |
| The values are equal                      | Nothing                                  |

Paths are in dot notation, so a change is described at the deepest path which actually changed:

```js
jsongin.Diff( { user: { name: 'Alice', role: 'admin' } },
              { user: { name: 'Alice', role: 'user' } } )
// === { $set: { 'user.role': 'user' } }
```

Values are compared with [`StrictEquals`](../Library-Guide.md), so a value which changed type is
  a change: `1` and `'1'` differ, and so do `0` and `false`.
`null` is a value rather than an absence, so a field which changed to `null` is `$set` and not
  `$unset`.
A field which is present but holds `undefined` counts as missing, on either side.

`''` is MongoDB's conventional `$unset` value. `jsongin` ignores the value entirely.


## Arrays Are Atomic

***A change anywhere inside an array replaces the whole array.***

```js
jsongin.Diff( { tags: [ 'a', 'b', 'c' ] }, { tags: [ 'a', 'z' ] } )
// === { $set: { tags: [ 'a', 'z' ] } }
```

`Diff` does not descend into arrays, and element order is part of an array's value, so
  reordering one is a change.

The alternative, describing an array element by element, cannot be made to work with the update
  operators `jsongin` has: shortening an array would need an `$unset` of its trailing indexes,
  and unsetting an array element leaves a hole rather than removing it.
Replacing the array is always correct, and it round trips.

Dates are atomic for the same reason, and are compared by their time value rather than by
  identity.


## Objects, Empty Objects, and Type Changes

Removal is per key, so an object which was ***emptied*** keeps its place, while an object which
  was ***removed*** does not:

```js
jsongin.Diff( { a: { x: 1 } }, { a: {} } )   // === { $unset: { 'a.x': '' } }
jsongin.Diff( { a: { x: 1 } }, {} )          // === { $unset: { a: '' } }
jsongin.Diff( {}, { a: {} } )                // === { $set: { a: {} } }
```

Note that this is why `Diff` does not build on [`Flatten()`](./Flatten.md), which would
  otherwise be the obvious tool: `Flatten` drops empty objects and arrays entirely, and it
  descends into arrays element-wise.

Only the both-are-objects case descends, so a value whose ***type*** changed is set whole,
  in either direction:

```js
jsongin.Diff( { a: { x: 1 } }, { a: 5 } )        // === { $set: { a: 5 } }
jsongin.Diff( { a: 5 }, { a: { x: 1 } } )        // === { $set: { a: { x: 1 } } }
```


## Content, Not Key Order

`Diff` compares content. Two documents whose fields appear in a different order are the same
  document, and produce an empty patch:

```js
jsongin.Diff( { a: 1, b: 2 }, { b: 2, a: 1 } )   // === {}
```

The consequence is worth knowing when asserting on a round trip: applying a patch restores
  content, ***not*** key order. A patch cannot reposition a key, so a field which is removed and
  later restored lands at the end of its object.
`StrictEquals` is sensitive to key order and will report such a document as unequal.
An empty `Diff` is the right test for "these hold the same content":

```js
let restored = jsongin.Update( after, jsongin.Invert( before, patch ) );
jsongin.StrictEquals( restored, before )              // may be false, on key order alone
jsongin.StrictEquals( jsongin.Diff( restored, before ), {} )   // true
```


## Errors and Limitations

`Diff` throws when either parameter is not an object.

A field name which itself contains a `.` cannot be addressed unambiguously in dot notation.
This is a limitation of document paths throughout `jsongin` rather than one of this function,
  and it is the one shape whose patch will not apply back correctly.


## See Also

- [`Invert( Before, Patch )`](./Invert.md), which reverses a patch.
- [`Update( Document, Updates )`](./Update.md), which applies one.
- [`SafeClone( Document )`](./SafeClone.md), which the patch's values are cloned with.
- [Operator Reference](../Operator-Reference.md) for the update operators.


## Examples

### It describes several changes at once
```js
let before = { hp: 10, tags: [ 'x' ], nest: { k: 1, keep: 2 } };
let after  = { hp: 7, tags: [ 'x', 'y' ], nest: { keep: 2 }, other: 2 };

jsongin.Diff( before, after );
// === {
//       $set: { hp: 7, tags: [ 'x', 'y' ], other: 2 },
//       $unset: { 'nest.k': '' },
//     }
```

### It applies with Update
```js
let patch = jsongin.Diff( before, after );
let result = jsongin.Update( before, patch );
jsongin.StrictEquals( jsongin.Diff( result, after ), {} ) === true
```

### It reports nothing when nothing changed
```js
jsongin.Diff( { a: 1 }, { a: 1 } )   // === {}
```

### It can be used as a strict, order-insensitive comparison
```js
// Empty means the two documents hold the same content, whatever order their fields are in.
function same_content( A, B ) { return ( Object.keys( jsongin.Diff( A, B ) ).length === 0 ); }
```
