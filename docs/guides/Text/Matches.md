# @liquicode/jsongin


# Matches( Text, Pattern, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `Text`          |        s          | The text to search in.                   |
| `Pattern`       |        s          | A wildcard pattern (* and ?).            |
| `CaseSensitive` |        b          | Flag to force case sensitive operations. |


## Description

Searches in `Text` for `Pattern` and returns `true` if found.

`Pattern` is a text string which can contain the wildcard characters `*` and `?`.
The `*` character matches any text while a `?` will match a single letter.
So, for example, the pattern `*3?5` will match `12345` and `anything 3 5`.


## Examples


### It matches entire string (case sensitive)
```js
jsongin.Text.Matches( 'The red fox', 'The red fox', true ) === true
jsongin.Text.Matches( 'The red fox', 'Not the red fox', true ) === false
```

### It matches text at start of string (case sensitive)
```js
jsongin.Text.Matches( 'The red fox', 'The *', true ) === true
```

### It matches text in middle of string (case sensitive)
```js
jsongin.Text.Matches( 'The red fox', 'The * fox', true ) === true
```

### It matches text at end of string (case sensitive)
```js
jsongin.Text.Matches( 'The red fox', '* fox', true ) === true
```

### It matches entire string (case insensitive)
```js
jsongin.Text.Matches( 'THE RED FOX', 'The red fox', false ) === true
jsongin.Text.Matches( 'THE RED FOX', 'Not the red fox', false ) === false
```

### It matches text at start of string (case insensitive)
```js
jsongin.Text.Matches( 'THE RED FOX', 'The *', false ) === true
```

### It matches text in middle of string (case insensitive)
```js
jsongin.Text.Matches( 'THE RED FOX', 'The * fox', false ) === true
```

### It matches text at end of string (case insensitive)
```js
jsongin.Text.Matches( 'THE RED FOX', '* fox', false ) === true
```
