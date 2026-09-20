# @liquicode/jsongin


### Operator Reference

This page lists the operators MongoDB has, and marks which ones `jsongin` supports.

To learn how to use an operator, follow its link to the page which describes it:

| **Page**                                                          | **Covers**                                           |
|-------------------------------------------------------------------|------------------------------------------------------|
| [Query Operators](./jsongin/Query-Operators.md)                   | operators in a query criteria                        |
| [Expression Operators](./jsongin/Expression-Operators.md)         | operators in an aggregation expression               |
| [Stage Operators](./jsongin/Stage-Operators.md)                   | the stages of an aggregation pipeline                |
| [Accumulator Operators](./jsongin/Accumulator-Operators.md)       | what can go inside `$group`                          |
| [Update Operators](./jsongin/Update-Operators.md)                 | operators in an update document                      |
| [Projection Operators](./jsongin/Projection-Operators.md)         | operators in a projection                            |

In the tables below, `Yes` means supported and `-` means not supported.


## Query Operators

Query operators test whether a document matches.
They are used by [`Query()`](./jsongin/Query.md), [`Filter()`](./jsongin/Filter.md) and the
  `$match` stage.

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
| Evaluation    |      Yes      | [$jsonSchema](./jsongin/Query-Operators.md#$jsonSchema)    | Matches documents which satisfy a JSON Schema, read as MongoDB reads one: draft 4 with `bsonType`, no references, and a refusal for any other keyword. |
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
| Miscellaneous |       -       | $rand          | Generates a random float between 0 and 1. Not a query operator.                                                           |
| Miscellaneous |       -       | $natural       | A hint forcing a forward or reverse collection scan. Not a query operator.                                                |
| Miscellaneous |      Yes      | [$sampleRate](./jsongin/Query-Operators.md#$sampleRate)    | Randomly selects documents at a given rate.                                                                                                   |

`$rand` and `$natural` are listed among MongoDB's query operators, but neither can be used as a
  query condition. Use `$rand` inside `$expr`.

***Dates*** :
The comparison operators compare dates by the moment they hold.
A date never equals the string or number which represents it, even inside a nested object.
See [`ShortType()`](./jsongin/ShortType.md).

***`$gt`, `$gte`, `$lt` and `$lte` only compare values of the same type***:

```js
jsongin.Query( { v: 5 }, { v: { $gt: 'abc' } } );      // false, a number is not a string
jsongin.Query( { v: 'abc' }, { v: { $gt: 1 } } );      // false
jsongin.Query( { v: null }, { v: { $gt: 1 } } );       // false
jsongin.Query( { v: { a: 2 } }, { v: { $gt: { a: 1 } } } );  // true
jsongin.Query( { v: [ 2 ] }, { v: { $gt: [ 1 ] } } );        // true
jsongin.Query( { v: { a: 1 } }, { v: { $gt: [ 1 ] } } );     // false, an object and an array
```

***`$options`*** is not an operator. It holds the flags for a `$regex` beside it:

```js
jsongin.Query( { a: 'FOO' }, { a: { $regex: 'foo', $options: 'i' } } );  // true
jsongin.Query( { a: 'FOO' }, { a: { $regex: 'foo' } } );                 // false
```

`$options` throws when there is no `$regex` beside it, when it is not a string, when it holds an
  unknown flag, or when the `$regex` is a regular expression which already has flags.
A regular expression with the `g` flag works the same for every document.

***`$elemMatch`*** needs ***one*** element to meet every condition:

```js
jsongin.Query( { v: [ 1, 4, 9 ] }, { v: { $elemMatch: { $gt: 2, $lt: 5 } } } );  // true
jsongin.Query( { v: [ 1, 9 ] }, { v: { $elemMatch: { $gt: 2, $lt: 5 } } } );     // false
```

- A field condition does not look inside an element which is itself an array. A nested
  `$elemMatch` does.
- An empty condition, `{}`, matches an element which is an object or an array.
- `$and`, `$or` and `$nor` inside it apply to one element at a time.
- A malformed condition throws, even when the array is empty.

```js
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { x: 1 } } } );                   // false
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { $elemMatch: { x: 1 } } } } );   // true

jsongin.Query( { v: [ { x: 1 } ] }, { v: { $elemMatch: {} } } );  // true
jsongin.Query( { v: [ 1 ] }, { v: { $elemMatch: {} } } );         // false

let document = { v: [ { x: 1, y: 2 }, { x: 5, y: 6 } ] };
jsongin.Query( document, { v: { $elemMatch: { $and: [ { x: 1 }, { y: 6 } ] } } } );  // false, no one element has both
jsongin.Query( document, { 'v.x': 1, 'v.y': 6 } );                                  // true, different elements

jsongin.Query( { v: [] }, { v: { $elemMatch: { $or: 5 } } } );                        // throws
jsongin.Query( { v: [ 1, 2 ] }, { v: { $elemMatch: { $or: [ { $gt: 1 } ] } } } );     // throws
```


## jsongin Extension Query Operators

`jsongin` adds these query operators, which MongoDB does not have:

- [`$eqx`](./jsongin/Query-Operators.md#$eqx) : like `$eq`, but compares loosely (`==`), and
  ignores field and element order.
- [`$nex`](./jsongin/Query-Operators.md#$nex) : matches when `$eqx` would not.
- [`$exprx`](./jsongin/Query-Operators.md#$exprx) : like `$expr`, but can also be used under a
  field, where it evaluates against that field's value.
- [`$noop`](./jsongin/Query-Operators.md#$noop) : matches everything. Rename a clause's key to
  `$noop` to switch it off.

```js
// The b clause is switched off. The a clause still applies.
jsongin.Query( { a: 1, b: 2 }, { a: 1, $noop: { b: 999 } } ) === true
jsongin.Query( { a: 1, b: 2 }, { a: 9, $noop: { b: 999 } } ) === false
```


## Expression Operators

Expression operators compute a value.
They are used by [`Evaluate()`](./jsongin/Evaluate.md), `$expr`, and the pipeline stages.

MongoDB adds expression operators in new server versions, so this list may not be complete.

| **Category**  | **Supported** | **Operator**       | **Description**                                                                              |
|---------------|:-------------:|--------------------|-----------------------------------------------------------------------------------------------|
| Accumulator   |      Yes      | [$avg](./jsongin/Expression-Operators.md#$avg)               | Returns the average of numeric values. Also an accumulator.                                  |
| Accumulator   |      Yes      | [$median](./jsongin/Expression-Operators.md#$median)            | Returns the middle value, picked by rank. Also an accumulator.                               |
| Accumulator   |      Yes      | [$percentile](./jsongin/Expression-Operators.md#$percentile)        | Returns values at given percentiles, picked by rank. Also an accumulator.                    |
| Accumulator   |      Yes      | [$stdDevPop](./jsongin/Expression-Operators.md#$stdDevPop)         | Returns the population standard deviation. Also an accumulator.                              |
| Accumulator   |      Yes      | [$stdDevSamp](./jsongin/Expression-Operators.md#$stdDevSamp)        | Returns the sample standard deviation. Also an accumulator.                                  |
| Accumulator   |      Yes      | [$sum](./jsongin/Expression-Operators.md#$sum)               | Returns the sum of numeric values. Also an accumulator.                                      |
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
| Array         |      Yes      | [$filter](./jsongin/Expression-Operators.md#$filter) | Returns the elements of an array which satisfy a condition.                                  |
| Array         |      Yes      | [$first](./jsongin/Expression-Operators.md#$first)             | Returns the first element of an array.                                                       |
| Array         |      Yes      | [$firstN](./jsongin/Expression-Operators.md#$firstN)            | Returns the first N elements of an array.                                                    |
| Array         |      Yes      | [$in](./jsongin/Expression-Operators.md#$in)                | Returns true when a value is found within an array.                                          |
| Array         |      Yes      | [$indexOfArray](./jsongin/Expression-Operators.md#$indexOfArray)      | Returns the index of the first array element which matches a value.                          |
| Array         |      Yes      | [$isArray](./jsongin/Expression-Operators.md#$isArray)           | Returns true when a value is an array.                                                       |
| Array         |      Yes      | [$last](./jsongin/Expression-Operators.md#$last)              | Returns the last element of an array.                                                        |
| Array         |      Yes      | [$lastN](./jsongin/Expression-Operators.md#$lastN)             | Returns the last N elements of an array.                                                     |
| Array         |      Yes      | [$map](./jsongin/Expression-Operators.md#$map) | Applies an expression to each element of an array.                                           |
| Array         |      Yes      | [$maxN](./jsongin/Expression-Operators.md#$maxN)              | Returns the N largest values from an array.                                                  |
| Array         |      Yes      | [$minN](./jsongin/Expression-Operators.md#$minN)              | Returns the N smallest values from an array.                                                 |
| Array         |      Yes      | [$range](./jsongin/Expression-Operators.md#$range)             | Generates an array of numbers.                                                               |
| Array         |      Yes      | [$reduce](./jsongin/Expression-Operators.md#$reduce) | Reduces the elements of an array to a single value.                                          |
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
| Date          |      Yes      | [$second](./jsongin/Expression-Operators.md#$second)            | Returns the seconds of a date, from 0 to 59.                                                 |
| Date          |      Yes      | [$week](./jsongin/Expression-Operators.md#$week)              | Returns the week number of a date.                                                           |
| Date          |      Yes      | [$year](./jsongin/Expression-Operators.md#$year)              | Returns the year of a date.                                                                  |
| Literal       |      Yes      | [$literal](./jsongin/Expression-Operators.md#$literal)           | Returns a value without evaluating it. Use this for literal strings which begin with a `$`.  |
| Logical       |      Yes      | [$and](./jsongin/Expression-Operators.md#$and)               | Returns true when all of the expressions are true.                                           |
| Logical       |      Yes      | [$not](./jsongin/Expression-Operators.md#$not)               | Returns the opposite of an expression's boolean value.                                       |
| Logical       |      Yes      | [$or](./jsongin/Expression-Operators.md#$or)                | Returns true when any of the expressions is true.                                            |
| Miscellaneous |      Yes      | [$rand](./jsongin/Expression-Operators.md#$rand)              | Generates a random float between 0 and 1.                                                    |
| Object        |      Yes      | [$getField](./jsongin/Expression-Operators.md#$getField)          | Returns the value of a given field, including fields whose names begin with a `$`.           |
| Object        |      Yes      | [$mergeObjects](./jsongin/Expression-Operators.md#$mergeObjects)      | Merges objects together into a single object.                                                |
| Object        |      Yes      | [$objectToArray](./jsongin/Expression-Operators.md#$objectToArray)     | Converts an object into an array of key/value pairs.                                         |
| Object        |      Yes      | [$setField](./jsongin/Expression-Operators.md#$setField)          | Adds or updates a field within an object.                                                    |
| Object        |      Yes      | [$unsetField](./jsongin/Expression-Operators.md#$unsetField)        | Removes a field from an object.                                                              |
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
| Variable      |      Yes      | [$let](./jsongin/Expression-Operators.md#$let) | Binds variables for use within a sub-expression.                                             |

- Arithmetic on a `null` or missing value gives `null`.
- The logical and conditional operators treat only `false`, `0`, `null` and missing as false, so
  `''` and `[]` are true.
- `$$ROOT`, `$$CURRENT`, `$$NOW` and `$$REMOVE` work anywhere an expression is evaluated. In a
  plain query condition or an update, `'$$NOW'` is just a string. See
  [Variables](./jsongin/Expression-Operators.md#variables).


## Aggregation Pipeline Stages

Stages are the steps of a pipeline, run by [`Aggregate()`](./jsongin/Aggregate.md).

| **Category**  | **Supported** | **Operator**     | **Description**                                                          |
|---------------|:-------------:|------------------|----------------------------------------------------------------------------|
| Stage         |      Yes      | [$addFields](./jsongin/Stage-Operators.md#$addFields)       | Adds computed fields to each document.                                   |
| Stage         |      Yes      | [$bucket](./jsongin/Stage-Operators.md#$bucket)       | Groups documents into buckets by given boundaries. |
| Stage         |      Yes      | [$bucketAuto](./jsongin/Stage-Operators.md#$bucketAuto)       | Groups documents into a given number of buckets. |
| Stage         |       -       | $collStats       | Returns statistics about a collection.                                   |
| Stage         |      Yes      | [$count](./jsongin/Stage-Operators.md#$count)           | Returns the number of documents, as a stage. See the note below.         |
| Stage         |      Yes      | [$densify](./jsongin/Stage-Operators.md#$densify)       | Fills in gaps in a sequence of documents. |
| Stage         |       -       | $documents       | Returns literal documents, as a pipeline source.                         |
| Stage         |      Yes      | [$facet](./jsongin/Stage-Operators.md#$facet)       | Runs several pipelines over the same documents. |
| Stage         |      Yes      | [$fill](./jsongin/Stage-Operators.md#$fill)       | Populates missing field values. |
| Stage         |       -       | $geoNear         | Orders documents by proximity to a point.                                |
| Stage         |      Yes      | [$graphLookup](./jsongin/Stage-Operators.md#$graphLookup)       | Follows a chain through a second set of documents. |
| Stage         |      Yes      | [$group](./jsongin/Stage-Operators.md#$group)           | Groups documents and reduces each group with accumulators.               |
| Stage         |       -       | $indexStats      | Returns statistics about index usage.                                    |
| Stage         |      Yes      | [$limit](./jsongin/Stage-Operators.md#$limit)           | Passes the first N documents along.                                      |
| Stage         |      Yes      | [$lookup](./jsongin/Stage-Operators.md#$lookup)       | Joins documents from a second set of documents. |
| Stage         |      Yes      | [$match](./jsongin/Stage-Operators.md#$match)           | Selects the documents which match a query.                               |
| Stage         |       -       | $merge           | Writes the results into a collection.                                    |
| Stage         |       -       | $out             | Writes the results into a new collection.                                |
| Stage         |      Yes      | [$project](./jsongin/Stage-Operators.md#$project)         | Includes, excludes, and computes document fields.                        |
| Stage         |      Yes      | [$redact](./jsongin/Stage-Operators.md#$redact) | Restricts the content of documents based on their content.               |
| Stage         |      Yes      | [$replaceRoot](./jsongin/Stage-Operators.md#$replaceRoot)       | Promotes a sub-document to the top level. |
| Stage         |      Yes      | [$replaceWith](./jsongin/Stage-Operators.md#$replaceWith)       | An alias of $replaceRoot. |
| Stage         |      Yes      | [$sample](./jsongin/Stage-Operators.md#$sample)       | Selects a random sample of documents. |
| Stage         |      Yes      | [$set](./jsongin/Stage-Operators.md#$set)             | An alias of $addFields.                                                  |
| Stage         |       -       | $setWindowFields | Computes values over a window of documents.                              |
| Stage         |      Yes      | [$skip](./jsongin/Stage-Operators.md#$skip)            | Discards the first N documents.                                          |
| Stage         |      Yes      | [$sort](./jsongin/Stage-Operators.md#$sort)            | Sorts the documents by one or more fields.                               |
| Stage         |      Yes      | [$sortByCount](./jsongin/Stage-Operators.md#$sortByCount)       | Groups documents and sorts the groups by count. |
| Stage         |      Yes      | [$unionWith](./jsongin/Stage-Operators.md#$unionWith)       | Appends a second set of documents. |
| Stage         |      Yes      | [$unset](./jsongin/Stage-Operators.md#$unset)       | Removes fields from each document, as a stage. See the note below. |
| Stage         |      Yes      | [$unwind](./jsongin/Stage-Operators.md#$unwind)          | Emits one document per element of an array field.                        |
| Stage         |       -       | $vectorSearch    | Performs a vector similarity search.                                     |

The stages which are not supported write to a database collection, or read an index or a
source which is not an array of documents.
***A stage which reads a second set of documents is supported***: `$lookup`, `$unionWith` and
`$graphLookup` take the documents themselves, where MongoDB names a collection.
`jsongin` works on an array of documents, so it has nothing for them to use.

`$count`, `$set` and `$unset` are both stages and other kinds of operator. All of those forms are
  supported. See [Operators Which Share a Name](#operators-which-share-a-name).


## Accumulators

Accumulators combine a group of documents into one value.
They are used in `$group`, `$bucket` and `$bucketAuto`, and not in `Evaluate()` or `$expr`.

| **Category**  | **Supported** | **Operator**   | **Description**                                                            |
|---------------|:-------------:|----------------|------------------------------------------------------------------------------|
| Accumulator   |       -       | $accumulator   | Accumulates values using custom Javascript functions.                      |
| Accumulator   |      Yes      | [$addToSet](./jsongin/Accumulator-Operators.md#$addToSet)      | Collects the unique values of a field.                                     |
| Accumulator   |      Yes      | [$avg](./jsongin/Accumulator-Operators.md#$avg)           | Returns the average of numeric values.                                     |
| Accumulator   |      Yes      | [$bottom](./jsongin/Accumulator-Operators.md#$bottom)        | Returns the last value in a given ordering.                                |
| Accumulator   |      Yes      | [$bottomN](./jsongin/Accumulator-Operators.md#$bottomN)       | Returns the last N values in a given ordering.                             |
| Accumulator   |      Yes      | [$count](./jsongin/Accumulator-Operators.md#$count)         | Returns the number of documents.                                           |
| Accumulator   |      Yes      | [$first](./jsongin/Accumulator-Operators.md#$first)         | Returns the value from the first document.                                 |
| Accumulator   |      Yes      | [$firstN](./jsongin/Accumulator-Operators.md#$firstN)        | Returns the values from the first N documents.                             |
| Accumulator   |      Yes      | [$last](./jsongin/Accumulator-Operators.md#$last)          | Returns the value from the last document.                                  |
| Accumulator   |      Yes      | [$lastN](./jsongin/Accumulator-Operators.md#$lastN)         | Returns the values from the last N documents.                              |
| Accumulator   |      Yes      | [$max](./jsongin/Accumulator-Operators.md#$max)           | Returns the largest value. See the note below.                             |
| Accumulator   |      Yes      | [$maxN](./jsongin/Accumulator-Operators.md#$maxN)          | Returns the N largest values.                                              |
| Accumulator   |      Yes      | [$median](./jsongin/Accumulator-Operators.md#$median)         | Returns the middle value, picked by rank. MongoDB 7.0.                     |
| Accumulator   |      Yes      | [$mergeObjects](./jsongin/Accumulator-Operators.md#$mergeObjects)  | Merges documents together into a single document.                          |
| Accumulator   |      Yes      | [$min](./jsongin/Accumulator-Operators.md#$min)           | Returns the smallest value. See the note below.                            |
| Accumulator   |      Yes      | [$minN](./jsongin/Accumulator-Operators.md#$minN)          | Returns the N smallest values.                                             |
| Accumulator   |      Yes      | [$percentile](./jsongin/Accumulator-Operators.md#$percentile)     | Returns values at given percentiles, picked by rank. MongoDB 7.0.          |
| Accumulator   |      Yes      | [$push](./jsongin/Accumulator-Operators.md#$push)          | Collects the values of a field into an array.                              |
| Accumulator   |      Yes      | [$stdDevPop](./jsongin/Accumulator-Operators.md#$stdDevPop)     | Returns the population standard deviation of numeric values.               |
| Accumulator   |      Yes      | [$stdDevSamp](./jsongin/Accumulator-Operators.md#$stdDevSamp)    | Returns the sample standard deviation of numeric values.                   |
| Accumulator   |      Yes      | [$sum](./jsongin/Accumulator-Operators.md#$sum)           | Returns the sum of numeric values.                                         |
| Accumulator   |      Yes      | [$top](./jsongin/Accumulator-Operators.md#$top)           | Returns the first value in a given ordering.                               |
| Accumulator   |      Yes      | [$topN](./jsongin/Accumulator-Operators.md#$topN)          | Returns the first N values in a given ordering.                            |

- `$median` and `$percentile` were added in MongoDB 7.0, which is the version jsongin is
  measured against. See [MongoDB Versions](./MongoDB-Versions.md).
- `$min` and `$max` compare values of any type, in MongoDB's type order.
- `$sum` and `$avg` skip values which are not numbers. The expression operators, such as `$add`,
  throw instead. MongoDB behaves the same way.


## Operators Which Share a Name

Some names are used by more than one kind of operator, with different meanings, as in MongoDB.
***Where you write the operator decides which one it is***:

- In a query criteria, it is a query operator.
- In `Evaluate()`, `$expr`, or a computed field, it is an expression operator.
- In an update document, it is an update operator.
- As the value of an output field in `$group`, it is an accumulator.
- As a pipeline step, it is a stage.

The shapes also differ. A query operator tests a field against a value. An expression operator
  takes a list of operands.

| **Operator**                          | **As a Query Operator**                                                | **As an Expression Operator**                                              |
|---------------------------------------|------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `$eq` `$ne` `$gt` `$gte` `$lt` `$lte` | `{ hp: { $gt: 5 } }` compares a field with a value.                    | `{ $gt: [ '$dmg', '$armor' ] }` compares two computed values.              |
| `$and` `$or`                          | `{ $and: [ { a: 1 }, { b: 2 } ] }` combines query conditions.          | `{ $and: [ { $gt: [ '$hp', 0 ] }, '$alive' ] }` combines true and false values. |
| `$not`                                | `{ hp: { $not: { $gt: 5 } } }` negates a condition on a field.         | `{ $not: '$alive' }` negates a value.                                      |
| `$mod`                                | `{ n: { $mod: [ 4, 0 ] } }` matches when `n % 4` equals `0`.           | `{ $mod: [ '$n', 4 ] }` returns the remainder.                             |
| `$size`                               | `{ tags: { $size: 3 } }` matches arrays of that length.               | `{ $size: '$tags' }` returns the length.                                   |
| `$type`                               | `{ n: { $type: 'number' } }` matches fields of that type.             | `{ $type: '$n' }` returns the type name.                                  |
| `$in`                                 | `{ role: { $in: [ 'admin', 'super' ] } }` matches any listed value.   | `{ $in: [ '$role', '$allowed' ] }` returns `true` or `false`. The value comes first and the array second. |
| `$rand`                               | Not usable as a query condition; use it inside `$expr`.               | `{ $rand: {} }` returns a random number from 0 up to 1.                    |

| **Operator**       | **As a Projection Operator**                                          | **As an Expression Operator**                                            |
|--------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `$slice`           | `{ tags: { $slice: 2 } }` keeps the first two elements, in a [`Project()`](./jsongin/Project.md) projection. | `{ $slice: [ '$tags', 2 ] }` returns the first two elements. |

Inside a `$project` ***stage***, `$slice` is always the expression operator.
`{ $project: { t: { $slice: 2 } } }` throws, because the expression form needs two operands.

| **Operator**       | **As an Accumulator**                                                 | **As an Expression Operator**                                            |
|--------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `$first` `$last`   | `{ $group: { _id: '$k', f: { $first: '$v' } } }` takes the value from the first document in a group. | `{ $first: '$tags' }` takes the first element of an array. |
| `$min` `$max`      | `{ $group: { _id: '$k', m: { $min: '$v' } } }` takes the smallest value in a group. | `{ $min: [ '$a', '$b' ] }` takes the smaller of two values. |
| `$mergeObjects`    | `{ $group: { _id: '$k', d: { $mergeObjects: '$v' } } }` merges the objects from every document in a group. | `{ $mergeObjects: [ '$a', '$b' ] }` merges the objects given to it. |
| `$firstN` `$lastN` | `{ $group: { _id: '$k', f: { $firstN: { input: '$v', n: 2 } } } }` takes values from one end of a group. | `{ $firstN: { input: '$tags', n: 2 } }` takes elements from one end of an array. |
| `$minN` `$maxN`    | `{ $group: { _id: '$k', m: { $minN: { input: '$v', n: 2 } } } }` takes the smallest values in a group. | `{ $minN: { input: '$tags', n: 2 } }` takes the smallest elements of an array. |
| `$sum` `$avg`      | `{ $group: { _id: '$k', t: { $sum: '$v' } } }` totals a field across a group. | `{ $sum: '$scores' }` totals the numbers one document holds. |
| `$stdDevPop` `$stdDevSamp` | `{ $group: { _id: '$k', d: { $stdDevPop: '$v' } } }` measures the spread across a group. | `{ $stdDevPop: '$scores' }` measures the spread within one array. |
| `$median` `$percentile` | `{ $group: { _id: '$k', m: { $median: { input: '$v', method: 'approximate' } } } }` picks the middle of a group. | `{ $median: { input: '$scores', method: 'approximate' } }` picks the middle of one array. |

| **Operator**   | **As an Update Operator**                                              | **As an Expression Operator**                                          |
|----------------|------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `$min` `$max`  | `{ $min: { hp: 0 } }` sets `hp` to `0`, but only if it is currently larger. | `{ $min: [ '$hp', 0 ] }` returns the smaller of the two values.  |
| `$set`         | `{ $set: { hp: 5 } }` sets a field, named by a dot notation path.     | `{ $setField: { field: 'hp', input: '$s', value: 5 } }` returns a copy with the field set. The name is a field name, not a path. |
| `$unset`       | `{ $unset: { hp: 0 } }` removes a field, named by a dot notation path. | `{ $unsetField: { field: 'hp', input: '$s' } }` returns a copy without the field. The name is a field name, not a path. |

| **Operator**   | **As a Pipeline Stage**                                                | **Elsewhere**                                                          |
|----------------|------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `$set`         | `{ $set: { total: { $add: [ '$a', '$b' ] } } }` adds computed fields to every document. The same as `$addFields`. | Also an update operator, which sets a field in one document. |
| `$unset`       | `{ $unset: [ 'a', 'b' ] }` removes fields from every document.        | Also an update operator. The expression `$unsetField` names a field rather than a path. |
| `$count`       | `{ $count: 'total' }` replaces the documents with one document holding the count. | Also an accumulator, `{ n: { $count: {} } }`, which counts a group. |
| `$push`        | `{ $push: { tags: 'new' } }` adds to an array field.                  | `$push` is an accumulator, not an expression operator.                 |
| `$addToSet`    | `{ $addToSet: { tags: 'new' } }` adds to an array field if the value is not already there. | `$addToSet` is an accumulator, not an expression operator. |

| **Operator**     | **As an Accumulator**                                                       | **Elsewhere**                                                            |
|------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `$sum`           | `{ total: { $sum: '$points' } }` totals a field across a group.             | There is no `$sum` expression. `$add` adds values, and throws on a non-number. |
| `$min` `$max`    | `{ top: { $max: '$points' } }` finds the largest across a group.            | Also an expression operator and an update operator.                      |
| `$push`          | `{ names: { $push: '$name' } }` collects a value from every document in a group. | Also an update operator, which adds to an array field in one document. |
| `$first` `$last` | `{ opener: { $first: '$name' } }` takes the value from one end of a group.  | Also expression operators, which take an element from one end of an array. |
| `$firstN` `$lastN` | `{ openers: { $firstN: { input: '$name', n: 2 } } }` takes values from one end of a group. | Also expression operators, on an array. |
| `$minN` `$maxN`  | `{ low: { $minN: { input: '$points', n: 2 } } }` takes the smallest values in a group. | Also expression operators, on an array.                                |
| `$mergeObjects`  | `{ all: { $mergeObjects: '$doc' } }` merges the objects from every document in a group. | Also an expression operator, which merges the objects given to it. |
| `$count`         | `{ n: { $count: {} } }` counts the documents in a group.                    | Also a pipeline stage, `{ $count: 'total' }`.                            |
| `$top` `$bottom` | `{ best: { $top: { sortBy: { points: -1 }, output: '$name' } } }` picks a document by sorting. | No other kind of operator has these names.                     |

Related operators with different names:

- `$regex` is a query operator. The expression operators `$regexMatch`, `$regexFind` and
  `$regexFindAll` do similar things in an expression.
- `$elemMatch` is both a query operator and a projection operator.
- `$expr` and `$exprx` are query operators which let you use an expression in a query.


## Projection Operators

Projection operators are used in a [`Project()`](./jsongin/Project.md) projection.

| Category | Supported | Operator   | Description                                                                             |
|----------|:---------:|------------|-----------------------------------------------------------------------------------------|
| Field    | -         | $          | Projects the first element in an array that matches the query condition.                |
| Field    |    Yes    | [$elemMatch](./jsongin/Projection-Operators.md#$elemMatch) | Projects the first element in an array that matches the specified $elemMatch condition. |
| Field    | -         | $meta      | Projects the available per-document metadata.                                           |
| Field    |    Yes    | [$slice](./jsongin/Projection-Operators.md#$slice)     | Limits the number of elements projected from an array. Supports skip and limit slices.  |

- `$slice` does not make a projection an inclusion, so it can be used beside exclusions.
- `$elemMatch` keeps only the first matching element. On its own it is an inclusion, but it can
  also be used beside exclusions. If nothing matches, the field is left out.
- `$` and `$meta` throw.

```js
jsongin.Project( { n: 5, t: [ 1, 2, 3, 4 ] }, { t: { $slice: 2 } } );
// { n: 5, t: [ 1, 2 ] }        the whole document, with t sliced

jsongin.Project( { n: 5, t: [ 1, 2, 3, 4 ] }, { n: 1, t: { $slice: 2 } } );
// { n: 5, t: [ 1, 2 ] }        only n and t

let document = { n: 5, s: 'x', a: [ { x: 1 }, { x: 2 } ] };

jsongin.Project( document, { a: { $elemMatch: { x: 2 } } } );
// { a: [ { x: 2 } ] }              only a

jsongin.Project( document, { n: 0, a: { $elemMatch: { x: 2 } } } );
// { s: 'x', a: [ { x: 2 } ] }      everything but n, with a matched
```

See [Projection Operators](./jsongin/Projection-Operators.md).


## Update Operators

Update operators change a document. They are used by [`Update()`](./jsongin/Update.md).

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
| Array    |    Yes    | [$pull](./jsongin/Update-Operators.md#$pull)            | Removes all array elements that match a specified query. A bare document is a condition on the fields of each element, not a value to match whole. |
| Array    |     -     | $                | Acts as a placeholder to update the first element that matches the query condition.                                                           |
| Array    |    Yes    | [$[]](./jsongin/Update-Operators.md#$[])              | Acts as a placeholder to update all elements in an array. Written inside a path, as `'a.$[].n'`, and usable by every update operator except `$rename`. |
| Array    |     -     | $[<identifier> ] | Acts as a placeholder to update all elements that match the arrayFilters condition for the documents that match the query condition.          |
| Bitwise  |    Yes    | [$bit](./jsongin/Update-Operators.md#$bit)             | Performs bitwise AND, OR, and XOR updates of integer values. The field must already hold an integer, or not be there at all.                  |

`$setOnInsert`, `$` and `$[<identifier>]` need a database query or insert, which `Update()` does
  not have: it is given a document, not a collection and a query.

***`$min` and `$max`*** compare values of any type, in MongoDB's type order.
A missing field is set to the value. A field holding `null` is compared like any other value.

```js
jsongin.Update( { s: 'xyz' }, { $min: { s: 'abc' } } );  // { s: 'abc' }
jsongin.Update( { n: 5 }, { $max: { n: 'abc' } } );      // { n: 'abc' }  a string is larger than a number
jsongin.Update( { n: 5 }, { $min: { n: null } } );       // { n: null }   null is smaller than a number
jsongin.Update( {}, { $min: { n: 5 } } );                // { n: 5 }
```

***`$inc` and `$mul`*** only work with numbers.
A missing field is created: `$inc` sets it to the amount, and `$mul` sets it to `0`.
A field or amount which is not a number throws, even a numeric string like `'5'`.

```js
jsongin.Update( {}, { $inc: { n: 5 } } );        // { n: 5 }
jsongin.Update( {}, { $mul: { n: 5 } } );        // { n: 0 }
jsongin.Update( {}, { $inc: { 'x.y': 5 } } );    // { x: { y: 5 } }

jsongin.Update( { n: 'abc' }, { $inc: { n: 1 } } );   // throws
jsongin.Update( { n: true }, { $inc: { n: 1 } } );    // throws
jsongin.Update( { n: 1 }, { $inc: { n: '5' } } );     // throws
```

When `Update()` throws, the document is not changed at all. The reason is also sent to the
  [OpLog](./OpLog.md).
