# @liquicode/jsongin


# Addendum and Other Notes


Why this library?
---------------------------------------------------------------------

I tried some packages which offer similar functionality. After some testing, I found that most of
  them compare values loosely, the old Javascript way (`==`), while MongoDB always compares
  strictly (`===`).
That is a real problem if your code will eventually run against a MongoDB server: something which
  worked in development can fail in production, probably without any warning.
Many of them also supported little of MongoDB beyond basic comparisons.

I needed it. I couldn't find it. So I built it. Here it is.


Goals
---------------------------------------------------------------------

- Behave exactly like MongoDB, for everything it implements.
- Be fast, easy to use, and small, with no dependencies.


Similar Projects
---------------------------------------------------------------------

The projects below fall into three groups:

- ***Query filters*** check whether a document matches a query, and do nothing more.
- ***Engines*** also do projection, updates, expressions and aggregation pipelines.
- ***Databases*** store data, and offer querying as one part of that.

`jsongin` is an engine, and stores nothing: you bring the objects.
See the [Operator Reference](./Operator-Reference.md) for how much of MongoDB it covers.
It also has document functions none of these projects provide, such as `Flatten`, `Expand`,
  `Hybridize`, `Diff` and `Invert`.

A project marked ***measured*** was run against the `jsongin` tests, so its compatibility note is
  an observation.
Versions, publication dates and download figures were read from npm in August 2026.

**Query filters**

