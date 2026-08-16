'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
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
				// An empty match array asks for nothing, and the loop selects nothing for it,
				// which is what MongoDB does.
				for ( let index = 0; index < MatchValue.length; index++ )
				{
					let match_element = MatchValue[ index ];

					// MongoDB refuses to nest a query operator inside $in, so a match value
					// which is a query is not run as one. Without this, $ImplicitEq would hand
					// it to Query() and { $in: [ { $gt: 5 } ] } would quietly behave as $gt.
					if ( ( jsongin.ShortType( match_element ) === 'o' ) && jsongin.IsQuery( match_element ) )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `$in: a query operator cannot be nested inside $in at [${Path}].` ); }
						continue;
					}

					if ( jsongin.QueryOperators.$ImplicitEq.Query( Document, match_element, Path, ExpandArrays ) === true ) { return true; }
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
