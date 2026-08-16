'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Array',
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

				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let result = false;
					let match_sub_type = jsongin.ShortType( MatchValue[ index ] );
					if ( match_sub_type === 'o' )
					{
						// An operator document, such as the { $elemMatch: { ... } } form.
						result = jsongin.Query( Document, MatchValue[ index ], Path );
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
