# JSONgin
`@liquiode/jsongin`


# Query Reference


Query Syntax Rules
---------------------------------------------------------------------

- A query (or sub-query) is an object which contains at least one field, conjunction operator, or negation operator.
	- Multiple fields within a query or evaluated individually and then `$and`-ed together.
- If a query contains multiple top level elements, they are treated as if they occur under an `$and` operator.
- Fields occur at the top of a query or sub-query.
- Fields can be assigned a `bnsla` value (implicit `$eq`).
	- When nested fields are encountered, they are used to indicate the path of evaluation rather than being the target of evaluation.
	- To properly compare object values, use the explicit `$eq` operator.
- Fields can be assigned an object containing operators or sub-queries, but not both.
	- When the field refers to an actual value wthin the underlying data, it should be assigned an object containing one or more operators that will be `$and`-ed together. (implicit `$and`)
	- When the field refers to an object in the underlying data, it should be assigned an object containing one or more fields that will be `$and`-ed together.
	- Conjunction and negation operators can appear in either case.
- Equality operators can match `bnsloa` values.
	- Fields in objects can appear in different orders.
	- Elements of arrays must appear in the same order. To test arrays regardless of element order, use `$in` or `$nin`.
- Comparison operators compare values of the same type and must be of type `bnsl`.
	- Note that when `null` is compared using `$gt` or `$lt`, the result will always be `false`.
	- When both values are `null`, the `$gt` and `$lt` comparisons will return `false` but the `$gte` and `$lte` comparisons will return `true`.
- Comparing to undefined will result in unexpected behaviors. Example: `$eq: undefined` is valid Javascript but will make a mess in your code.


Special Operators
---------------------------------------------------------------------


Document Operators
---------------------------------------------------------------------

**Conjunction Operators**

- Can appear at the top level of a query.
- Can appear after a field.
- Must be followed by an array of sub-queries.

|          |    |
|----------|----|
| `$and`   | Returns true if **all** of its sub-queries return true. |
| `$or`    | Returns true if **any** of its sub-queries return true. |
| `$nor`   | Returns true if **none** of its sub-queries return true. |
|          |    |


**Negation Operator**

- Can appear at the top level of a query.
- Can appear after a field.
- Must be followed by an operator or a sub-query.

|          |    |
|----------|----|
| `$not`   |    |
|          |    |

### Conditional Operators

**Equality Operators**

- Must appear after a field.
- Must be followed by a `bnsloa` value.

|          |    |
|----------|----|
| `$eq`    |    |
| `$ne`    |    |
|          |    |

**Comparison Operators**

- Must appear after a field.
- Must be followed by a `bnsl` value or an operator.

|          |    |
|----------|----|
| `$gt`    |    |
| `$gte`   |    |
| `$lt`    |    |
| `$lte`   |    |
|          |    |

**Array Operators**

- Must appear after a field.
- Must be followed by an array of `bnsl` values.

|          |    |
|----------|----|
| `$in`    |    |
| `$nin`   |    |
|          |    |

**Meta Operators**

- Must appear after a field.
- $exists must be followed by a `b` value.
- $type must be followed by an `s` value.
- $size must be followed by an `n` value.

|           |    |
|-----------|----|
| `$exists` |    |
| `$type`   |    |
| `$size`   |    |
|           |    |

**Other Operators**

- $mod

- Must appear after a field.
- $mod must be followed by an `n` value.

|          |    |
|----------|----|
| `$mod`   |    |
|          |    |

