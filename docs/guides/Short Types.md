# jsongin
[`@liquiode/jsongin`](https://github.com/liquicode/jsongin)


# Short Types


Short Types: `bnsloafryu`
---------------------------------------------------------------------

`jsongin` categorizes all values into the one of the following types,
  where each type is represented by a single character.
This shorthand makes it easier to describe requirements and work with Javascript data types.
You will see references to these types throughout the code and documentation.

For example, to say that a value must be of type `'bns'` means that it must be of type `boolean`, `number`, or `string`.
Also. rather than using a bunch of `if( typeof Value === 'number' )` statements, you can use something
  like:  `if( 'bns'.includes( jsongin.ShortType( Value ) ) )`, which is much more concise.

To convert a value to its short type, call the `jsongin.ShortType( Value )` function.

This notation was inspired by a similar notation found in the JSONata project.

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


