# @liquicode/jsongin


# IsQuery( Query )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Query         |       (any)       | The value to test.                       |


## Description

Returns `true` when `Query` is an object with at least one ***top-level*** key starting with `$`.
Returns `false` for everything else.

The key does not have to be a real operator.
`{ $bogus: 1 }` is a query, just a malformed one, and [`Query()`](./Query.md) throws for it.

Use `IsQuery` to tell whether a value holds operators or is plain data.


## It Only Looks at the Top Level

`IsQuery` does not look inside fields.
A valid query whose operators are all inside a field returns `false`:

```js
jsongin.IsQuery( { $and: [ { a: 1 } ] } ) === true    // $and is a top-level key
jsongin.IsQuery( { a: { $eq: 1 } } ) === false        // $eq is inside the field a
```

A document with no operators, such as `{ a: 1 }`, also returns `false`, even though it works as a
  query.

So `true` means "this has an operator at the top level", and `false` means only that it does
  not. It does ***not*** mean the value cannot be used as a query.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`ValidateQuery( Criteria )`](./ValidateQuery.md)
- [Query Operators](./Query-Operators.md)


## Examples


### It finds a top-level operator
```js
jsongin.IsQuery( { $eq: 1 } ) === true
jsongin.IsQuery( { $and: [] } ) === true
```


### It does not look inside fields
```js
jsongin.IsQuery( { a: { $eq: 1 } } ) === false
jsongin.IsQuery( { a: 1 } ) === false
jsongin.IsQuery( {} ) === false
```


### A value which is not an object returns false
```js
jsongin.IsQuery( [] ) === false
jsongin.IsQuery( null ) === false
jsongin.IsQuery( 'abc' ) === false
```
