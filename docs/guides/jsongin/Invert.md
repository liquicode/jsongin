# @liquicode/jsongin


# Invert( Before, Patch )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                        |
|---------------|:-----------------:|-----------------------------------------------------------|
| Before        |         o         | The document the patch is applied to.                  |
| Patch         |         o         | The update document to undo.                           |


## Description

Returns an update document which ***undoes*** `Patch`.

```js
let before = { hp: 10 };
let patch = { $inc: { hp: -3 } };

let after = jsongin.Update( before, patch );
// returns { hp: 7 }

let undo = jsongin.Invert( before, patch );
// returns { $set: { hp: 10 } }

jsongin.Update( after, undo );
// returns { hp: 10 }                         the same content as before
```

`Before` must be the document ***before*** the patch is applied.
Neither `Before` nor `Patch` is changed.
A patch which changes nothing gives an empty undo, `{}`.

Use `Invert` for undo and redo, or to replay a list of changes backwards.


## It Undoes Any Update

`Invert` applies the patch to a copy of `Before`, then uses [`Diff`](./Diff.md) to find what
  turns the result back into `Before`:

```
Invert( Before, Patch )   ===   Diff( Update( Before, Patch ), Before )
```

So it works for every update operator, and the undo always uses `$set` and `$unset`:

```js
jsongin.Invert( { n: 5 }, { $inc: { n: 3 } } )            // returns { $set: { n: 5 } }
jsongin.Invert( { t: [ 'a' ] }, { $push: { t: 'b' } } )   // returns { $set: { t: [ 'a' ] } }
jsongin.Invert( { a: 1 }, { $rename: { a: 'b' } } )       // returns { $set: { a: 1 }, $unset: { b: '' } }
```


## Errors

`Invert` throws when `Before` is not an object, or when [`Update()`](./Update.md) would throw
  for the patch or return `null` for it.
A `Patch` of `null` or `undefined` changes nothing, so it gives `{}`.


## What Is Not Restored

The undo restores ***content***, not field order.
A field which the patch removed comes back at the end of its object.

`StrictEquals` cares about field order, so check a round trip with an empty `Diff` instead:

```js
let restored = jsongin.Update( after, jsongin.Invert( before, patch ) );
jsongin.StrictEquals( jsongin.Diff( restored, before ), {} ) === true
```


## See Also

- [`Diff( Before, After )`](./Diff.md), which makes the undo.
- [`Update( Document, Updates )`](./Update.md), which applies it.


## Examples

### Undo and redo
```js
let state = { hp: 10, tags: [ 'x' ] };

let patch = { $inc: { hp: -3 }, $push: { tags: 'burned' } };
let undo = jsongin.Invert( state, patch );

let damaged = jsongin.Update( state, patch );   // { hp: 7, tags: [ 'x', 'burned' ] }
let healed = jsongin.Update( damaged, undo );   // { hp: 10, tags: [ 'x' ] }

// To redo, apply the original patch again.
jsongin.Update( healed, patch );                // { hp: 7, tags: [ 'x', 'burned' ] }
```

Make the undo from the document the patch is applied to (`state` here), and apply it to the
  result (`damaged`).

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
