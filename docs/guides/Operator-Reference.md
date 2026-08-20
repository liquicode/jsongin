# @liquicode/jsongin


### Operator Reference

***This page answers "is it supported?".***
It lists the operators MongoDB defines and marks which of them `jsongin` implements, so that the
  gap between the two is visible in one place.

***For "how do I use it?", follow the operator's link*** into the page which describes it in
  detail and gives examples:

| **Page**                                                          | **Covers**                                           |
|-------------------------------------------------------------------|------------------------------------------------------|
| [Query Operators](./jsongin/Query-Operators.md)                   | the operators of a query criteria                    |
| [Expression Operators](./jsongin/Expression-Operators.md)         | the aggregation expression language                  |
| [Stage Operators](./jsongin/Stage-Operators.md)                   | the stages of an aggregation pipeline                |
| [Accumulator Operators](./jsongin/Accumulator-Operators.md)       | what may appear inside a `$group`                    |
| [Update Operators](./jsongin/Update-Operators.md)                 | the operators of an update document                  |
| [Projection Operators](./jsongin/Projection-Operators.md)         | the operators of a projection                        |

There are three types of operators:
- `Query` operators are used to construct queries that filter documents.
- `Projection` operators control the inclusion or exclusion of fields from documents returned by a query.
- `Update` operators modify the contents of one or more documents.


## Query Operators

Query operators define conditions used to distinguish one or more documents from other documents.
Use the `jsongin.Query( Document, Criteria )` function to test if a certain document satifies the
  selection criteria or not.
If it does match all of the criteria, then `jsongin.Query` will return `true`.
If not all of the criteria are satisfied, then a `false` will be returned instead.

Read the [`Query()`](./jsongin/Query.md) document to understand how these operators are used.

