# @liquicode/jsongin


# Update Operators

The operators used in an update document.
[`Update()`](./Update.md) applies them, and [`Diff()`](./Diff.md) and [`Invert()`](./Invert.md)
  produce them.

Each operator below has its usage, what it does, and examples.
See [`Update()`](./Update.md) for the rules that apply to a whole update document, and the
  [Operator Reference](../Operator-Reference.md) for which MongoDB operators are supported.

Every update operator takes an object of `field: value` pairs.
Fields can be dot notation paths.

When an operator cannot be applied, such as `$inc` on a string, `Update()` throws and the
  document is not changed.


# Field Update Operators


<a id="$set"></a>$set
---------------------------------------------------------------------

**Usage** : `{ $set: { field: value, ... } }`

Sets each field to its value.
Missing fields along the path are created as objects.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $set: { 'user.name': 'Bob' } }
			);
// updated is { user: { name: 'Bob' } }

updated = jsongin.Update( {}, { $set: { 'a.b.c': 1 } } );
// updated is { a: { b: { c: 1 } } }
```


<a id="$unset"></a>$unset
---------------------------------------------------------------------

**Usage** : `{ $unset: { field: '', ... } }`

Removes each field. The value you give is ignored; `''` is the usual choice.

A field which does not exist is left alone.
Unsetting an array element, such as `'a.1'`, sets it to `null` rather than shortening the array.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $unset: { 'user.name': '' } }
			);
// updated is { user: {} }

updated = jsongin.Update( { a: [ 1, 2, 3 ] }, { $unset: { 'a.1': '' } } );
// updated is { a: [ 1, null, 3 ] }
```


<a id="$rename"></a>$rename
---------------------------------------------------------------------

**Usage** : `{ $rename: { field: 'new.name', ... } }`

Moves each field to a new name, which can be a dot notation path.
If a field already exists at the new name, it is replaced.

A field which does not exist is left alone.
The new name must be a string, and cannot lead into an array.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $rename: { 'user.name': 'user.first_name' } }
			);
// updated is { user: { first_name: 'Alice' } }
```


<a id="$min"></a>$min
---------------------------------------------------------------------

**Usage** : `{ $min: { field: value, ... } }`

Sets the field to `value` only if `value` is ***smaller*** than the current value.
If the field does not exist, it is set to `value`.

Values of any type can be compared, using [`CompareValues()`](./CompareValues.md).
So `null` is smaller than any number, and a number is smaller than any string.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $min: { 'user.login_count': 7 } }
			);
// updated is { user: { name: 'Alice', login_count: 7 } }
```


<a id="$max"></a>$max
---------------------------------------------------------------------

**Usage** : `{ $max: { field: value, ... } }`

Sets the field to `value` only if `value` is ***larger*** than the current value.
If the field does not exist, it is set to `value`.
Values are compared the same way as for [`$min`](#$min).

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $max: { 'user.login_count': 50 } }
			);
// updated is { user: { name: 'Alice', login_count: 50 } }
```


<a id="$inc"></a>$inc
---------------------------------------------------------------------

**Usage** : `{ $inc: { field: amount, ... } }`

Adds `amount` to the field. Use a negative amount to subtract.
If the field does not exist, it is created and set to `amount`.

The field and `amount` must both be numbers.
A field holding anything else, including `null`, throws.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 1 } },
				{ $inc: { 'user.login_count': 5 } }
			);
// updated is { user: { name: 'Alice', login_count: 6 } }
```


<a id="$mul"></a>$mul
---------------------------------------------------------------------

**Usage** : `{ $mul: { field: amount, ... } }`

Multiplies the field by `amount`.
If the field does not exist, it is created and set to `0`.

The field and `amount` must both be numbers.
A field holding anything else, including `null`, throws.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $mul: { 'user.login_count': 2 } }
			);
// updated is { user: { name: 'Alice', login_count: 84 } }
```


<a id="$currentDate"></a>$currentDate
---------------------------------------------------------------------

**Usage** : `{ $currentDate: { field: true | { $type: 'date' } | { $type: 'timestamp' }, ... } }`

Sets each field to the current date and time.

| **Value**                | **Sets the field to**                                        |
|--------------------------|--------------------------------------------------------------|
| `true` or `false`        | A `Date`.                                                    |
| `{ $type: 'date' }`      | A `Date`.                                                    |
| `{ $type: 'timestamp' }` | A number: milliseconds since 1970.                           |

Every field in one `$currentDate` gets the same moment, but each gets its own `Date` object.

`{ $type: 'timestamp' }` stores a number because `jsongin` has no BSON timestamp type.

A string, an object without `$type`, or an unknown `$type` throws.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': true } }
			);
// updated is { user: { name: 'Alice', last_login: <Date 2023-11-24T07:51:47.064Z> } }

updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': { $type: 'timestamp' } } }
			);
// updated is { user: { name: 'Alice', last_login: 1700812593086 } }
```

