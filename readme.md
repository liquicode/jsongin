# JSONgin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin) (v0.0.6)

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
	- Single minified file (33k) deployment for web.

- Object Based Queries:
	- Compose queries in a structured and logical manner.
	- Easier to read, understand, and debug.
	- Include comments and documentation in your queries.
	- Programatically create and structure data queries.

- Tentative Features
	- Use path extensions to nest queries and use bracketed [] array notation.
	- Use extended query operators to perform more flexible object and value matching.
	- Use the `Explain` feature to help understand and debug queries.
	- Extend `jsongin` by developing your own query operators.


MongoDB Query API
---------------------------------------------------------------------

`jsongin` is fully compatible with the core MongoDB query operators.

See [Query Reference](docs/jsongin%20Query%20Reference.md) for more detail.

The function `jsongin.Query( Document, Query )` will return `true` if `Document` matches the criteria specified in `Query`.

- Comparison Operators
	- `$eq` : Matches values that are equal to a specified value.
	- `$ne` : Matches all values that are not equal to a specified value.
	- `$gt` : Matches values that are greater than a specified value.
	- `$gte` : Matches values that are greater than or equal to a specified value.
	- `$lt` : Matches values that are less than a specified value.
	- `$lte` : Matches values that are less than or equal to a specified value.
	- `$in` : Matches any of the values specified in an array.
	- `$nin` : Matches none of the values specified in an array.

- Logical Operators
	- `$and` : Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
	- `$or` : Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
	- `$nor` : Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
	- `$not` : Inverts the effect of a query expression and returns documents that do not match the query expression.

- Element Operators
	- `$exists` : Matches documents that have the specified field.
	- `$type` : Selects documents if a field is of the specified type.

- Evaluation Operators
	- `$expr` : Allows use of aggregation expressions within the query language.
	- `$jsonSchema` : Validate documents against the given JSON Schema.
	- `$mod` : Performs a modulo operation on the value of a field and selects documents with a specified result.
	- `$regex` : Selects documents where values match a specified regular expression.
	- `$text` : Performs text search.
	- `$where` : Matches documents that satisfy a JavaScript expression.

- Geospatial Operators *(not implemented)*
	- `$geoIntersects` : Selects geometries that intersect with a GeoJSON geometry. The 2dsphere index supports $geoIntersects.
	- `$geoWithin` : Selects geometries within a bounding GeoJSON geometry. The 2dsphere and 2d indexes support $geoWithin.
	- `$near` : Returns geospatial objects in proximity to a point. Requires a geospatial index. The 2dsphere and 2d indexes support $near.
	- `$nearSphere` : Returns geospatial objects in proximity to a point on a sphere. Requires a geospatial index. The 2dsphere and 2d indexes support $nearSphere.

- Array Operators
	- `$elemMatch` : Selects documents if element in the array field matches all the specified $elemMatch conditions.
	- `$size` : Selects documents if the array field is a specified size.
	- `$all` : Matches arrays that contain all elements specified in the query.

- Bitwise Operators *(not implemented)*
	- `$bitsAllClear` : *(not implemented)* Matches numeric or binary values in which a set of bit positions all have a value of 0.
	- `$bitsAllSet` : *(not implemented)* Matches numeric or binary values in which a set of bit positions all have a value of 1.
	- `$bitsAnyClear` : *(not implemented)* Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.
	- `$bitsAnySet` : *(not implemented)* Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.

- Miscellaneous Query Operators *(not implemented)*
	- `$comment` : *(not implemented)* Adds a comment to a query predicate.
	- `$rand` : *(not implemented)* Generates a random float between 0 and 1.
	- `$natural` : *(not implemented)* A special hint that can be provided via the sort() or hint() methods that can be used to force either a forward or reverse collection scan.

All comparisons done by MongoDB are strict comparisons (===).
This means that the any values being compared must be of the same type and,
in the case objects and arrays, must be in the same order.

`jsongin` offers additional operators, some of which support loose comparisons (==):

- Extended Operators
	- `$eqx` : Matches values that are equal to a specified value. Loose comparison (==).
	- `$nex` : Matches all values that are not equal to a specified value. Loose comparison (==).
	- `$noop` : Can be anything. No operation is performed on this data.


MongoDB Projection API
---------------------------------------------------------------------

`jsongin` supports the MongoDB projection mechanism when returning documents from a query.

See [Project Fields to Return from Query](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/)

The function `jsongin.Projection( Document, Projection )` will return a document that includes (or excludes)
fields from `Document` that are specified in `Projection`.

- Projection Operators *(not implemented)*
	- `$` : *(not implemented)* Projects the first element in an array that matches the query condition.
	- `$elemMatch` : *(not implemented)* Projects the first element in an array that matches the specified $elemMatch condition.
	- `$meta` : *(not implemented)* Projects the available per-document metadata.
	- `$slice` : *(not implemented)* Limits the number of elements projected from an array. Supports skip and limit slices.


MongoDB Update API
---------------------------------------------------------------------

`jsongin` is compatible with the core MongoDB update operators.

See [Update Reference](docs/jsongin%Update%20Reference.md) for more detail.

The function `jsongin.Update( Document, Update )` will return a copy of `Document` includes the updates specified in `Update`.

- Field Update Operators
	- `$set` : Sets the value of a field in a document.
	- `$unset` : Removes the specified field from a document.
	- `$rename` : Renames a field.
	- `$inc` : Increments the value of the field by the specified amount.
	- `$min` : Only updates the field if the specified value is less than the existing field value.
	- `$max` : Only updates the field if the specified value is greater than the existing field value.
	- `$mul` : Multiplies the value of the field by the specified amount.
	- `$currentDate` : Sets the value of a field to current date, either as a Date or a Timestamp.
	- `$setOnInsert` : *(not implemented)* Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.

- Array Update Operators
	- `$addToSet` : *(partially implemented)* Adds elements to an array only if they do not already exist in the set.
	- `$pop` : Removes the first or last item of an array.
	- `$push` : *(partially implemented)* Adds an item to an array.
	- `$pullAll` : Removes all matching values from an array.
	- `$pull` : *(not implemented)* Removes all array elements that match a specified query.
	- `$` : *(not implemented)* Acts as a placeholder to update the first element that matches the query condition.
	- `$[]` : *(not implemented)* Acts as a placeholder to update all elements in an array for the documents that match the query condition.
	- `$[<identifier>]` : *(not implemented)* Acts as a placeholder to update all elements that match the arrayFilters condition for the documents that match the query condition.

- Bitwise Update Operator
	- `bit` : *(not implemented)* Performs bitwise AND, OR, and XOR updates of integer values.


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
- [MongoDB: Dot Notation](https://www.mongodb.com/docs/manual/core/document/#std-label-document-dot-notation)

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


