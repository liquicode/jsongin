# @liquicode/jsongin


# FindBetween( Text, StartText, EndText, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search in.                   |
| `StartText`     |        s          | The starting text to find.               |
| `EndText`       |        s          | The ending text to find.                 |
| `CaseSensitive` |        b          | Flag to force case sensitive operations. |


## Description

Searches in `Text` and returns all text found between `StartText` and `EndText`.
If `StartText` is null or empty, all text starting from the beginning of the string will be included.
If `EndText` is null or empty, all text up to the end of the string will be included.

If `CaseSensitive` is set to `true`, then all strings are lower-cased prior to searching.


## Examples


### It find the entire string (case sensitive)
```js
jsongin.Text.FindBetween( 'The red fox', '', '', true ) === 'The red fox'
jsongin.Text.FindBetween( 'The red fox', null, null, true ) === 'The red fox'
```

### It finds text at start of string (case sensitive)
```js
jsongin.Text.FindBetween( 'The red fox', '', ' ', true ) === 'The'
jsongin.Text.FindBetween( 'The red fox', null, ' ', true ) === 'The'
```

### It finds text in middle of string (case sensitive)
```js
jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', true ) === ' red '
jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', true ) === null
```

### It find the entire string (case insensitive)
```js
jsongin.Text.FindBetween( 'The red fox', '', '', false ) === 'The red fox'
jsongin.Text.FindBetween( 'The red fox', null, null, false ) === 'The red fox'
```

### It finds text at start of string (case insensitive)
```js
jsongin.Text.FindBetween( 'The red fox', '', ' ', false ) === 'The'
jsongin.Text.FindBetween( 'The red fox', null, ' ', false ) === 'The'
```

### It finds text in middle of string (case insensitive)
```js
assert.ok( jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', false ) === ' red ' );
assert.ok( jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', false ) === ' red ' );
```