| **Category**  | **Supported** | **Operator**   | **Description**                                                                                                                               |
|---------------|:-------------:|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Comparison    |      Yes      | <field>: value | Implicit $eq. Specify a document field and value. A matching document will have that field strictly equal to that value.                      |
| Comparison    |      Yes      | [$eq](./jsongin/Query-Operators.md#$eq)            | Matches values that are equal to a specified value.                                                                                           |
| Comparison    |      Yes      | [$ne](./jsongin/Query-Operators.md#$ne)            | Matches all values that are not equal to a specified value.                                                                                   |
| Comparison    |      Yes      | [$gt](./jsongin/Query-Operators.md#$gt)            | Matches values that are greater than a specified value.                                                                                       |
| Comparison    |      Yes      | [$gte](./jsongin/Query-Operators.md#$gte)           | Matches values that are greater than or equal to a specified value.                                                                           |
| Comparison    |      Yes      | [$lt](./jsongin/Query-Operators.md#$lt)            | Matches values that are less than a specified value.                                                                                          |
| Comparison    |      Yes      | [$lte](./jsongin/Query-Operators.md#$lte)           | Matches values that are less than or equal to a specified value.                                                                              |
| Comparison    |      Yes      | [$in](./jsongin/Query-Operators.md#$in)            | Matches any of the values specified in an array. Each value is matched the way the implicit form matches one, so a sub-document, an array, a date, and `null` all work, and a regexp in the list pattern matches. |
| Comparison    |      Yes      | [$nin](./jsongin/Query-Operators.md#$nin)           | Matches none of the values specified in an array. The exact negation of `$in`.                                                                |
| Logical       |      Yes      | [$and](./jsongin/Query-Operators.md#$and)           | Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.                                       |
| Logical       |      Yes      | [$or](./jsongin/Query-Operators.md#$or)            | Joins query clauses with a logical OR returns all documents that match the conditions of either clause.                                       |
| Logical       |      Yes      | [$nor](./jsongin/Query-Operators.md#$nor)           | Joins query clauses with a logical NOR returns all documents that fail to match both clauses.                                                 |
| Logical       |      Yes      | [$not](./jsongin/Query-Operators.md#$not)           | Inverts the effect of a query expression and returns documents that do not match the query expression. Applies to a field, and is not a top level operator: use `$nor` to negate a whole query. |
| Element       |      Yes      | [$exists](./jsongin/Query-Operators.md#$exists)        | Matches documents that have the specified field. The value is coerced to a boolean, so only `0`, `null`, and `false` ask for a missing field. |
| Element       |      Yes      | [$type](./jsongin/Query-Operators.md#$type)          | Selects documents if a field is of the specified type.                                                                                        |
| Evaluation    |      Yes      | [$expr](./jsongin/Query-Operators.md#$expr)          | Allows use of aggregation expressions within the query language.                                                                              |
| Evaluation    |       -       | $jsonSchema    | Validate documents against the given JSON Schema.                                                                                             |
| Evaluation    |      Yes      | [$mod](./jsongin/Query-Operators.md#$mod)           | Performs a modulo operation on the value of a field and selects documents with a specified result.                                            |
| Evaluation    |      Yes      | [$regex](./jsongin/Query-Operators.md#$regex)         | Selects documents where values match a specified regular expression. Accepts a sibling `$options` carrying the flags. See the note below.     |
| Evaluation    |       -       | $text          | Performs text search.                                                                                                                         |
| Evaluation    |       -       | $where         | Matches documents that satisfy a JavaScript expression.                                                                                       |
| Geospatial    |       -       | $geoIntersects | Selects geometries that intersect with a GeoJSON geometry. The 2dsphere index supports $geoIntersects.                                        |
| Geospatial    |       -       | $geoWithin     | Selects geometries within a bounding GeoJSON geometry. The 2dsphere and 2d indexes support $geoWithin.                                        |
| Geospatial    |       -       | $near          | Returns geospatial objects in proximity to a point. Requires a geospatial index. The 2dsphere and 2d indexes support $near.                   |
| Geospatial    |       -       | $nearSphere    | Returns geospatial objects in proximity to a point on a sphere. Requires a geospatial index. The 2dsphere and 2d indexes support $nearSphere. |
| Array         |      Yes      | [$elemMatch](./jsongin/Query-Operators.md#$elemMatch)     | Selects documents if a single element of the array field matches all the specified $elemMatch conditions. See the note below.                 |
| Array         |      Yes      | [$size](./jsongin/Query-Operators.md#$size)          | Selects documents if the array field is a specified size.                                                                                     |
| Array         |      Yes      | [$all](./jsongin/Query-Operators.md#$all)           | Matches arrays that contain all elements specified in the query.                                                                              |
| Bitwise       |      Yes      | [$bitsAllClear](./jsongin/Query-Operators.md#$bitsAllClear)  | Matches numeric or binary values in which a set of bit positions all have a value of 0.                                                       |
| Bitwise       |      Yes      | [$bitsAllSet](./jsongin/Query-Operators.md#$bitsAllSet)    | Matches numeric or binary values in which a set of bit positions all have a value of 1.                                                       |
| Bitwise       |      Yes      | [$bitsAnyClear](./jsongin/Query-Operators.md#$bitsAnyClear)  | Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.                                               |
| Bitwise       |      Yes      | [$bitsAnySet](./jsongin/Query-Operators.md#$bitsAnySet)    | Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.                                               |
| Miscellaneous |      Yes      | [$comment](./jsongin/Query-Operators.md#$comment)       | Adds a comment to a query predicate.                                                                                                          |
| Miscellaneous |       -       | $rand          | Generates a random float between 0 and 1. Not a query operator; see the note below.                                                           |
| Miscellaneous |       -       | $natural       | A hint forcing a forward or reverse collection scan. Not a query operator; see the note below.                                                |
| Miscellaneous |      Yes      | [$sampleRate](./jsongin/Query-Operators.md#$sampleRate)    | Randomly selects documents at a given rate.                                                                                                   |

***Note on `$rand` and `$natural`*** :
MongoDB lists these two among the query operators, and ***neither is a predicate***, so neither
  can be marked supported here however much of it is built. A server refuses `{ $rand: {} }`
  and `{ $natural: 1 }` as criteria, and so does `jsongin`.

`$rand` is an ***expression***, and it is implemented as one: reach it from a criteria through
  [`$expr`](./jsongin/Query-Operators.md#$expr), as in
  `{ $expr: { $lt: [ { $rand: {} }, 0.5 ] } }`. Its row in the Expression Operators section is
  the one which counts it.

`$natural` names a ***collection scan direction***, which is a property of a collection rather
  than of a document. `Query()` matches one document at a time and has no scan to direct, so
  there is nothing here for it to mean.

***Note on dates*** :
A `Date` has its own short type `d`, so the comparison operators handle dates directly.
`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, and `$nin` all compare dates by their time
  value, and `$type` selects them with either `'date'` or `9`.
A date is never equal to the string or number which represents it: `$eq` against an ISO string
  or a timestamp is `false`.
This holds ***inside*** a sub-document too, so `{ d: <date> }` does not equal
  `{ d: '1970-01-01T00:00:00.000Z' }`.
See [`ShortType()`](./jsongin/ShortType.md) for why dates are treated as their own type.


***Note on the range operators*** :
`$gt`, `$gte`, `$lt`, and `$lte` are ***bracketed by type***.
A value only matches when it is the same type as the operand, however the BSON ordering ranks
  the two types against each other:

```js
jsongin.Query( { v: 5 }, { v: { $gt: 'abc' } } );      // false, a number is not a string
jsongin.Query( { v: 'abc' }, { v: { $gt: 1 } } );      // false
jsongin.Query( { v: null }, { v: { $gt: 1 } } );       // false
```

Objects and arrays are inside the bracket too, ordered against their own type by
  [`CompareValues`](./jsongin/CompareValues.md):

```js
jsongin.Query( { v: { a: 2 } }, { v: { $gt: { a: 1 } } } );  // true
jsongin.Query( { v: [ 2 ] }, { v: { $gt: [ 1 ] } } );        // true
jsongin.Query( { v: { a: 1 } }, { v: { $gt: [ 1 ] } } );     // false, still bracketed
```

Both behaviors match MongoDB.


***Note on `$regex` and `$options`*** :
`$options` is not an operator of its own.
It carries the flags for a `$regex` written beside it, and it is only accepted there:

```js
jsongin.Query( { a: 'FOO' }, { a: { $regex: 'foo', $options: 'i' } } );  // true
jsongin.Query( { a: 'FOO' }, { a: { $regex: 'foo' } } );                 // false
```

`$options` given ***without*** a `$regex`, given as anything but a string, carrying a flag which
  is not valid, or given beside a regexp which already carries its own flags, is refused with an
  error, which is what MongoDB does for each of those.

A pattern is rebuilt for every document, so a regexp carrying the ***global flag*** is not
  stateful across a `Filter()`.
The caller's own `RegExp` object is never written to.


***Note on `$elemMatch`*** :
Every condition must be satisfied by the ***same*** element:

```js
jsongin.Query( { v: [ 1, 4, 9 ] }, { v: { $elemMatch: { $gt: 2, $lt: 5 } } } );  // true
jsongin.Query( { v: [ 1, 9 ] }, { v: { $elemMatch: { $gt: 2, $lt: 5 } } } );     // false
```

An element which is itself an ***array*** is a value to test, not a second array to search.
A field condition does not look inside it, while a nested `$elemMatch` does, because that is the
  query which asks for it:

```js
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { x: 1 } } } );                   // false
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { $elemMatch: { x: 1 } } } } );   // true
```

An ***empty*** condition matches an element which can hold fields, meaning a document or an
  array, and matches nothing else:

```js
jsongin.Query( { v: [ { x: 1 } ] }, { v: { $elemMatch: {} } } );  // true
jsongin.Query( { v: [ 1 ] }, { v: { $elemMatch: {} } } );         // false
```

A logical operator inside `$elemMatch` applies to ***one element at a time***, which is the whole
  reason to reach for it. `$and` asks for a single element satisfying every branch, where the
  dotted spelling of the same conditions would accept them spread across different elements:

```js
let document = { v: [ { x: 1, y: 2 }, { x: 5, y: 6 } ] };

jsongin.Query( document, { v: { $elemMatch: { $and: [ { x: 1 }, { y: 6 } ] } } } );  // false
jsongin.Query( document, { 'v.x': 1, 'v.y': 6 } );                                  // true
```

The criteria inside `$elemMatch` is a criteria in its own right, so a ***malformed*** one is
  refused with an error rather than reported as no match — and it is refused whether or not there
  is an element to apply it to, because being malformed has nothing to do with the data:

```js
// throws: $or requires an array of criteria
jsongin.Query( { v: [] }, { v: { $elemMatch: { $or: 5 } } } );

// throws: Operator [$gt] cannot appear at the top level of a $or branch
jsongin.Query( { v: [ 1, 2 ] }, { v: { $elemMatch: { $or: [ { $gt: 1 } ] } } } );
```


## jsongin Extended Query Operators

`jsongin` offers additional query operators which support loose comparisons (==):

- `$eqx` : Matches values that are equal to a specified value. Loose comparison (==).
- `$nex` : Matches all values that are not equal to a specified value. Loose comparison (==).
- `$noop` : Can be anything. No operation is performed on this data. Can be used to "comment out" portions of a query.
  It matches everything, so renaming a clause's key to `$noop` disables that clause while
  leaving the rest of the query intact. It can appear at the top level of a query or within a
  field. The one value it does not accept is `undefined`, which `Query` rejects for every
  operator so that a missing variable is never silently ignored.

```js
// The b clause is disabled. The a clause still applies.
jsongin.Query( { a: 1, b: 2 }, { a: 1, $noop: { b: 999 } } ) === true
jsongin.Query( { a: 1, b: 2 }, { a: 9, $noop: { b: 999 } } ) === false
```
- `$exprx` : Like `$expr`, but it can also appear within a field of a query, where it evaluates its expression against the sub-document found at that field.


## Expression Operators

Expression operators compute a value from the contents of a document.
Use the `jsongin.Evaluate( Document, Expression )` function to evaluate an expression,
  or use the `$expr` query operator to match documents with one.

Read the [`Evaluate()`](./jsongin/Evaluate.md) document to understand how these operators are used.

A string beginning with `$` is a reference to a document field (e.g. `"$user.name"`).
Anything else is a literal value.

This table lists the expression operators which MongoDB documents.
Operators marked `-` are not implemented by `jsongin`.
MongoDB adds operators from one server version to the next, so treat this as a close list
  rather than an exact one.

| **Category**  | **Supported** | **Operator**       | **Description**                                                                              |
|---------------|:-------------:|--------------------|-----------------------------------------------------------------------------------------------|
| Arithmetic    |      Yes      | [$abs](./jsongin/Expression-Operators.md#$abs)               | Returns the absolute value of a number.                                                      |
| Arithmetic    |      Yes      | [$add](./jsongin/Expression-Operators.md#$add)               | Adds numbers together. Adds milliseconds to a date.                                          |
| Arithmetic    |      Yes      | [$ceil](./jsongin/Expression-Operators.md#$ceil)              | Returns the smallest integer which is greater than or equal to a number.                     |
| Arithmetic    |      Yes      | [$divide](./jsongin/Expression-Operators.md#$divide)            | Divides one number by another. Throws when dividing by zero.                                 |
| Arithmetic    |      Yes      | [$exp](./jsongin/Expression-Operators.md#$exp)               | Raises Euler's number to a power.                                                            |
| Arithmetic    |      Yes      | [$floor](./jsongin/Expression-Operators.md#$floor)             | Returns the largest integer which is less than or equal to a number.                         |
| Arithmetic    |      Yes      | [$ln](./jsongin/Expression-Operators.md#$ln)                | Returns the natural logarithm of a number.                                                   |
| Arithmetic    |      Yes      | [$log](./jsongin/Expression-Operators.md#$log)               | Returns the logarithm of a number in a given base.                                           |
| Arithmetic    |      Yes      | [$log10](./jsongin/Expression-Operators.md#$log10)             | Returns the base 10 logarithm of a number.                                                   |
| Arithmetic    |      Yes      | [$max](./jsongin/Expression-Operators.md#$max)               | Returns the largest of several values, ignoring null and missing values.                     |
| Arithmetic    |      Yes      | [$min](./jsongin/Expression-Operators.md#$min)               | Returns the smallest of several values, ignoring null and missing values.                    |
| Arithmetic    |      Yes      | [$mod](./jsongin/Expression-Operators.md#$mod)               | Divides one number by another and returns the remainder.                                     |
| Arithmetic    |      Yes      | [$multiply](./jsongin/Expression-Operators.md#$multiply)          | Multiplies numbers together.                                                                 |
| Arithmetic    |      Yes      | [$pow](./jsongin/Expression-Operators.md#$pow)               | Raises a number to a power.                                                                  |
| Arithmetic    |      Yes      | [$round](./jsongin/Expression-Operators.md#$round)             | Rounds a number to a given number of decimal places.                                         |
| Arithmetic    |      Yes      | [$sqrt](./jsongin/Expression-Operators.md#$sqrt)              | Returns the square root of a number.                                                         |
| Arithmetic    |      Yes      | [$subtract](./jsongin/Expression-Operators.md#$subtract)          | Subtracts two numbers, two dates, or milliseconds from a date.                               |
| Arithmetic    |      Yes      | [$trunc](./jsongin/Expression-Operators.md#$trunc)             | Truncates a number to a given number of decimal places.                                      |
| Array         |      Yes      | [$arrayElemAt](./jsongin/Expression-Operators.md#$arrayElemAt)       | Returns the element of an array at a given index.                                            |
| Array         |      Yes      | [$arrayToObject](./jsongin/Expression-Operators.md#$arrayToObject)     | Converts an array of key/value pairs into an object.                                         |
| Array         |      Yes      | [$concatArrays](./jsongin/Expression-Operators.md#$concatArrays)      | Joins arrays together.                                                                       |
| Array         |       -       | $filter            | Returns the elements of an array which satisfy a condition.                                  |
| Array         |      Yes      | [$first](./jsongin/Expression-Operators.md#$first)             | Returns the first element of an array.                                                       |
| Array         |      Yes      | [$firstN](./jsongin/Expression-Operators.md#$firstN)            | Returns the first N elements of an array.                                                    |
| Array         |      Yes      | [$in](./jsongin/Expression-Operators.md#$in)                | Returns true when a value is found within an array.                                          |
| Array         |      Yes      | [$indexOfArray](./jsongin/Expression-Operators.md#$indexOfArray)      | Returns the index of the first array element which matches a value.                          |
| Array         |      Yes      | [$isArray](./jsongin/Expression-Operators.md#$isArray)           | Returns true when a value is an array.                                                       |
| Array         |      Yes      | [$last](./jsongin/Expression-Operators.md#$last)              | Returns the last element of an array.                                                        |
| Array         |      Yes      | [$lastN](./jsongin/Expression-Operators.md#$lastN)             | Returns the last N elements of an array.                                                     |
| Array         |       -       | $map               | Applies an expression to each element of an array.                                           |
| Array         |      Yes      | [$maxN](./jsongin/Expression-Operators.md#$maxN)              | Returns the N largest values from an array.                                                  |
| Array         |      Yes      | [$minN](./jsongin/Expression-Operators.md#$minN)              | Returns the N smallest values from an array.                                                 |
| Array         |      Yes      | [$range](./jsongin/Expression-Operators.md#$range)             | Generates an array of numbers.                                                               |
| Array         |       -       | $reduce            | Reduces the elements of an array to a single value.                                          |
| Array         |      Yes      | [$reverseArray](./jsongin/Expression-Operators.md#$reverseArray)      | Returns an array with its elements in reverse order.                                         |
| Array         |      Yes      | [$size](./jsongin/Expression-Operators.md#$size)              | Returns the number of elements in an array.                                                  |
| Array         |      Yes      | [$slice](./jsongin/Expression-Operators.md#$slice)             | Returns a subset of an array.                                                                |
| Array         |      Yes      | [$sortArray](./jsongin/Expression-Operators.md#$sortArray)         | Sorts the elements of an array.                                                              |
| Array         |      Yes      | [$zip](./jsongin/Expression-Operators.md#$zip)               | Merges arrays together, element by element.                                                  |
| Comparison    |      Yes      | [$cmp](./jsongin/Expression-Operators.md#$cmp)               | Returns -1, 0, or 1 from the comparison of two values.                                       |
| Comparison    |      Yes      | [$eq](./jsongin/Expression-Operators.md#$eq)                | Returns true when two values are equal.                                                      |
| Comparison    |      Yes      | [$gt](./jsongin/Expression-Operators.md#$gt)                | Returns true when the first value is greater than the second.                                |
| Comparison    |      Yes      | [$gte](./jsongin/Expression-Operators.md#$gte)               | Returns true when the first value is greater than or equal to the second.                    |
| Comparison    |      Yes      | [$lt](./jsongin/Expression-Operators.md#$lt)                | Returns true when the first value is less than the second.                                   |
| Comparison    |      Yes      | [$lte](./jsongin/Expression-Operators.md#$lte)               | Returns true when the first value is less than or equal to the second.                       |
| Comparison    |      Yes      | [$ne](./jsongin/Expression-Operators.md#$ne)                | Returns true when two values are not equal.                                                  |
| Conditional   |      Yes      | [$cond](./jsongin/Expression-Operators.md#$cond)              | Returns one of two values, depending upon a condition.                                       |
| Conditional   |      Yes      | [$ifNull](./jsongin/Expression-Operators.md#$ifNull)            | Returns the first value which is neither null nor missing.                                   |
| Conditional   |      Yes      | [$switch](./jsongin/Expression-Operators.md#$switch)            | Returns the value belonging to the first matching branch.                                    |
| Custom        |       -       | $accumulator       | Defines a custom accumulator in Javascript.                                                  |
| Custom        |       -       | $function          | Defines a custom function in Javascript.                                                     |
| Data Size     |      Yes      | [$binarySize](./jsongin/Expression-Operators.md#$binarySize)        | Returns the size of a binary value in bytes.                                                 |
| Data Size     |      Yes      | [$bsonSize](./jsongin/Expression-Operators.md#$bsonSize)          | Returns the size of a document in bytes.                                                     |
| Date          |      Yes      | [$dateAdd](./jsongin/Expression-Operators.md#$dateAdd)           | Adds a number of time units to a date.                                                       |
| Date          |      Yes      | [$dateDiff](./jsongin/Expression-Operators.md#$dateDiff)          | Returns the difference between two dates, in a given time unit.                              |
| Date          |      Yes      | [$dateFromParts](./jsongin/Expression-Operators.md#$dateFromParts)     | Constructs a date from its individual parts.                                                 |
| Date          |      Yes      | [$dateFromString](./jsongin/Expression-Operators.md#$dateFromString)    | Converts a string to a date.                                                                 |
| Date          |      Yes      | [$dateSubtract](./jsongin/Expression-Operators.md#$dateSubtract)      | Subtracts a number of time units from a date.                                                |
| Date          |      Yes      | [$dateToParts](./jsongin/Expression-Operators.md#$dateToParts)       | Returns a document containing the individual parts of a date.                                |
| Date          |      Yes      | [$dateToString](./jsongin/Expression-Operators.md#$dateToString)      | Converts a date to a formatted string.                                                       |
| Date          |      Yes      | [$dateTrunc](./jsongin/Expression-Operators.md#$dateTrunc)         | Truncates a date to a given time unit.                                                       |
| Date          |      Yes      | [$dayOfMonth](./jsongin/Expression-Operators.md#$dayOfMonth)        | Returns the day of the month of a date, from 1 to 31.                                        |
| Date          |      Yes      | [$dayOfWeek](./jsongin/Expression-Operators.md#$dayOfWeek)         | Returns the day of the week of a date, from 1 to 7.                                          |
| Date          |      Yes      | [$dayOfYear](./jsongin/Expression-Operators.md#$dayOfYear)         | Returns the day of the year of a date, from 1 to 366.                                        |
| Date          |      Yes      | [$hour](./jsongin/Expression-Operators.md#$hour)              | Returns the hour of a date, from 0 to 23.                                                    |
| Date          |      Yes      | [$isoDayOfWeek](./jsongin/Expression-Operators.md#$isoDayOfWeek)      | Returns the ISO 8601 day of the week of a date.                                              |
| Date          |      Yes      | [$isoWeek](./jsongin/Expression-Operators.md#$isoWeek)           | Returns the ISO 8601 week number of a date.                                                  |
| Date          |      Yes      | [$isoWeekYear](./jsongin/Expression-Operators.md#$isoWeekYear)       | Returns the ISO 8601 year of a date.                                                         |
| Date          |      Yes      | [$millisecond](./jsongin/Expression-Operators.md#$millisecond)       | Returns the milliseconds of a date, from 0 to 999.                                           |
| Date          |      Yes      | [$minute](./jsongin/Expression-Operators.md#$minute)            | Returns the minute of a date, from 0 to 59.                                                  |
| Date          |      Yes      | [$month](./jsongin/Expression-Operators.md#$month)             | Returns the month of a date, from 1 to 12.                                                   |
| Date          |      Yes      | [$second](./jsongin/Expression-Operators.md#$second)            | Returns the seconds of a date, from 0 to 60.                                                 |
| Date          |      Yes      | [$week](./jsongin/Expression-Operators.md#$week)              | Returns the week number of a date.                                                           |
| Date          |      Yes      | [$year](./jsongin/Expression-Operators.md#$year)              | Returns the year of a date.                                                                  |
| Literal       |      Yes      | [$literal](./jsongin/Expression-Operators.md#$literal)           | Returns a value without evaluating it. Use this for literal strings which begin with a `$`.  |
| Logical       |      Yes      | [$and](./jsongin/Expression-Operators.md#$and)               | Returns true when all of the expressions are true.                                           |
| Logical       |      Yes      | [$not](./jsongin/Expression-Operators.md#$not)               | Returns the opposite of an expression's boolean value.                                       |
| Logical       |      Yes      | [$or](./jsongin/Expression-Operators.md#$or)                | Returns true when any of the expressions is true.                                            |
| Miscellaneous |      Yes      | [$rand](./jsongin/Expression-Operators.md#$rand)              | Generates a random float between 0 and 1.                                                    |
| Object        |       -       | $getField          | Returns the value of a given field, including fields whose names begin with a `$`.           |
| Object        |       -       | $mergeObjects      | Merges objects together into a single object.                                                |
| Object        |       -       | $objectToArray     | Converts an object into an array of key/value pairs.                                         |
| Object        |       -       | $setField          | Adds or updates a field within an object.                                                    |
| Object        |       -       | $unsetField        | Removes a field from an object.                                                              |
| Set           |      Yes      | [$allElementsTrue](./jsongin/Expression-Operators.md#$allElementsTrue)   | Returns true when every element of an array is true.                                         |
| Set           |      Yes      | [$anyElementTrue](./jsongin/Expression-Operators.md#$anyElementTrue)    | Returns true when any element of an array is true.                                           |
| Set           |      Yes      | [$setDifference](./jsongin/Expression-Operators.md#$setDifference)     | Returns the elements of the first set which are not in the second set.                       |
| Set           |      Yes      | [$setEquals](./jsongin/Expression-Operators.md#$setEquals)         | Returns true when two sets contain the same elements.                                        |
| Set           |      Yes      | [$setIntersection](./jsongin/Expression-Operators.md#$setIntersection)   | Returns the elements which appear in every set.                                              |
| Set           |      Yes      | [$setIsSubset](./jsongin/Expression-Operators.md#$setIsSubset)       | Returns true when every element of the first set appears in the second set.                  |
| Set           |      Yes      | [$setUnion](./jsongin/Expression-Operators.md#$setUnion)          | Returns the elements which appear in any set.                                                |
| String        |      Yes      | [$concat](./jsongin/Expression-Operators.md#$concat)         | Joins strings end to end. A null operand makes the whole result null.                        |
| String        |      Yes      | [$indexOfBytes](./jsongin/Expression-Operators.md#$indexOfBytes) | The UTF-8 byte position of a substring, or -1. Takes an optional start and end.              |
| String        |      Yes      | [$indexOfCP](./jsongin/Expression-Operators.md#$indexOfCP)   | The code point position of a substring, or -1. Takes an optional start and end.              |
| String        |      Yes      | [$ltrim](./jsongin/Expression-Operators.md#$ltrim)           | Removes characters from the left end of a string.                                            |
| String        |      Yes      | [$regexFind](./jsongin/Expression-Operators.md#$regexFind)   | The first match of a pattern, as { match, idx, captures }, or null. idx counts code points.  |
| String        |      Yes      | [$regexFindAll](./jsongin/Expression-Operators.md#$regexFindAll) | Every match of a pattern, as an array. No match is an empty array, not a null.               |
| String        |      Yes      | [$regexMatch](./jsongin/Expression-Operators.md#$regexMatch) | Whether a pattern matches a string. A null input is false rather than null.                  |
| String        |      Yes      | [$replaceAll](./jsongin/Expression-Operators.md#$replaceAll) | Replaces every occurrence of a substring. The find is literal text, not a pattern.           |
| String        |      Yes      | [$replaceOne](./jsongin/Expression-Operators.md#$replaceOne) | Replaces the first occurrence of a substring. The find is literal text, not a pattern.       |
| String        |      Yes      | [$rtrim](./jsongin/Expression-Operators.md#$rtrim)           | Removes characters from the right end of a string.                                           |
| String        |      Yes      | [$split](./jsongin/Expression-Operators.md#$split)           | Cuts a string into an array on a delimiter. An empty delimiter is refused.                   |
| String        |      Yes      | [$strLenBytes](./jsongin/Expression-Operators.md#$strLenBytes) | The length of a string in UTF-8 bytes. A null operand is refused.                            |
| String        |      Yes      | [$strLenCP](./jsongin/Expression-Operators.md#$strLenCP)     | The length of a string in code points. A null operand is refused.                            |
| String        |      Yes      | [$strcasecmp](./jsongin/Expression-Operators.md#$strcasecmp) | Compares two strings without regard to case, giving -1, 0, or 1.                             |
| String        |      Yes      | [$substr](./jsongin/Expression-Operators.md#$substr)         | Deprecated by MongoDB. Another name for $substrBytes.                                        |
| String        |      Yes      | [$substrBytes](./jsongin/Expression-Operators.md#$substrBytes) | Part of a string, counted in UTF-8 bytes. A range which splits a character is refused.       |
| String        |      Yes      | [$substrCP](./jsongin/Expression-Operators.md#$substrCP)     | Part of a string, counted in code points. Stricter about its positions than $substrBytes.    |
| String        |      Yes      | [$toLower](./jsongin/Expression-Operators.md#$toLower)       | Lowercases a string. A null operand is an empty string, and a number is rendered.            |
| String        |      Yes      | [$toUpper](./jsongin/Expression-Operators.md#$toUpper)       | Uppercases a string. A null operand is an empty string, and a number is rendered.            |
| String        |      Yes      | [$trim](./jsongin/Expression-Operators.md#$trim)             | Removes characters from both ends of a string. chars is a set, not a sequence.               |
| Text          |       -       | $meta              | Returns the metadata belonging to a document, such as its text search score.                 |
| Timestamp     |       -       | $tsIncrement       | Returns the incrementing ordinal of a timestamp.                                             |
| Timestamp     |       -       | $tsSecond          | Returns the seconds of a timestamp.                                                          |
| Trigonometry  |      Yes      | [$acos](./jsongin/Expression-Operators.md#$acos)              | Returns the inverse cosine of a value.                                                       |
| Trigonometry  |      Yes      | [$acosh](./jsongin/Expression-Operators.md#$acosh)             | Returns the inverse hyperbolic cosine of a value.                                            |
| Trigonometry  |      Yes      | [$asin](./jsongin/Expression-Operators.md#$asin)              | Returns the inverse sine of a value.                                                         |
| Trigonometry  |      Yes      | [$asinh](./jsongin/Expression-Operators.md#$asinh)             | Returns the inverse hyperbolic sine of a value.                                              |
| Trigonometry  |      Yes      | [$atan](./jsongin/Expression-Operators.md#$atan)              | Returns the inverse tangent of a value.                                                      |
| Trigonometry  |      Yes      | [$atan2](./jsongin/Expression-Operators.md#$atan2)             | Returns the inverse tangent of a coordinate pair.                                            |
| Trigonometry  |      Yes      | [$atanh](./jsongin/Expression-Operators.md#$atanh)             | Returns the inverse hyperbolic tangent of a value.                                           |
| Trigonometry  |      Yes      | [$cos](./jsongin/Expression-Operators.md#$cos)               | Returns the cosine of an angle.                                                              |
| Trigonometry  |      Yes      | [$cosh](./jsongin/Expression-Operators.md#$cosh)              | Returns the hyperbolic cosine of an angle.                                                   |
| Trigonometry  |      Yes      | [$degreesToRadians](./jsongin/Expression-Operators.md#$degreesToRadians)  | Converts degrees to radians.                                                                 |
| Trigonometry  |      Yes      | [$radiansToDegrees](./jsongin/Expression-Operators.md#$radiansToDegrees)  | Converts radians to degrees.                                                                 |
| Trigonometry  |      Yes      | [$sin](./jsongin/Expression-Operators.md#$sin)               | Returns the sine of an angle.                                                                |
| Trigonometry  |      Yes      | [$sinh](./jsongin/Expression-Operators.md#$sinh)              | Returns the hyperbolic sine of an angle.                                                     |
| Trigonometry  |      Yes      | [$tan](./jsongin/Expression-Operators.md#$tan)               | Returns the tangent of an angle.                                                             |
| Trigonometry  |      Yes      | [$tanh](./jsongin/Expression-Operators.md#$tanh)              | Returns the hyperbolic tangent of an angle.                                                  |
| Type          |      Yes      | [$convert](./jsongin/Expression-Operators.md#$convert)           | Converts a value to a given type.                                                            |
| Type          |      Yes      | [$isNumber](./jsongin/Expression-Operators.md#$isNumber)          | Returns true when a value is a number.                                                       |
| Type          |      Yes      | [$toBool](./jsongin/Expression-Operators.md#$toBool)            | Converts a value to a boolean.                                                               |
| Type          |      Yes      | [$toDate](./jsongin/Expression-Operators.md#$toDate)            | Converts a value to a date.                                                                  |
| Type          |       -       | $toDecimal         | Converts a value to a decimal.                                                               |
| Type          |      Yes      | [$toDouble](./jsongin/Expression-Operators.md#$toDouble)          | Converts a value to a double.                                                                |
| Type          |      Yes      | [$toInt](./jsongin/Expression-Operators.md#$toInt)             | Converts a value to an integer.                                                              |
| Type          |      Yes      | [$toLong](./jsongin/Expression-Operators.md#$toLong)            | Converts a value to a long.                                                                  |
| Type          |       -       | $toObjectId        | Converts a value to an ObjectId.                                                             |
| Type          |      Yes      | [$toString](./jsongin/Expression-Operators.md#$toString)          | Converts a value to a string.                                                                |
| Type          |      Yes      | [$type](./jsongin/Expression-Operators.md#$type)              | Returns the type of a value.                                                                 |
| Variable      |       -       | $let               | Binds variables for use within a sub-expression.                                             |

***Note on missing values*** :
Arithmetic performed on a missing or `null` value returns `null` rather than throwing an error.
Only `false`, `0`, `null`, and missing values are treated as false by the logical and
  conditional operators. Note that the empty string `""` and the empty array `[]` are true.

***Note on system variables*** :
The expression system variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `$$REMOVE`) are not supported.
An expression which uses one throws an error rather than mistaking it for a field reference.


## Aggregation Pipeline Stages

Pipeline stages transform an array of documents into another array of documents.
Use the `jsongin.Aggregate( Documents, Pipeline )` function to run documents through a pipeline.
See the [`Aggregate()`](jsongin/Aggregate.md) guide for the details of each stage.

| **Category**  | **Supported** | **Operator**     | **Description**                                                          |
|---------------|:-------------:|------------------|----------------------------------------------------------------------------|
| Stage         |      Yes      | [$addFields](./jsongin/Stage-Operators.md#$addFields)       | Adds computed fields to each document.                                   |
| Stage         |       -       | $bucket          | Groups documents into buckets by given boundaries.                       |
| Stage         |       -       | $bucketAuto      | Groups documents into a given number of buckets.                         |
| Stage         |       -       | $collStats       | Returns statistics about a collection.                                   |
| Stage         |      Yes      | [$count](./jsongin/Stage-Operators.md#$count)           | Returns the number of documents, as a stage. See the note below.         |
| Stage         |       -       | $densify         | Fills in gaps in a sequence of documents.                                |
| Stage         |       -       | $documents       | Returns literal documents, as a pipeline source.                         |
| Stage         |       -       | $facet           | Runs several pipelines over the same documents.                          |
| Stage         |       -       | $fill            | Populates missing field values.                                          |
| Stage         |       -       | $geoNear         | Orders documents by proximity to a point.                                |
| Stage         |       -       | $graphLookup     | Performs a recursive search across a collection.                         |
| Stage         |      Yes      | [$group](./jsongin/Stage-Operators.md#$group)           | Groups documents and reduces each group with accumulators.               |
| Stage         |       -       | $indexStats      | Returns statistics about index usage.                                    |
| Stage         |      Yes      | [$limit](./jsongin/Stage-Operators.md#$limit)           | Passes the first N documents along.                                      |
| Stage         |       -       | $lookup          | Joins documents from another collection.                                 |
| Stage         |      Yes      | [$match](./jsongin/Stage-Operators.md#$match)           | Selects the documents which match a query.                               |
| Stage         |       -       | $merge           | Writes the results into a collection.                                    |
| Stage         |       -       | $out             | Writes the results into a new collection.                                |
| Stage         |      Yes      | [$project](./jsongin/Stage-Operators.md#$project)         | Includes, excludes, and computes document fields.                        |
| Stage         |       -       | $redact          | Restricts the content of documents based on their content.               |
| Stage         |       -       | $replaceRoot     | Promotes a sub-document to the top level.                                |
| Stage         |       -       | $replaceWith     | An alias of $replaceRoot.                                                |
| Stage         |       -       | $sample          | Selects a random sample of documents.                                    |
| Stage         |      Yes      | [$set](./jsongin/Stage-Operators.md#$set)             | An alias of $addFields.                                                  |
| Stage         |       -       | $setWindowFields | Computes values over a window of documents.                              |
| Stage         |      Yes      | [$skip](./jsongin/Stage-Operators.md#$skip)            | Discards the first N documents.                                          |
| Stage         |      Yes      | [$sort](./jsongin/Stage-Operators.md#$sort)            | Sorts the documents by one or more fields.                               |
| Stage         |       -       | $sortByCount     | Groups documents and sorts the groups by count.                          |
| Stage         |       -       | $unionWith       | Appends the documents of another collection.                             |
| Stage         |       -       | $unset           | Removes fields from each document, as a stage. See the note below.       |
| Stage         |      Yes      | [$unwind](./jsongin/Stage-Operators.md#$unwind)          | Emits one document per element of an array field.                        |
| Stage         |       -       | $vectorSearch    | Performs a vector similarity search.                                     |

***Note on the stages which need a second collection*** :
`$lookup`, `$graphLookup`, and `$unionWith` join documents from another collection.
`jsongin` operates on one array of documents at a time and has no notion of a second one, so
  these are out of scope here rather than merely unimplemented.

***Note on names which are also something else*** :
`$count` and `$unset` are each both a stage and something else.
The `$count` ***accumulator*** and the `$count` ***stage*** are both supported, and they take
  different arguments: the accumulator takes `{}` and counts within a `$group`, while the stage
  takes a field name and replaces the whole stream with one document.
The `$unset` ***update operator*** is supported and the `$unset` ***stage*** is not.
`$set` is both a stage and an update operator, and both are supported.


## Accumulators

Accumulators combine the values of many documents into a single value.
They are not expression operators and cannot be used with `Evaluate` or `$expr`.
They belong to the `$group` stage of an aggregation pipeline.

Several of them share a name with an operator of another kind.
See the *Operators Which Share a Name* section below.

| **Category**  | **Supported** | **Operator**   | **Description**                                                            |
|---------------|:-------------:|----------------|------------------------------------------------------------------------------|
| Accumulator   |       -       | $accumulator   | Accumulates values using custom Javascript functions.                      |
| Accumulator   |      Yes      | [$addToSet](./jsongin/Accumulator-Operators.md#$addToSet)      | Collects the unique values of a field.                                     |
| Accumulator   |      Yes      | [$avg](./jsongin/Accumulator-Operators.md#$avg)           | Returns the average of numeric values.                                     |
| Accumulator   |       -       | $bottom        | Returns the last value in a given ordering.                                |
| Accumulator   |       -       | $bottomN       | Returns the last N values in a given ordering.                             |
| Accumulator   |      Yes      | [$count](./jsongin/Accumulator-Operators.md#$count)         | Returns the number of documents.                                           |
| Accumulator   |      Yes      | [$first](./jsongin/Accumulator-Operators.md#$first)         | Returns the value from the first document.                                 |
| Accumulator   |       -       | $firstN        | Returns the values from the first N documents.                             |
| Accumulator   |      Yes      | [$last](./jsongin/Accumulator-Operators.md#$last)          | Returns the value from the last document.                                  |
| Accumulator   |       -       | $lastN         | Returns the values from the last N documents.                              |
| Accumulator   |      Yes      | [$max](./jsongin/Accumulator-Operators.md#$max)           | Returns the largest value. See the note below.                             |
| Accumulator   |       -       | $maxN          | Returns the N largest values.                                              |
| Accumulator   |       -       | $median        | Returns the median value.                                                  |
| Accumulator   |       -       | $mergeObjects  | Merges documents together into a single document.                          |
| Accumulator   |      Yes      | [$min](./jsongin/Accumulator-Operators.md#$min)           | Returns the smallest value. See the note below.                            |
| Accumulator   |       -       | $minN          | Returns the N smallest values.                                             |
| Accumulator   |       -       | $percentile    | Returns values at given percentiles.                                       |
| Accumulator   |      Yes      | [$push](./jsongin/Accumulator-Operators.md#$push)          | Collects the values of a field into an array.                              |
| Accumulator   |       -       | $stdDevPop     | Returns the population standard deviation of numeric values.               |
| Accumulator   |       -       | $stdDevSamp    | Returns the sample standard deviation of numeric values.                   |
| Accumulator   |      Yes      | [$sum](./jsongin/Accumulator-Operators.md#$sum)           | Returns the sum of numeric values.                                         |
| Accumulator   |       -       | $top           | Returns the first value in a given ordering.                               |
| Accumulator   |       -       | $topN          | Returns the first N values in a given ordering.                            |

***Note on non-numeric values*** :
`$sum` and `$avg` ignore the values which are not numbers, while the expression operators throw
  on them. This difference is deliberate and both behaviors are what MongoDB does.
An expression is authored against a single document, where a type error is an authoring mistake
  worth surfacing. An accumulator runs across a whole group, where one malformed document should
  not abort the report.


## Operators Which Share a Name

A number of operator names appear in more than one place, where they mean different things.
This is true of MongoDB itself and is not something `jsongin` invented.

***The position of an operator determines which one it is.***
An operator written inside a query document is a query operator.
The same name written inside `Evaluate`, or inside a `$expr`, is an expression operator.
Written inside an update document, it is an update operator.

There is also a difference in shape which makes them easy to tell apart at a glance:
- A ***query*** operator names a document field and gives a value to compare it against.
- An ***expression*** operator takes an array of operands, each of which is itself an expression.

| **Operator**                          | **As a Query Operator**                                                | **As an Expression Operator**                                              |
|---------------------------------------|------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `$eq` `$ne` `$gt` `$gte` `$lt` `$lte` | `{ hp: { $gt: 5 } }` compares one field to a constant.                 | `{ $gt: [ '$dmg', '$armor' ] }` compares two computed values.              |
| `$and` `$or`                          | `{ $and: [ { a: 1 }, { b: 2 } ] }` joins query clauses together.       | `{ $and: [ { $gt: [ '$hp', 0 ] }, '$alive' ] }` combines boolean values.   |
| `$not`                                | `{ hp: { $not: { $gt: 5 } } }` inverts a query expression on a field.  | `{ $not: '$alive' }` inverts a boolean value.                              |
| `$mod`                                | `{ n: { $mod: [ 4, 0 ] } }` matches when `n % 4` equals `0`.                      | `{ $mod: [ '$n', 4 ] }` returns the remainder itself.               |
| `$size`                               | `{ tags: { $size: 3 } }` matches arrays of that length.               | `{ $size: '$tags' }` returns the length.                                   |
| `$type`                               | `{ n: { $type: 'number' } }` matches fields of that type.             | `{ $type: '$n' }` returns the type name.                                  |
| `$in`                                 | `{ role: { $in: [ 'admin', 'super' ] } }` matches any listed value.   | `{ $in: [ '$role', '$allowed' ] }` returns a boolean. Note that the array is the ***second*** operand here and the value is the first, which is the reverse of the query form. |
| `$rand`                               | Not a query operator; reach it through `$expr`.                       | `{ $rand: {} }` returns a random float from 0 up to 1.                     |

| **Operator**       | **As a Projection Operator**                                          | **As an Expression Operator**                                            |
|--------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `$slice`           | `{ tags: { $slice: 2 } }` keeps the first two elements of a field, in a [`Project()`](./jsongin/Project.md) projection. | `{ $slice: [ '$tags', 2 ] }` returns those two elements as a value. |

***Inside a `$project` stage there are no projection operators at all***, which is what decides
  `$slice` there: the name is always the expression operator, and `{ $project: { t: { $slice: 2 } } }`
  is refused for having only one operand. The projection form belongs to a projection handed to
  `Project()` or to a find.

| **Operator**       | **As an Accumulator**                                                 | **As an Expression Operator**                                            |
|--------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `$first` `$last`   | `{ $group: { _id: '$k', f: { $first: '$v' } } }` takes the value from the first document of a group. | `{ $first: '$tags' }` takes the first element of an array. |
| `$min` `$max`      | `{ $group: { _id: '$k', m: { $min: '$v' } } }` takes the smallest value in a group. | `{ $min: [ '$a', '$b' ] }` selects the smaller of two values. |

| **Operator**   | **As an Update Operator**                                              | **As an Expression Operator**                                          |
|----------------|------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `$min` `$max`  | `{ $min: { hp: 0 } }` lowers `hp` to `0`, but only if it is currently greater. | `{ $min: [ '$hp', 0 ] }` selects the smaller of the two values.  |
| `$set`         | `{ $set: { hp: 5 } }` sets a document field.                          | The expression equivalent is `$setField`. *(not supported)*            |
| `$unset`       | `{ $unset: { hp: 0 } }` removes a document field.                     | The expression equivalent is `$unsetField`. *(not supported)*          |
| `$push`        | `{ $push: { tags: 'new' } }` appends to an array field.               | `$push` is an accumulator, not an expression operator.                 |
| `$addToSet`    | `{ $addToSet: { tags: 'new' } }` appends only if not already present. | `$addToSet` is an accumulator, not an expression operator. Both compare by content rather than by reference. |

An ***accumulator*** is written inside a `$group` stage, as the single field of the object which
  defines an output field. That position is what makes it an accumulator.

| **Operator**     | **As an Accumulator**                                                       | **Elsewhere**                                                            |
|------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `$sum`           | `{ total: { $sum: '$points' } }` totals a field across a group.             | The expression counterpart is `$add`, which throws on a non-numeric operand rather than ignoring it. |
| `$min` `$max`    | `{ top: { $max: '$points' } }` selects across a group.                      | Also an expression operator and an update operator.                      |
| `$push`          | `{ names: { $push: '$name' } }` collects a value from every document in a group. | Also an update operator, which appends to an array field within one document. |
| `$first` `$last` | `{ opener: { $first: '$name' } }` takes the value from one end of a group.  | No counterpart of either name elsewhere.                                 |
| `$count`         | `{ n: { $count: {} } }` counts the documents in a group.                    | Also a pipeline stage, `{ $count: 'total' }`, which replaces the stream with one document. |

`$min` and `$max` are the most easily confused, because the same two names carry three
  different meanings: an update operator, an expression operator, and an accumulator.
`jsongin` supports all three.

`$set` carries two meanings, an update operator and a pipeline stage, and both are supported.
The stage is an alias of `$addFields` and adds computed fields to every document in a pipeline.
The update operator sets a field within a single document.

Some operators have no name collision, but do have a counterpart which is easy to look for
  under the wrong name:
- `$regex` is a query operator. Its expression counterparts are `$regexMatch`, `$regexFind`,
  and `$regexFindAll`, none of which are supported.
- `$elemMatch` is both a query operator and a projection operator.
- `$expr` and `$exprx` are query operators. They are the bridge between the two worlds: they
  are what allow an expression to be used inside a query in the first place.


## Projection Operators

Projection operators allow you to "project" the content of one document into another.
You can use `jsongin.Project( Document, Projection )` to perform this function.


| Category | Supported | Operator   | Description                                                                             |
|----------|:---------:|------------|-----------------------------------------------------------------------------------------|
| Field    | -         | $          | Projects the first element in an array that matches the query condition.                |
| Field    |    Yes    | [$elemMatch](./jsongin/Projection-Operators.md#$elemMatch) | Projects the first element in an array that matches the specified $elemMatch condition. |
| Field    | -         | $meta      | Projects the available per-document metadata.                                           |
| Field    |    Yes    | [$slice](./jsongin/Projection-Operators.md#$slice)     | Limits the number of elements projected from an array. Supports skip and limit slices.  |

***A projection operator is not an expression operator***, even where the two share a name.
`$slice` and `$elemMatch` both exist in other languages meaning something else: there is an
  expression `$slice`, which is not supported, and a query `$elemMatch`, which is.
A projection operator is recognized by its position — a projection value which is a document
  holding exactly one `$` key — so the two never have to be told apart by name alone.

***Note on `$slice`*** :
`$slice` does ***not*** make a projection an inclusion, which is what lets it sit beside
  exclusions:

```js
jsongin.Project( { n: 5, t: [ 1, 2, 3, 4 ] }, { t: { $slice: 2 } } );
// { n: 5, t: [ 1, 2 ] }        the whole document, with t sliced

jsongin.Project( { n: 5, t: [ 1, 2, 3, 4 ] }, { n: 1, t: { $slice: 2 } } );
// { n: 5, t: [ 1, 2 ] }        an inclusion, and t is one of the fields included

jsongin.Project( { t: [ 1, 2, 3, 4 ] }, { t: { $slice: -1 } } );      // { t: [ 4 ] }
jsongin.Project( { t: [ 1, 2, 3, 4 ] }, { t: { $slice: [ 1, 2 ] } } ); // { t: [ 2, 3 ] }
```

A field which is not an array is left exactly as it is.

***Note on the projection `$elemMatch`*** :
It takes the ***first*** matching element only and keeps the array around it.
Like `$slice`, it only decides the type of projection when nothing else has: on its own it is an
  inclusion, but beside an exclusion the exclusion wins and the `$elemMatch` is applied within
  it.

```js
let document = { n: 5, s: 'x', a: [ { x: 1 }, { x: 2 } ] };

jsongin.Project( document, { a: { $elemMatch: { x: 2 } } } );
// { a: [ { x: 2 } ] }              on its own, an inclusion

jsongin.Project( document, { n: 1, a: { $elemMatch: { x: 2 } } } );
// { n: 5, a: [ { x: 2 } ] }        an inclusion, and a is one of the fields included

jsongin.Project( document, { n: 0, a: { $elemMatch: { x: 2 } } } );
// { s: 'x', a: [ { x: 2 } ] }      an exclusion, with a matched
```

The difference from `$slice` is only what each does on its own: `$elemMatch` alone is an
  inclusion, while `$slice` alone returns the whole document with the slice applied.
`$elemMatch` may sit beside an exclusion, which is what MongoDB accepts.

When nothing matches, or the field is not an array, the field is omitted rather than coming back
  as an empty array — and dropped from an exclusion projection for the same reason.

***The two unsupported projection operators are refused by name.***
`$` and `$meta` raise an error which says they are projection operators, so the message points
  at the table above rather than at the expression operators.


## Update Operators

Update operators modify the contents of a document.
Use the `jsongin.Update( Document, Updates )` function to apply updates to a document.


| Category | Supported | Operator         | Description                                                                                                                                   |
|----------|:---------:|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Field    |    Yes    | $set             | Sets the value of a field in a document. A path which is not there is created as a document, and a gap written past the end of an array is filled with `null`. See [`SetValue`](./jsongin/SetValue.md). |
| Field    |    Yes    | [$unset](./jsongin/Update-Operators.md#$unset)           | Removes the specified field from a document. An array element is set to `null` rather than being removed, which keeps the array's length.     |
| Field    |    Yes    | [$rename](./jsongin/Update-Operators.md#$rename)          | Renames a field. A source field which is not present is left alone, and the target field is not created.                                      |
| Field    |    Yes    | [$inc](./jsongin/Update-Operators.md#$inc)             | Increments the value of the field by the specified amount. A field which is not present is created. See the note below.                       |
| Field    |    Yes    | [$min](./jsongin/Update-Operators.md#$min)             | Only updates the field if the specified value is less than the existing field value. Compares by BSON order, not just numerically. See the note below. |
| Field    |    Yes    | [$max](./jsongin/Update-Operators.md#$max)             | Only updates the field if the specified value is greater than the existing field value. Compares by BSON order, not just numerically. See the note below. |
| Field    |    Yes    | [$mul](./jsongin/Update-Operators.md#$mul)             | Multiplies the value of the field by the specified amount. A field which is not present is set to `0`. See the note below.                    |
| Field    |    Yes    | [$currentDate](./jsongin/Update-Operators.md#$currentDate)     | Sets the value of a field to the current date, as a `Date` or as a numeric timestamp. Takes `true` or `{ $type: '...' }`, never a bare string. |
| Field    |     -     | $setOnInsert     | Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents. |
| Array    |    Yes    | [$addToSet](./jsongin/Update-Operators.md#$addToSet)        | Adds elements to an array only if they do not already exist in the set. Supports the `$each` modifier. Creates the array when the field is not present. |
| Array    |    Yes    | [$pop](./jsongin/Update-Operators.md#$pop)             | Removes the first or last item of an array.                                                                                                   |
| Array    |    Yes    | [$push](./jsongin/Update-Operators.md#$push)            | Adds items to an array. Supports the `$each`, `$position`, `$sort`, and `$slice` modifiers, which require a `$each` beside them to be read as modifiers at all. Creates the array when the field is not present. |
| Array    |    Yes    | [$pullAll](./jsongin/Update-Operators.md#$pullAll)         | Removes all matching values from an array.                                                                                                    |
| Array    |     -     | $pull            | Removes all array elements that match a specified query.                                                                                      |
| Array    |     -     | $                | Acts as a placeholder to update the first element that matches the query condition.                                                           |
| Array    |     -     | $[]              | Acts as a placeholder to update all elements in an array for the documents that match the query condition.                                    |
| Array    |     -     | $[<identifier> ] | Acts as a placeholder to update all elements that match the arrayFilters condition for the documents that match the query condition.          |
| Bitwise  |    Yes    | [$bit](./jsongin/Update-Operators.md#$bit)             | Performs bitwise AND, OR, and XOR updates of integer values. The field must already hold an integer, or not be there at all.                  |


***Note on `$min` and `$max`*** :
Neither is a numeric operator.
Values are compared by the ***BSON ordering***, the same order
  [`CompareValues`](./jsongin/CompareValues.md) and [`Sort`](./jsongin/Sort.md) use, so strings,
  dates, booleans, and comparisons between different types are all meaningful.

```js
jsongin.Update( { s: 'xyz' }, { $min: { s: 'abc' } } );  // { s: 'abc' }
jsongin.Update( { n: 5 }, { $max: { n: 'abc' } } );      // { n: 'abc' }  a string outranks a number
jsongin.Update( { n: 5 }, { $min: { n: null } } );       // { n: null }   null outranks nothing
```

A field which is ***not present*** is set to the given value, since there is nothing to compare
  against:

```js
jsongin.Update( {}, { $min: { n: 5 } } );  // { n: 5 }
```

A field holding `null` is compared rather than treated as missing.
Both behaviors match MongoDB.


***Note on `$inc` and `$mul`*** :
A field which is ***not present*** counts as a zero, and the path to it is created.
One rule covers both operators: `$inc` stores the operand and `$mul` stores `0`.

```js
jsongin.Update( {}, { $inc: { n: 5 } } );        // { n: 5 }
jsongin.Update( {}, { $mul: { n: 5 } } );        // { n: 0 }
jsongin.Update( {}, { $inc: { 'x.y': 5 } } );    // { x: { y: 5 } }
```

Both operators are ***strictly numeric***, on the stored value as well as on the operand.
A field holding a string, a boolean, a date, or a `null` is refused rather than coerced,
  and so is a non numeric operand — including a numeric string, which
  [`AsNumber`](./jsongin/AsNumber.md) would convert but MongoDB rejects:

```js
jsongin.Update( { n: 'abc' }, { $inc: { n: 1 } } );   // throws, the stored value is not numeric
jsongin.Update( { n: true }, { $inc: { n: 1 } } );    // throws
jsongin.Update( { n: 1 }, { $inc: { n: '5' } } );     // throws, a numeric string is not a number
```

A refused update leaves the ***whole document*** untouched.
Every field is checked before any field is written, so an update naming several fields never
  applies some of them and refuses the rest.

The refusal is raised as an error, as MongoDB raises one.
The operator writes the reason to the [OpLog](./OpLog.md) and `Update()` raises it.

