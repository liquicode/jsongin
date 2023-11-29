# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin)


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

Read the [Query Reference](./Query%20Reference.md) document to understand how these operators are used.

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
| Evaluation    |       -       | $expr          | Allows use of aggregation expressions within the query language.                                                                              |
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

## jsongin Extended Query Operators

`jsongin` offers additional query operators which support loose comparisons (==):

- `$eqx` : Matches values that are equal to a specified value. Loose comparison (==).
- `$nex` : Matches all values that are not equal to a specified value. Loose comparison (==).
- `$noop` : Can be anything. No operation is performed on this data. Can be used to "comment out" portions of a query.


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
| Field    |    Yes    | $currentDate     | Sets the value of a field to current date either as a Date or a Timestamp.                                                                    |
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

