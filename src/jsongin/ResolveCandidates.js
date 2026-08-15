'use strict';

/*
	Resolves a path to the list of values it can legitimately mean.

	This exists because GetValue() returns one value, and when a path crosses an array it
	returns the gathered values of every element as a single array. That gathered array is
	indistinguishable from a field which genuinely holds an array:

		{ a: [ { x: 1 }, { x: 2 } ] }   GetValue( doc, 'a.x' )  =>  [ 1, 2 ]   gathered
		{ a: [ { x: [ 5, 6 ] } ] }      GetValue( doc, 'a.x' )  =>  [ 5, 6 ]   a real array

	Every query operator downstream sees the same shape for both and cannot apply the right
	rule. $size is the clearest damage: it matches the first document, whose gathered list
	happens to hold two entries, and misses the second, whose field actually is a two element
	array.

	A candidate list keeps them distinct. The first document yields the candidates 1 and 2,
	neither an array. The second yields the one candidate [ 5, 6 ].

	The rules below were measured against MongoDB 6.0.1 rather than assumed. See
	.plans/2026-08-14/parity-explicit-operators-through-arrays.md for the sweep.

	NOT YET USED. This lands ahead of the operators which will use it, so that the mechanism
	can be proven on its own before any operator changes behavior. It is deliberately not
	registered on the engine: it becomes public API, with a documentation page, when the
	operators move onto it.
*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns an array of the values which Path can mean within Document.
	// An empty array means the path resolves to nothing, which is how a missing field is
	// reported. This is not the same as a path which resolves to undefined, which yields one
	// candidate holding undefined.
	function ResolveCandidates( Document, Path )
	{
		try
		{
			// Validate Path, the same way GetValue does.
			// An empty path means the document itself.
			let empty_path = false;
			switch ( jsongin.ShortType( Path ) )
			{
				case 'u': empty_path = true; break;
				case 'l': empty_path = true; break;
				case 'n': break;
				case 's': break;
				default: throw new Error( `Path is invalid [${JSON.stringify( Path )}].` );
			}
			if ( ( empty_path === false ) && ( Path.length === 0 ) ) { empty_path = true; }

			let candidates = [];
			if ( empty_path )
			{
				// The document itself is the value. It still goes through the walker rather
				// than being returned directly, so that an array document offers its elements
				// the same way an array field does. An operator called with a bare value
				// rather than a path relies on this.
				resolve_node( Document, [], 0, candidates );
				return candidates;
			}

			let path_elements = jsongin.SplitPath( Path );
			resolve_node( Document, path_elements, 0, candidates );
			return candidates;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'ResolveCandidates: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	// Walks one path element and appends whatever it finds to Candidates.
	function resolve_node( Node, PathElements, Index, Candidates )
	{
		// The path is used up, so this node is what the path means.
		if ( Index >= PathElements.length )
		{
			Candidates.push( Node );

			// An array is also matched by each of its elements, which is how { tags: 'red' }
			// matches { tags: [ 'red', 'blue' ] } while { tags: [ 'red' ] } matches both
			// { tags: [ 'red' ] } as a whole and { tags: [ [ 'red' ] ] } by its element.
			// Exactly one level deep: an element which is itself an array is a candidate as
			// the array it is, and is not expanded again. Verified against MongoDB 6.0.1,
			// where { tags: 'red' } does not match { tags: [ [ 'red' ] ] }.
			if ( jsongin.ShortType( Node ) === 'a' )
			{
				for ( let index = 0; index < Node.length; index++ )
				{
					Candidates.push( Node[ index ] );
				}
			}
			return;
		}

		let key = PathElements[ Index ];
		let st_key = jsongin.ShortType( key );
		let st_node = jsongin.ShortType( Node );

		if ( st_node === 'a' )
		{
			if ( st_key === 'n' )
			{
				// A numeric key indexes the array, counting from the end when negative.
				let element_index = key;
				if ( element_index < 0 ) { element_index = Node.length + element_index; }
				if ( element_index < 0 ) { return; }
				if ( element_index >= Node.length ) { return; }
				resolve_node( Node[ element_index ], PathElements, Index + 1, Candidates );
				return;
			}

			// A non numeric key against an array is looked for in each element.
			// The key is not used up here: it applies to the elements, not to the array.
			//
			// Only object elements are descended into. An array which sits directly inside
			// another array is not traversed without an index, which is what MongoDB does:
			// { 'a.c': 1 } does not match { a: [ [ { c: 1 } ] ] }.
			for ( let index = 0; index < Node.length; index++ )
			{
				if ( jsongin.ShortType( Node[ index ] ) !== 'o' ) { continue; }
				resolve_node( Node[ index ], PathElements, Index, Candidates );
			}
			return;
		}

		if ( st_node === 'o' )
		{
			// A field which is not there contributes no candidate, which is what lets
			// $exists tell { a: [ { y: 1 } ] } from { a: [ { x: 1 } ] } for the path 'a.x'.
			if ( Object.prototype.hasOwnProperty.call( Node, key ) === false ) { return; }
			resolve_node( Node[ key ], PathElements, Index + 1, Candidates );
			return;
		}

		// A scalar has no fields to descend into.
		return;
	};


	//---------------------------------------------------------------------
	return ResolveCandidates;
};
