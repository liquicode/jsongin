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
if( (typeof Value === 'boolean') || (typeof Value === 'number') || (typeof Value === 'string') ) { /* ... */ }
```
we can express the same constraint in a more concise way:
```js
if( 'bns'.includes( jsongin.ShortType( Value ) ) ) { /* ... */ }
```

To get a value's short type, call the `jsongin.ShortType( Value )` function.

Note: This notation was inspired by a similar notation found in the JSONata project.

List of ShortTypes:
- [`b`]oolean
- [`n`]umber
- [`s`]tring
- [`d`]ate
- nul[`l`]
- [`o`]bject
- [`a`]rray
- [`f`]unction (not used)
- [`r`]egexp
- s[`y`]mbol (not used)
- [`u`]ndefined


## Dates

A `Date` has its own short type, `d`, rather than being reported as an `o`bject.

This matters because a `Date` keeps its value internally and has no fields to walk.
Code which treats a date as an ordinary object finds nothing inside it and produces an empty
  object, losing the value silently.
Giving dates their own short type is what allows `Query`, `Sort`, `Flatten`, `SafeClone`, and
  the expression operators to handle them correctly.

A value is recognized as a date by its ***type only***, never by parsing.
A number which would be a valid timestamp is still an `n`, and a string which would parse as a
  date is still an `s`:

```js
jsongin.ShortType( new Date() ) === 'd'
jsongin.ShortType( 1700000000000 ) === 'n'
jsongin.ShortType( '2023-11-14T22:13:20.000Z' ) === 's'
```

This is deliberate. Every number is a valid timestamp, so classifying by parsing would make
  every number a date.


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
jsongin.ShortType( new Date() ) === 'd'
jsongin.ShortType( /^abc/ ) === 'r'
```

### It tests for undefined values
```js
jsongin.ShortType() === 'u'
```

