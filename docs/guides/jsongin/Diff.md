# @liquicode/jsongin


# Diff( Before, After )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                              |
|---------------|:-----------------:|------------------------------------------------|
| Before        |         o         | The document as it was.                      |
| After         |         o         | The document as it should be.                |


## Description

Returns an ***update document*** which turns `Before` into `After`.
You can pass it straight to [`Update( Document, Updates )`](./Update.md).

```js
let before = { hp: 10, n: 1 };
let after = { hp: 7 };

let patch = jsongin.Diff( before, after );
// returns { $set: { hp: 7 }, $unset: { n: '' } }

jsongin.Update( before, patch );
// returns { hp: 7 }                          the same content as after
```

Neither document is changed, and the patch shares nothing with either of them.

Two documents with the same content give an empty patch, `{}`.
`Update( document, {} )` returns an unchanged copy, so an empty patch still applies.
A patch never holds an empty operator such as `$set: {}`.

To get a patch which undoes this one, use [`Invert( Before, Patch )`](./Invert.md).


## How Changes Are Described

`Diff` goes through both documents field by field:

| **Case**                                  | **Adds to the patch**                    |
|-------------------------------------------|---------------------------------------------|
| The field is missing from `After`         | `$unset[ path ] = ''`                    |
| The field is missing from `Before`        | `$set[ path ] = <the new value>`         |
| Both values are objects                   | Compares the fields inside them          |
| The values are different                  | `$set[ path ] = <the new value>`         |
| The values are equal                      | Nothing                                  |

Paths use dot notation, so each change is recorded at the deepest field which changed:

```js
jsongin.Diff( { user: { name: 'Alice', role: 'admin' } },
              { user: { name: 'Alice', role: 'user' } } )
// returns { $set: { 'user.role': 'user' } }
```

Values are compared with [`StrictEquals()`](./StrictEquals.md), so a change of type is a change:
  `1` and `'1'` are different, and so are `0` and `false`.
A field changed to `null` is `$set`, not `$unset`.
A field holding `undefined` counts as missing, in either document.


## Arrays Are Replaced Whole

***Any change inside an array replaces the whole array.***

```js
jsongin.Diff( { tags: [ 'a', 'b', 'c' ] }, { tags: [ 'a', 'z' ] } )
// returns { $set: { tags: [ 'a', 'z' ] } }
```

Changing the order of an array's elements is also a change.

Dates are compared by the moment they hold, and are also replaced whole.


## Objects and Type Changes

A field is removed with `$unset`, so an object which was ***emptied*** stays, while an object
  which was ***removed*** goes:

```js
jsongin.Diff( { a: { x: 1 } }, { a: {} } )   // returns { $unset: { 'a.x': '' } }
jsongin.Diff( { a: { x: 1 } }, {} )          // returns { $unset: { a: '' } }
jsongin.Diff( {}, { a: {} } )                // returns { $set: { a: {} } }
```

When a value changes to or from an object, the new value is set whole:

```js
jsongin.Diff( { a: { x: 1 } }, { a: 5 } )        // returns { $set: { a: 5 } }
jsongin.Diff( { a: 5 }, { a: { x: 1 } } )        // returns { $set: { a: { x: 1 } } }
```


## Field Order Does Not Matter

`Diff` compares content.
Two documents with the same fields in a different order give an empty patch:

```js
jsongin.Diff( { a: 1, b: 2 }, { b: 2, a: 1 } )   // returns {}
```

Keep this in mind when checking that a patch round trips.
A patch restores content but ***not*** field order: a field which is removed and then added back
  ends up last in its object.
`StrictEquals` does care about field order, so use an empty `Diff` to test for the same content:

```js
let restored = jsongin.Update( after, jsongin.Invert( before, patch ) );
jsongin.StrictEquals( restored, before )                       // can be false, on field order alone
jsongin.StrictEquals( jsongin.Diff( restored, before ), {} )   // true
```


## Errors and Limitations

`Diff` throws when either parameter is not an object.

A field whose name contains a `.` cannot be named correctly in dot notation, so a patch which
  touches it will not apply back correctly.
This is true of paths everywhere in `jsongin`.


## See Also

- [`Invert( Before, Patch )`](./Invert.md), which undoes a patch.
- [`Update( Document, Updates )`](./Update.md), which applies one.
- [`SafeClone( Document )`](./SafeClone.md), which copies the values in a patch.
- [Operator Reference](../Operator-Reference.md) for the update operators.


## Examples

### It describes several changes at once
```js
let before = { hp: 10, tags: [ 'x' ], nest: { k: 1, keep: 2 } };
let after  = { hp: 7, tags: [ 'x', 'y' ], nest: { keep: 2 }, other: 2 };

jsongin.Diff( before, after );
// returns {
//       $set: { hp: 7, tags: [ 'x', 'y' ], other: 2 },
//       $unset: { 'nest.k': '' },
//     }
```

### Update applies it
```js
let patch = jsongin.Diff( before, after );
let result = jsongin.Update( before, patch );
jsongin.StrictEquals( jsongin.Diff( result, after ), {} ) === true
```

### It returns an empty patch when nothing changed
```js
jsongin.Diff( { a: 1 }, { a: 1 } )   // returns {}
```

### It can compare content while ignoring field order
```js
// An empty patch means the documents hold the same content.
function same_content( A, B ) { return ( Object.keys( jsongin.Diff( A, B ) ).length === 0 ); }
```
