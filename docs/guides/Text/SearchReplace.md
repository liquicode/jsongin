# @liquicode/jsongin


# SearchReplace( Text, Search, Replace, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search.                      |
| `Search`        |        s          | The text to find.                        |
| `Replace`       |        s          | The text to put in its place.            |
| `CaseSensitive` |        b          | Optional. `false` ignores upper and lower case when searching. Defaults to `true`. |


## Description

Returns `Text` with every `Search` replaced by `Replace`.

`Search` is plain text, not a pattern, so characters such as `.` and `(` match themselves.

Throws if `Text` or `Search` is not a string.

To replace several different strings at once, use [`SearchReplacements()`](./SearchReplacements.md).


## Examples


### The whole string
```js
jsongin.Text.SearchReplace( 'The red fox', 'The red fox', 'A blue dog', true ) === 'A blue dog'
jsongin.Text.SearchReplace( 'THE RED FOX', 'The red fox', 'A blue dog', false ) === 'A blue dog'
```

### At the start
```js
jsongin.Text.SearchReplace( 'The red fox', 'The', 'A', true ) === 'A red fox'
jsongin.Text.SearchReplace( 'THE RED FOX', 'The', 'A', false ) === 'A RED FOX'
```

### In the middle
```js
jsongin.Text.SearchReplace( 'The red fox', 'red', 'blue', true ) === 'The blue fox'
jsongin.Text.SearchReplace( 'THE RED FOX', 'red', 'blue', false ) === 'THE blue FOX'
```

### At the end
```js
jsongin.Text.SearchReplace( 'The red fox', 'fox', 'dog', true ) === 'The red dog'
jsongin.Text.SearchReplace( 'THE RED FOX', 'fox', 'dog', false ) === 'THE RED dog'
```

### Special characters are plain text
```js
jsongin.Text.SearchReplace( 'a.b axb', 'a.b', 'X', true ) === 'X axb'
```
