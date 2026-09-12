# jsongin for a Language Model

A single self-contained description of everything a model needs in order to write a **query
criteria** or an **update document** for jsongin, written to be pasted into a prompt whole.

This is a *derivation*, not a reference. The [Operator Reference](/guides/Operator-Reference.md)
documents all 228 operators for a human reading one at a time; this documents the 45 a caller
can put in a criteria or an update, densely, with the mistakes models actually make called out
where they happen. If you want to know what `$reduce` does, read the reference. If you are
generating JSON, read this.

**It is one file on purpose.** Retrieval over a documentation corpus cannot help here: the
question is about somebody's *data* and the corpus is about *operators*, so the nearest
matching page is still the wrong page. Handing over the whole vocabulary costs a few thousand
tokens and removes the guessing.

**Every example below uses one invented collection**, a fleet of vehicles, which is not
anybody's real data. The point of an example here is the *shape* of the operator, and a
document written around one consumer's field names teaches those names instead:

```
{ "Registration": "KX21ABC", "Model": "Transit", "Odometer": 84210, "Retired": false,
  "Depot": { "City": "Leeds", "Region": "North" },
  "Service": [ { "Part": "Brake Pad", "Hours": 3, "Cost": 120 } ],
  "Crew": [ "day-shift" ], "Budget": 4000, "Spent": 3820,
  "LastSeen": "2026-03-14T00:00:00.000Z" }
```

**Use the field names and values of the data you are actually shown**, never these.


## The two shapes, and the one mistake worth preventing

**A criteria is an object keyed by field name.** The field comes first and the operator goes
*inside* it:

```
{ "Odometer": { "$gt": 100000 } }     correct
{ "$gt": 100000 }                     WRONG - refused, an operator cannot open a query
```

That single error is the most common failure a model makes here, and jsongin refuses it by
name: *Operator [$gt] cannot appear at the top level of a query.* Only `$and`, `$or`, `$nor`,
`$expr`, `$exprx`, `$noop`, `$comment`, `$sampleRate` and `$jsonSchema` may open a query.

**Equality needs no operator.** `{ "Retired": false }` is the whole query.

**Several fields mean AND.** `{ "Retired": false, "Odometer": { "$gt": 100000 } }` needs no
`$and`; write `$and` only when the same field carries two conditions that cannot share one
object.

**A nested field is a dotted path.** `{ "Depot.City": "Leeds" }`. This reaches into arrays of
objects too: `{ "Service.Part": "Brake Pad" }` matches a vehicle whose service history includes
a brake pad.

**A criteria is never an array.** `[ { "a": 1 } ]` is not a query.

**An update is an object keyed by update operator**, with the fields inside:

```
{ "$set": { "Retired": true } }                   correct
{ "Retired": true }                                WRONG - no operator, changes nothing
{ "$set": { "a": 1 }, "$unset": { "a": "" } }      WRONG - two operators writing to "a"
```

**Sort is a separate object**, not part of the criteria: `{ "Odometer": -1 }` descending,
`{ "Odometer": 1 }` ascending.


## Use the field names and the values that exist

Two failures that valid JSON will not save you from:

**Use the field names of the actual data**, not names invented from the question. A query over
`odometer` when the field is `Odometer` is well-formed and matches nothing.

**Use the values the data holds.** A region column holding `"North"` is not matched by
`"Northern"`; a status of `"open"` is not matched by `"Open"`. When you are shown the values a
field holds, use one of them exactly. When you are not shown them, prefer a field you *were*
shown values for, or use `$regex` with the `i` option rather than guessing at capitalisation.

**Do not invent operator names.** Every operator is listed below. `$leq`, `$contains`, `$top`,
`$like` and `$between` do not exist. There is no "top N" operator: express that as a sort plus
a limit, not as a criteria.


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
| `$nin` | `{ f: { $nin: [ v, ... ] } }` | equals **none** of them |

**Comparison is bracketed by type.** A field only matches when it is the same type as the
value, so `{ n: { $gt: 1 } }` never matches a string `"5"`. Numbers must be written as numbers.

