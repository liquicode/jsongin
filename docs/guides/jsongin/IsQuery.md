# @liquicode/jsongin


# IsQuery( Query )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Query         |       (any)       | The value to test.                       |


## Description

Returns `true` when `Query` is an object which has at least one ***top-level*** key beginning
  with `$`.
Returns `false` for everything else.

The key does not have to be an operator this engine knows.
A misspelled operator makes the object a ***malformed query***, which
  [`Query()`](./Query.md) refuses, rather than a data value to compare a field against.
Reading `{ $bogus: 1 }` as data compared the field against an object nobody meant to write and
  reported that nothing matched, which hid the mistake.

Use it to tell a query document apart from a plain data document, which is a decision a storage
  layer often has to make before choosing what to do with a parameter.


## It Only Looks at the Top Level

This is the part worth knowing.
`IsQuery` checks whether any of the object's ***own keys*** begins with `$`.
It does not descend into fields, so a perfectly valid query whose operators are all nested
  inside a field reports `false`:

```js
jsongin.IsQuery( { $and: [ { a: 1 } ] } ) === true    // $and is a top-level key
jsongin.IsQuery( { a: { $eq: 1 } } ) === false        // $eq is nested inside a field
```

Both of those are valid queries and both work with [`Query()`](./Query.md).
`IsQuery` recognizes only the first.

An object with no operators at all is indistinguishable from a data document by inspection, so
  a plain document like `{ a: 1 }` — which is also a valid query — reports `false`.

***Treat a `true` result as a certainty and a `false` result as "no operator was found at the
top level", not as "this is not a query."***


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [Operator Reference](../Operator-Reference.md) for the list of query operators.


## Examples


### It finds a top-level operator
```js
jsongin.IsQuery( { $eq: 1 } ) === true
jsongin.IsQuery( { $and: [] } ) === true
```


### It does not find a nested one
```js
jsongin.IsQuery( { a: { $eq: 1 } } ) === false
jsongin.IsQuery( { a: 1 } ) === false
jsongin.IsQuery( {} ) === false
```


### Anything which is not an object is not a query
```js
jsongin.IsQuery( [] ) === false
jsongin.IsQuery( null ) === false
jsongin.IsQuery( 'abc' ) === false
```
