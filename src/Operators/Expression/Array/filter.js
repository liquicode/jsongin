'use strict';
/*md

## Operators > Expression > $filter

Usage: `$filter: { input: array, as: name, cond: expression, limit: number }`

Answers the elements of an array which satisfy a condition, in the order they were in.

The element being tested is bound to `$$this`, or to the name given by `as`. As with
  [$map](#$map), `as` ***renames*** the binding rather than adding one, and a field path
  inside `cond` reads the document rather than the element.

***`cond` is read for its truthiness rather than for a boolean.*** Only `false`, `null`, `0`,
  and a missing value are false; every other value is true, including an empty string and an
  empty array.

```js
const large = { $filter: { input: '$scores', cond: { $gt: [ '$$this', 90 ] } } };
const young = { $filter: { input: '$people', as: 'person', cond: { $lt: [ '$$person.age', 25 ] } } };
```

***`limit` is a count of matches, not a count of elements examined.*** Filtering stops once
  that many elements have been kept. A limit larger than the number of matches simply gives
  every match, and a `null` limit means no limit at all.

`limit` is an expression, so it may be computed. It must evaluate to a whole number of one or
  more; a zero, a negative, or a fraction throws.

A null `input`, or one which is missing, answers `null`. An `input` which is present and is
  not an array throws. An empty array answers an empty array.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = array.ReadBindingArgs( Document, Args, '$filter',
					[ 'input', 'as', 'cond', 'limit' ], [ 'input', 'cond' ], Scope );
				if ( read.Values === null ) { return null; }

				// ***A null limit is no limit***, which is not the same as a limit of zero.
				// Zero is refused, because a filter which can keep nothing is a mistake rather
				// than a request. Verified against MongoDB 6.0.1.
				let limit = read.Values.length;
				if ( 'limit' in Args )
				{
					let requested = jsongin.Evaluate( Document, Args.limit, Scope );
					if ( 'lu'.includes( jsongin.ShortType( requested ) ) === false )
					{
						limit = array.AsWholeNumber( requested, '$filter', 'limit' );
						if ( limit < 1 )
						{
							throw new Error( `$filter: requires a limit of one or more but found ${limit} instead.` );
						}
					}
				}

				let results = [];
				for ( let index = 0; index < read.Values.length; index++ )
				{
					if ( results.length >= limit ) { break; }

					let bindings = {};
					bindings[ read.Name ] = read.Values[ index ];

					let condition = jsongin.Evaluate( Document, Args.cond, Scope.Child( bindings ) );
					if ( jsongin.AsBoolean( condition ) === false ) { continue; }

					results.push( read.Values[ index ] );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$filter: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