**Through an array, any element matching is enough.** `{ "Crew": { "$eq": "day-shift" } }`
matches a vehicle whose `Crew` is `[ "day-shift", "night-shift" ]`.

`{ $gt: null }` matches nothing. Only `$gte` and `$lte` are satisfied by a null or a missing
field. `{ f: { $in: [ null ] } }` is the idiom for "missing or null".

**`$in` here takes the array as its value**, which is the opposite of the *expression* `$in`
used inside `$expr` — that one takes `[ value, array ]`.

Two regions is one `$in`, not two clauses:

```
{ "Depot.Region": { "$in": [ "North", "Wales" ] } }
```

### Logical

| Operator | Usage | Meaning |
|---|---|---|
| `$and` | `{ $and: [ query, ... ] }` | every query matches |
| `$or` | `{ $or: [ query, ... ] }` | at least one matches |
| `$nor` | `{ $nor: [ query, ... ] }` | none match |
| `$not` | `{ f: { $not: { $op: v } } }` | the field does **not** satisfy the expression |

`$and`, `$or` and `$nor` may open a query. **`$not` may not** — it applies to a field, and
negating a whole query is `$nor`. An **empty list is refused** for all three; do not write
`{ "$and": [] }`.

A missing field satisfies `$not`, because a field that is not there cannot meet the condition.

### Element and evaluation

| Operator | Usage | Meaning |
|---|---|---|
| `$exists` | `{ f: { $exists: true } }` | the field is present, whatever its value |
| `$type` | `{ f: { $type: "string" } }` | the field is of a BSON type, or any of a list |
| `$regex` | `{ f: { $regex: "^A", $options: "i" } }` | a **string** field matches the pattern |
| `$mod` | `{ f: { $mod: [ divisor, remainder ] } }` | the field divided by `divisor` leaves `remainder` |
| `$expr` | `{ $expr: expression }` | compare one field to another; see below |
| `$jsonSchema` | `{ $jsonSchema: schema }` | the document satisfies a JSON Schema, read as MongoDB reads one |

**`$exists` is about presence, not emptiness.** Vehicles with no recorded sighting:

```
{ "LastSeen": { "$exists": false } }
```

A field holding `null` **does** exist, and so does a field holding an empty array — see `$size`
below, which is the operator for "the array is empty". The value is coerced to a boolean.

`$regex` only matches strings — a number is never matched by its printed form. `$options`
accepts `i`, `m`, `s` and `x`, and sits beside `$regex` in the same object.

**The query `$mod` takes a divisor and the remainder to look for**, unlike the expression `$mod`
of the same name, which returns a remainder.

### Arrays

| Operator | Usage | Meaning |
|---|---|---|
| `$all` | `{ f: { $all: [ v, ... ] } }` | contains **every** listed value |
| `$size` | `{ f: { $size: n } }` | is an array with exactly `n` elements |
| `$elemMatch` | `{ f: { $elemMatch: { criteria } } }` | has **one element** meeting all the criteria at once |

`$all` is `$in` with AND between the values instead of OR. An empty list matches nothing.

**`$size` is how you ask whether an array is empty.** A vehicle with nobody assigned:

```
{ "Crew": { "$size": 0 } }              correct
{ "Crew": { "$exists": false } }        WRONG - an empty array is present, so this finds
                                        only vehicles with no Crew field at all
```

`$size` needs an actual array; a scalar never matches, not even `{ $size: 1 }`, and the count
must be a non-negative integer.

**`$elemMatch` is for when one element must satisfy several conditions together**, and a dotted
path is not the same query:

```
{ "Service": { "$elemMatch": { "Hours": { "$gt": 2 }, "Cost": { "$lt": 100 } } } }
        one service item took over 2 hours AND cost under 100

{ "Service.Hours": { "$gt": 2 }, "Service.Cost": { "$lt": 100 } }
        WRONG for that question - a long job and a separate cheap job also match
```

For a single condition on one field you do not need it — a dotted path is simpler and does the
same job: `{ "Service.Part": "Brake Pad" }`.

