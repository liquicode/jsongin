# @liquicode/jsongin


# Compare( TextA, TextB, CaseSensitive = true )


## Parameters

| **Parameter**   | **Allowed Types** | **Description**                          |
|-----------------|:-----------------:|------------------------------------------|
| `TextA`         |        s          | The first text to compare.               |
| `TextB`         |        s          | The second text to compare.              |
| `CaseSensitive` |        b          | Flag to force case sensitive operations. |


## Description

Compares the two strings `TextA` and `TextB` using Javascript's `localeCompare()` function.

If `CaseSensitive` is set to `true`, then both strings are lower-cased prior to comparing.


## Returns

| **Value** | **Description**   |
|:---------:|-------------------|
| -1        | `TextA` < `TextB` |
| 0         | `TextA` = `TextB` |
| 1         | `TextA` > `TextB` |


## Examples


### It compares text (case sensitive)
```js
jsongin.Text.Compare( 'a', 'a', true ) === 0
jsongin.Text.Compare( 'a', 'A', true ) === -1
jsongin.Text.Compare( 'A', 'a', true ) === 1
```

### It compares text (case insensitive)
```js
jsongin.Text.Compare( 'a', 'a', false ) === 0
jsongin.Text.Compare( 'a', 'A', false ) === 0
jsongin.Text.Compare( 'A', 'a', false ) === 0
```
