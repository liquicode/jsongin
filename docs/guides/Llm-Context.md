# jsongin for a Language Model

Everything a model needs to write a **query criteria** or an **update document** for jsongin, in
one page, meant to be pasted into a prompt whole.

This is not the full reference. The [Operator Reference](/guides/Operator-Reference.md) covers
every operator, one at a time, for a person. This page covers only the operators which can be
used in a criteria or an update, briefly, and points out the mistakes models actually make. To
learn what `$reduce` does, read the reference. To write JSON, read this.

**It is one page on purpose.** Searching the documentation does not help here: the question is
about someone's *data*, the documentation is about *operators*, so the closest matching page is
usually the wrong one. Including the whole page costs a few thousand tokens and removes the
guessing.

**Every example uses one made-up collection**, a fleet of vehicles, which is nobody's real data.
The examples show the *shape* of each operator; they are not about these field names:

```
{ "Registration": "KX21ABC", "Model": "Transit", "Odometer": 84210, "Retired": false,
  "Depot": { "City": "Leeds", "Region": "North" },
  "Service": [ { "Part": "Brake Pad", "Hours": 3, "Cost": 120 } ],
  "Crew": [ "day-shift" ], "Budget": 4000, "Spent": 3820,
  "LastSeen": "2026-03-14T00:00:00.000Z" }
```

**Use the field names and values of the data you are actually shown**, never these.


## The two shapes, and the most common mistake

**A criteria is an object keyed by field name.** The field comes first, and the operator goes
*inside* it:

```
{ "Odometer": { "$gt": 100000 } }     correct
{ "$gt": 100000 }                     WRONG - refused, an operator cannot start a query
```

This is the most common mistake models make, and jsongin refuses it with the message
*Operator [$gt] cannot appear at the top level of a query.* Only `$and`, `$or`, `$nor`, `$expr`,
`$exprx`, `$noop`, `$comment`, `$sampleRate` and `$jsonSchema` can start a query.

**Equality needs no operator.** `{ "Retired": false }` is a complete query.

**Several fields mean AND.** `{ "Retired": false, "Odometer": { "$gt": 100000 } }` needs no
`$and`. Only use `$and` when the same field needs two conditions which cannot go in one object.

**A nested field is a dotted path.** `{ "Depot.City": "Leeds" }`. This also reaches into arrays
of objects: `{ "Service.Part": "Brake Pad" }` matches a vehicle whose service history includes a
brake pad.

**A criteria is never an array.** `[ { "a": 1 } ]` is not a query.

**An update is an object keyed by update operator**, with the fields inside:

```
{ "$set": { "Retired": true } }                   correct
{ "Retired": true }                                WRONG - refused, it has no operator
{ "$set": { "a": 1 }, "$unset": { "a": "" } }      WRONG - refused, two operators change "a"
```

**Sort is a separate object**, not part of the criteria: `{ "Odometer": -1 }` for descending,
`{ "Odometer": 1 }` for ascending.


## Use the field names and values which exist

Valid JSON does not protect against these two mistakes:

**Use the field names of the actual data**, not names made up from the question. A query on
`odometer` when the field is `Odometer` is valid and matches nothing.

**Use the values the data holds.** A region holding `"North"` does not match `"Northern"`, and a
status of `"open"` does not match `"Open"`. When you are shown a field's values, use one of them
exactly. When you are not, prefer a field you *were* shown values for, or use `$regex` with the
`i` option instead of guessing the capitalisation.

**Do not invent operator names.** Every operator you can use is listed below. `$leq`,
`$contains`, `$like` and `$between` do not exist. There is no "top N" operator for a criteria:
write that as a sort plus a limit.


## Query operators

### Comparison

| Operator | Usage | Meaning |
|---|---|---|
| `$eq` | `{ f: { $eq: v } }` | equals `v` |
| `$ne` | `{ f: { $ne: v } }` | does not equal `v`; a **missing** field matches |
| `$gt` | `{ f: { $gt: v } }` | greater than `v` |
| `$gte` | `{ f: { $gte: v } }` | greater than or equal to `v` |
| `$lt` | `{ f: { $lt: v } }` | less than `v` |
| `$lte` | `{ f: { $lte: v } }` | less than or equal to `v` |
| `$in` | `{ f: { $in: [ v, ... ] } }` | equals **any** listed value |
| `$nin` | `{ f: { $nin: [ v, ... ] } }` | equals **none** of the listed values |