`{ v: [ 1, 9 ] }` does *not* match `{ $elemMatch: { $gt: 2, $lt: 5 } }`, because no single
element is both.

### Bitwise

`$bitsAllSet`, `$bitsAllClear`, `$bitsAnySet`, `$bitsAnyClear`, each written as
`{ f: { $bitsAllSet: bitmask } }` or with an array of bit positions counted from the ones
place. A field that is not an integer has no bits and does not match. Rarely what a question
about business data is asking for.

### Miscellaneous and jsongin extensions

| Operator | Usage | Meaning |
|---|---|---|
| `$comment` | `{ $comment: "text" }` | annotates; narrows nothing |
| `$sampleRate` | `{ $sampleRate: 0.1 }` | a random fraction, 0 through 1; **not repeatable** |
| `$noop` | `{ $noop: anything }` | matches everything; disables a clause by renaming its key |
| `$eqx` | `{ f: { $eqx: v } }` | **loose** equality, as `==` compares: `1` equals `"1"` |
| `$nex` | `{ f: { $nex: v } }` | the negation of `$eqx` |
| `$exprx` | `{ f: { $exprx: expr } }` | like `$expr`, but may sit **inside a field** |

`$eqx`, `$nex`, `$exprx` and `$noop` are jsongin extensions; MongoDB has no operator of these
names. `$eqx` and `$nex` are field operators and cannot open a query.

`$ImplicitEq` is internal — it is what `{ field: value }` means — and is never written by hand.


## Comparing one field to another: `$expr`

The comparison operators compare a field to a *constant*. To compare a field to **another
field**, you need `$expr`, and inside it field names are written with a `$` prefix:

```
{ "$expr": { "$gt": [ "$Spent", "$Budget" ] } }
        vehicles which have overspent
```

With arithmetic on one side — vehicles which have used more than 90% of their budget:

```
{ "$expr": { "$gt": [ "$Spent", { "$multiply": [ "$Budget", 0.9 ] } ] } }
```

**`$expr` may only open a query**, or sit within a top-level `$and`, `$or` or `$nor`. To
evaluate against a sub-document instead, use the jsongin extension `$exprx`, which may appear
inside a field.

**Inside `$expr` the operators are expression operators, and they take arrays.** Every one of
them takes its operands as a list, so a comparison has exactly two: `{ "$gt": [ a, b ] }`, never
`{ "$gt": a }`. The most useful ones:

