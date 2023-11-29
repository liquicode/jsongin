# jsongin
[`@liquicode/jsongin`](https://github.com/liquicode/jsongin)


# JoinPaths( PathSegment1, PathSegment2, ... )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| PathSegment   |       ulnsa       | A segment of a document path.            |


## Description

Joins a series of path segments into a single path.
A path segment should be a dot-notation string, indentifying field names within a document.
A path segment can be numeric when addressing an element of an array.
A path segment can also be an array of path segments.
This function will return a combined path string in dot-notation.

If a path segment is not one of the types `ulnsa`, then an error is thrown.


## Examples


### It returns a Document path in dot-notation
```js
jsongin.JoinPaths( 'user' ) === 'user'
jsongin.JoinPaths( 'user', 'name' ) === 'user.name'
```

### It allows numeric array indexes
```js
jsongin.JoinPaths( 'users', 1, 'name' ) === 'users.1.name'
```

### It allows embedded document paths
```js
jsongin.JoinPaths( 'users.1', 'name' ) === 'users.1.name'
```

### It allows an array of document paths
```js
jsongin.JoinPaths( [ 'users', 1, 'name' ] ) === 'users.1.name'
jsongin.JoinPaths( [ 'users.1', 'name' ] ) === 'users.1.name'
jsongin.JoinPaths( 'users', [ 1, 'name' ] ) === 'users.1.name'
```

### Undefined and nulls are ignored
```js
jsongin.JoinPaths( 'users', undefined, 'name' ) === 'users.name'
jsongin.JoinPaths( 'users', null, 'name' ) === 'users.name'
```

### It throws an error when an invalid path segment is given
```js
jsongin.JoinPaths( 'users', { a: 1 }, 'name' ) // throws 'Path segment is invalid ...'
```