**Types must match.** A field only matches a value of the same type, so `{ n: { $gt: 1 } }` never
matches the string `"5"`. Write numbers as numbers.

**For an array field, one matching element is enough.** `{ "Crew": { "$eq": "day-shift" } }`
matches a vehicle whose `Crew` is `[ "day-shift", "night-shift" ]`.

`{ $gt: null }` matches nothing. Only `$gte` and `$lte` match a null or missing field.
`{ f: { $in: [ null ] } }` means "missing or null".

**The query `$in` takes the array as its value.** The *expression* `$in`, used inside `$expr`, is
the other way round: `[ value, array ]`.

Two regions is one `$in`, not two conditions:

```
{ "Depot.Region": { "$in": [ "North", "Wales" ] } }
```

### Logical

| Operator | Usage | Meaning |
|---|---|---|
| `$and` | `{ $and: [ query, ... ] }` | every query matches |
| `$or` | `{ $or: [ query, ... ] }` | at least one query matches |
| `$nor` | `{ $nor: [ query, ... ] }` | no query matches |
| `$not` | `{ f: { $not: { $op: v } } }` | the field does **not** meet the condition |

`$and`, `$or` and `$nor` can start a query. **`$not` cannot**: it goes under a field. To negate a
whole query, use `$nor`. An **empty list is refused** for `$and`, `$or` and `$nor`, so never write
`{ "$and": [] }`.

A missing field matches `$not`, because a field which is not there cannot meet the condition.

### Element and evaluation

| Operator | Usage | Meaning |
|---|---|---|
| `$exists` | `{ f: { $exists: true } }` | the field is present, whatever its value |
| `$type` | `{ f: { $type: "string" } }` | the field has a BSON type, or one of a list of types |
| `$regex` | `{ f: { $regex: "^A", $options: "i" } }` | a **string** field matches the pattern |
| `$mod` | `{ f: { $mod: [ divisor, remainder ] } }` | the field divided by `divisor` leaves `remainder` |
| `$expr` | `{ $expr: expression }` | compare one field to another; see below |
| `$jsonSchema` | `{ $jsonSchema: schema }` | the document matches a JSON Schema, as MongoDB reads one |

**`$exists` is about presence, not emptiness.** Vehicles with no recorded sighting:

```
{ "LastSeen": { "$exists": false } }
```

A field holding `null` **does** exist, and so does a field holding an empty array. To ask whether
an array is empty, use `$size`, below. The `$exists` value is read as true or false.

`$regex` only matches strings; a number never matches its printed form. `$options` holds the
flags, such as `i`, and goes beside `$regex` in the same object.

**The query `$mod` takes a divisor and the remainder to look for.** The expression `$mod` of the
same name returns a remainder instead.

### Arrays

| Operator | Usage | Meaning |
|---|---|---|
| `$all` | `{ f: { $all: [ v, ... ] } }` | contains **every** listed value |
| `$size` | `{ f: { $size: n } }` | is an array with exactly `n` elements |
| `$elemMatch` | `{ f: { $elemMatch: { criteria } } }` | has **one element** meeting all the criteria at once |

`$all` is like `$in`, but every value must be there instead of any one. An empty list matches
nothing.

**Use `$size` to ask whether an array is empty.** A vehicle with nobody assigned:

```
{ "Crew": { "$size": 0 } }              correct
{ "Crew": { "$exists": false } }        WRONG - an empty array exists, so this only finds
                                        vehicles with no Crew field at all
```

`$size` needs a real array: a single value never matches, not even `{ $size: 1 }`. The count must
be a whole number, 0 or more.

**Use `$elemMatch` when one element must meet several conditions together.** A dotted path asks
a different question:

```
{ "Service": { "$elemMatch": { "Hours": { "$gt": 2 }, "Cost": { "$lt": 100 } } } }
        one service item took over 2 hours AND cost under 100

{ "Service.Hours": { "$gt": 2 }, "Service.Cost": { "$lt": 100 } }
        WRONG for that question - a long job and a different cheap job also match
```

For one condition, you do not need it: a dotted path is simpler and does the same thing,
`{ "Service.Part": "Brake Pad" }`.

`{ v: [ 1, 9 ] }` does *not* match `{ $elemMatch: { $gt: 2, $lt: 5 } }`, because no single
element is both.

