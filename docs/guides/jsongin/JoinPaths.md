# @liquicode/jsongin


# JoinPaths( PathSegment1, PathSegment2, ... )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| PathSegment   |       ulnsa       | Part of a document path. Pass as many as you need. |


## Description

Joins its arguments into one dot notation path.

Each argument can be:

- a string, which can already contain dots, such as `'users.1'`
- a number, for an array position
- an array of strings and numbers
- `undefined` or `null`, which is skipped

Any other type throws.


## Examples


### It joins parts with dots
```js
jsongin.JoinPaths( 'user' ) === 'user'
jsongin.JoinPaths( 'user', 'name' ) === 'user.name'
```

### It accepts numbers
```js
jsongin.JoinPaths( 'users', 1, 'name' ) === 'users.1.name'
```

### A part can already be a path
```js
jsongin.JoinPaths( 'users.1', 'name' ) === 'users.1.name'
```

### It accepts arrays of parts
```js
jsongin.JoinPaths( [ 'users', 1, 'name' ] ) === 'users.1.name'
jsongin.JoinPaths( [ 'users.1', 'name' ] ) === 'users.1.name'
jsongin.JoinPaths( 'users', [ 1, 'name' ] ) === 'users.1.name'
```

### It skips undefined and null
```js
jsongin.JoinPaths( 'users', undefined, 'name' ) === 'users.name'
jsongin.JoinPaths( 'users', null, 'name' ) === 'users.name'
```

### It throws for a part of the wrong type
```js
jsongin.JoinPaths( 'users', { a: 1 }, 'name' ) // throws 'Path segment is invalid ...'
```


## See Also

- [`SplitPath( Path )`](./SplitPath.md), which splits a path into its parts.
- [`GetValue( Document, Path )`](./GetValue.md) and [`SetValue( Document, Path, Value )`](./SetValue.md), which read and write by path.
- [Document Manipulation](../Document-Manipulation.md)
