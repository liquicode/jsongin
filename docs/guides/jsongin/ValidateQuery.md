# @liquicode/jsongin


# ValidateQuery( Criteria )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Criteria      |         o         | The query criteria to check.             |


## Description

Checks a criteria for mistakes without needing a document.
Throws the same error [`Query()`](./Query.md) would throw. Returns nothing if the criteria is fine.

`Query()` stops at the first condition which does not match, so it can miss a mistake which
  comes after it:

```js
jsongin.Query( { a: 1 }, { a: 2, b: { $size: 2.5 } } );   // false, and the $size is never checked
jsongin.ValidateQuery( { a: 2, b: { $size: 2.5 } } );      // throws: $size requires a non-negative integer
```

`ValidateQuery` checks every operator at every level, including inside `$and`, `$or`, `$nor`,
  `$not`, `$elemMatch`, and an `$elemMatch` inside `$all`.
It throws for:

- an unknown operator
- an operator used at the wrong level, such as `$or` under a field
- an operand of the wrong type
- anything the operator itself refuses, such as a negative `$size`

Use it when you have a criteria but no documents yet, such as before sending a query to a
  database, or to show a mistake in an editor as it is typed.


## What It Does Not Check

It does not check anything which depends on the data.
Comparing a field with a value of another type, testing a field which does not exist, or using
  `$mod` on a string are not mistakes: `Query()` just returns `false`.

`null` and `undefined` throw, because a criteria must be an object.
If you use either one to mean "match everything", check for that before calling.


## See Also

- [`Query( Document, Criteria )`](./Query.md)
- [`IsQuery( Query )`](./IsQuery.md)
- [Query Operators](./Query-Operators.md)


## Examples


### It accepts what Query accepts
```js
jsongin.ValidateQuery( { a: 1 } );                                    // returns
jsongin.ValidateQuery( { $or: [ { a: { $gt: 1 } }, { b: /x/ } ] } );  // returns
jsongin.ValidateQuery( {} );                                          // returns
```


### It refuses what Query refuses, wherever it is
```js
jsongin.ValidateQuery( { $nope: 1 } );                          // throws: unknown operator
jsongin.ValidateQuery( { $and: [] } );                          // throws: $and needs at least one condition
jsongin.ValidateQuery( { a: { $or: [ { $gt: 0 } ] } } );        // throws: $or cannot be used under a field
jsongin.ValidateQuery( { a: 1, b: { $size: -1 } } );            // throws, even though a: 1 comes first
jsongin.ValidateQuery( { $or: [ { a: 1 }, { b: { $type: 'bogus' } } ] } );   // throws, from the second branch
```


### Criteria must be an object
```js
jsongin.ValidateQuery( 'abc' );      // throws
jsongin.ValidateQuery( null );       // throws
```
