# @liquicode/jsongin


# Compare( TextA, TextB, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `TextA`         |        s          | The first string.                        |
| `TextB`         |        s          | The second string.                       |
| `CaseSensitive` |        b          | Optional. `false` ignores upper and lower case. Defaults to `true`. |


## Description

Compares two strings with Javascript's `localeCompare()`, and returns a number:

| **Value** | **Means**               |
|:---------:|-------------------------|
| -1        | `TextA` comes first     |
| 0         | they are the same       |
| 1         | `TextB` comes first     |

When `CaseSensitive` is `false`, both strings are lowercased before comparing.

Throws if `TextA` or `TextB` is not a string.


## Examples


### Case sensitive
```js
jsongin.Text.Compare( 'a', 'a', true ) === 0
jsongin.Text.Compare( 'a', 'A', true ) === -1
jsongin.Text.Compare( 'A', 'a', true ) === 1
```

### Ignoring case
```js
jsongin.Text.Compare( 'a', 'a', false ) === 0
jsongin.Text.Compare( 'a', 'A', false ) === 0
jsongin.Text.Compare( 'A', 'a', false ) === 0
```
