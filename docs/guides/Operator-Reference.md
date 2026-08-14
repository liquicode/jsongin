# @liquicode/jsongin


### Operator Reference

This is a list of existing MongoDB operators.
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
| Comparison    |      Yes      | $eq            | Matches values that are equal to a specified value.                                                                                           |
| Comparison    |      Yes      | $ne            | Matches all values that are not equal to a specified value.                                                                                   |
| Comparison    |      Yes      | $gt            | Matches values that are greater than a specified value.                                                                                       |
| Comparison    |      Yes      | $gte           | Matches values that are greater than or equal to a specified value.                                                                           |
| Comparison    |      Yes      | $lt            | Matches values that are less than a specified value.                                                                                          |
| Comparison    |      Yes      | $lte           | Matches values that are less than or equal to a specified value.                                                                              |
| Comparison    |      Yes      | $in            | Matches any of the values specified in an array.                                                                                              |
| Comparison    |      Yes      | $nin           | Matches none of the values specified in an array.                                                                                             |
| Logical       |      Yes      | $and           | Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.                                       |
| Logical       |      Yes      | $or            | Joins query clauses with a logical OR returns all documents that match the conditions of either clause.                                       |
| Logical       |      Yes      | $nor           | Joins query clauses with a logical NOR returns all documents that fail to match both clauses.                                                 |
| Logical       |      Yes      | $not           | Inverts the effect of a query expression and returns documents that do not match the query expression.                                        |
| Element       |      Yes      | $exists        | Matches documents that have the specified field.                                                                                              |
| Element       |      Yes      | $type          | Selects documents if a field is of the specified type.                                                                                        |
| Evaluation    |      Yes      | $expr          | Allows use of aggregation expressions within the query language.                                                                              |
| Evaluation    |       -       | $jsonSchema    | Validate documents against the given JSON Schema.                                                                                             |
| Evaluation    |       -       | $mod           | Performs a modulo operation on the value of a field and selects documents with a specified result.                                            |
| Evaluation    |      Yes      | $regex         | Selects documents where values match a specified regular expression.                                                                          |
| Evaluation    |       -       | $text          | Performs text search.                                                                                                                         |
| Evaluation    |       -       | $where         | Matches documents that satisfy a JavaScript expression.                                                                                       |
| Geospatial    |       -       | $geoIntersects | Selects geometries that intersect with a GeoJSON geometry. The 2dsphere index supports $geoIntersects.                                        |
| Geospatial    |       -       | $geoWithin     | Selects geometries within a bounding GeoJSON geometry. The 2dsphere and 2d indexes support $geoWithin.                                        |
| Geospatial    |       -       | $near          | Returns geospatial objects in proximity to a point. Requires a geospatial index. The 2dsphere and 2d indexes support $near.                   |
| Geospatial    |       -       | $nearSphere    | Returns geospatial objects in proximity to a point on a sphere. Requires a geospatial index. The 2dsphere and 2d indexes support $nearSphere. |
| Array         |      Yes      | $elemMatch     | Selects documents if element in the array field matches all the specified $elemMatch conditions.                                              |
| Array         |      Yes      | $size          | Selects documents if the array field is a specified size.                                                                                     |
| Array         |      Yes      | $all           | Matches arrays that contain all elements specified in the query.                                                                              |
| Bitwise       |       -       | $bitsAllClear  | Matches numeric or binary values in which a set of bit positions all have a value of 0.                                                       |
| Bitwise       |       -       | $bitsAllSet    | Matches numeric or binary values in which a set of bit positions all have a value of 1.                                                       |
| Bitwise       |       -       | $bitsAnyClear  | Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.                                               |
| Bitwise       |       -       | $bitsAnySet    | Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.                                               |
| Miscellaneous |       -       | $comment       | Adds a comment to a query predicate.                                                                                                          |
| Miscellaneous |       -       | $rand          | Generates a random float between 0 and 1.                                                                                                     |
| Miscellaneous |       -       | $natural       | A special hint that can be provided via the sort() or hint() methods that can be used to force either a forward or reverse collection scan.   |

