# @liquicode/jsongin


# Addendum and Other Notes


Why this library?
---------------------------------------------------------------------

I tried some packages out there that provide similar functionality but, after some testing,
  I found that most of these implementations perform only loose old school javascript (==)
  comparisons while MongoDB always uses strict (===) comparisons.
This could be a real problem if you want to eventually run your code against a MongoDB server.
Things that went smoothly in development might fail terribly while running in production, and probably with no warnings.
Furthermore, many of the other implementation I tried did not support many more MongoDB query features
  beyond basic comparisons.

I needed it. I couldn't find it. So I built it. Here it is.


Goals
---------------------------------------------------------------------

- Full accuracy with implemented MongoDB functionality.
- Fast, easy to use, low overhead, and minimal (no) dependencies.


Similar Projects
---------------------------------------------------------------------

The projects below fall into two groups.
Some are ***query engines***, which apply MongoDB-style criteria to objects you already have.
The rest are ***databases***, which own the storage and offer querying as one part of a larger
  whole.
`jsongin` belongs to the first group, and does not store anything.

Where a project is marked as having been ***measured***, it was run against the `jsongin` test
  suite through a driver in `test/Parity Tests/Drivers`, so the compatibility note is an
  observation rather than an impression.

**Query engines**

- [mingo](https://www.npmjs.com/package/mingo) :
	A MongoDB-style querying mechanism for in-memory collections.
	A full and mature implementation, covering the query language and the aggregation pipeline
	with a large operator set.
	***Differs*** : broader and larger than `jsongin`, and squarely aimed at querying.
	`jsongin` implements a smaller aggregation subset but adds the document mechanics —
	paths, `Flatten`, `Expand`, `Hybridize`, `Diff`, `Invert` — which are half of what it is for.

- [json-criteria](https://www.npmjs.com/package/json-criteria) :
	A MongoDB-style querying mechanism.
	Tests whether a document satisfies a criteria object.
	Minimal MongoDB compatibility. *(measured)*
	***Differs*** : query testing only. No projection, update, aggregation, or document mechanics.

**Databases**

- [nedb](https://www.npmjs.com/package/nedb) : 
	A MongoDB-style querying mechanism.
	Create and manage memory-based and file-based data collections.
	No longer maintained by the author(s).
	Minimal MongoDB compatibility. *(measured)*
	***Differs*** : owns its storage, indexes, and persistence.
	`jsongin` has no storage of its own — you bring the objects.

- [@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb) : 
	A currently maintained fork of `nedb`, adding a promise-based API.
	Minimal MongoDB compatibility. *(measured)*
	***Differs*** : as `nedb`.

- [Mongo-Local-DB](https://www.npmjs.com/package/mongo-local-db) :
	A small local datastore with a MongoDB-flavored API, persisting collections to JSON files.
	***Differs*** : a storage layer rather than a query engine, and a much smaller MongoDB
	surface than any of the others here.

- [RxDB](https://www.npmjs.com/package/rxdb) :
	A reactive, offline-first NoSQL database for Javascript.
	Documents are validated against a schema, queries are observable and re-emit when the
	underlying data changes, and collections can replicate to a server.
	***Differs*** : an entire database, of which querying is one part.
	The reactivity and replication have no counterpart in `jsongin`, which is a set of
	functions over objects and holds no state.

- [realm](https://www.npmjs.com/package/realm) :
	An embedded object database with a native core and Javascript bindings, offering live
	objects and synchronization to MongoDB Atlas.
	***Differs*** : native code rather than pure Javascript, with its own object model and its
	own query language rather than MongoDB query documents.
	Note that MongoDB has since deprecated the Atlas Device SDKs, which include this one.


Object Cloning
---------------------------------------------------------------------

- If your code performs a json stringify and parse to clone the `Criteria` parameter,
  problems can occur when using regular expressions and when comparing fields to `undefined`.
  In both of these cases the value does not survive the round trip: an `undefined` field
  is removed entirely, while a regular expression is left behind as an empty object `{}`.
  To avoid this, consider using the `jsongin.SafeClone` function from the
	[@liquicode/jsongin](https://www.npmjs.com/package/@liquicode/jsongin) library.
  The SafeClone function preserves both.

- A couple rules of thumb can be applied:
	1) Avoid explicitly specifying `undefined` in `Criteria` (e.g. `$eq: undefined`).
	  If you need to test for the presence of a field in a document, use the `$exists` operator instead.
	2) Use the string representation of a regular expression rather than the Javascript notation.
	  Use `$regex: "^hello"` rather than `$regex: /^hello/`.
	  Note that this also precludes using implicit `$eq` with regular expressions (e.g. `name: /^joe/`).
	  You will need to use `$regex` operator in such cases: `name: { $regex: "^joe" }`.

- Strict comparison between two objects requires that all fields appear in both objects, have the same (strict)
  value, and also appear in the same order within the objects.
  As software systems of any sort are likely to massage and dissect the data objects they work with,
	it is not recommended to rely upon the consistency of an object's internal order.
  Performing any `$eq` comparisons requires that fields in both document and criteria objects match the same order.
  If this is too strict for your needs, you can use the more loose `$eqx` operator if you want to match
	fields, values, but not the field order.


Query Syntax Rules
---------------------------------------------------------------------

- A query (or sub-query) is an object which contains at least one field and/or at least one logical operator.
	- Multiple fields within a query are evaluated individually and then `$and`-ed together.
- If a query contains multiple top level elements, they are treated as if they occur under an `$and` operator.
- Fields occur at the top of a query or sub-query.
- Fields can be assigned a `bnsdla` value (implicit `$eq`).
	- A regular expression value is matched with `$regex` rather than `$eq`.
	- When nested fields are encountered, they are used to indicate the path of evaluation rather than being the target of evaluation.
	- To properly compare object values, use the explicit `$eq` operator.
- Fields can be assigned an object containing operators or sub-queries, but not both.
	- When the field refers to an actual value within the underlying data, it should be assigned an object containing one or more operators that will be `$and`-ed together. (implicit `$and`)
	- When the field refers to an object in the underlying data, it should be assigned an object containing one or more fields that will be `$and`-ed together.
	- Conjunction and negation operators can appear in either case.
- Equality operators can match `bnsdloa` values.
	- Fields in objects can appear in different orders.
	- Elements of arrays must appear in the same order.
		- To compare two arrays regardless of element order, use the `$eqx` operator.
		- Note that `$in` does not do this. It tests whether the field and the given array have
		  any element in common, so `{ tags: [ 'A', 'C' ] }` also matches `$in: [ 'A' ]`.
- Comparison operators compare values of the same type and must be of type `bnsdl`.
	- Note that when `null` is compared using `$gt` or `$lt`, the result will always be `false`.
	- When both values are `null`, the `$gt` and `$lt` comparisons will return `false` but the `$gte` and `$lte` comparisons will return `true`.
- Comparing to undefined will result in unexpected behaviors. Example: `$eq: undefined` is valid Javascript but will make a mess in your code.


Type Coercion
---------------------------------------------------------------------

### Javascript

Javascript is not a strongly typed language making it flexible and easy to use.
Also, there can be a lot of conversion and type coercion going behind the scenes.
It is totally possible to have a single field (in an object or database) be represented by different types of values.

Imagine having a JSON based database (i.e. MongoDB) with a simple field called `year`.
It usually contains numeric values like `1975` but a web app stores this value as a string `"1975"`.
To make things worse, sometimes `year` contains no value (`null`) or is not even present (`undefined`) in the data record.
This can complicate queries to a database when fields can be of various types.
Javascript addresses this with a system of type coercion to handle "common sense" situations like `1975 == "1975"`.
While this is incredibly helpful in some circumstances, it can be confusing if these coercion rules are not properly understood.

In order to address this confusion, Javascript introduced the strict equality `===` and inequality `!==` operators.
These operators require both operands to be of the same type in order to be equal.
The problem is that there does not also exist strict comparison operators `<==`, `>==` which perform similar type checking.
This can be confusing as `1975 === "1975"` will return false, yet `1975 >= "1975"` is true.

Here are the coercion rules for Javascript:

- Strict Equality Operators `===` and `!==`
	- No coercion takes place, values must be of the same type.
	- `!==` will always be `true` if the values are of different types. No value comparison is performed.

- Loose Equality Operators `==` and `!=`
	- Will coerce values between `b`oolean, `n`umber, and `s`tring types such that:
		- `(false == 0) and (false == "")`
		- `(true == 1) and (true == "1")`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 == '42') and (42 == '42.0')`
		- `(42 != '39.9')`
	- No coercion of `null` takes place with the exception that `(null == undefined)` returns `true`.

- Comparison Operators `<=`, `>=`, `<` and `>`
	- Will coerce between `bnsl` types such that:
		- `(false <= 0) and (0 <= "") and ("" <= null)`
		- `(true >= 1) and (1 >= "1") and ("1" >= null)`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 >= '42') and (42 >= '42.0')`
		- `(42 > '39.9')`
	- Note that two strings are compared as strings, with no numeric coercion,
	  so `('42' >= '42.0')` is `false`.
	- `null` and `undefined` cannot be compared to each other. Any comparison (`  <=  >=  <  >  `) returns `false`.

It is useful to be aware of these differences as they appear in both MongoDB and `jsongin`.


### MongoDB

All of MongoDB comparison operators (`$eq`, `$gt`, etc.) perform strict comparisons.
That means that, in order for two values to match, they must also be of the same type.
In the case of `o`bjects, fields must also be in the same order.



