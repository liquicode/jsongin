'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returned by sort_key when a path produces no sort key candidates at all.
	// This happens when the field holds an empty array, or when the path crosses one.
	// Such a document sorts below every value, including null, and below documents which
	// are missing the field entirely. Verified against MongoDB 6.0.1.
	const NO_KEY = { NoSortKey: true };


	//---------------------------------------------------------------------
	// Collects the sort key candidates which Segments can produce within Node.
	//
	// MongoDB builds a sort key from a set of candidates rather than from a single value,
	// and the number of array levels it expands depends on the shape of the path, not on
	// the shape of the resolved value:
	//
	//		- An array crossed while walking the path applies the remaining path to each
	//		  of its elements.
	//		- An array found at the END of the path contributes each of its elements as a
	//		  candidate. Those elements are NOT expanded any further.
	//		- A path which cannot be followed contributes one candidate holding null.
	//
	// So 'a.x' within { a: [ { x: [ 0, 7 ] } ] } yields the candidates 0 and 7, two levels
	// deep, while 'v' within { v: [ [ 3, 4 ], [ 1, 2 ] ] } yields [ 3, 4 ] and [ 1, 2 ],
	// one level deep. GetValue() resolves both of those documents to an array holding two
	// arrays and cannot tell them apart, which is why sorting cannot use it.
	//
	// This is deliberately NOT ResolveCandidates(). That function offers an array whole as
	// well as by element, which is correct for matching a query and wrong for sorting: the
	// extra whole-array candidate wins a descending max and misplaces the document. It also
	// omits a missing field where sorting needs a null.
	function collect_candidates( Node, Segments, Candidates )
	{
		let st_node = jsongin.ShortType( Node );

		// The end of the path.
		if ( Segments.length === 0 )
		{
			if ( st_node === 'a' )
			{
				for ( let index = 0; index < Node.length; index++ )
				{
					Candidates.push( Node[ index ] );
				}
				return;
			}
			if ( Node === undefined ) { Candidates.push( null ); return; }
			Candidates.push( Node );
			return;
		}

		// An array within the path.
		if ( st_node === 'a' )
		{
			let key = Segments[ 0 ];
			if ( jsongin.ShortType( key ) === 'n' )
			{
				// An explicit index selects a single element, as GetValue() does.
				if ( key < 0 ) { key = Node.length + key; }
				if ( key < 0 ) { Candidates.push( null ); return; }
				if ( key >= Node.length ) { Candidates.push( null ); return; }
				collect_candidates( Node[ key ], Segments.slice( 1 ), Candidates );
				return;
			}
			// An empty array offers no element to descend into, so the path cannot be
			// followed and contributes null. Note that this is NOT the same as an empty
			// array found at the end of the path, which contributes nothing at all.
			// Verified against MongoDB 6.0.1: sorting { a: [] } by 'a.x' places it with
			// the nulls, while { a: [ { x: [] } ] } sorts below them.
			if ( Node.length === 0 ) { Candidates.push( null ); return; }

			// The implicit iterator. Every element continues down the same path.
			for ( let index = 0; index < Node.length; index++ )
			{
				collect_candidates( Node[ index ], Segments, Candidates );
			}
			return;
		}

		// An object within the path.
		if ( st_node === 'o' )
		{
			collect_candidates( Node[ Segments[ 0 ] ], Segments.slice( 1 ), Candidates );
			return;
		}

		// The path cannot be followed any further.
		Candidates.push( null );
	};


	//---------------------------------------------------------------------
	// Builds the single sort key which Document offers for Path.
	// The smallest candidate is used when ascending and the largest when descending.
	// Candidates are compared by plain value order. An empty array which is selected as
	// the key is an ordinary value carrying the array type rank, so it wins a descending
	// max and sorts above every number. Only the absence of candidates is special.
	function sort_key( Document, Path, Ascending )
	{
		let candidates = [];
		collect_candidates( Document, jsongin.SplitPath( Path ), candidates );
		if ( candidates.length === 0 ) { return NO_KEY; }

		let selected = candidates[ 0 ];
		for ( let index = 1; index < candidates.length; index++ )
		{
			let result = jsongin.CompareValues( candidates[ index ], selected );
			if ( Ascending === true )
			{
				if ( result < 0 ) { selected = candidates[ index ]; }
			}
			else
			{
				if ( result > 0 ) { selected = candidates[ index ]; }
			}
		}
		return selected;
	};


	//---------------------------------------------------------------------
	// Compares two sort keys.
	// A document which offered no candidates sorts below every other document.
	// Everything else is compared as an ordinary value.
	function compare_sort_keys( KeyA, KeyB )
	{
		let none_a = ( KeyA === NO_KEY );
		let none_b = ( KeyB === NO_KEY );
		if ( none_a && none_b ) { return 0; }
		if ( none_a ) { return -1; }
		if ( none_b ) { return 1; }
		return jsongin.CompareValues( KeyA, KeyB );
	};


	//---------------------------------------------------------------------
	function Sort( Documents, SortCriteria )
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( SortCriteria ) !== 'o' ) { throw new Error( `SortCriteria must be an object.` ); }

			// Sorts the array in place.
			Documents.sort(
				function ( A, B )
				{
					for ( let key in SortCriteria )
					{
						let direction = SortCriteria[ key ];
						if ( direction === 0 ) { continue; }
						let ascending = ( direction > 0 );

						let key_a = sort_key( A, key, ascending );
						let key_b = sort_key( B, key, ascending );

						let result = compare_sort_keys( key_a, key_b );
						if ( result !== 0 )
						{
							if ( ascending ) { return result; }
							return -result;
						}
					}
					return 0;
				} );

			return Documents;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Sort: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Sort;
};