### Bitwise

`$bitsAllSet`, `$bitsAllClear`, `$bitsAnySet` and `$bitsAnyClear`, each written as
`{ f: { $bitsAllSet: bitmask } }`, or with an array of bit positions counted from the lowest bit.
A field which is not a whole number has no bits and does not match. A question about business
data rarely needs these.

### Miscellaneous and jsongin extensions

| Operator | Usage | Meaning |
|---|---|---|
| `$comment` | `{ $comment: "text" }` | adds a note; changes nothing |
| `$sampleRate` | `{ $sampleRate: 0.1 }` | a random share, from 0 to 1; **different each time** |
| `$noop` | `{ $noop: anything }` | matches everything; switches off a condition by renaming its key |
| `$eqx` | `{ f: { $eqx: v } }` | **loose** equality, like `==`: `1` equals `"1"` |
| `$nex` | `{ f: { $nex: v } }` | the opposite of `$eqx` |
| `$exprx` | `{ f: { $exprx: expr } }` | like `$expr`, but can go **under a field** |

`$eqx`, `$nex`, `$exprx` and `$noop` are jsongin extensions; MongoDB does not have them. `$eqx`
and `$nex` go under a field and cannot start a query.

`$ImplicitEq` is internal. It is what `{ field: value }` means, and is never written by hand.


## Comparing one field to another: `$expr`

The comparison operators compare a field to a *fixed value*. To compare a field to **another
field**, use `$expr`, and write field names inside it with a `$` in front:

```
{ "$expr": { "$gt": [ "$Spent", "$Budget" ] } }
        vehicles which have overspent
```

With arithmetic on one side, for vehicles which have used more than 90% of their budget:

```
{ "$expr": { "$gt": [ "$Spent", { "$multiply": [ "$Budget", 0.9 ] } ] } }
```

**`$expr` can only start a query**, or go inside a top-level `$and`, `$or` or `$nor`. To use an
expression under a field, use the jsongin extension `$exprx`.

**Inside `$expr`, the operators are expression operators, and most take a list.** A comparison
takes exactly two operands: `{ "$gt": [ a, b ] }`, never `{ "$gt": a }`. The most useful ones:

