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


## See Also

- [`GetValue( Document, Path )`](./GetValue.md)
- [`SetValue( Document, Path, Value )`](./SetValue.md)
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
// 		started: '2023-11-24T07:51:47.064Z',
// 	},
// }

```


# Field Update Operators


 $set
---------------------------------------------------------------------

**Usage** : `$set: { field: value, field: value, ... }`

Sets the value of a field in a document.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $set: { 'user.name': 'Bob' } }
			);
// updated is { user: { name: 'Bob' } }
```


 $unset
---------------------------------------------------------------------

**Usage** : `$unset: { field: <any>, field: <any>, ... }`

Removes the specified field from a document.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $unset: { 'user.name': 1 } }
			);
// updated is { user: {} }
```


 $rename
---------------------------------------------------------------------

**Usage** : `$rename: { field: new-name, field: new-name, ... }`

Renames a field.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice' } },
				{ $rename: { 'user.name': 'user.first_name' } }
			);
// updated is { user: { first_name: 'Alice' } }
```


 $min
---------------------------------------------------------------------

**Usage** : `$min: { field: value, field: value, ... }`

Only updates the field if the specified value is less than the existing field value.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $min: { 'user.login_count': 7 } }
			);
// updated is { user: { name: 'Alice', login_count: 7 } }
```


 $max
---------------------------------------------------------------------

**Usage** : `$max: { field: value, field: value, ... }`

Only updates the field if the specified value is greater than the existing field value.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $max: { 'user.login_count': 50 } }
			);
// updated is { user: { name: 'Alice', login_count: 50 } }
```


 $inc
---------------------------------------------------------------------

**Usage** : `$inc: { field: value, field: value, ... }`

Increments the value of the field by the specified amount.
The increment value can be negative to decrement the document field.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 1 } },
				{ $inc: { 'user.login_count': 5 } }
			);
// updated is { user: { name: 'Alice', login_count: 6 } }
```


 $mul
---------------------------------------------------------------------

**Usage** : `$mul: { field: value, field: value, ... }`

Multiplies the value of the field by the specified amount.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', login_count: 42 } },
				{ $mul: { 'user.login_count': 2 } }
			);
// updated is { user: { name: 'Alice', login_count: 84 } }
```


 $currentDate
---------------------------------------------------------------------

**Usage** : `$currentDate: { field: date-spec, field: date-spec, ... }`

Sets the value of a field to the current date.

A `date-spec` is either the boolean `true` or an object of the form `{ $type: string }`,
  which is the same shape MongoDB uses.
A bare string is ***not*** a valid `date-spec`.

| **date-spec**            | **Sets the field to**                                        |
|--------------------------|--------------------------------------------------------------|
| `true`                   | A `Date` object.                                             |
| `{ $type: 'date' }`      | A `Date` object.                                             |
| `{ $type: 'timestamp' }` | A `Date.getTime()` numeric value.                            |

All of the fields named in one `$currentDate` operation receive the ***same*** moment in time,
  which is read once before the fields are visited.
Each field gets its own `Date`, so two fields never share one object.

A stored `Date` is a real `Date`, so it answers a date query and survives
  [`SafeClone()`](./SafeClone.md):

```js
let updated = jsongin.Update( {}, { $currentDate: { when: true } } );
jsongin.Query( updated, { when: { $type: 'date' } } ) === true
```

`{ $type: 'timestamp' }` stores a number rather than a `Date` because `jsongin` has no BSON
  Timestamp type to store.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': true } }
			);
// updated is { user: { name: 'Alice', last_login: <Date 2023-11-24T07:51:47.064Z> } }

updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': { $type: 'date' } } }
			);
// updated is { user: { name: 'Alice', last_login: <Date 2023-11-24T07:51:47.064Z> } }

updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': { $type: 'timestamp' } } }
			);
// updated is { user: { name: 'Alice', last_login: 1700812593086 } }
```

An invalid `date-spec` leaves the field alone, reports the reason to the `OpLog`, and makes the
  operation report failure:
```js
// A bare string is not a date-spec. This does nothing.
let updated = jsongin.Update(
				{ user: { last_login: null } },
				{ $currentDate: { 'user.last_login': 'timestamp' } }
			);
