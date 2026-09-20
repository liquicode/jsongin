# @liquicode/jsongin


# Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )


## Parameters

| **Parameter** | **Allowed Types** | **Description**                                                        |
|---------------|:-----------------:|-------------------------------------------------------------------------|
| Documents     |       a o         | The documents to join from. One document is taken as a set of one.      |
| JoinDocuments |       a o         | The documents to join with.                                             |
| JoinCriteria  |        o          | Which pairs go together. See below.                                     |
| JoinType      |        s          | Optional. `Left`, `Inner`, `Right` or `Outer`. Defaults to `Left`.      |
| JoinName      |        s          | Optional. The field the matches are written to. Absent, they are merged. |


## Description

Matches two sets of documents against each other and returns an array of joined documents.

***One document in, one document out.***
A document which matched three carries all three, so the answer is as long as `Documents` was
  rather than as long as the number of matches.
This is what MongoDB's [`$lookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
  stage does, and not what a SQL join does.

```js
let bookings = [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'C' } ];
let nights = [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' } ];

jsongin.Join( bookings, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Nights' );
// returns [ { Id: 1, Dome: 'A', Nights: [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' } ] }, { Id: 2, Dome: 'C', Nights: [] } ]
```

A document which matched nothing carries an empty array, so the shape of the answer does not
  depend on what happened to match.


## The Join Criteria

`JoinCriteria` is an ordinary [query criteria](./Query.md), matched against each document of
  `JoinDocuments`.
While it runs, the document being joined from is lent as `$$Left`, and the one being tested is
  lent as `$$Right`.

So `$Field` means a field of the join document, as it does in any criteria, and `$$Left.Field`
  reaches across to the other side:

```js
{ $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }
```

Anything a criteria can say, a join can say:

```js
let bookings = [ { Dome: 'A', Minimum: 2 } ];
let nights = [ { DomeId: 'A', Nights: 1 }, { DomeId: 'A', Nights: 5 } ];

jsongin.Join( bookings, nights, { $expr: { $and: [
	{ $eq: [ '$DomeId', '$$Left.Dome' ] },
	{ $gt: [ '$Nights', '$$Left.Minimum' ] },
] } }, 'Inner', 'Long' );
// returns [ { Dome: 'A', Minimum: 2, Long: [ { DomeId: 'A', Nights: 5 } ] } ]
```

A criteria which lends neither side is an ordinary filter on the join documents, and every
  document gets the same matches.
An empty criteria matches every pair.

***A criteria which cannot mean anything is refused before any of it runs***, even when there is
  nothing to match it against.
A join against an empty set would otherwise answer a set of unjoined documents and never notice
  the mistake.


## The Four Joins

| **JoinType** | **What is in the answer**                                                  |
|--------------|-----------------------------------------------------------------------------|
| `Left`       | Every `Documents` document, matched or not. The default.                    |
| `Inner`      | Only those which matched at least once.                                     |
| `Right`      | Those which matched, then every unmatched `JoinDocuments` document.         |
| `Outer`      | Every `Documents` document, then every unmatched `JoinDocuments` document.  |

The name is matched without regard to case.

***An unmatched join document comes back alone***: there is no document to attach it to, so it
  is a copy of itself with no `JoinName` field.

```js
let bookings = [ { Id: 1, Dome: 'A' } ];
let nights = [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'B', Night: 'fog' } ];
let on_dome = { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } };

jsongin.Join( bookings, nights, on_dome, 'Outer', 'Nights' );
// returns [ { Id: 1, Dome: 'A', Nights: [ { DomeId: 'A', Night: 'clear' } ] }, { DomeId: 'B', Night: 'fog' } ]
```

Documents come back in the order they were given, `Documents` first.


## Gathering Or Merging

With a `JoinName`, the matches are written there as an array.
The name can be a dot notation path, and what is already beside it is kept:

