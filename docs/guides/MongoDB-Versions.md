# @liquicode/jsongin


# MongoDB Versions

jsongin answers the way MongoDB answers. This page says ***which*** MongoDB, where the server
versions disagree with each other, and the few places jsongin does not follow the one it is
measured against.

You only need this page if you are writing something unusual. Everything in the operator guides
works the same on every server version.


## The version jsongin is measured against

***MongoDB 7.0.*** Every parity test is run against a live 7.0 server before it is trusted, and
the test run refuses to start against any other version, so the claim cannot quietly go stale.

7.0 does not change. It is a released version, so the behavior described here is fixed rather
than a moving target.


## What moved between server versions

MongoDB changed its mind about eight behaviors between 6.0 and 8.3. The table says what each
version does, and what jsongin does.

`accepts` means the server performs the operation. `refuses` means it reports an error.

| Behavior | 6.0 | 7.0 | 8.3 | jsongin |
|---|---|---|---|---|
| `$toString` on an array or a document | refuses | refuses | accepts | ***accepts*** |
| `$getField` with a computed field name | refuses | refuses | accepts | ***accepts*** |
| `$firstN` with a fractional `n` | refuses | refuses | partly | refuses |
| `$top` with an empty `sortBy` | accepts | accepts | refuses | accepts |
| `$sample` with a size of 0 | accepts | accepts | refuses | accepts |
| `$fill` with a `sortBy` direction other than 1 or -1 | accepts | accepts | refuses | accepts |
| `$median` and `$percentile` | refuses | accepts | accepts | accepts |
| `$fill` with `partitionBy` given a field path | refuses | accepts | accepts | accepts |

jsongin follows 7.0 down the whole table except for the first two rows, which are explained
below.

Note that the movement runs in both directions. 8.3 accepts three things 7.0 refuses and refuses
three things 7.0 accepts, so a newer server is not simply a stricter one.


## Two things jsongin does that a 7.0 server will not

These two are worth knowing before you use them: ***your database will refuse them***. They work
inside jsongin, and if the same expression is sent to a MongoDB 7.0 server it reports an error.

Use them freely where jsongin is doing the work. Think twice where the same expression may later
be handed to a server.

### `$toString` on an array or a document

jsongin renders it as JSON.

```js
jsongin.Evaluate( { a: [ 1, 2 ] }, { $toString: '$a' } );
// returns '[1,2]'

jsongin.Evaluate( { o: { p: 1, q: 2 } }, { $toString: '$o' } );
// returns '{"p":1,"q":2}'
```

A date inside the container becomes its ISO string, an empty array becomes `[]`, and a field name
which contains a dot is kept exactly as written.

MongoDB 6.0 and 7.0 both refuse this. MongoDB 8.3 performs it, and renders it the same way.

### `$getField` with a computed field name

The name may come from a field, or from any expression which produces a string.

```js
let record = { user: { role: 'admin' }, which: 'role' };

jsongin.Evaluate( record, { $getField: { field: '$which', input: '$user' } } );
// returns 'admin'
```

A name which is not a string is refused, on every version and in jsongin.

***This is `$getField` alone.*** `$setField` and `$unsetField` require a name written out as a
constant, on 8.3 as much as on 7.0, and jsongin requires one too.


## One thing jsongin gets right that MongoDB does not

`$percentile` at `p` 1.0 should answer the largest value. When every value is negative, or the
largest is zero, MongoDB answers `2.2250738585072014e-308` instead - the smallest positive number
a double can hold. MongoDB 7.0 and 8.3 both do this.

jsongin answers the largest value.

```js
let readings = [ { v: -30 }, { v: -20 }, { v: -10 } ];
let highest = jsongin.Aggregate( readings, [
	{ $group: { _id: null, r: { $percentile: { input: '$v', p: [ 1 ], method: 'approximate' } } } },
] );

highest[ 0 ].r[ 0 ] === -10
```

Where the largest value is positive, MongoDB is correct and the two agree. `$median` is never
affected, because it reads the middle rather than the end.


## `$graphLookup` does not promise an order

`$graphLookup` fills an array with the documents it reached. ***Nothing promises what order they
arrive in***, and in practice every version gives a different one. The same three document chain:

| | order |
|---|---|
| jsongin | `a, b, c` |
| MongoDB 6.0 | `a, b, c` |
| MongoDB 7.0 | `b, c, a` |
| MongoDB 8.3 | `b, a, c` |

The documents are the same and each carries the same depth. Only the order differs.

***Sort the array if the order matters to you.*** Code which depends on the order it happens to
get will behave differently against a different server, before jsongin enters into it.

`$lookup` and `$unionWith` do not have this problem. Both answer identically on 6.0, 7.0 and 8.3.


## One thing 8.3 accepts and jsongin does not

MongoDB 8.3 accepts a fractional `n` in `$firstN`, but only sometimes:

| `n` | `$firstN` `$lastN` `$topN` `$bottomN` | `$minN` `$maxN` |
|---|---|---|
| 1.5 | accepts, takes 1 | refuses |
| 2.5 | refuses | refuses |

A fraction between 1 and 2 is accepted by four of the six operators and refused by the other two;
any other fraction is refused by all six. This is not a rule anyone can rely on, so jsongin does
not follow it. ***A fractional `n` is refused***, which is what 6.0 and 7.0 do as well.