```js
// The stored value is a real Date.
let updated = jsongin.Update( {}, { $currentDate: { when: true } } );
jsongin.Query( updated, { when: { $type: 'date' } } ) === true

// A string is not accepted.
jsongin.Update( { a: null }, { $currentDate: { a: 'timestamp' } } );   // throws
jsongin.Update( { a: null }, { $currentDate: { a: { $type: 'bogus' } } } );   // throws
```


# Array Update Operators

If the array field does not exist, `$addToSet` and `$push` create it, while `$pop`, `$pull` and
  `$pullAll` leave the document alone.
If the field exists but is not an array, all five throw.


<a id="$addToSet"></a>$addToSet
---------------------------------------------------------------------

**Usage** : `{ $addToSet: { array-field: value, ... } }`
  or `{ $addToSet: { array-field: { $each: [ value, ... ] }, ... } }`

Adds `value` to the array, unless an equal value is already there.

With `$each`, each value in the list is added unless it is already there, including values added
  earlier from the same list.
An object ***without*** `$each` is added as a single value.

Values are compared by content, so an equal object, array or date counts as already there.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $addToSet: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $addToSet: { a: { $each: [ 2, 3, 4 ] } } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// Duplicates within the list are skipped too.
updated = jsongin.Update(
				{ a: [] },
				{ $addToSet: { a: { $each: [ 1, 1, 2 ] } } }
			);
// updated is { a: [ 1, 2 ] }
```


<a id="$pop"></a>$pop
---------------------------------------------------------------------

**Usage** : `{ $pop: { array-field: 1 | -1, ... } }`

`1` removes the last element, and `-1` removes the first.
Any other value throws. An empty array is left as it is.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $pop: { a: 1 } }
			);
// updated is { a: [ 1, 2 ] }

updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $pop: { a: -1 } }
			);
// updated is { a: [ 2, 3 ] }
```


<a id="$push"></a>$push
---------------------------------------------------------------------

**Usage** : `{ $push: { array-field: value, ... } }`
  or `{ $push: { array-field: { $each: [ value, ... ], $position: n, $sort: spec, $slice: n }, ... } }`

Adds `value` to the end of the array.

To add several values, or to control where they go, give an object with `$each`:

| **Option**    | **Effect**                                                                  |
|---------------|------------------------------------------------------------------------------|
| `$each`       | The values to add. Required to use any of the other options.                 |
| `$position`   | Insert at this position instead of at the end. A negative position counts back from the end. A position past either end is treated as that end. |
| `$sort`       | Sort the array afterwards: `1` or `-1` for simple values, or a sort object such as `{ score: -1 }` for objects. |
| `$slice`      | Then keep only part of the array: a positive number keeps that many from the start, a negative number keeps that many from the end, and `0` empties it. |

They are applied in this order: `$each`, `$position`, `$sort`, `$slice`.

An object ***without*** `$each` is added as a single value, even if it has `$position`, `$sort`
  or `$slice` keys.
An object ***with*** `$each` and any other `$` key throws, and the array is not changed.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $push: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// Add several values.
updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $push: { a: { $each: [ 3, 4 ] } } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// Insert at the start.
updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $push: { a: { $each: [ 9 ], $position: 0 } } }
			);
// updated is { a: [ 9, 1, 2 ] }

// Keep the two largest values.
updated = jsongin.Update(
				{ a: [ 5, 1 ] },
				{ $push: { a: { $each: [ 3 ], $sort: -1, $slice: 2 } } }
			);
// updated is { a: [ 5, 3 ] }
```

```js
// An object without $each is added as one value.
jsongin.Update( { a: [] }, { $push: { a: { n: 1 } } } ).a.length === 1
jsongin.Update( { a: [ 1 ] }, { $push: { a: { $position: 0 } } } ).a.length === 2

// An unknown $ key beside $each throws.
jsongin.Update( { a: [ 1 ] }, { $push: { a: { $each: [ 3 ], $bogus: 1 } } } );   // throws
```


<a id="$pullAll"></a>$pullAll
---------------------------------------------------------------------

**Usage** : `{ $pullAll: { array-field: [ value, ... ], ... } }`

Removes every element equal to any value in the list.
Values are compared by content, so an equal object, array or date is removed.
The list must be an array.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $pullAll: { a: [ 1, 3 ] } }
			);
// updated is { a: [ 2 ] }

updated = jsongin.Update(
				{ a: [ { n: 1 }, { n: 2 } ] },
				{ $pullAll: { a: [ { n: 1 } ] } }
			);
// updated is { a: [ { n: 2 } ] }
```


<a id="$pull"></a>$pull
---------------------------------------------------------------------

**Usage** : `{ $pull: { array-field: condition, ... } }`

