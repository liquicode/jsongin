# @liquicode/jsongin


# Invert( Before, Patch )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                        |
|---------------|:-----------------:|-----------------------------------------------------------|
| Before        |      object       | The document the patch was, or would be, applied to.   |
| Patch         |      object       | The update document to reverse.                        |


## Description

Returns the update document which ***undoes*** `Patch`, given the document it applies to.

```js
let patch = jsongin.Diff( before, after );
let after = jsongin.Update( before, patch );

let undo = jsongin.Invert( before, patch );
jsongin.Update( after, undo );   // holds the content of before again
```

Both `Before` and `Patch` are left unmodified.
A patch which changes nothing inverts to an empty patch `{}`.

This is the primitive behind undo and redo, and behind replaying a change log in either
  direction.


## It Inverts Any Update Document

`Invert` does not inspect the operators in the patch. It applies the patch and then diffs the
  result back toward the original:

```js
Invert( Before, Patch )   ===   Diff( Update( Before, Patch ), Before )
```

Because the inverse is computed from the ***observed result*** rather than from the operators,
  every update operator inverts, not only the `$set` and `$unset` which
  [`Diff`](./Diff.md) emits:

```js
jsongin.Invert( { n: 5 }, { $inc: { n: 3 } } )            // returns { $set: { n: 5 } }
jsongin.Invert( { t: [ 'a' ] }, { $push: { t: 'b' } } )   // returns { $set: { t: [ 'a' ] } }
jsongin.Invert( { a: 1 }, { $rename: { a: 'b' } } )       // returns { $set: { a: 1 }, $unset: { b: '' } }
```

The inverse is always expressed as `$set` and `$unset`, whatever the original patch used, since
  that is what `Diff` produces.

An inverse is only valid for the document it was computed against. `Before` must be the state
  the patch was applied to, not the state after it.


## Errors

`Invert` throws when `Before` is not an object, and when `Patch` is not a valid update document.

Note that [`Update()`](./Update.md) itself returns `null` rather than throwing when it rejects
  its parameters. `Invert` checks for that and throws, so a bad patch cannot quietly produce a
  nonsense inverse.


## What Is Not Restored

The inverse restores ***content***, not key order. A field which the patch removed is restored
  at the end of its object rather than in its original position, because an update document
  cannot reposition a key.

`StrictEquals` is sensitive to key order, so the natural round-trip assertion is an empty
  `Diff` instead:

```js
let restored = jsongin.Update( after, jsongin.Invert( before, patch ) );
jsongin.StrictEquals( jsongin.Diff( restored, before ), {} ) === true
```


## See Also

- [`Diff( Before, After )`](./Diff.md), which produces the patches this reverses.
- [`Update( Document, Updates )`](./Update.md), which applies them.


## Examples

### Undo and redo
```js
let state = { hp: 10, tags: [ 'x' ] };

let patch = { $inc: { hp: -3 }, $push: { tags: 'burned' } };
let undo = jsongin.Invert( state, patch );

let damaged = jsongin.Update( state, patch );   // { hp: 7, tags: [ 'x', 'burned' ] }
let healed = jsongin.Update( damaged, undo );   // { hp: 10, tags: [ 'x' ] }

// To redo, apply the original patch again. The restored state holds the same content it did
// the first time, so the patch produces the same result.
jsongin.Update( healed, patch );                // { hp: 7, tags: [ 'x', 'burned' ] }
```

Note that `undo` belongs to `damaged`, the state it was made to be applied to. Inverting it
  against `healed` instead describes no change at all, because `healed` already holds what the
  undo would set. Keep a patch with the state it applies to.

### A change log which replays in either direction
```js
let history = [];
function apply( State, Patch )
{
	history.push( { patch: Patch, undo: jsongin.Invert( State, Patch ) } );
	return jsongin.Update( State, Patch );
}
// Walk history forward with .patch, or backward with .undo.
```
