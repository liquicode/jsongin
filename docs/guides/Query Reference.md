# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Query Reference


 $eq Operator
---------------------------------------------------------------------
`field: { $eq: value }`

### Usage

The `$eq` operator compares two values and true if they are the same.



### Implicit $eq

An implicit `$eq` can be used when comparing against a simple scalar value:
`{ foo: { $eq: 'baz' } }` is the same as `{ foo: 'baz' }`.

An implicit `$eq ` will only be applied at the end of a nested structure,
where a field represents a single `bnsl` type of value.
Therefore, the query `{ foo: bar: 'baz' }` would equate to
`{ foo: bar: { $eq: 'baz' } }` and not `{ foo: { $eq: { bar: 'baz' } } }`.
To make comparisons between objects (of type `oa`), then you must explicitly
use the `$eq` operator.

