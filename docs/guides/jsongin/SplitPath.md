# @liquicode/jsongin


# SplitPath( Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Path          |       ulsn        | A dot notation path.                     |


## Description

Splits a dot notation path into an array of its parts.

A part which is a plain whole number, such as `1` or `-1`, is returned as a number.
Every other part stays a string, including `'01'` and `'1e2'`, which are field names.

A number `Path` is treated as a one-part path.
An empty path (`undefined`, `null` or `''`) returns `[]`.
Any other type of `Path` throws.

A negative number is returned as a number, but it is not an array index anywhere in `jsongin`.


## See Also

- [`JoinPaths( PathSegment1, PathSegment2, ... )`](./JoinPaths.md)


## Examples


### It splits a path into parts
```js
// jsongin.SplitPath( 'user' ) returns [ 'user' ]
// jsongin.SplitPath( 'user.name' ) returns [ 'user', 'name' ]
```

### Whole numbers become numbers
```js
// jsongin.SplitPath( '1' ) returns [ 1 ]
// jsongin.SplitPath( 'users.1' ) returns [ 'users', 1 ]
// jsongin.SplitPath( 'users.1.name' ) returns [ 'users', 1, 'name' ]
// jsongin.SplitPath( 'users.-1' ) returns [ 'users', -1 ]
```

### Other number-like text stays a string
```js
// jsongin.SplitPath( 'a.01' ) returns [ 'a', '01' ]
// jsongin.SplitPath( 'a.1e2' ) returns [ 'a', '1e2' ]
```

### An empty path returns an empty array
```js
// jsongin.SplitPath() returns []
// jsongin.SplitPath( null ) returns []
// jsongin.SplitPath( '' ) returns []
```

### It throws for a path of the wrong type
```js
jsongin.SplitPath( true ) // throws 'Path is invalid ...'
jsongin.SplitPath( {} ) // throws 'Path is invalid ...'
jsongin.SplitPath( [] ) // throws 'Path is invalid ...'
```
