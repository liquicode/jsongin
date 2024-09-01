# @liquicode/jsongin


# SearchReplace( Text, Search, Replace, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search in. 	                 |
| `Search`        |        s          | The text to search for.                  |
| `Replace`       |        s          | The text to replace with.                |
| `CaseSensitive` |        b          | Flag to force case sensitive operations. |


## Description

Search in `Text` for all occurances of the `Search` value and replace it with the `Replace` value.
This function returns the resulting string after all replacements have been made.


## Examples


### It replaces entire string (case sensitive)
```js
jsongin.Text.SearchReplace( 'The red fox', 'The red fox', 'A blue dog', true ) === 'A blue dog'
```

### It replaces text at start of string (case sensitive)
```js
jsongin.Text.SearchReplace( 'The red fox', 'The', 'A', true ) === 'A red fox'
```

### It replaces text in middle of string (case sensitive)
```js
jsongin.Text.SearchReplace( 'The red fox', 'red', 'blue', true ) === 'The blue fox'
```

### It replaces text at end of string (case sensitive)
```js
jsongin.Text.SearchReplace( 'The red fox', 'fox', 'dog', true ) === 'The red dog'
```


### It replaces entire string (case insensitive)
```js
jsongin.Text.SearchReplace( 'THE RED FOX', 'The red fox', 'A blue dog', true ) === 'A blue dog'
```

### It replaces text at start of string (case insensitive)
```js
jsongin.Text.SearchReplace( 'THE RED FOX', 'The', 'A', true ) === 'A RED FOX'
```

### It replaces text in middle of string (case insensitive)
```js
jsongin.Text.SearchReplace( 'THE RED FOX', 'red', 'blue', true ) === 'THE blue FOX'
```

### It replaces text at end of string (case insensitive)
```js
jsongin.Text.SearchReplace( 'THE RED FOX', 'fox', 'dog', true ) === 'THE RED dog'
```