| Expression | Meaning |
|---|---|
| `{ $eq: [ a, b ] }`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte` | comparison, **across** types by BSON order |
| `{ $add: [ a, b ] }`, `$subtract`, `$multiply`, `$divide`, `$mod` | arithmetic |
| `{ $and: [ a, b ] }`, `$or`, `$not` | boolean |
| `{ $concat: [ a, b ] }`, `$toLower`, `$toUpper`, `$substr` | strings |
| `{ $size: "$arr" }` | array length — note this **returns** a length, unlike the query `$size` |
| `{ $in: [ value, "$arr" ] }` | membership — value **first**, array second |
| `{ $cond: [ test, then, else ] }` | a conditional |
| `{ $year: "$d" }`, `$month`, `$dayOfMonth`, `$hour` | date parts |

Do not reach for `$expr` when a plain criteria will do. It is slower and easier to get wrong.


## Update operators

An update document is keyed by operator. **No two operators may write to the same field** —
`{ "$set": { "a": 1 }, "$unset": { "a": "" } }` is refused as a conflict.

### Setting and removing

| Operator | Usage | Meaning |
|---|---|---|
| `$set` | `{ $set: { f: v, ... } }` | writes the value, creating the field |
| `$unset` | `{ $unset: { f: "" } }` | removes the field; the value is ignored |
| `$rename` | `{ $rename: { f: "new" } }` | moves a field to a new name |
| `$currentDate` | `{ $currentDate: { f: true } }` | sets the field to now |

```
{ "$set": { "Retired": true } }
{ "$unset": { "LastSeen": "" } }
```

`$currentDate` accepts `true` or `{ $type: "date" }` for a `Date`, or `{ $type: "timestamp" }`
for a number of milliseconds. A bare string or number is refused.

`$rename` on a field that is not there is a successful no-op.

### Arithmetic

| Operator | Usage | Meaning |
|---|---|---|
| `$inc` | `{ $inc: { f: 5 } }` | adds a number; a **missing** field starts at zero |
| `$mul` | `{ $mul: { f: 2 } }` | multiplies; a **missing** field becomes `0` |
| `$min` | `{ $min: { f: v } }` | lowers the field to `v` only if `v` is smaller |
| `$max` | `{ $max: { f: v } }` | raises the field to `v` only if `v` is larger |
| `$bit` | `{ $bit: { f: { and: 6 } } }` | bitwise `and`, `or` or `xor` on an integer |

**Changing a number by an amount is `$inc`, not `$set`.** Adding 500 to the odometer:

```
{ "$inc": { "Odometer": 500 } }         correct
{ "$set": { "Odometer": 500 } }         WRONG - stores 500, discarding the reading
```

Use `$inc` with a negative number to subtract; there is no `$dec`. `$inc` and `$mul` refuse a
field holding a string, a boolean, a date or a null rather than coercing it, and **a refused
update leaves the whole document untouched**.

`$min` and `$max` compare by BSON ordering, so strings and dates work too.

### Arrays

| Operator | Usage | Meaning |
|---|---|---|
| `$push` | `{ $push: { f: v } }` | appends one element |
| `$addToSet` | `{ $addToSet: { f: v } }` | appends only if not already present |
| `$pop` | `{ $pop: { f: 1 } }` | removes the **last** element; `-1` removes the first |
| `$pull` | `{ $pull: { f: condition } }` | removes every element a **query** selects |
| `$pullAll` | `{ $pullAll: { f: [ v, ... ] } }` | removes every element **equal to** a listed value |

**Taking a value out of an array is `$pull`.** Removing a crew tag:

```
{ "$pull": { "Crew": "night-shift" } }        correct
{ "$unset": { "Crew": "night-shift" } }       WRONG - $unset removes the whole field
{ "$set": { "Crew": [] } }                    WRONG - empties the array entirely
```

**`$push` and `$addToSet` take the value directly.** `{ "$addToSet": { "Crew": "relief" } }`
adds the string. To add several at once, and only then, use `$each`:
`{ "$addToSet": { "Crew": { "$each": [ "relief", "night-shift" ] } } }`. `$push` additionally
accepts `$position`, `$sort` and `$slice` alongside `$each`.

**`$pull` takes a condition and `$pullAll` takes values.** `{ $pull: { a: { $gt: 3 } } }`
removes every element over 3; `{ $pullAll: { a: [ 3 ] } }` removes the threes.

`$pop` takes exactly `1` or `-1`. An empty array is left alone; a field that is present and is
not an array is refused.

There is no `$dec`, no `$append`, and no `$remove`.


## Worked examples

All over one invented fleet collection. **Read them for shape, not for field names.**

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

Vehicles with nobody assigned — an empty array, which is not the same as an absent field:

```
{ "Crew": { "$size": 0 } }
```

Vehicles whose service history includes a brake pad:

```
{ "Service.Part": "Brake Pad" }
```

Vehicles with one service item that both took over 2 hours and cost under 100:

```
{ "Service": { "$elemMatch": { "Hours": { "$gt": 2 }, "Cost": { "$lt": 100 } } } }
```

Vehicles which have spent more than 90% of their budget — a field against another field:

```
{ "$expr": { "$gt": [ "$Spent", { "$multiply": [ "$Budget", 0.9 ] } ] } }
```

The three highest-mileage vehicles — a **sort** and a **limit**, not an operator:

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

Take a crew tag off the vehicles that have it:

```
criteria { "Crew": "night-shift" }
update   { "$pull": { "Crew": "night-shift" } }
```

Add a tag without duplicating it, and count the change:

```
update   { "$addToSet": { "Crew": "relief" }, "$inc": { "Inspections": 1 } }
```
