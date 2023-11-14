# JSONgin
`@liquiode/jsongin`


# Types


Short Types: `bnsloafryu`
---------------------------------------------------------------------

`jsongin` categorizes all values into the one of the following types.
Each type is represented by a single character.
This shorthand makes it easier to describe requirements.
It also mkaes it easier to work with Javascript data types.
You will see references to these types throughout the code and documentation.

For example, to say that a value must be of type `'bns'` means that it must be of type `boolean`, `number`, or `string`.

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


Type Coercion
---------------------------------------------------------------------

### Javascript

Javascipt is not a strongly typed language making it flexible and easy to use.
Also, there can be a lot of conversion and type coercion going behind the scenes.
It is totally possible to have a single field (in an object or database) be represented by different types of values.

Imagine having a JSON based database (i.e. MongoDB) with a sinple field called `year`.
It usually contains numeric values like `1975` but a web app stores this value as a string `"1975"`.
To make things worse, sometimes `year` contains no value (`null`) or is not even present (`undefined`) in the data record.
This can complicate queries to a database when fields can be of various types.
Javascript addresses this with a system of type coercion to handle "common sense" situations like `1975 == "1975"`.
While this incredibly helpful in some circumstances, it can be confusing if these coercion rules are not properly understood.

In order address this confusion, Javascript introduced the strict equality `===` and inequality `!==` operators.
These operators require both operands to be of the same type in order to be equal.
The problem is that there does not also exist strict comparison operators `<==`, `>==` which perform similar type checking.
This can be confusing as `1975 === "1975"` will return false, yet `1975 >= "1975"` is true.

Here are the coercion rules for Javascript:

- Strict Equality Operators `===` and `!==`
	- No coercion takes place, values must be of the same type.
	- `!==` will always be `true` if the values are of different types. No value comparison is performed.

- Loose Equality Operators `==` and `!=`
	- Will coerce values between `b`oolean, `n`umber, and `s`tring types such that:
		- `(false == 0 == "")`
		- `(true == 1 == "1")`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 == '42' == '42.0')`
		- `(42 != '39.9')`
	- No coercion of `null` takes place with the exception that `(null == undefined)` returns `true`.

- Comparison Operators `<=`, `>=`, `<` and `>`
	- Will coerce between `bnsl` types such that:
		- `(false <= 0 <= "" <= null)`
		- `(true >= 1 >= "1" >= null)`
	- Special consideration is given to `n`umber and `s`tring values such that:
		- `(42 >= '42' >= '42.0')`
		- `(42 > '39.9')`
	- `null` and `undefined` cannot be compared to each other. Any comparison (`  <=  >=  <  >  `) returns `false`.

It is useful to be aware of these differences as appear in both MongoDB and `jsongin`.


### MongoDB

All of MongoDB comparison operators (`$eq`, `$gt`, etc.) perform strict comparisons.
That means that, in order for two values to match, they must also be of the same type.


