# JSONgin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)

### A JSON Engine for MongoDB-Style Queries and Data Structure Manipulation

#### NOTE: ***This package is under active development and may include dramatic changes in the near future.***


Overview
---------------------------------------------------------------------

`jsongin` provides a complete implementation of the [MongoDB](https://www.mongodb.com/)
	query mechanism, allowing you to use it in your own applications and libraries.

I developed `jsongin` to provide a single query interface for different types
	of data storages (e.g. memory, file, server).
I now have a single query structure to access data
	from my data storage in local memory for development,
	in data files for testing, and on a MongoDB server for release.

I tried some packages out there that provide similar functionality but, after some testing,
	I found that most of these implementations perform only	loose old school javascript (==)
	comparisons while MongoDB always uses strict (===) comparisons.
This could be a real problem if you want to eventually run your code against a MongoDB server.
Things that went smoothly in development might fail terribly while running in production, and probably with no warnings.
Furthermore, many of the other implementation I tried did not support many more MongoDB query features
	beyond basic comparisons.

I needed it. I couldn't find it. So I built it. Here it is.


Goals
---------------------------------------------------------------------

- Full compatibility and accuracy with MongoDB Query syntax.
- Generate SQL queries for relational/hybrid databases.
- Fast, easy to use, low overhead, and minimal (no) dependencies.


Getting Started
---------------------------------------------------------------------

***Install with NPM:***
```bash
npm install --save @liquicode/jsongin
```

***Include in your NodeJS Project***
```js
// Create an instance of jsongin:
const jsongin = require('@liquicode/jsongin')()

// Or, create with custom settings:
const jsongin = require('@liquicode/jsongin')( settings )
```

***Use jsongin to perform MongoDB Queries on JSON objects:***
```js
let document =
{
	id: 1001,
	user:
	{
		name: 'Alice',
		location: 'East',
	},
	profile:
	{
		login: 'alice',
		role: 'admin',
	},
	tags: [ 'Staff', 'Dept. A' ],
};

// Use Query to match values against a document.
jsongin.Query( document, { id: 1001 } ) === true
jsongin.Query( document, { 'user.name': 'Alice' } ) === true
jsongin.Query( document, { tags: 'Staff', 'profile.role': 'admin' } ) === true

// Query returns false when the values are not matched.
jsongin.Query( document, { tags: 'Hourly' } ) === false
jsongin.Query( document, { 'user.name': 'alice' } ) === false

// Use query operators to perform more complex matches.
jsongin.Query( document, { 'user.name': { $ne: 'Joe' } ) === true
jsongin.Query( document, { 'profile.role': { $in: ['admin', 'super'] } ) === true
jsongin.Query( document, { $or:
	[
		{'user.location': 'East'},
		{'user.location': 'West'}
	] } ) === true
jsongin.Query( document, { $and:
	[
		{'user.location': 'East'},
		{'user.role': {$ne: 'user'}}
	] } ) === true
```


Features
---------------------------------------------------------------------

- Developer Quality of Life:
	- No external dependencies.
	- 100% pure javascript.
	- Single minified file (<25k) deployment for web.

- Object Based Queries:
	- Compose queries in a structured and logical manner.
	- Easier to read, understand, and debug.
	- Include comments and documentation in your queries.
	- Programatically create and structure data queries.

- Use path extensions to nest queries and use bracketed [] array notation.
- Use extended query operators to perform more flexible object and value matching.
- Use the `Explain` feature to help understand and debug queries.
- Extend `jsongin` by developing your own query operators.


MongoDB Query API
---------------------------------------------------------------------

`jsongin` is fully compatible with the core MongoDB query operators.
See [Query Reference](docs/jsongin%20Query%20Reference.md) for more detail.


- Logical Operators
	- `$and` : Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
	- `$or` : Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
	- `$nor` : Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
	- `$not` : Inverts the effect of a query expression and returns documents that do not match the query expression.

- Comparison Operators
	- `$eq` : Matches values that are equal to a specified value.
	- `$ne` : Matches all values that are not equal to a specified value.
	- `$gt` : Matches values that are greater than a specified value.
	- `$gte` : Matches values that are greater than or equal to a specified value.
	- `$lt` : Matches values that are less than a specified value.
	- `$lte` : Matches values that are less than or equal to a specified value.
	- `$in` : Matches any of the values specified in an array.
	- `$nin` : Matches none of the values specified in an array.
	- `$regex` : 

- Array Operators
	- `$elemMatch` : 
	- `$size` : 
	- `$all` : 

- Meta Operators
	- `$exists` : Matches documents that have the specified field.
	- `$type` : Selects documents if a field is of the specified type.

All comparisons done by MongoDB are strict comparisons (===).
This means that the any values being compared must be of the same type and,
in the case objects and arrays, must be in the same order.

`jsongin` offers some additional operators which support loose comparisons (==)
and continbute other functionality:

- Extended Operators
	- `$eqx` : Matches values that are equal to a specified value. Loose comparison (==).
	- `$nex` : Matches all values that are not equal to a specified value. Loose comparison (==).
	- `$query` : When using the `jsongin` path extensions, force processing of the current object as a query.
	- `$noop` : Can be anything. No operation is performed on this data.


Additional References
---------------------------------------------------------------------

- [Library Guide](docs/jsongin%20Library%20Guide.md)
- [Query Reference](docs/jsongin%20Query%20Reference.md)
- [Data Types](docs/jsongin%20Data%20Types.md)


Related Information
---------------------------------------------------------------------

### MongoDB References

- [MongoDB: Query Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [MongoDB: Query Operator Reference](https://www.mongodb.com/docs/manual/reference/operator/query/)

### Similar Projects

- [json-criteria](https://www.npmjs.com/package/json-criteria) :
	A MongoDB-style querying mechanism.

- [nedb](https://www.npmjs.com/package/nedb) : 
	A MongoDB-style querying mechanism.
	Create and manage memory-based and file-based data collections.
	No longer maintained by the author(s).

- [@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb) : 
	A currently maintained fork of `nedb`.

- [Mongo-Local-DB](https://www.npmjs.com/package/mongo-local-db) :

- [RxDB](https://www.npmjs.com/package/rxdb) :

- [realm](https://www.npmjs.com/package/realm) :


