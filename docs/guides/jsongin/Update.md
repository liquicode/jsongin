# @liquicode/jsongin


# Update( Document, Updates )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to update.                  |
| Updates       |         o         | The update operators to apply.           |


## Description

`jsongin.Update( Document, Updates )` applies MongoDB update operators to a document and returns
  the result.

`Updates` holds one or more update operators.
Each operator takes an object of `field: value` pairs, naming the fields to change and how:

```js
jsongin.Update( { count: 1 }, { $inc: { count: 5 } } );   // { count: 6 }
```

`Document` is never changed.
`Update` works on a copy, made with [`SafeClone()`](./SafeClone.md) so that dates stay dates,
  and returns the copy.

To reach every element of an array, write `$[]` in the path.
`{ $inc: { 'items.$[].qty': 1 } }` adds one to the `qty` of each element of `items`.
See [`$[]`](./Update-Operators.md#$[]).


## When Update Throws

`Update` throws when the update document is wrong:

```js
jsongin.Update( { a: 1 }, { $bogus: { a: 2 } } );               // throws: unknown operator
jsongin.Update( { a: 1 }, { a: 2 } );                           // throws: not an operator
jsongin.Update( { a: 1 }, { $set: 'abc' } );                    // throws: $set takes an object
jsongin.Update( { a: 1 }, { $set: { a: 2 }, $inc: { a: 1 } } ); // throws: both change 'a'
jsongin.Update( { a: 1 }, { $set: { $x: 1 } } );                // throws: a new field cannot start with $
```

`{ a: 2 }` is a replacement document, not an update, so `Update` refuses it.

Two operators ***conflict*** when they change the same field, or a field and something inside it,
  such as `a` and `a.b`.
The result would depend on which ran first, so `Update` refuses them.

`Update` also throws when an operator cannot be applied to this particular document, such as `$inc`
  on a string or `$pop` on something which is not an array.
The reason is sent to the [`OpLog`](../OpLog.md).

```js
jsongin.Update( { a: 'abc' }, { $inc: { a: 1 } } );  // throws: $inc needs a number
jsongin.Update( { a: 5 }, { $pop: { a: 1 } } );      // throws: $pop needs an array
```

MongoDB rejects all of these as well.
Because `Update` works on a copy, a refused update never leaves `Document` partly changed.


## When Nothing Happens

A few updates change nothing, and are not errors:

- A field which does not exist is left alone by `$pop`, `$pull`, `$pullAll`, `$unset` and
  `$rename`. Operators which add, such as `$set`, `$inc` and `$push`, create it.
- An empty update, `{}`, returns an unchanged copy. MongoDB refuses it, but `jsongin` allows it so
  that the output of [`Diff()`](./Diff.md) for two identical documents can always be applied.
- An `Updates` of `null` or `undefined` returns an unchanged copy.

`Update` returns `null` when `Document` is not an object, or when `Updates` is some other type
  which is not an object.


## Operator Summary

|                    **Field**                     |                 **Array**                  |       **Bitwise**       |
|:------------------------------------------------:|:------------------------------------------:|:-----------------------:|
|  [$set](./Update-Operators.md#$set), [$unset](./Update-Operators.md#$unset)  |  [$addToSet](./Update-Operators.md#$addToSet)  | [$bit](./Update-Operators.md#$bit) |
|          [$rename](./Update-Operators.md#$rename)          |       [$pop](./Update-Operators.md#$pop)       |                         |
|   [$inc](./Update-Operators.md#$inc), [$mul](./Update-Operators.md#$mul)   |      [$push](./Update-Operators.md#$push)      |                         |
|   [$min](./Update-Operators.md#$min), [$max](./Update-Operators.md#$max)   | [$pull](./Update-Operators.md#$pull), [$pullAll](./Update-Operators.md#$pullAll) |                         |
|    [$currentDate](./Update-Operators.md#$currentDate)     |          [$[]](./Update-Operators.md#$[])          |                         |

[Update Operators](./Update-Operators.md) describes each operator, with examples.

Every update operator takes an object, so `{ $inc: 5 }` is refused and `{ $inc: { count: 5 } }` is
  correct.


## See Also

- [`Diff( Before, After )`](./Diff.md)
- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
- [Update Operators](./Update-Operators.md)
- MongoDB Reference: [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)


## Examples

```js
// A document with user account data:
let document = {
	id: 101,
	user: {
		name: 'Alice',
		location: 'East',
		status: null,
	},
	profile: {
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
};

// Update the account when the user logs in.
let updates = {
	$set: { 'user.status': 'online' },
	$currentDate: { 'session.started': true },
	$addToSet: { tags: 'Logged In' },
};

// Apply the updates and get back the updated copy.
let updated = jsongin.Update( document, updates );

// updated is {
// 	id: 101,
// 	user: {
// 		name: 'Alice',
// 		location: 'East',
// 		status: 'online',
// 	},
// 	profile: {
// 		login: 'alice',
// 		role: 'admin',
// 	},
// 	tags: [ 'Staff', 'Dept. A', 'Logged In' ],
// 	session: {
// 		started: Date( '2023-11-24T07:51:47.064Z' ),
// 	},
// }
```
