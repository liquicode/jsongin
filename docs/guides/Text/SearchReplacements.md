# @liquicode/jsongin


# SearchReplacements( Text, ReplacementMap, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search in. 	                 |
| `ReplacementMap`|        o          | A map of search-replace values.          |
| `CaseSensitive` |        b          | Flag to force case sensitive operations. |


## Description

Search in `Text` for keys found in `ReplacementMap` and replaces them with the associated values in `ReplacementMap`.
This function returns the resulting string after all replacements have been made.

`ReplacementMap` is an object whose keys are the search terms and each key's value is used as its replacement text.


## Examples


### It replaces entire string (case sensitive)
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The red fox': 'A blue dog' }, true ) === 'A blue dog'
```

### It replaces text at start of string (case sensitive)
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A' }, true ) === 'A red fox'
```

### It replaces text in middle of string (case sensitive)
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'red': 'blue' }, true ) === 'The blue fox'
```

### It replaces text at end of string (case sensitive)
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'fox': 'dog' }, true ) === 'The red dog'
```

### It replaces multiple strings (case sensitive)
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, true ) === 'A blue dog'
```

### It replaces entire string (case insensitive)
```js
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The red fox': 'A blue dog' }, false ) === 'A blue dog'
```

### It replaces text at start of string (case insensitive)
```js
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A' }, false ) === 'A RED FOX'
```

### It replaces text in middle of string (case insensitive)
```js
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'red': 'blue' }, false ) === 'THE blue FOX'
```

### It replaces text at end of string (case insensitive)
```js
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'fox': 'dog' }, false ) === 'THE RED dog'
```

### It replaces multiple strings (case insensitive)
```js
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, false ) === 'A blue dog'
```
