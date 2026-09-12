# @liquicode/jsongin


# ValidateQuery( Criteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Criteria      |      object       | The query criteria to check.             |


## Description

Checks a criteria the way [`Query()`](./Query.md) would, without a document and without
  stopping early.
Returns nothing.
Throws the same error `Query()` would throw for the same mistake, and throws nothing for a
  criteria `Query()` would accept.

`Query()` refuses a malformed criteria as it evaluates it, and evaluation stops at the first
  condition which is false.
So a mistake behind a condition which does not match is never seen:

```js
jsongin.Query( { a: 1 }, { a: 2, b: { $size: 2.5 } } );   // false - the $size is never reached
jsongin.ValidateQuery( { a: 2, b: { $size: 2.5 } } );      // throws: $size requires a non-negative integer
```

`ValidateQuery` visits every operator at every level - inside `$and`, `$or` and `$nor`, inside
  `$not`, inside `$elemMatch` and an `$all` which carries one - and applies the same rules to
  each: an unknown operator, an operator at the wrong level, an operand of the wrong type, and
  whatever the operator itself refuses.

Use it where a criteria is accepted before any document is available: a storage layer deciding
  whether to send a criteria to a server at all, or an editor reporting a mistake as it is typed.
An empty collection then refuses the same criteria a full one does.


## What It Does Not Check

Anything which is only a mistake against data.
A comparison against a field of another type, a field which is not there, a `$mod` against a
  string - these are answered false by `Query()`, not refused, and `ValidateQuery` says nothing
  about them.

`null` and `undefined` are refused, since a criteria is an object.
A caller which uses either one to mean *every document* should test for that before calling.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`IsQuery( Query )`](./IsQuery.md)
- [Operator Reference](../Operator-Reference.md) for the list of query operators.


## Examples


### It accepts what Query accepts
```js
jsongin.ValidateQuery( { a: 1 } );                                    // returns
jsongin.ValidateQuery( { $or: [ { a: { $gt: 1 } }, { b: /x/ } ] } );  // returns
jsongin.ValidateQuery( {} );                                          // returns
```


### It refuses what Query refuses, wherever it sits
```js
jsongin.ValidateQuery( { $nope: 1 } );                          // throws, unknown operator
jsongin.ValidateQuery( { $and: [] } );                          // throws, $and needs a non-empty array
jsongin.ValidateQuery( { a: { $or: [ { $gt: 0 } ] } } );        // throws, $or cannot appear below a field
jsongin.ValidateQuery( { a: 1, b: { $size: -1 } } );            // throws, even though a: 1 comes first
jsongin.ValidateQuery( { $or: [ { a: 1 }, { b: { $type: 'bogus' } } ] } );   // throws, inside the second branch
```


### A criteria must be an object
```js
jsongin.ValidateQuery( 'abc' );      // throws
jsongin.ValidateQuery( null );       // throws
```
