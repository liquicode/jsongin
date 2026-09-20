'use strict';

/*
	What a joining stage's answer has to be compared with, and why it cannot be compared
	directly.

	***MongoDB does not promise an order, and it does not give the same one jsongin does.***
	Measured against MongoDB 8.3.8 on 2026-09-20 (`jsonx/.plans/tools/lookup-parity-probe.js`):
	a `$graphLookup` over a three document chain answered them as `b, a, c`, while the array a
	`$lookup` fills came back in the join collection's own order. Both were identical across two
	runs, so the order is the server's own rather than random - and it is not one an in-memory
	engine can reproduce, because it belongs to how the collection is stored.

	So an answer is compared as a ***set***: the documents in any order, and the documents inside
	a named array in any order. Everything else about them still has to match exactly.

	***This is the one comparison a parity suite is allowed to relax***, and it is stated here
	once rather than per test, so that a suite which relaxes something else is visible.
*/


//---------------------------------------------------------------------
// A stable ordering for comparison: the documents sorted by their own text, with the arrays a
// joining stage fills sorted the same way first.
//
// Nothing else is reordered. An array which is the document's own data keeps the order it has,
// because that order is part of what is being compared.

function canonical( Documents, ArrayFields )
{
	let fields = Array.isArray( ArrayFields ) ? ArrayFields : [ ArrayFields ];

	// ***A field name may be a path***, because `as` may be one: a stage which writes its
	// matches at 'Site.Found' nests them, and an array left unsorted down there fails a
	// comparison for its order alone. Found by the $graphLookup cases, where every document
	// agreed and only the nesting was compared unsorted.
	function sort_at( Node, PathElements )
	{
		if ( ( Node === null ) || ( typeof Node !== 'object' ) ) { return; }
		let key = PathElements[ 0 ];
		if ( PathElements.length > 1 )
		{
			sort_at( Node[ key ], PathElements.slice( 1 ) );
			return;
		}
		if ( !Array.isArray( Node[ key ] ) ) { return; }
		Node[ key ] = Node[ key ]
			.map( function ( Each ) { return JSON.stringify( Each ); } )
			.sort()
			.map( function ( Each ) { return JSON.parse( Each ); } );
		return;
	}

	function sorted_copy( Value )
	{
		let copy = JSON.parse( JSON.stringify( Value ) );
		for ( let index = 0; index < fields.length; index++ )
		{
			sort_at( copy, String( fields[ index ] ).split( '.' ) );
		}
		return copy;
	}

	return Documents
		.map( sorted_copy )
		.map( function ( Each ) { return JSON.stringify( Each ); } )
		.sort();
}


//---------------------------------------------------------------------
/*
	Asserts that two answers hold the same documents, in any order, with the named arrays in any
	order within them.

		SameDocuments( assert, answer, expected, 'Found' )
		SameDocuments( assert, answer, expected, [ 'Found', 'Chain' ] )
*/

function SameDocuments( Assert, Actual, Expected, ArrayFields )
{
	Assert.deepStrictEqual(
		canonical( Actual, ArrayFields || [] ),
		canonical( Expected, ArrayFields || [] ) );
	return;
}


//---------------------------------------------------------------------
// The documents a joining stage found, by one field of theirs, sorted - for a test which cares
// which documents were reached rather than what they hold.

function FoundValues( Document, ArrayField, ValueField )
{
	let found = Document[ ArrayField ];
	if ( !Array.isArray( found ) ) { return found; }
	return found.map( function ( Each ) { return Each[ ValueField ]; } ).sort();
}


//---------------------------------------------------------------------
module.exports = {
	SameDocuments: SameDocuments,
	FoundValues: FoundValues,
};
