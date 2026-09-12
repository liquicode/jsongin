'use strict';
/*md

## Operators > Query > $all

Usage: `$all: [ value, ... ]`

Matches a field which contains ***every*** one of the listed values.

Each value is delegated to `$eq`, so the values may be sub-documents, arrays, or dates, and
  they are compared by content.

`$all` is `$in` with an `AND` between the values rather than an `OR`.
An empty list matches nothing.

The list may instead hold `{ $elemMatch: criteria }` documents, one element having to satisfy
  each. The two forms do not mix, and no other operator expression may appear in the list.

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
					if ( jsongin.OpLog ) { jsongin.OpLog( `$all: match requires an array but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// $all is an AND of the given values, each tested as ordinary equality against
				// the field. MongoDB documents it that way, and it is why $all works against a
				// field which is not an array at all:
				//
				//   { 'qty.num': { $all: [ 50 ] } }   selects a document whose num is 50
				//
				// Equality already means "the field is this value, or is an array holding it",
				// which is what the candidate list expresses, so this operator does not need
				// to reason about arrays itself. Delegating to $eq is what makes
				// { a: [ { x: [ 5, 6 ] } ] } match { 'a.x': { $all: [ 5, 6 ] } }, which it did
				// not when this asked GetValue for one gathered value.
				// Verified against MongoDB 6.0.1.

				// An empty match array asks for nothing and MongoDB selects nothing for it.
				if ( MatchValue.length === 0 )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$all: an empty match array selects no documents at [${Path}].` ); }
					return false;
				}

				// $all takes values, or it takes $elemMatch criteria, and the two forms do not
				// mix: every entry is a { $elemMatch: ... } document or none is. No other
				// operator expression is allowed inside it at all. MongoDB refuses both; this
				// used to answer false for the mix and to evaluate the expression.
				// Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
				let elem_match_form = null;
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let entry = MatchValue[ index ];
					let is_elem_match = false;
					if ( jsongin.ShortType( entry ) === 'o' )
					{
						is_elem_match = ( Object.keys( entry )[ 0 ] === '$elemMatch' );
						if ( ( is_elem_match === false ) && jsongin.IsQuery( entry ) )
						{
							throw new Error( `$all: an operator expression cannot appear inside $all at [${Path}].` );
						}
					}
					if ( elem_match_form === null ) { elem_match_form = is_elem_match; }
					if ( elem_match_form !== is_elem_match )
					{
						throw new Error( `$all: $elemMatch and values cannot be mixed inside $all at [${Path}].` );
					}
				}

				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let result = false;
					if ( elem_match_form === true )
					{
						// Only the $elemMatch is read. MongoDB ignores any other key beside it.
						result = jsongin.Query( Document, { $elemMatch: MatchValue[ index ].$elemMatch }, Path );
					}
					else
					{
						result = jsongin.QueryOperators.$eq.Query( Document, MatchValue[ index ], Path, ExpandArrays );
					}
					if ( result === false ) { return false; }
				}
				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$all: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
