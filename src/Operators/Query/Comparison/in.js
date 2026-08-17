'use strict';
/*md

## Operators > Query > $in

Usage: `$in: [ value, ... ]`

Matches a field which equals ***any*** of the listed values.

Each value is matched the way `$eq` matches one, so a sub-document, an array, a date, and a
  `null` all work, and the match reaches through an array field.

`{ f: { $in: [ null ] } }` is the idiom for "missing or null", and it matches a document which
  has no `f` at all.

A ***regexp*** in the list is a pattern to test with rather than a value to compare against,
  which is the opposite of what a regexp means to `$eq`. That asymmetry is MongoDB's.

Note that this is the ***query*** `$in`, which takes the array as its value. The ***expression***
  `$in` takes `[ value, array ]`, with the array second.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'a' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$in: expected an array but found a type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// $in is an OR of the given values, each tested the way the implicit form
				// { field: value } tests one. That is MongoDB's own definition of it, and it is
				// why a regexp in the list pattern matches while { field: { $eq: /re/ } } does
				// not: $ImplicitEq routes a regexp to $regex and everything else to $eq.
				//
				// This used to ask GetValue for one value and compare with array.includes(),
				// which is ===. That failed every case where equality is not identity:
				// a sub-document, an array, a date, a missing field against null, and any path
				// crossing an array. Equality already means "the field is this value, or is an
				// array holding it", which is what the candidate list expresses, so this
				// operator does not need to reason about arrays itself.
				// $all is the same operator with AND between the values.
				// Verified against MongoDB 6.0.1.
				//
				// $in takes values to compare against, not queries to run, and MongoDB refuses
				// a query operator nested inside it. Without a refusal, $ImplicitEq would hand
				// it to Query() and { $in: [ { $gt: 5 } ] } would quietly behave as $gt.
				//
				// ***Checked over the whole list before any of it is matched***, so that the
				// refusal does not depend on where the bad element sits: matching stops at the
				// first element which succeeds, so { $in: [ 9, { $gt: 5 } ] } against { a: 9 }
				// would otherwise return true without ever reaching the second element.
				// This used to write to the OpLog and skip the element.
				// Verified against MongoDB 6.0.1.
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let match_element = MatchValue[ index ];
					if ( ( jsongin.ShortType( match_element ) === 'o' ) && jsongin.IsQuery( match_element ) )
					{
						throw new Error( `$in: a query operator cannot be nested inside $in at [${Path}].` );
					}
				}

				// $in is an OR of the given values, each tested the way the implicit form
				// { field: value } tests one.
				//
				// An empty match array asks for nothing, and the loop selects nothing for it,
				// which is what MongoDB does.
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					if ( jsongin.QueryOperators.$ImplicitEq.Query( Document, MatchValue[ index ], Path, ExpandArrays ) === true ) { return true; }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$in: ${error.message}` ); }
				throw error;
			}

		},

	};

	// Return the operator.
	return operator;
};
