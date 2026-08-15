'use strict';

/*
	Shared implementation for the range comparison query operators.
	This is a helper module, not an operator.

	$gt, $gte, $lt, and $lte differ only in which comparison satisfies them and in whether
	an equal value counts, so they share one implementation rather than being maintained as
	four mirrors of each other.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Answers whether any value the path can mean satisfies Test.
	//
	// Test is called with ( ActualValue, MatchValue ) and only for values of the same type
	// as the match value.
	//
	// EqualCounts is true for the inclusive operators, $gte and $lte, which are satisfied by
	// a null or missing field when the match value is null. It is false for $gt and $lt,
	// which are not. That is the same split their ValueTypes already declare: 'bnsdlu' for
	// the inclusive pair and 'bnsd' for the strict one.
	//
	// MongoDB brackets these operators by type: { $gt: 1 } never matches the string 'hello',
	// however the BSON ordering ranks the two. Verified against MongoDB 6.0.1. The same type
	// test below is what enforces that, and ShortType already treats every number as 'n'.
	helper.Query = function ( Document, MatchValue, Path, OperatorName, Test, EqualCounts )
	{
		// A path which crosses an array means "does any element satisfy this", which is what
		// MongoDB does. ResolveCandidates returns every value the path can mean: the value
		// itself, and for an array the array and each of its elements.
		//
		// This used to ask GetValue for one value, which gathered every element's value into
		// a single array, and then scanned that array with the raw comparison operators. A
		// field which genuinely held an array was gathered into an array of arrays, and
		// comparing an array against a number coerces to NaN, so it never matched.
		let candidates = jsongin.ResolveCandidates( Document, Path );

		// A path which resolves to nothing is still compared, so that a missing field can
		// satisfy { $gte: null } the way MongoDB does.
		if ( candidates.length === 0 ) { candidates = [ undefined ]; }

		let match_type = jsongin.ShortType( MatchValue );
		let found_comparable = false;

		for ( let index = 0; index < candidates.length; index++ )
		{
			let actual_value = candidates[ index ];
			let actual_type = jsongin.ShortType( actual_value );

			if ( 'bnsd'.includes( match_type ) && ( match_type === actual_type ) )
			{
				found_comparable = true;
				if ( Test( actual_value, MatchValue ) === true ) { return true; }
				continue;
			}

			if ( ( EqualCounts === true ) && 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) )
			{
				// null and undefined are always equivalent, so an inclusive comparison is
				// already satisfied.
				return true;
			}
		}

		if ( found_comparable === false )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `${OperatorName}: no value at [${Path}] is comparable with the [${match_type}] type match value.` ); }
		}
		return false;
	};


	//---------------------------------------------------------------------
	return helper;
};
