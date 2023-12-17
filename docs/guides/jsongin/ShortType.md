# @liquicode/jsongin


# ShortType( Value )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                          |
|---------------|:-----------------:|------------------------------------------|
| Value         |       (any)       | The value to get the type of.            |


## Description

`jsongin` categorizes all values into the one of the following types,
  where each type is represented by a single character.
This shorthand makes it easier to describe requirements and work with Javascript data types.
You will see many references to these ShortTypes throughout the code and documentation.

For example, to say that a value must be of type `'bns'` means that it must be of type `boolean`, `number`, or `string`.

Rather than using statements like this one:
```js
if( (typeof Value === 'boolean') || (typeof Value === 'number') || (typeof Value === 'string') ) { ... }
```
we can express the same constraint in a more concise way:
```js
if( 'bns'.includes( jsongin.ShortType( Value ) ) ) { ... }
```

To get a value's short type, call the `jsongin.ShortType( Value )` function.

Note: This notation was inspired by a similar notation found in the JSONata project.

List of ShortTypes:
- [`b`]oolean
- [`n`]umber
- [`s`]tring
- nul[`l`]
- [`o`]bject
- [`a`]rray
- [`f`]unction (not used)
- [`r`]egexp
- s[`y`]mbol (not used)
- [`u`]ndefined


## Examples


### It gets the ShortType for primitive values
```js
jsongin.ShortType( true ) === 'b'
jsongin.ShortType( 3.14 ) === 'n'
jsongin.ShortType( 'abc' ) === 's'
```

### It tests object values for a more specific ShortType
```js
jsongin.ShortType( null ) === 'l'
jsongin.ShortType( { a: 1 } ) === 'o'
jsongin.ShortType( [ 1, 2, 3 ] ) === 'a'
jsongin.ShortType( /^abc/ ) === 'r'
```

### It tests for undefined values
```js
jsongin.ShortType() === 'u'
```

