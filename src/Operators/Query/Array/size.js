'use strict';
/*md

## Operators > Query > $size

Usage: `$size: count`

Matches an array field which has exactly `count` elements.

The field must actually be an array: a scalar never matches, not even `{ $size: 1 }`.
The count must be a non-negative integer; a fraction or a negative is refused.

The count is of the field's own elements, and an element which is itself an array is one
  element: `{ a: [ [ 1, 2 ] ] }` matches `{ a: { $size: 1 } }` and not `{ a: { $size: 2 } }`.
A path which crosses an array of documents asks each document's field in turn, so
  `{ 'a.x': { $size: 2 } }` matches `{ a: [ { x: [ 1, 2 ] } ] }`.

Note that this is the ***query*** `$size`, which selects documents. The ***expression*** `$size`
  returns the length instead.

*/

const LIB_QUERY_OPTIONS = require( '../../../QueryOptions' );

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'n',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', Options )
		{
			let options = LIB_QUERY_OPTIONS.Normalize( Options );
			try
			{
				// A count is a whole number of elements. Anything else cannot mean anything
				// and is refused, as MongoDB refuses it. This used to answer false for a
				// fraction or a negative, which a caller could not tell from an array of some
				// other size. Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'n' )
				{
					// A direct call answers false for a value of the wrong type, which is the
					// API's promise; through Query() the ValueTypes check has already refused it.
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires a number but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}
				if ( ( Number.isInteger( MatchValue ) === false ) || ( MatchValue < 0 ) )
				{
					throw new Error( `$size: requires a non-negative integer but found [${MatchValue}] at [${Path}].` );
				}

				// $size asks about an array, so only a candidate which is an array can satisfy
				// it. This is the operator the candidate list exists for.
				//
				// It used to ask GetValue for one value and measure that. A path crossing an
				// array gathered every element's value into an array, which was then measured
				// as though it were the field, giving a wrong answer in both directions:
				//
				//   { a: [ { x: 1 }, { x: 2 } ] }   gathered to [ 1, 2 ], length 2, so
				//                                   { 'a.x': { $size: 2 } } matched a document
				//                                   whose x is not an array at all
				//   { a: [ { x: [ 5, 6 ] } ] }      gathered to [ [ 5, 6 ] ], length 1, so the
				//                                   document whose x really is a two element
				//                                   array did not match
				//
				// Verified against MongoDB 6.0.1, which matches only the second.
				//
				// ***The leaf is never expanded***, whatever the caller asked. Expanding it
				// offered each element of the field as a candidate too, so { a: [ [ 1, 2 ] ] }
				// matched { $size: 2 } by its element as well as { $size: 1 } by itself.
				// MongoDB counts the field's own elements and nothing below them. $elemMatch
				// is the operator which asks about the elements, and it resolves the same way.
				// Found by the translator parity probe on 2026-09-12 and verified against
				// MongoDB 6.0.28.
				let candidates = jsongin.ResolveCandidates( Document, Path, false );
				let found_array = false;

				for ( let index = 0; index < candidates.length; index++ )
				{
					if ( jsongin.ShortType( candidates[ index ] ) !== 'a' ) { continue; }
					found_array = true;
					if ( candidates[ index ].length === MatchValue ) { return true; }
				}

				if ( found_array === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires an array but no value at [${Path}] is one.` ); }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$size: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
