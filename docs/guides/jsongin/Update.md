# @liquicode/jsongin


# Update( Document, Updates )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Document      |         o         | The document to perform updates on.      |
| Updates       |         o         | The set of updates to perform.           |


## Description

`jsongin` supports the MongoDB update mechanic with the function `jsongin.Update( Document, Updates )`.
This function will update the given document with update operations found in `Updates`.
It returns the updated document.

Updates are specified by one more update operators (see below).
Each operator will be followed by a number of `field: value` arguments that specify the document field
  to update and the value to use in the update.

The given `Document` is never written to.
`Update()` returns an updated ***copy***, cloned with [`SafeClone()`](./SafeClone.md) so that
  dates survive.


## Refusing an Update

An update ***document*** which cannot be applied throws:

```js
jsongin.Update( { a: 1 }, { $bogus: { a: 2 } } );            // throws: Unknown update operator
jsongin.Update( { a: 1 }, { a: 2 } );                        // throws, a replacement is a different call
jsongin.Update( { a: 1 }, { $set: 'abc' } );                 // throws, $set takes an object
jsongin.Update( { a: 1 }, { $set: { a: 2 }, $inc: { a: 1 } } ); // throws, both write to 'a'
```

Two operators ***conflict*** when they write to the same path, or to a path and one below it,
  because the result would depend on which of them ran first.
The whole update document is checked before any of it is applied, so a refused update leaves the
  document untouched rather than half written.

MongoDB refuses each of them.

***An operator which cannot apply itself is also refused.*** `$inc` against a string, or `$pop`
  against a scalar, is a well formed update meeting a document it does not suit. The operator
  reports the reason through the `OpLog`, and `Update()` raises it as an error:

```js
jsongin.Update( { a: 'abc' }, { $inc: { a: 1 } } );  // throws, $inc is numeric on both sides
jsongin.Update( { a: 5 }, { $pop: { a: 1 } } );      // throws, $pop needs an array
```

Nothing is half written when it happens, because `Update()` works on a clone and discards it.

A field which is ***not there*** is a no-op rather than a refusal, so `$pop`, `$pullAll`,
  `$unset`, and `$rename` all return the document unchanged, and `$inc` creates the field.

`null` is returned only for a `Document` or `Updates` parameter of the wrong type.


## Operator Summary

|                    **Field**                     |                 **Array**                  |
|:------------------------------------------------:|:------------------------------------------:|
|  [$set](./Update-Operators.md#$set), [$unset](./Update-Operators.md#$unset)  |  [$addToSet](./Update-Operators.md#$addToSet)  |
|          [$rename](./Update-Operators.md#$rename)          |       [$pop](./Update-Operators.md#$pop)       |
|   [$inc](./Update-Operators.md#$inc), [$mul](./Update-Operators.md#$mul)   |      [$push](./Update-Operators.md#$push)      |
|   [$min](./Update-Operators.md#$min), [$max](./Update-Operators.md#$max)   |   [$pullAll](./Update-Operators.md#$pullAll)   |
|    [$currentDate](./Update-Operators.md#$currentDate)     |                                            |

Each operator is described in detail, with examples, in
  [Update Operators](./Update-Operators.md).

***Every update operator takes a document*** of `field: value` pairs, so
  `{ $inc: 5 }` is refused and `{ $inc: { count: 5 } }` is the form.


## See Also

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

// Apply the updates and return the updated document.
let updated = jsongin.Update( document, updates );

// Updated document has all the changes:
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