| Expression | Meaning |
|---|---|
| `{ $eq: [ a, b ] }`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte` | comparison, which works **across** types by BSON order |
| `{ $add: [ a, b ] }`, `$subtract`, `$multiply`, `$divide`, `$mod` | arithmetic |
| `{ $and: [ a, b ] }`, `$or`, `$not` | true and false |
| `{ $concat: [ a, b ] }`, `$toLower`, `$toUpper`, `$substr` | strings |
| `{ $size: "$arr" }` | array length; this one **returns** a length, unlike the query `$size` |
| `{ $in: [ value, "$arr" ] }` | membership; the value **first**, the array second |
| `{ $cond: [ test, then, else ] }` | choose between two values |
| `{ $year: "$d" }`, `$month`, `$dayOfMonth`, `$hour` | parts of a date |

Do not use `$expr` when a plain criteria will do. It is slower and easier to get wrong.


## Update operators

An update document is keyed by operator. **No two operators can change the same field**, so
`{ "$set": { "a": 1 }, "$unset": { "a": "" } }` is refused.

### Setting and removing

| Operator | Usage | Meaning |
|---|---|---|
| `$set` | `{ $set: { f: v, ... } }` | sets the value, creating the field if needed |
| `$unset` | `{ $unset: { f: "" } }` | removes the field; the value is ignored |
| `$rename` | `{ $rename: { f: "new" } }` | moves a field to a new name |
| `$currentDate` | `{ $currentDate: { f: true } }` | sets the field to the current date and time |

```
{ "$set": { "Retired": true } }
{ "$unset": { "LastSeen": "" } }
```

`$currentDate` takes `true` or `{ $type: "date" }` for a `Date`, or `{ $type: "timestamp" }` for
a number of milliseconds. A string or number is refused.

`$rename` on a field which is not there does nothing, and is not an error.

### Arithmetic

| Operator | Usage | Meaning |
|---|---|---|
| `$inc` | `{ $inc: { f: 5 } }` | adds a number; a **missing** field starts at zero |
| `$mul` | `{ $mul: { f: 2 } }` | multiplies; a **missing** field becomes `0` |
| `$min` | `{ $min: { f: v } }` | lowers the field to `v`, only if `v` is smaller |
| `$max` | `{ $max: { f: v } }` | raises the field to `v`, only if `v` is larger |
| `$bit` | `{ $bit: { f: { and: 6 } } }` | bitwise `and`, `or` or `xor` on a whole number |

**To change a number by an amount, use `$inc`, not `$set`.** Adding 500 to the odometer:

```
{ "$inc": { "Odometer": 500 } }         correct
{ "$set": { "Odometer": 500 } }         WRONG - stores 500, losing the old reading
```

To subtract, use `$inc` with a negative number; there is no `$dec`. `$inc` and `$mul` refuse a
field holding a string, a boolean, a date or a null, and **a refused update does not change the
document at all**.

`$min` and `$max` compare by BSON order, so strings and dates work too.

### Arrays

| Operator | Usage | Meaning |
|---|---|---|
| `$push` | `{ $push: { f: v } }` | adds one element to the end |
| `$addToSet` | `{ $addToSet: { f: v } }` | adds it only if it is not already there |
| `$pop` | `{ $pop: { f: 1 } }` | removes the **last** element; `-1` removes the first |
| `$pull` | `{ $pull: { f: condition } }` | removes every element which matches a **query** |
| `$pullAll` | `{ $pullAll: { f: [ v, ... ] } }` | removes every element **equal to** a listed value |

**To take a value out of an array, use `$pull`.** Removing a crew tag:

```
{ "$pull": { "Crew": "night-shift" } }        correct
{ "$unset": { "Crew": "night-shift" } }       WRONG - $unset removes the whole field
{ "$set": { "Crew": [] } }                    WRONG - empties the whole array
```

**`$push` and `$addToSet` take the value directly.** `{ "$addToSet": { "Crew": "relief" } }` adds
the string. To add several values at once, and only then, use `$each`:
`{ "$addToSet": { "Crew": { "$each": [ "relief", "night-shift" ] } } }`. `$push` also accepts
`$position`, `$sort` and `$slice` beside `$each`.

**`$pull` takes a condition, and `$pullAll` takes values.** `{ $pull: { a: { $gt: 3 } } }` removes
every element over 3; `{ $pullAll: { a: [ 3 ] } }` removes the threes.

`$pop` takes exactly `1` or `-1`. An empty array is left alone. A field which exists but is not
an array is refused.

There is no `$dec`, no `$append`, and no `$remove`.


## Worked examples

All use the made-up fleet collection. **Read them for their shape, not their field names.**

Vehicles still in service with more than 100000 on the clock:

```
{ "Retired": false, "Odometer": { "$gt": 100000 } }
```

Vehicles at either of two depots:

```
{ "Depot.Region": { "$in": [ "North", "Wales" ] } }
```

Vehicles with no recorded sighting:

```
{ "LastSeen": { "$exists": false } }
```

Vehicles with nobody assigned, meaning an empty array, which is not the same as a missing field:

```
{ "Crew": { "$size": 0 } }
```

Vehicles whose service history includes a brake pad:

```
{ "Service.Part": "Brake Pad" }
```

Vehicles with one service item which both took over 2 hours and cost under 100:

```
{ "Service": { "$elemMatch": { "Hours": { "$gt": 2 }, "Cost": { "$lt": 100 } } } }
```

Vehicles which have spent more than 90% of their budget, comparing one field to another:

```
{ "$expr": { "$gt": [ "$Spent", { "$multiply": [ "$Budget", 0.9 ] } ] } }
```

The three vehicles with the highest mileage, which is a **sort** and a **limit**, not an operator:

```
criteria { }
sort     { "Odometer": -1 }
limit    3
```

Retire everything past 200000:

```
criteria { "Odometer": { "$gt": 200000 } }
update   { "$set": { "Retired": true } }
```

Add 500 to the odometer of every vehicle at one depot:

```
criteria { "Depot.City": "Leeds" }
update   { "$inc": { "Odometer": 500 } }
```

Take a crew tag off the vehicles which have it:

```
criteria { "Crew": "night-shift" }
update   { "$pull": { "Crew": "night-shift" } }
```

Add a tag without duplicating it, and count the change:

```
update   { "$addToSet": { "Crew": "relief" }, "$inc": { "Inspections": 1 } }
```
