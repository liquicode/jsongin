'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		// The implicit form { field: value }.
		//
		// This used to be a dispatch table over every pairing of the field's short type with
		// the match value's short type, each array pairing carrying its own hand rolled
		// traversal. That traversal handled one array level, so { 'a.b.c': 1 } did not match
		// { a: [ { b: [ { c: 1 } ] } ] }, which MongoDB matches.
		//
		// The pairings collapse now that $eq and $regex resolve a path to every value it can
		// mean. Equality already means "the field is this value, or is an array holding it",
		// at any depth, so there is nothing left here to decide except which operator the
		// match value calls for.
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				let match_type = jsongin.ShortType( MatchValue );

				// An object holding a query operator is a query to evaluate against the field,
				// not a value to compare it against. Query() routes only non-query values
				// here, so this is for callers which reach the operator directly.
				if ( ( match_type === 'o' ) && jsongin.IsQuery( MatchValue ) )
				{
					return jsongin.Query( Document, MatchValue, Path );
				}

				// A regexp is a pattern to test the field with, which is the one place the
				// implicit form differs from the explicit $eq: { field: /re/ } pattern matches
				// a string, while { field: { $eq: /re/ } } does not. That asymmetry is
				// MongoDB's own.
				// $regex matches a string against the pattern and a regexp field against the
				// same regexp, which is both of the things MongoDB matches here.
				if ( match_type === 'r' )
				{
					return jsongin.QueryOperators.$regex.Query( Document, MatchValue, Path, ExpandArrays );
				}

				// Everything else is ordinary equality.
				return jsongin.QueryOperators.$eq.Query( Document, MatchValue, Path, ExpandArrays );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$ImplicitEq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
