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
| `true`                   | A `Date.toISOString()` zulu timestamp string.                |
| `{ $type: 'timestamp' }` | A `Date.getTime()` numeric value.                            |
| `{ $type: 'date' }`      | A `Date.toDateString()` string.                              |

All of the fields named in one `$currentDate` operation receive the ***same*** timestamp,
  which is read once before the fields are visited.

Note that `jsongin` stores a string or a number here, never a `Date` object.
To store an actual `Date`, use `$set` with a date value.

**Examples**
```js
let updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': true } }
			);
// updated is { user: { name: 'Alice', last_login: '2023-11-24T07:51:47.064Z' } }

updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': { $type: 'timestamp' } } }
			);
// updated is { user: { name: 'Alice', last_login: 1700812593086 } }

updated = jsongin.Update(
				{ user: { name: 'Alice', last_login: null } },
				{ $currentDate: { 'user.last_login': { $type: 'date' } } }
			);
// updated is { user: { name: 'Alice', last_login: 'Fri Nov 24 2023' } }
```

An invalid `date-spec` leaves the field alone and reports the reason to the `OpLog`:
```js
// A bare string is not a date-spec. This does nothing.
let updated = jsongin.Update(
				{ user: { last_login: null } },
				{ $currentDate: { 'user.last_login': 'timestamp' } }
			);
// updated is { user: { last_login: null } }
```


# Array Update Operators


 $addToSet
---------------------------------------------------------------------

**Usage** : `$addToSet: { array-field: value, array-field: value, ... }`

*(partially implemented)* Adds elements to an array only if they do not already exist in the set.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $addToSet: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }
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

**Usage** : `$push: { array-field: value, array-field: value, ... }`

*(partially implemented)* Adds an item to an array.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $push: { a: 4 } }
			);
// updated is { a: [ 1, 2, 3, 4 ] }
```


 $pullAll
---------------------------------------------------------------------

**Usage** : `$pullAll: { array-field: array-values, array-field: array-values, ... }`

Removes all matching values from an array.

**Examples**
```js
let updated = jsongin.Update(
				{ a: [ 1, 2, 3 ] },
				{ $pullAll: { a: [ 1, 3 ] } }
			);
// updated is { a: [ 2 ] }
```