- [sift](https://www.npmjs.com/package/sift) :
	MongoDB query filtering for Javascript, and by far the most used package on this list, at
	about 6.7 million downloads a week.
	Twenty-three query operators, no dependencies, and a build which lets you include only the
	operators you use.
	***Differs*** : it only tests queries, on purpose. No projection, updates, aggregation or
	document functions. `jsongin` tries to be MongoDB; `sift` tries to be small.

- [@ucast/mongo](https://www.npmjs.com/package/@ucast/mongo) and
	[@ucast/mongo2js](https://www.npmjs.com/package/@ucast/mongo2js) :
	Turns a MongoDB query into a syntax tree. `mongo2js` runs it against Javascript objects, and
	other `ucast` packages turn it into SQL or ORM conditions. Widely used, mostly through `CASL`.
	***Differs*** : it translates queries rather than running them exactly as MongoDB does, and
	handles queries only. (`jsonstor` has a similar translation layer.)

- [json-criteria](https://www.npmjs.com/package/json-criteria) :
	Tests whether a document matches a query.
	Little MongoDB compatibility. *(measured)*
	Last published in 2015.
	***Differs*** : it only tests queries. No projection, updates, aggregation or document
	functions.

**Engines**

- [mingo](https://www.npmjs.com/package/mingo) :
	The closest match to `jsongin`.
	Queries, projection, updates, and aggregation pipelines with accumulators, expressions and
	window operators. Actively maintained, no dependencies, written in TypeScript.
	***Differs*** : `mingo` has more pipeline stages, including `$setWindowFields`, `$out` and
	`$merge`. `$out` and `$merge` write to a database collection, which `jsongin` does not have.
	`$lookup`, `$unionWith` and `$graphLookup` are here: they read a second set of documents, and
	`jsongin` takes that set rather than the name of a collection.
	`jsongin` adds the document functions above, and tests each behavior against a running
	MongoDB server.

**Databases**

> **NOTE**: See the [jsonstor](http://jsonstor.liquicode.com) project, which uses `jsongin` with storage on many platforms, such as memory, files, MongoDB and MySQL. It is not part of this comparison.

- [nedb](https://www.npmjs.com/package/nedb) :
	A file-based embedded data store with a MongoDB-style query API.
	Last published in 2016 and no longer maintained, though still widely installed.
	Little MongoDB compatibility. *(measured)*
	***Differs*** : it handles its own storage, indexes and saving. `jsongin` has no storage.

- [@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb) :
	A maintained copy of `nedb`, with a promise-based API.
	Little MongoDB compatibility. *(measured)*
	***Differs*** : as for `nedb`.

- [LokiJS](https://www.npmjs.com/package/lokijs) :
	An in-memory document database with a MongoDB-like query syntax and optional saving.
	Still heavily downloaded, but abandoned: last published in 2021, and dropped by `RxDB` because
	of query and data-loss bugs.
	***Differs*** : a database rather than an engine, and not a good choice for new work.

- [minimongo](https://www.npmjs.com/package/minimongo) :
	A browser implementation of the MongoDB API which syncs with a server, from mWater. Not the
	Meteor package of the same name.
	***Differs*** : its purpose is syncing, which `jsongin` does not do.

- [Mongo-Local-DB](https://www.npmjs.com/package/mongo-local-db) :
	A small local data store with a MongoDB-like API, saving collections to JSON files.
	***Differs*** : a storage layer rather than a query engine, with much less of MongoDB than the
	others here.

- [RxDB](https://www.npmjs.com/package/rxdb) :
	A reactive, local-first NoSQL database for Javascript.
	Documents are checked against a schema, queries update when the data changes, and collections
	can sync to a server.
	***Differs*** : a whole database, of which querying is one part. `jsongin` is a set of
	functions and holds no data.

- [realm](https://www.npmjs.com/package/realm) :
	An embedded object database with a native core and Javascript bindings.
	***Differs*** : native code rather than Javascript, with its own object model and query
	language instead of MongoDB queries.
	MongoDB deprecated the Atlas Device SDKs in September 2024 and ended Atlas Device Sync on
	30 September 2025. The SDK continues as an open source local database, without the sync.


Copying Queries
---------------------------------------------------------------------

If you copy a query with `JSON.parse( JSON.stringify( ... ) )`, two things are lost:

- A field set to `undefined` is removed.
- A regular expression becomes an empty object `{}`.

Use `jsongin.SafeClone()` instead, which keeps both.

Two habits avoid the problem entirely:

1. Do not write `undefined` in a query, such as `$eq: undefined`. To test whether a field exists,
   use `$exists`.
2. Write a regular expression as a string with `$regex`, such as `{ name: { $regex: '^joe' } }`,
   rather than as `/^joe/`.

When two objects are compared strictly, as `$eq` does, they must have the same fields, with the
  same values, ***in the same order***.
Programs often rebuild objects and change their field order, so this can be surprising.
If field order should not matter, use `$eqx`.


Query Rules
---------------------------------------------------------------------

- A query is an object of fields and operators. All of its conditions must match, as if they were
  inside `$and`.
- A field's value can be:
	- A plain value, such as `{ age: 30 }`, which must be equal. (A regular expression is matched
	  as a pattern.)
	- An object of operators, such as `{ age: { $gt: 18, $lt: 65 } }`, which must all match.
	- Any other object, such as `{ user: { name: 'Alice' } }`, which the field must ***equal
	  exactly***, with the same fields in the same order. To test one field inside an object, use
	  dot notation: `{ 'user.name': 'Alice' }`.
- Do not mix operators and plain fields in the same object.
- Equality compares any type of value.
	- Objects must have the same fields in the same order.
	- Arrays must have the same elements in the same order. To ignore order, use `$eqx`.
	- For an array field, a value also matches if ***one element*** equals it.
	- `$in` matches when the field, or one of its elements, is in the list. So
	  `{ tags: [ 'A', 'C' ] }` matches `{ tags: { $in: [ 'A' ] } }`.
- `$gt`, `$gte`, `$lt` and `$lte` only match values of the same type.
	- Compared with `null`, `$gt` and `$lt` are always `false`.
	- A `null` field compared with `null` is `false` for `$gt` and `$lt`, and `true` for `$gte` and
	  `$lte`.
- Writing `undefined` as a value throws. Use `$exists` instead.


Type Coercion
---------------------------------------------------------------------

### Javascript

Javascript converts values between types behind the scenes, which is convenient but can be
  confusing.

Imagine a database field called `year`. It usually holds numbers like `1975`, but a web app saves
  it as the string `"1975"`, and sometimes it is `null` or not there at all.
Javascript's `==` treats `1975 == "1975"` as true, which helps here, but only if you know the
  rules.

`===` and `!==` compare without converting.
There are no such operators for `<` and `>`, though, so `1975 === "1975"` is false while
  `1975 >= "1975"` is true.

Javascript's rules:

- `===` and `!==`
	- No conversion. Values of different types are never equal.

- `==` and `!=`
	- Booleans, numbers and strings are converted:
		- `(false == 0) and (false == "")`
		- `(true == 1) and (true == "1")`
		- `(42 == '42') and (42 == '42.0')`
		- `(42 != '39.9')`
	- `null` only equals `undefined`: `(null == undefined)` is `true`.

- `<=`, `>=`, `<` and `>`
	- Booleans, numbers, strings and `null` are converted:
		- `(false <= 0) and (0 <= "") and ("" <= null)`
		- `(true >= 1) and (1 >= "1") and ("1" >= null)`
		- `(42 >= '42') and (42 >= '42.0')`
		- `(42 > '39.9')`
	- Two strings are compared as text, so `('42' >= '42.0')` is `false`.
	- Comparing `null` with `undefined` is always `false`.


### MongoDB

MongoDB's comparison operators (`$eq`, `$gt` and the rest) never convert types.
Two values can only match if they have the same type, and objects must have their fields in the
  same order.
`jsongin` does the same.