***Note on dates*** :
A `Date` has its own short type `d`, so the comparison operators handle dates directly.
`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, and `$nin` all compare dates by their time
  value, and `$type` selects them with either `'date'` or `9`.
A date is never equal to the string or number which represents it: `$eq` against an ISO string
  or a timestamp is `false`.
See [`ShortType()`](./jsongin/ShortType.md) for why dates are treated as their own type.


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
| Arithmetic    |      Yes      | $abs               | Returns the absolute value of a number.                                                      |
| Arithmetic    |      Yes      | $add               | Adds numbers together. Adds milliseconds to a date.                                          |
| Arithmetic    |       -       | $ceil              | Returns the smallest integer which is greater than or equal to a number.                     |
| Arithmetic    |      Yes      | $divide            | Divides one number by another. Throws when dividing by zero.                                 |
| Arithmetic    |       -       | $exp               | Raises Euler's number to a power.                                                            |
| Arithmetic    |       -       | $floor             | Returns the largest integer which is less than or equal to a number.                         |
| Arithmetic    |       -       | $ln                | Returns the natural logarithm of a number.                                                   |
| Arithmetic    |       -       | $log               | Returns the logarithm of a number in a given base.                                           |
| Arithmetic    |       -       | $log10             | Returns the base 10 logarithm of a number.                                                   |
| Arithmetic    |      Yes      | $max               | Returns the largest of several values, ignoring null and missing values.                     |
| Arithmetic    |      Yes      | $min               | Returns the smallest of several values, ignoring null and missing values.                    |
| Arithmetic    |      Yes      | $mod               | Divides one number by another and returns the remainder.                                     |
| Arithmetic    |      Yes      | $multiply          | Multiplies numbers together.                                                                 |
| Arithmetic    |       -       | $pow               | Raises a number to a power.                                                                  |
| Arithmetic    |       -       | $round             | Rounds a number to a given number of decimal places.                                         |
| Arithmetic    |       -       | $sqrt              | Returns the square root of a number.                                                         |
| Arithmetic    |      Yes      | $subtract          | Subtracts two numbers, two dates, or milliseconds from a date.                               |
| Arithmetic    |       -       | $trunc             | Truncates a number to a given number of decimal places.                                      |
| Array         |       -       | $arrayElemAt       | Returns the element of an array at a given index.                                            |
| Array         |       -       | $arrayToObject     | Converts an array of key/value pairs into an object.                                         |
| Array         |       -       | $concatArrays      | Joins arrays together.                                                                       |
| Array         |       -       | $filter            | Returns the elements of an array which satisfy a condition.                                  |
| Array         |       -       | $first             | Returns the first element of an array.                                                       |
| Array         |       -       | $firstN            | Returns the first N elements of an array.                                                    |
| Array         |       -       | $in                | Returns true when a value is found within an array.                                          |
| Array         |       -       | $indexOfArray      | Returns the index of the first array element which matches a value.                          |
| Array         |       -       | $isArray           | Returns true when a value is an array.                                                       |
| Array         |       -       | $last              | Returns the last element of an array.                                                        |
| Array         |       -       | $lastN             | Returns the last N elements of an array.                                                     |
| Array         |       -       | $map               | Applies an expression to each element of an array.                                           |
| Array         |       -       | $maxN              | Returns the N largest values from an array.                                                  |
| Array         |       -       | $minN              | Returns the N smallest values from an array.                                                 |
| Array         |       -       | $range             | Generates an array of numbers.                                                               |
| Array         |       -       | $reduce            | Reduces the elements of an array to a single value.                                          |
| Array         |       -       | $reverseArray      | Returns an array with its elements in reverse order.                                         |
| Array         |       -       | $size              | Returns the number of elements in an array.                                                  |
| Array         |       -       | $slice             | Returns a subset of an array.                                                                |
| Array         |       -       | $sortArray         | Sorts the elements of an array.                                                              |
| Array         |       -       | $zip               | Merges arrays together, element by element.                                                  |
| Comparison    |      Yes      | $cmp               | Returns -1, 0, or 1 from the comparison of two values.                                       |
| Comparison    |      Yes      | $eq                | Returns true when two values are equal.                                                      |
| Comparison    |      Yes      | $gt                | Returns true when the first value is greater than the second.                                |
| Comparison    |      Yes      | $gte               | Returns true when the first value is greater than or equal to the second.                    |
| Comparison    |      Yes      | $lt                | Returns true when the first value is less than the second.                                   |
| Comparison    |      Yes      | $lte               | Returns true when the first value is less than or equal to the second.                       |
| Comparison    |      Yes      | $ne                | Returns true when two values are not equal.                                                  |
| Conditional   |      Yes      | $cond              | Returns one of two values, depending upon a condition.                                       |
| Conditional   |      Yes      | $ifNull            | Returns the first value which is neither null nor missing.                                   |
| Conditional   |      Yes      | $switch            | Returns the value belonging to the first matching branch.                                    |
| Custom        |       -       | $accumulator       | Defines a custom accumulator in Javascript.                                                  |
| Custom        |       -       | $function          | Defines a custom function in Javascript.                                                     |
| Data Size     |       -       | $binarySize        | Returns the size of a binary value in bytes.                                                 |
| Data Size     |       -       | $bsonSize          | Returns the size of a document in bytes.                                                     |
| Date          |       -       | $dateAdd           | Adds a number of time units to a date.                                                       |
| Date          |       -       | $dateDiff          | Returns the difference between two dates, in a given time unit.                              |
| Date          |       -       | $dateFromParts     | Constructs a date from its individual parts.                                                 |
| Date          |       -       | $dateFromString    | Converts a string to a date.                                                                 |
| Date          |       -       | $dateSubtract      | Subtracts a number of time units from a date.                                                |
| Date          |       -       | $dateToParts       | Returns a document containing the individual parts of a date.                                |
| Date          |       -       | $dateToString      | Converts a date to a formatted string.                                                       |
| Date          |       -       | $dateTrunc         | Truncates a date to a given time unit.                                                       |
| Date          |       -       | $dayOfMonth        | Returns the day of the month of a date, from 1 to 31.                                        |
| Date          |       -       | $dayOfWeek         | Returns the day of the week of a date, from 1 to 7.                                          |
| Date          |       -       | $dayOfYear         | Returns the day of the year of a date, from 1 to 366.                                        |
| Date          |       -       | $hour              | Returns the hour of a date, from 0 to 23.                                                    |
| Date          |       -       | $isoDayOfWeek      | Returns the ISO 8601 day of the week of a date.                                              |
| Date          |       -       | $isoWeek           | Returns the ISO 8601 week number of a date.                                                  |
| Date          |       -       | $isoWeekYear       | Returns the ISO 8601 year of a date.                                                         |
| Date          |       -       | $millisecond       | Returns the milliseconds of a date, from 0 to 999.                                           |
| Date          |       -       | $minute            | Returns the minute of a date, from 0 to 59.                                                  |
| Date          |       -       | $month             | Returns the month of a date, from 1 to 12.                                                   |
| Date          |       -       | $second            | Returns the seconds of a date, from 0 to 60.                                                 |
| Date          |       -       | $week              | Returns the week number of a date.                                                           |
| Date          |       -       | $year              | Returns the year of a date.                                                                  |
| Literal       |      Yes      | $literal           | Returns a value without evaluating it. Use this for literal strings which begin with a `$`.  |
| Logical       |      Yes      | $and               | Returns true when all of the expressions are true.                                           |
| Logical       |      Yes      | $not               | Returns the opposite of an expression's boolean value.                                       |
| Logical       |      Yes      | $or                | Returns true when any of the expressions is true.                                            |
| Miscellaneous |       -       | $rand              | Generates a random float between 0 and 1.                                                    |
| Miscellaneous |       -       | $sampleRate        | Randomly selects documents at a given rate.                                                  |
| Object        |       -       | $getField          | Returns the value of a given field, including fields whose names begin with a `$`.           |
| Object        |       -       | $mergeObjects      | Merges objects together into a single object.                                                |
| Object        |       -       | $objectToArray     | Converts an object into an array of key/value pairs.                                         |
| Object        |       -       | $setField          | Adds or updates a field within an object.                                                    |
| Object        |       -       | $unsetField        | Removes a field from an object.                                                              |
| Set           |       -       | $allElementsTrue   | Returns true when every element of an array is true.                                         |
| Set           |       -       | $anyElementTrue    | Returns true when any element of an array is true.                                           |
| Set           |       -       | $setDifference     | Returns the elements of the first set which are not in the second set.                       |
| Set           |       -       | $setEquals         | Returns true when two sets contain the same elements.                                        |
| Set           |       -       | $setIntersection   | Returns the elements which appear in every set.                                              |
| Set           |       -       | $setIsSubset       | Returns true when every element of the first set appears in the second set.                  |
| Set           |       -       | $setUnion          | Returns the elements which appear in any set.                                                |
| String        |       -       | $concat            | Joins strings together.                                                                      |
| String        |       -       | $indexOfBytes      | Returns the byte position of a substring.                                                    |
| String        |       -       | $indexOfCP         | Returns the code point position of a substring.                                              |
| String        |       -       | $ltrim             | Removes whitespace from the beginning of a string.                                           |
| String        |       -       | $regexFind         | Returns information about the first regular expression match within a string.                |
| String        |       -       | $regexFindAll      | Returns information about every regular expression match within a string.                    |
| String        |       -       | $regexMatch        | Returns true when a string matches a regular expression.                                     |
| String        |       -       | $replaceAll        | Replaces every occurrence of a substring.                                                    |
| String        |       -       | $replaceOne        | Replaces the first occurrence of a substring.                                                |
| String        |       -       | $rtrim             | Removes whitespace from the end of a string.                                                 |
| String        |       -       | $split             | Splits a string into an array of substrings.                                                 |
| String        |       -       | $strLenBytes       | Returns the length of a string in bytes.                                                     |
| String        |       -       | $strLenCP          | Returns the length of a string in code points.                                               |
| String        |       -       | $strcasecmp        | Compares two strings without regard to case.                                                 |
| String        |       -       | $substr            | Returns a substring. Deprecated in favor of $substrBytes and $substrCP.                      |
| String        |       -       | $substrBytes       | Returns a substring, using byte positions.                                                   |
| String        |       -       | $substrCP          | Returns a substring, using code point positions.                                             |
| String        |       -       | $toLower           | Converts a string to lowercase.                                                              |
| String        |       -       | $toUpper           | Converts a string to uppercase.                                                              |
| String        |       -       | $trim              | Removes whitespace from both ends of a string.                                               |
| Text          |       -       | $meta              | Returns the metadata belonging to a document, such as its text search score.                 |
| Timestamp     |       -       | $tsIncrement       | Returns the incrementing ordinal of a timestamp.                                             |
| Timestamp     |       -       | $tsSecond          | Returns the seconds of a timestamp.                                                          |
| Trigonometry  |       -       | $acos              | Returns the inverse cosine of a value.                                                       |
| Trigonometry  |       -       | $acosh             | Returns the inverse hyperbolic cosine of a value.                                            |
| Trigonometry  |       -       | $asin              | Returns the inverse sine of a value.                                                         |
| Trigonometry  |       -       | $asinh             | Returns the inverse hyperbolic sine of a value.                                              |
| Trigonometry  |       -       | $atan              | Returns the inverse tangent of a value.                                                      |
| Trigonometry  |       -       | $atan2             | Returns the inverse tangent of a coordinate pair.                                            |
| Trigonometry  |       -       | $atanh             | Returns the inverse hyperbolic tangent of a value.                                           |
| Trigonometry  |       -       | $cos               | Returns the cosine of an angle.                                                              |
| Trigonometry  |       -       | $cosh              | Returns the hyperbolic cosine of an angle.                                                   |
| Trigonometry  |       -       | $degreesToRadians  | Converts degrees to radians.                                                                 |
| Trigonometry  |       -       | $radiansToDegrees  | Converts radians to degrees.                                                                 |
| Trigonometry  |       -       | $sin               | Returns the sine of an angle.                                                                |
| Trigonometry  |       -       | $sinh              | Returns the hyperbolic sine of an angle.                                                     |
| Trigonometry  |       -       | $tan               | Returns the tangent of an angle.                                                             |
| Trigonometry  |       -       | $tanh              | Returns the hyperbolic tangent of an angle.                                                  |
| Type          |       -       | $convert           | Converts a value to a given type.                                                            |
| Type          |       -       | $isNumber          | Returns true when a value is a number.                                                       |
| Type          |       -       | $toBool            | Converts a value to a boolean.                                                               |
| Type          |       -       | $toDate            | Converts a value to a date.                                                                  |
| Type          |       -       | $toDecimal         | Converts a value to a decimal.                                                               |
| Type          |       -       | $toDouble          | Converts a value to a double.                                                                |
| Type          |       -       | $toInt             | Converts a value to an integer.                                                              |
| Type          |       -       | $toLong            | Converts a value to a long.                                                                  |
| Type          |       -       | $toObjectId        | Converts a value to an ObjectId.                                                             |
| Type          |       -       | $toString          | Converts a value to a string.                                                                |
| Type          |       -       | $type              | Returns the type of a value.                                                                 |
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
| Stage         |      Yes      | $addFields       | Adds computed fields to each document.                                   |
| Stage         |       -       | $bucket          | Groups documents into buckets by given boundaries.                       |
| Stage         |       -       | $bucketAuto      | Groups documents into a given number of buckets.                         |
| Stage         |       -       | $collStats       | Returns statistics about a collection.                                   |
| Stage         |       -       | $count           | Returns the number of documents, as a stage. See the note below.         |
| Stage         |       -       | $densify         | Fills in gaps in a sequence of documents.                                |
| Stage         |       -       | $documents       | Returns literal documents, as a pipeline source.                         |
| Stage         |       -       | $facet           | Runs several pipelines over the same documents.                          |
| Stage         |       -       | $fill            | Populates missing field values.                                          |
| Stage         |       -       | $geoNear         | Orders documents by proximity to a point.                                |
| Stage         |       -       | $graphLookup     | Performs a recursive search across a collection.                         |
| Stage         |      Yes      | $group           | Groups documents and reduces each group with accumulators.               |
| Stage         |       -       | $indexStats      | Returns statistics about index usage.                                    |
| Stage         |      Yes      | $limit           | Passes the first N documents along.                                      |
| Stage         |       -       | $lookup          | Joins documents from another collection.                                 |
| Stage         |      Yes      | $match           | Selects the documents which match a query.                               |
| Stage         |       -       | $merge           | Writes the results into a collection.                                    |
| Stage         |       -       | $out             | Writes the results into a new collection.                                |
| Stage         |      Yes      | $project         | Includes, excludes, and computes document fields.                        |
| Stage         |       -       | $redact          | Restricts the content of documents based on their content.               |
| Stage         |       -       | $replaceRoot     | Promotes a sub-document to the top level.                                |
| Stage         |       -       | $replaceWith     | An alias of $replaceRoot.                                                |
| Stage         |       -       | $sample          | Selects a random sample of documents.                                    |
| Stage         |      Yes      | $set             | An alias of $addFields.                                                  |
| Stage         |       -       | $setWindowFields | Computes values over a window of documents.                              |
| Stage         |      Yes      | $skip            | Discards the first N documents.                                          |
| Stage         |      Yes      | $sort            | Sorts the documents by one or more fields.                               |
| Stage         |       -       | $sortByCount     | Groups documents and sorts the groups by count.                          |
| Stage         |       -       | $unionWith       | Appends the documents of another collection.                             |
| Stage         |       -       | $unset           | Removes fields from each document, as a stage. See the note below.       |
| Stage         |      Yes      | $unwind          | Emits one document per element of an array field.                        |
| Stage         |       -       | $vectorSearch    | Performs a vector similarity search.                                     |

***Note on the stages which need a second collection*** :
`$lookup`, `$graphLookup`, and `$unionWith` join documents from another collection.
`jsongin` operates on one array of documents at a time and has no notion of a second one, so
  these are out of scope here rather than merely unimplemented.

***Note on names which are also something else*** :
`$count` and `$unset` are each both a stage and something else.
The `$count` ***accumulator*** is supported and the `$count` ***stage*** is not.
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
| Accumulator   |       -       | $addToSet      | Collects the unique values of a field.                                     |
| Accumulator   |      Yes      | $avg           | Returns the average of numeric values.                                     |
| Accumulator   |       -       | $bottom        | Returns the last value in a given ordering.                                |
| Accumulator   |       -       | $bottomN       | Returns the last N values in a given ordering.                             |
| Accumulator   |      Yes      | $count         | Returns the number of documents.                                           |
| Accumulator   |      Yes      | $first         | Returns the value from the first document.                                 |
| Accumulator   |       -       | $firstN        | Returns the values from the first N documents.                             |
| Accumulator   |      Yes      | $last          | Returns the value from the last document.                                  |
| Accumulator   |       -       | $lastN         | Returns the values from the last N documents.                              |
| Accumulator   |      Yes      | $max           | Returns the largest value. See the note below.                             |
| Accumulator   |       -       | $maxN          | Returns the N largest values.                                              |
| Accumulator   |       -       | $median        | Returns the median value.                                                  |
| Accumulator   |       -       | $mergeObjects  | Merges documents together into a single document.                          |
| Accumulator   |      Yes      | $min           | Returns the smallest value. See the note below.                            |
| Accumulator   |       -       | $minN          | Returns the N smallest values.                                             |
| Accumulator   |       -       | $percentile    | Returns values at given percentiles.                                       |
| Accumulator   |      Yes      | $push          | Collects the values of a field into an array.                              |
| Accumulator   |       -       | $stdDevPop     | Returns the population standard deviation of numeric values.               |
| Accumulator   |       -       | $stdDevSamp    | Returns the sample standard deviation of numeric values.                   |
| Accumulator   |      Yes      | $sum           | Returns the sum of numeric values.                                         |
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
| `$mod`                                | `{ n: { $mod: [ 4, 0 ] } }` matches when `n % 4` equals `0`. *(not supported)* | `{ $mod: [ '$n', 4 ] }` returns the remainder itself.               |
| `$size`                               | `{ tags: { $size: 3 } }` matches arrays of that length.               | `{ $size: '$tags' }` returns the length. *(not supported)*                 |
| `$type`                               | `{ n: { $type: 'number' } }` matches fields of that type.             | `{ $type: '$n' }` returns the type name. *(not supported)*                 |
| `$in`                                 | `{ role: { $in: [ 'admin', 'super' ] } }` matches any listed value.   | `{ $in: [ '$role', '$allowed' ] }` returns a boolean. *(not supported)*    |
| `$rand`                               | Generates a random float. *(not supported)*                           | Generates a random float. *(not supported)*                                |

| **Operator**   | **As an Update Operator**                                              | **As an Expression Operator**                                          |
|----------------|------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `$min` `$max`  | `{ $min: { hp: 0 } }` lowers `hp` to `0`, but only if it is currently greater. | `{ $min: [ '$hp', 0 ] }` selects the smaller of the two values.  |
| `$set`         | `{ $set: { hp: 5 } }` sets a document field.                          | The expression equivalent is `$setField`. *(not supported)*            |
| `$unset`       | `{ $unset: { hp: 0 } }` removes a document field.                     | The expression equivalent is `$unsetField`. *(not supported)*          |
| `$push`        | `{ $push: { tags: 'new' } }` appends to an array field.               | `$push` is an accumulator, not an expression operator.                 |
| `$addToSet`    | `{ $addToSet: { tags: 'new' } }` appends only if not already present. | `$addToSet` is an accumulator, not an expression operator.             |

An ***accumulator*** is written inside a `$group` stage, as the single field of the object which
  defines an output field. That position is what makes it an accumulator.

| **Operator**     | **As an Accumulator**                                                       | **Elsewhere**                                                            |
|------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `$sum`           | `{ total: { $sum: '$points' } }` totals a field across a group.             | The expression counterpart is `$add`, which throws on a non-numeric operand rather than ignoring it. |
| `$min` `$max`    | `{ top: { $max: '$points' } }` selects across a group.                      | Also an expression operator and an update operator.                      |
| `$push`          | `{ names: { $push: '$name' } }` collects a value from every document in a group. | Also an update operator, which appends to an array field within one document. |
| `$first` `$last` | `{ opener: { $first: '$name' } }` takes the value from one end of a group.  | No counterpart of either name elsewhere.                                 |
| `$count`         | `{ n: { $count: {} } }` counts the documents in a group.                    | Also a pipeline stage, which is not supported.                           |

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
| Field    | -         | $elemMatch | Projects the first element in an array that matches the specified $elemMatch condition. |
| Field    | -         | $meta      | Projects the available per-document metadata.                                           |
| Field    | -         | $slice     | Limits the number of elements projected from an array. Supports skip and limit slices.  |


## Update Operators

Update operators modify the contents of a document.
Use the `jsongin.Update( Document, Updates )` function to apply updates to a document.


| Category | Supported | Operator         | Description                                                                                                                                   |
|----------|:---------:|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Field    |    Yes    | $set             | Sets the value of a field in a document.                                                                                                      |
| Field    |    Yes    | $unset           | Removes the specified field from a document.                                                                                                  |
| Field    |    Yes    | $rename          | Renames a field.                                                                                                                              |
| Field    |    Yes    | $inc             | Increments the value of the field by the specified amount.                                                                                    |
| Field    |    Yes    | $min             | Only updates the field if the specified value is less than the existing field value.                                                          |
| Field    |    Yes    | $max             | Only updates the field if the specified value is greater than the existing field value.                                                       |
| Field    |    Yes    | $mul             | Multiplies the value of the field by the specified amount.                                                                                    |
| Field    |    Yes    | $currentDate     | Sets the value of a field to the current date, as a `Date` or as a numeric timestamp. Takes `true` or `{ $type: '...' }`, never a bare string. |
| Field    |     -     | $setOnInsert     | Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents. |
| Array    |    Yes    | $addToSet        | *(partially implemented)* Adds elements to an array only if they do not already exist in the set.                                             |
| Array    |    Yes    | $pop             | Removes the first or last item of an array.                                                                                                   |
| Array    |    Yes    | $push            | *(partially implemented)* Adds an item to an array.                                                                                           |
| Array    |    Yes    | $pullAll         | Removes all matching values from an array.                                                                                                    |
| Array    |     -     | $pull            | Removes all array elements that match a specified query.                                                                                      |
| Array    |     -     | $                | Acts as a placeholder to update the first element that matches the query condition.                                                           |
| Array    |     -     | $[]              | Acts as a placeholder to update all elements in an array for the documents that match the query condition.                                    |
| Array    |     -     | $[<identifier> ] | Acts as a placeholder to update all elements that match the arrayFilters condition for the documents that match the query condition.          |
| Bitwise  |     -     | bit              | Performs bitwise AND, OR, and XOR updates of integer values.                                                                                  |

