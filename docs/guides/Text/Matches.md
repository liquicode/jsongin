# @liquicode/jsongin


# Matches( Text, Pattern, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to test.                        |
| `Pattern`       |        s          | A pattern which can use `*` and `?`.     |
| `CaseSensitive` |        b          | Optional. `false` ignores upper and lower case. Defaults to `true`. |


## Description

Returns `true` if the ***whole*** of `Text` matches `Pattern`.

In `Pattern`, `*` matches any number of characters (including none), and `?` matches exactly one
  character. Every other character must match itself.
So `*3?5` matches `12345` and `anything 3 5`, but `The` does not match `The red fox`: use `The*`.

Throws if `Text` or `Pattern` is not a string.


## Examples


### The whole string
```js
jsongin.Text.Matches( 'The red fox', 'The red fox', true ) === true
jsongin.Text.Matches( 'The red fox', 'Not the red fox', true ) === false
jsongin.Text.Matches( 'THE RED FOX', 'The red fox', false ) === true
jsongin.Text.Matches( 'THE RED FOX', 'Not the red fox', false ) === false
```

### A pattern for the start
```js
jsongin.Text.Matches( 'The red fox', 'The *', true ) === true
jsongin.Text.Matches( 'THE RED FOX', 'The *', false ) === true
```

### A pattern for the middle
```js
jsongin.Text.Matches( 'The red fox', 'The * fox', true ) === true
jsongin.Text.Matches( 'THE RED FOX', 'The * fox', false ) === true
```

### A pattern for the end
```js
jsongin.Text.Matches( 'The red fox', '* fox', true ) === true
jsongin.Text.Matches( 'THE RED FOX', '* fox', false ) === true
```

### Without a wildcard, part of the string does not match
```js
jsongin.Text.Matches( 'The red fox', 'The', true ) === false
```
