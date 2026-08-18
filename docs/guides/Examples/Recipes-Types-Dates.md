# @liquicode/jsongin


# Recipes: Types & Dates

`jsongin` is type-aware all the way down: a date is never equal to the string that
represents it, and `null` is never equal to `undefined`. This page shows the
functions for inspecting types, the `$type` query operator, and how dates compare.

The recipes use this document:

```js
let doc = { _id: 1, name: 'Alice', age: 30, active: true, joined: new Date( '2026-01-15T00:00:00Z' ), tags: [ 'a' ] };
```


## Identify a Value's Type with `ShortType`

[`ShortType( Value )`](../jsongin/ShortType.md) returns a one-letter type code.
Every value has one:

```js
jsongin.ShortType( 3 ) === 'n'
jsongin.ShortType( 'x' ) === 's'
jsongin.ShortType( true ) === 'b'
jsongin.ShortType( null ) === 'l'
jsongin.ShortType( undefined ) === 'u'
jsongin.ShortType( [] ) === 'a'
jsongin.ShortType( {} ) === 'o'
jsongin.ShortType( new Date( '2026-01-01' ) ) === 'd'
jsongin.ShortType( /re/ ) === 'r'
```

A date has its own code, `d`, which is why a date is never equal to the string or
number that represents it.


## Get the BSON Type with `BsonType`

[`BsonType( Value, ReturnAlias )`](../jsongin/BsonType.md) returns the BSON type
number, or — with `ReturnAlias` true — its name:

```js
jsongin.BsonType( 30, false ) === 16
jsongin.BsonType( 30, true ) === 'int'
jsongin.BsonType( 'x', true ) === 'string'
jsongin.BsonType( true, true ) === 'bool'
jsongin.BsonType( null, true ) === 'null'
jsongin.BsonType( new Date( '2026-01-01' ), true ) === 'date'
jsongin.BsonType( [], true ) === 'array'
jsongin.BsonType( {}, true ) === 'object'
```


## Select by Type with `$type`

The [`$type`](../jsongin/Query-Operators.md) query operator matches a field whose
value is of a named type. `'number'` is an alias that matches every numeric type:

```js
jsongin.Query( doc, { age: { $type: 'number' } } ) === true
jsongin.Query( doc, { name: { $type: 'string' } } ) === true
jsongin.Query( doc, { active: { $type: 'bool' } } ) === true
jsongin.Query( doc, { tags: { $type: 'array' } } ) === true
jsongin.Query( doc, { joined: { $type: 'date' } } ) === true
```

A BSON type number works too — `9` is the code for a date:

```js
jsongin.Query( doc, { joined: { $type: 9 } } ) === true
```


## Compare Dates

The comparison operators compare dates by their time value, so a date orders
against other dates the way you would expect:

```js
jsongin.Query( doc, { joined: { $gte: new Date( '2025-01-01T00:00:00Z' ) } } ) === true
jsongin.Query( doc, { joined: { $lt: new Date( '2025-01-01T00:00:00Z' ) } } ) === false
jsongin.Query( doc, { joined: { $eq: new Date( '2026-01-15T00:00:00Z' ) } } ) === true
```

A date is never equal to the string or number that represents it. The same date as
an ISO string does not match:

```js
jsongin.Query( doc, { joined: { $eq: '2026-01-15' } } ) === false
```


## Coerce a Value with `AsNumber`, `AsDate`, `AsBoolean`

[`AsNumber( Value )`](../jsongin/AsNumber.md) parses a number, returning `null`
when it cannot:

```js
jsongin.AsNumber( '42' ) === 42
jsongin.AsNumber( 'x' ) === null
```

[`AsDate( Value )`](../jsongin/AsDate.md) parses a date:

```js
jsongin.ShortType( jsongin.AsDate( '2026-01-01' ) ) === 'd'
jsongin.AsDate( '2026-01-01' ).getTime() === new Date( '2026-01-01' ).getTime()
```

[`AsBoolean( Value )`](../jsongin/AsBoolean.md) coerces to a boolean:

```js
jsongin.AsBoolean( 1 ) === true
jsongin.AsBoolean( 0 ) === false
jsongin.AsBoolean( 'true' ) === true
```


## Compare Two Values


### `LooseEquals` and `StrictEquals`

[`LooseEquals( A, B )`](../jsongin/LooseEquals.md) compares by content, so a number
and its string form are equal. [`StrictEquals( A, B )`](../jsongin/StrictEquals.md)
also requires the types to match:

```js
jsongin.LooseEquals( { a: 1 }, { a: 1 } ) === true
jsongin.LooseEquals( 1, '1' ) === true
jsongin.StrictEquals( 1, 1 ) === true
jsongin.StrictEquals( 1, '1' ) === false
```


### `CompareValues`

[`CompareValues( A, B )`](../jsongin/CompareValues.md) returns MongoDB's value
ordering: `-1` when `A` sorts before `B`, `0` when equal, `1` after. This is the
ordering [`Sort()`](../jsongin/Sort.md) uses:

```js
jsongin.CompareValues( 1, 2 ) === -1
jsongin.CompareValues( 2, 1 ) === 1
jsongin.CompareValues( 1, 1 ) === 0
```


## Ask Whether a Value Is a Query with `IsQuery`

[`IsQuery( Value )`](../jsongin/IsQuery.md) returns `true` when the value is an
object with at least one `$`-prefixed key — the shape a query operator takes:

```js
jsongin.IsQuery( { $gt: 1 } ) === true
jsongin.IsQuery( { a: 1 } ) === false
```


## See Also

- [`ShortType()`](../jsongin/ShortType.md), [`BsonType()`](../jsongin/BsonType.md)
- [`AsNumber()`](../jsongin/AsNumber.md), [`AsDate()`](../jsongin/AsDate.md),
  [`AsBoolean()`](../jsongin/AsBoolean.md)
- [`LooseEquals()`](../jsongin/LooseEquals.md),
  [`StrictEquals()`](../jsongin/StrictEquals.md),
  [`CompareValues()`](../jsongin/CompareValues.md)
- [`IsQuery()`](../jsongin/IsQuery.md)
- [Query Operators](../jsongin/Query-Operators.md) (`$type`)