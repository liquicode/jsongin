# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Addendum and Other Notes

Why this library?
---------------------------------------------------------------------

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

- Full accuracy with implmeneted MongoDB functionality.
- Generate SQL queries for relational/hybrid databases.
- Fast, easy to use, low overhead, and minimal (no) dependencies.


Query Syntax Rules
---------------------------------------------------------------------

- A query (or sub-query) is an object which contains at least one field and/or at least one logical operator.
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


Document Operators
---------------------------------------------------------------------

**Logical Operators**

- Can appear at the top level of a query.
- Can appear after a field.
- Must be followed by an array of sub-queries.
	- Exception: `$not` is followed by an operator or a sub-query.

|          |    |
|----------|----|
| `$and`   | Returns true if **all** of its sub-queries return true. |
| `$or`    | Returns true if **any** of its sub-queries return true. |
| `$nor`   | Returns true if **none** of its sub-queries return true. |
| `$not`   | Negates the value of its sub-query. |
|          | |

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


Type Coercion
---------------------------------------------------------------------

### Javascript

Javascipt is not a strongly typed language making it flexible and easy to use.
Also, there can be a lot of conversion and type coercion going behind the scenes.
It is totally possible to have a single field (in an object or database) be represented by different types of values.

Imagine having a JSON based database (i.e. MongoDB) with a sinple field called `year`.
It usually contains numeric values like `1975` but a web app stores this value as a string `"1975"`.
To make things worse, sometimes `year` contains no value (`null`) or is not even present (`undefined`) in the data record.
This can complicate queries to a database when fields can be of various types.
Javascript addresses this with a system of type coercion to handle "common sense" situations like `1975 == "1975"`.
While this incredibly helpful in some circumstances, it can be confusing if these coercion rules are not properly understood.

In order address this confusion, Javascript introduced the strict equality `===` and inequality `!==` operators.
These operators require both operands to be of the same type in order to be equal.
The problem is that there does not also exist strict comparison operators `<==`, `>==` which perform similar type checking.
This can be confusing as `1975 === "1975"` will return false, yet `1975 >= "1975"` is true.

Here are the coercion rules for Javascript:

- Strict Equality Operators `===` and `!==`
	- No coercion takes place, values must be of the same type.
	- `!==` will always be `true` if the values are of different types. No value comparison is performed.

- Loose Equality Operators `==` and `!=`
	- Will coerce values between `b`oolean, `n`umber, and `s`tring types such that:
		- `(false == 0 == "")`
		- `(true == 1 == "1")`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 == '42' == '42.0')`
		- `(42 != '39.9')`
	- No coercion of `null` takes place with the exception that `(null == undefined)` returns `true`.

- Comparison Operators `<=`, `>=`, `<` and `>`
	- Will coerce between `bnsl` types such that:
		- `(false <= 0 <= "" <= null)`
		- `(true >= 1 >= "1" >= null)`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 >= '42' >= '42.0')`
		- `(42 > '39.9')`
	- `null` and `undefined` cannot be compared to each other. Any comparison (`  <=  >=  <  >  `) returns `false`.

It is useful to be aware of these differences as appear in both MongoDB and `jsongin`.


### MongoDB

All of MongoDB comparison operators (`$eq`, `$gt`, etc.) perform strict comparisons.
That means that, in order for two values to match, they must also be of the same type.
In the case of `o`bjects, fields must also be in the same order.