```js
let sites = [ { Dome: 'A', Site: { Name: 'North' } } ];
let nights = [ { DomeId: 'A', Night: 'clear' } ];

jsongin.Join( sites, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Site.Nights' );
// returns [ { Dome: 'A', Site: { Name: 'North', Nights: [ { DomeId: 'A', Night: 'clear' } ] } } ]
```

***Without a `JoinName`, each match is merged into the document***, one after another, with
  [`Merge()`](./Merge.md).
A field two matches share takes the last one's value, and a document which matched nothing is
  unchanged:

```js
let bookings = [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'C' } ];
let nights = [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' } ];

jsongin.Join( bookings, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } } );
// returns [ { Id: 1, Dome: 'A', DomeId: 'A', Night: 'rain' }, { Id: 2, Dome: 'C' } ]
```


## Notes

***The answer is new documents.***
Every part of it is a copy, so changing one changes neither input.
`Join` produces documents rather than selecting them, which is the rule
  [`Filter()`](./Filter.md) states for the whole library.

***Which document a join document is, is where it sits in the array.***
These documents carry no identifier of their own and need none, so two identical documents are
  two documents - exactly as they are two rows on a server, where an `_id` tells them apart.

```js
jsongin.Join( [ { Dome: 'A' } ], [ { DomeId: 'A' }, { DomeId: 'A' } ],
	{ $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Found' )[ 0 ].Found.length === 2
```

`Join` throws when either side is not an array of documents or a document, when `JoinCriteria`
  is not an object, when `JoinType` is not one of the four, or when `JoinName` is not a string.


## Why This Is Not `$lookup`

MongoDB reads its second set from a ***collection***, which is why `Aggregate()` has no
  `$lookup`: `jsongin` works on an array of documents and has no collection to name.
`Join` takes the documents themselves, so the question does not arise.

Everything else is `$lookup`'s: what the answer holds, one document out per document in, an
  empty array where nothing matched, and a correlated criteria which can see both sides.


## See Also

- [`Query( Document, Criteria )`](./Query.md), which matches each pair, and the options which
  lend a criteria its variables.
- [`Merge( DocumentA, DocumentB )`](./Merge.md), which merges a match when there is no `JoinName`.
- [`Filter( Documents, QueryCriteria )`](./Filter.md), which selects documents from one set.
- [Scope](./Scope.md)


## Examples

### It gathers every match under one name
```js
let bookings = [ { Id: 1, Dome: 'A' } ];
let nights = [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' }, { DomeId: 'B', Night: 'fog' } ];

jsongin.Join( bookings, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Nights' );
// returns [ { Id: 1, Dome: 'A', Nights: [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' } ] } ]
```

### An inner join drops what did not match
```js
let bookings = [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'C' } ];
let nights = [ { DomeId: 'A', Night: 'clear' } ];

jsongin.Join( bookings, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Inner', 'Nights' ).length === 1
```

### A filter on the join documents needs no variable
```js
let bookings = [ { Id: 1 }, { Id: 2 } ];
let nights = [ { Night: 'clear' }, { Night: 'fog' } ];

jsongin.Join( bookings, nights, { Night: 'fog' }, 'Left', 'Foggy' );
// returns [ { Id: 1, Foggy: [ { Night: 'fog' } ] }, { Id: 2, Foggy: [ { Night: 'fog' } ] } ]
```

### One document on either side
```js
jsongin.Join( { Dome: 'A' }, { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Found' );
// returns [ { Dome: 'A', Found: [ { DomeId: 'A' } ] } ]
```

### The inputs are never changed
```js
let bookings = [ { Id: 1, Dome: 'A' } ];
let nights = [ { DomeId: 'A', Night: 'clear' } ];

let joined = jsongin.Join( bookings, nights, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, 'Left', 'Nights' );
joined[ 0 ].Nights[ 0 ].Night = 'changed';

nights[ 0 ].Night === 'clear'
```