Removes every element which matches `condition`.

Unlike [`$pullAll`](#$pullAll), the condition is a ***query***, so it can use operators:

| **Written** | **Removes** |
|-------------|--------------|
| `{ $pull: { a: 3 } }` | every element equal to `3` |
| `{ $pull: { a: { $gt: 3 } } }` | every element greater than `3` |
| `{ $pull: { a: { b: 1 } } }` | every object element whose `b` is `1` |

- An object condition tests ***fields of each element***, so `{ b: 1 }` removes `{ b: 1, c: 2 }`
  as well as `{ b: 1 }`. To remove only exact matches, use `$pullAll`.
- An empty condition, `{}`, removes every element which is an object.
- The condition is tested against each element itself. `{ $pull: { a: 1 } }` removes an element
  `1`, but not an element `[ 1, 2 ]`.

**Examples**
```js
jsongin.Update( { a: [ 1, 3, 5, 3 ] }, { $pull: { a: 3 } } );
// returns { a: [ 1, 5 ] }

jsongin.Update( { a: [ 1, 3, 5, 7 ] }, { $pull: { a: { $gt: 3 } } } );
// returns { a: [ 1, 3 ] }

// An object condition tests fields, so the element with c is removed too.
jsongin.Update( { a: [ { b: 1, c: 2 }, { b: 2 } ] }, { $pull: { a: { b: 1 } } } );
// returns { a: [ { b: 2 } ] }

// The array element [ 1, 2 ] is not equal to 1.
jsongin.Update( { a: [ [ 1, 2 ], 1 ] }, { $pull: { a: 1 } } );
// returns { a: [ [ 1, 2 ] ] }
```


<a id="$[]"></a>$[] — every array element
---------------------------------------------------------------------

**Usage** : `{ operator: { 'array-field.$[].field': value } }`

`$[]` is written ***inside a path*** and means "every element of this array".
`'a.$[].n'` is the `n` field of every element of `a`.

It is the only way to change a field in every element.
A plain path such as `'a.n'` against an array throws, because it does not say which element.

- Every update operator accepts it except [`$rename`](#$rename).
- Each element is read and changed separately, so `$inc` adds to each element's own value.
- Paths can use it more than once, one for each array.

| **Used on** | **Result** |
|---------------------|-------------|
| a field which is not an array, or does not exist | throws |
| an ***empty*** array | nothing changes |
| elements which cannot hold the field, such as numbers | throws |

**Examples**
```js
jsongin.Update( { a: [ 1, 2, 3 ] }, { $set: { 'a.$[]': 5 } } );
// returns { a: [ 5, 5, 5 ] }

// Each element gets its own result.
jsongin.Update( { a: [ { n: 1 }, { n: 2 } ] }, { $inc: { 'a.$[].n': 1 } } );
// returns { a: [ { n: 2 }, { n: 3 } ] }

jsongin.Update( { a: [ { n: 1, k: 'x' } ] }, { $unset: { 'a.$[].n': '' } } );
// returns { a: [ { k: 'x' } ] }

// Nested arrays.
jsongin.Update( { a: [ { b: [ { n: 1 }, { n: 2 } ] } ] }, { $set: { 'a.$[].b.$[].n': 9 } } );
// returns { a: [ { b: [ { n: 9 }, { n: 9 } ] } ] }

// An empty array.
jsongin.Update( { a: [] }, { $set: { 'a.$[]': 5 } } );
// returns { a: [] }
```


# Bitwise Update Operators


<a id="$bit"></a>$bit
---------------------------------------------------------------------

**Usage** : `{ $bit: { field: { and: number } } }`, `{ $bit: { field: { or: number } } }`
  or `{ $bit: { field: { xor: number } } }`

Applies a bitwise `and`, `or` or `xor` to a whole-number field.

- If the field does not exist, it is treated as `0` and created.
- The field and the number must both be whole numbers. Anything else, including `null`, throws.
- Large numbers keep all of their bits, and negative numbers are read as two's complement.

**Examples**
```js
// 20 is binary 10100 and 12 is 01100.
let updated = jsongin.Update( { flags: 20 }, { $bit: { flags: { and: 12 } } } );
updated.flags === 4

updated = jsongin.Update( { flags: 20 }, { $bit: { flags: { or: 12 } } } );
updated.flags === 28

updated = jsongin.Update( { flags: 20 }, { $bit: { flags: { xor: 12 } } } );
updated.flags === 24

// A missing field counts as 0.
updated = jsongin.Update( {}, { $bit: { flags: { or: 12 } } } );
updated.flags === 12
```


## See Also

- [`Update( Document, Updates )`](./Update.md)
- [`Diff( Before, After )`](./Diff.md) and [`Invert( Before, Patch )`](./Invert.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [Operator Reference](../Operator-Reference.md)
