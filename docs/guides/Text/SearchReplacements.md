# @liquicode/jsongin


# SearchReplacements( Text, ReplacementMap, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search.                      |
| `ReplacementMap`|        ol         | An object whose keys are the text to find, and whose values are the text to put in their place. |
| `CaseSensitive` |        b          | Optional. `false` ignores upper and lower case when searching. Defaults to `true`. |


## Description

Returns `Text` with every key of `ReplacementMap` replaced by that key's value.

- The keys are plain text, not patterns.
- All the keys are replaced in one pass, so a replacement is never searched again.
- A `null` or empty `ReplacementMap` returns `Text` unchanged.

Throws if `Text` is not a string.


## Examples


### The whole string
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The red fox': 'A blue dog' }, true ) === 'A blue dog'
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The red fox': 'A blue dog' }, false ) === 'A blue dog'
```

### Parts of the string
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A' }, true ) === 'A red fox'
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A' }, false ) === 'A RED FOX'
jsongin.Text.SearchReplacements( 'The red fox', { 'red': 'blue' }, true ) === 'The blue fox'
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'red': 'blue' }, false ) === 'THE blue FOX'
jsongin.Text.SearchReplacements( 'The red fox', { 'fox': 'dog' }, true ) === 'The red dog'
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'fox': 'dog' }, false ) === 'THE RED dog'
```

### Several replacements at once
```js
jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, true ) === 'A blue dog'
jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, false ) === 'A blue dog'
```

### A replacement is not searched again
```js
jsongin.Text.SearchReplacements( 'a b', { 'a': 'b', 'b': 'c' }, true ) === 'b c'
```