// updated is { user: { last_login: null } }
```

`false`, an object with no `$type`, and an unrecognized `$type` are all invalid in the same way.


# Array Update Operators


 $addToSet
---------------------------------------------------------------------

**Usage** : `$addToSet: { array-field: value, ... }`
  or `$addToSet: { array-field: { $each: [ value, ... ] }, ... }`

Adds elements to an array only if they do not already exist in the set.

A document carrying `$each` adds every element of that array, each one subject to the same
  test.
Any other value, ***including a document with no `$each`***, is added as a single value.

Values are compared by their content, so an object, an array, or a date is recognized as
  already present rather than being added again because it is a different instance.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $addToSet: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// $each adds each element which is not already present.
updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $addToSet: { a: { $each: [ 2, 3, 4 ] } } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// An element is also tested against the ones added before it.
updated = jsongin.Update(
				{ a: [] },
				{ $addToSet: { a: { $each: [ 1, 1, 2 ] } } }
			);
// updated is { a: [ 1, 2 ] }
```


 $pop
---------------------------------------------------------------------

**Usage** : `$pop: { array-field: <-1 | 1>, array-field: <-1 | 1>, ... }`

Removes the first or last item of an array.

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


 $push
---------------------------------------------------------------------

**Usage** : `$push: { array-field: value, ... }`
  or `$push: { array-field: { $each: [ value, ... ], $position: n, $sort: spec, $slice: n }, ... }`

Appends to an array.

A plain value is appended as a single element.
A document carrying `$each` is a ***modifier document***, and appends every element of the
  `$each` array instead.

| **Modifier**  | **Effect**                                                                  |
|---------------|------------------------------------------------------------------------------|
| `$each`       | The values to append. Required by the other three modifiers.                 |
| `$position`   | Inserts at this index rather than appending. A negative index counts back from the end, and an index outside the array is clamped to it. |
| `$sort`       | Sorts the array after the insert. Use `1` or `-1` for an array of values, or a sort document such as `{ score: -1 }` for an array of documents. |
| `$slice`      | Trims the array after the sort. A positive count keeps the first, a negative count keeps the last, and zero empties it. |

The modifiers are applied in the order MongoDB applies them: `$each`, then `$position`, then
  `$sort`, then `$slice`.

A modifier written without `$each` is rejected, as it is by MongoDB, and so is an unrecognized
  `$` field within a modifier document.
***A rejected modifier leaves the array untouched***, because the whole modifier document is
  checked before the first element is inserted.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $push: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// $each appends several values.
updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $push: { a: { $each: [ 3, 4 ] } } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }

// $position inserts rather than appends.
updated = jsongin.Update(
				{ a: [ 1, 2 ] },
				{ $push: { a: { $each: [ 9 ], $position: 0 } } }
			);
// updated is { a: [ 9, 1, 2 ] }

// $sort and $slice keep a top-N list, in that order.
updated = jsongin.Update(
				{ a: [ 5, 1 ] },
				{ $push: { a: { $each: [ 3 ], $sort: -1, $slice: 2 } } }
			);
// updated is { a: [ 5, 3 ] }
```

Note that a document with no `$each` is a value rather than a modifier, so
  `{ $push: { a: { n: 1 } } }` appends the document `{ n: 1 }`.


 $pullAll
---------------------------------------------------------------------

**Usage** : `$pullAll: { array-field: array-values, array-field: array-values, ... }`

Removes every instance of the given values from an array.

Values are matched by ***content***, using the same comparison as the query and expression
  operators, which is what [`$addToSet`](#$addToSet) does.
An object, an array, or a date is therefore removed by writing an equal value, rather than only
  by writing the very instance which is in the array.

A value which is not in the array is not an error; nothing is removed for it.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $pullAll: { a: [ 1, 3 ] } }
			);
// updated is { a: [ 2 ] }

// Values are matched by content, so an equal object is removed.
updated = jsongin.Update(
				{ a: [ { n: 1 }, { n: 2 } ] },
				{ $pullAll: { a: [ { n: 1 } ] } }
			);
// updated is { a: [ { n: 2 } ] }
```

