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

	The rules below were measured against MongoDB 7.0.40 rather than assumed, and the two
	which concern a missing field against MongoDB 6.0.28, 7.0.40 and 8.3.8. See
	.plans/2026-08-14/parity-explicit-operators-through-arrays.md for the first sweep and the
	jsonx root's .plans/jsongin-parity-repairs.md for the second.

	This landed ahead of the operators which use it, so that the mechanism could be proven on
	its own before any operator changed behavior. That migration has happened: it is registered
	on the engine, documented at docs/guides/jsongin/ResolveCandidates.md, and called by $eq,
	$eqx, $gt/$gte/$lt/$lte, $regex, $size, $exists, $type, $all, and $elemMatch.
*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns an array of the values which Path can mean within Document.
	// An empty array means the path resolves to nothing. This is not the same as a path
	// which resolves to undefined, which yields one candidate holding undefined - and it is
	// not the same as a missing field either, which is what Report is for.
	//
	// ExpandArrays is what makes an array field also offer each of its elements, which is the
	// rule ordinary equality follows. Pass false to get only the values the path lands on.
	// $elemMatch is the caller which needs that: it asks about the elements of the array
	// itself, so an element which is another array is a value it tests, not a second array to
	// look inside. Verified against MongoDB 7.0.40, where { a: { $elemMatch: { x: 1 } } } does
	// not match { a: [ [ { x: 1 } ] ] }.
	//
	// Report, when an object is given, has Missing set true when the path met a ***missing
	// field***: a document which lacks the key, or a scalar or null which the path runs on
	// below after reaching it through a field name. That is the case MongoDB matches against
	// null. A path which reaches nothing any other way - through an array holding no document
	// to descend into, an index past the end, or below an element reached by index - is not a
	// missing field, and null does not match it. The list alone cannot carry the distinction:
	// { a: [ { b: 1 }, { c: 1 } ] } at 'a.b' yields the candidate 1 ***and*** a missing field,
	// and { 'a.b': null } matches it. Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
	function ResolveCandidates( Document, Path, ExpandArrays = true, Report = null )
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
				resolve_node( Document, [], 0, candidates, ExpandArrays, Report );
				return candidates;
			}

			let path_elements = jsongin.SplitPath( Path );
			resolve_node( Document, path_elements, 0, candidates, ExpandArrays, Report );
			return candidates;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'ResolveCandidates: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	// Records that the path met a missing field. See Report above.
	function report_missing( Report )
	{
		if ( jsongin.ShortType( Report ) === 'o' ) { Report.Missing = true; }
	};


	//---------------------------------------------------------------------
	// Walks one path element and appends whatever it finds to Candidates.
	function resolve_node( Node, PathElements, Index, Candidates, ExpandArrays, Report )
	{
		// The path is used up, so this node is what the path means.
		if ( Index >= PathElements.length )
		{
			Candidates.push( Node );

			// An array is also matched by each of its elements, which is how { tags: 'red' }
			// matches { tags: [ 'red', 'blue' ] } while { tags: [ 'red' ] } matches both
			// { tags: [ 'red' ] } as a whole and { tags: [ [ 'red' ] ] } by its element.
			// Exactly one level deep: an element which is itself an array is a candidate as
			// the array it is, and is not expanded again. Verified against MongoDB 7.0.40,
			// where { tags: 'red' } does not match { tags: [ [ 'red' ] ] }.
			if ( ExpandArrays === false ) { return; }
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
			// The key is looked for in each element which is a document, ***whatever the key
			// looks like***. The key is not used up here: it applies to the elements, not to
			// the array.
			//
			// Only object elements are descended into. An array which sits directly inside
			// another array is not traversed without an index, which is what MongoDB does:
			// { 'a.c': 1 } does not match { a: [ [ { c: 1 } ] ] }. A scalar or a null element
			// is not a document lacking the field, so it reports nothing - which is why
			// { 'a.b': null } does not match { a: [ 1 ] }, while a document element lacking
			// the key does report a missing field, which is why it matches { a: [ { c: 1 } ] }.
			//
			// A numeric key takes this branch too. MongoDB reads '0' against an array as an
			// index ***and*** as a field name of each document element, and both readings
			// contribute: { 'a.0': 'x' } matches { a: [ { '0': 'x' } ] }. This used to read it
			// as an index only. Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
			for ( let index = 0; index < Node.length; index++ )
			{
				if ( jsongin.ShortType( Node[ index ] ) !== 'o' ) { continue; }
				resolve_node( Node[ index ], PathElements, Index, Candidates, ExpandArrays, Report );
			}

			if ( st_key === 'n' )
			{
				// A numeric key also indexes the array, as MongoDB does when it resolves a
				// query path: { 'a.2': 3 } matches { a: [ 1, 2, 3 ] }.
				// A negative index addresses nothing. MongoDB has no reverse indexing: it
				// reads '-1' as a field name, and an array has no such field, so
				// { 'a.-1': 3 } matches nothing. Verified against MongoDB 7.0.40.
				// An index past the end addresses nothing either, and nothing is not a missing
				// field: { 'a.5': null } does not match { a: [ 1 ] }.
				let element_index = key;
				if ( element_index < 0 ) { return; }
				if ( element_index >= Node.length ) { return; }

				// The element the index leads to. When the path runs on below it and it is a
				// scalar or a null, the path reaches nothing rather than a missing field:
				// { 'a.0.b': null } does not match { a: [ 1 ] }, though { 'a.b': null } does
				// match { a: 1 }. A document or an array carries on with ordinary semantics.
				let element = Node[ element_index ];
				if ( ( ( Index + 1 ) < PathElements.length ) && ( 'oa'.includes( jsongin.ShortType( element ) ) === false ) ) { return; }
				resolve_node( element, PathElements, Index + 1, Candidates, ExpandArrays, Report );
			}
			return;
		}

		if ( st_node === 'o' )
		{
			// A field which is not there contributes no candidate, which is what lets
			// $exists tell { a: [ { y: 1 } ] } from { a: [ { x: 1 } ] } for the path 'a.x'.
			// It is a missing field, which is what lets { a: null } match a document with no
			// a, and { 'a.b': null } match { a: [ { c: 1 } ] }.
			if ( Object.prototype.hasOwnProperty.call( Node, key ) === false ) { report_missing( Report ); return; }
			resolve_node( Node[ key ], PathElements, Index + 1, Candidates, ExpandArrays, Report );
			return;
		}

		// A scalar or a null has no fields to descend into. Reached through a field name it
		// is a missing field - { 'a.b': null } matches { a: 5 } and { a: null } - and this is
		// the only way it can be reached with path remaining: an index into an array does not
		// descend into a scalar, above, and an array iteration skips one.
		report_missing( Report );
		return;
	};


	//---------------------------------------------------------------------
	return ResolveCandidates;
};
