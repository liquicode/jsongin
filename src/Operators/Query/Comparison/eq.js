'use strict';
/*md

## Operators > Query > $eq

Usage: `$eq: value`

Matches a field which equals the value.

***Through an array***, the field matches when the whole array equals the value ***or*** when
  any one element does. `{ tags: { $eq: 'red' } }` matches `{ tags: [ 'red', 'blue' ] }`.

Values are compared by ***content*** and by ***type***, all the way down, so an object holding
  a date does not equal an object holding the equivalent string.

A regexp given here is a value to compare against rather than a pattern to test with:
  `{ f: { $eq: /re/ } }` matches only a field which is itself that regexp, while the implicit
  form `{ f: /re/ }` pattern matches. That asymmetry is MongoDB's.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Compares one candidate value against the match value.
	// This is a single value test: it does not look inside an array for a matching element,
	// because ResolveCandidates already offers each element as its own candidate.
	//
	// Structured values are compared with CompareValues, which is type aware all the way down.
	// They used to be compared by their JSON.stringify text, which discards the type before
	// comparing: a Date renders as its ISO string, so an object holding a date compared equal
	// to an object holding the equivalent string. undefined members, NaN, and Infinity collapse
	// the same way. Verified against MongoDB 6.0.1, which matches none of those.
	function equals_value( ActualValue, MatchValue, Path )
	{
		let actual_type = jsongin.ShortType( ActualValue );
		let match_type = jsongin.ShortType( MatchValue );

		if ( 'bnslu'.includes( match_type ) && ( match_type === actual_type ) )
		{
			// Primitive types must match exactly.
			return ( ActualValue === MatchValue );
		}
		else if ( match_type === 'r' )
		{
			// A regexp match value here is a value to compare against, not a pattern to test
			// with. { field: { $eq: /re/ } } matches only a field which is itself that regexp,
			// while the implicit form { field: /re/ } pattern matches.
			// That asymmetry is MongoDB's, verified against MongoDB 6.0.1, and the implicit
			// form is handled separately at ImplicitEq.js:132.
			if ( actual_type !== 'r' ) { return false; }
			// Two Regexp objects are never === to each other, the same trap dates have below,
			// so compare what actually identifies them.
			if ( ActualValue.source !== MatchValue.source ) { return false; }
			if ( ActualValue.flags !== MatchValue.flags ) { return false; }
			return true;
		}
		else if ( ( match_type === 'd' ) && ( actual_type === 'd' ) )
		{
			// Two Date objects are never === to each other, so compare their time values.
			return ( ActualValue.getTime() === MatchValue.getTime() );
		}
		else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) )
		{
			return true; // null and undefined are always equivalent.
		}
		else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) )
		{
			// Objects must match exactly, including the key order.
			return ( jsongin.CompareValues( MatchValue, ActualValue ) === 0 );
		}
		else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) )
		{
			// Arrays must match exactly, including the value order.
			// The match value also matching a single element of the field is handled by the
			// candidate list rather than here.
			return ( jsongin.CompareValues( MatchValue, ActualValue ) === 0 );
		}

		if ( jsongin.OpLog ) { jsongin.OpLog( `$eq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
		return false; // Unsupported type or equivalence.
	};


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		// ExpandArrays is passed through to ResolveCandidates. It is false only when
		// $elemMatch is testing one element, where the element is a value rather than an
		// array to look inside. See ResolveCandidates.
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// A path which crosses an array means "does any element satisfy this", which is
				// what MongoDB does. ResolveCandidates returns every value the path can mean:
				// the value itself, and for an array the array and each of its elements.
				//
				// This used to ask GetValue for one value, which gathered every element's value
				// into a single array. That gathered array was indistinguishable from a field
				// which genuinely held an array, so { 'a.x': { $eq: 1 } } compared [ 1, 2 ]
				// against 1 and found nothing, while the implicit form matched.
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );

				// A path which resolves to nothing is still compared, so that { a: null }
				// matches a document which has no 'a'. MongoDB matches null against a missing
				// field.
				if ( candidates.length === 0 ) { candidates = [ undefined ]; }

				for ( let index = 0; index < candidates.length; index++ )
				{
					if ( equals_value( candidates[ index ], MatchValue, Path ) === true ) { return true; }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$eq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
