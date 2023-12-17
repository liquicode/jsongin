# @liquicode/jsongin


# SplitPath( Path )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Path          |       ulsn        | The path of a document field in dot-notation.   |


## Description

Splits a string `Path` into an array of individual path components.

If the `Path` is empty (`undefined`, `null`, or empty string `""`), then an empty array `[]` is returned.
Otherwise `Path` must be a string, in dot-notation, which identifies a field within a document.
`Path` can be numeric when specifying an element of an array.

If `Path` is not of type `ulsn`, then an error is thrown.


## See Also

- [`JoinPaths( PathSegment1, PathSegment2, ... )`](./JoinPaths.md)


## Examples


### It returns an array of path components
```js
jsongin.SplitPath( 'user' ) === [ 'user' ]
jsongin.SplitPath( 'user.name' ) === [ 'user', 'name' ]
```

### It returns array indexes as numerics in the output array
```js
jsongin.SplitPath( document, '1' ) === [ 1 ]
jsongin.SplitPath( document, 'users.1' ) === [ 'users', 1 ]
jsongin.SplitPath( document, 'users.1.name' ) === [ 'users', 1, 'name' ]
```

### Array indexes within a path can be positive or negative
```js
jsongin.SplitPath( document, '-1' ) === [ -1 ]
jsongin.SplitPath( document, 'users.-1' ) === [ 'users', -1 ]
jsongin.SplitPath( document, 'users.-1.name' ) === [ 'users', -1, 'name' ]
```

### If the path is undefined, null, or empty "", then it returns an empty array []
```js
jsongin.SplitPath()  === []
jsongin.SplitPath( null )  === []
jsongin.SplitPath( '' )  === []
```

### It throws an error when an invalid path is given
```js
jsongin.SplitPath( true ) // throws 'Path is invalid ...'
jsongin.SplitPath( {} ) // throws 'Path is invalid ...'
jsongin.SplitPath( [] ) // throws 'Path is invalid ...'
```

