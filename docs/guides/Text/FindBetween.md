# @liquicode/jsongin


# FindBetween( Text, StartText, EndText, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search.                      |
| `StartText`     |       sl          | The text which comes before the part you want. `null` or `''` means the start of `Text`. |
| `EndText`       |       sl          | The text which comes after the part you want. `null` or `''` means the end of `Text`. |
| `CaseSensitive` |        b          | Optional. `false` ignores upper and lower case. Defaults to `true`. |


## Description

Returns the text between the first `StartText` and the next `EndText` after it.

- If `StartText` or `EndText` is not found, it returns `null`.
- When `CaseSensitive` is `false`, the search ignores case, but the text returned keeps its
  original case.

Throws if `Text` is not a string, or `StartText` or `EndText` is not a string or `null`.


## Examples


### The whole string
```js
jsongin.Text.FindBetween( 'The red fox', '', '', true ) === 'The red fox'
jsongin.Text.FindBetween( 'The red fox', null, null, true ) === 'The red fox'
jsongin.Text.FindBetween( 'The red fox', '', '', false ) === 'The red fox'
jsongin.Text.FindBetween( 'The red fox', null, null, false ) === 'The red fox'
```

### From the start of the string
```js
jsongin.Text.FindBetween( 'The red fox', '', ' ', true ) === 'The'
jsongin.Text.FindBetween( 'The red fox', null, ' ', true ) === 'The'
jsongin.Text.FindBetween( 'The red fox', '', ' ', false ) === 'The'
jsongin.Text.FindBetween( 'The red fox', null, ' ', false ) === 'The'
```

### From the middle of the string
```js
jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', true ) === ' red '
jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', true ) === null

// Ignoring case, THE and FOX are found.
jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', false ) === ' red '
jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', false ) === ' red '
```
