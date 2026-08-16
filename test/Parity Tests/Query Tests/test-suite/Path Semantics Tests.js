'use strict';

const assert = require( 'assert' );

/*
	What a path means when the document's shape makes it ambiguous.

	A dotted path is read against the document it meets, so the same path means different
	things in different documents: 'a.0' is an array index in one and a field name in another.
	These are the cases where getting it wrong is invisible, because both readings produce a
	plausible answer.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	async function matches( Document, Criteria )
	{
		await Driver.SetData( [ Document ] );
		let found = await Driver.Find( Criteria );
		return ( found.length > 0 );
	}


	//---------------------------------------------------------------------
	describe( 'Path Semantics Tests', () =>
	{

		it( 'should read a numeric path element as an index into an array', async () =>
		{
			assert.ok( await matches( { a: [ 'x', 'y' ] }, { 'a.0': 'x' } ) );
			assert.ok( !await matches( { a: [ 'x', 'y' ] }, { 'a.0': 'y' } ) );
		} );

		it( 'should read a numeric path element as a field name on a document', async () =>
		{
			// The same path, against a document rather than an array, names a field. A field
			// may legitimately be called '0'.
			assert.ok( await matches( { a: { 0: 'x' } }, { 'a.0': 'x' } ) );
		} );

		it( 'should reach an element of a nested array by index', async () =>
		{
			assert.ok( await matches( { a: [ [ { c: 1 } ] ] }, { 'a.0.0.c': 1 } ) );
		} );

		it( 'should not reach into an array inside an array without an index', async () =>
		{
			assert.ok( !await matches( { a: [ [ { c: 1 } ] ] }, { 'a.c': 1 } ) );
		} );

		it( 'should equate a nested array element with the value it holds', async () =>
		{
			// The field holds an array of arrays, so the candidate list offers the whole field
			// and each element, and the match value equals the element.
			assert.ok( await matches( { v: [ [ 1 ] ] }, { v: [ 1 ] } ) );
			assert.ok( !await matches( { v: [ [ 1 ] ] }, { v: 1 } ) );
		} );

		it( 'should match nothing for a path which runs below a scalar', async () =>
		{
			assert.ok( !await matches( { a: 5 }, { 'a.b': 1 } ) );
			assert.ok( !await matches( { a: 5 }, { 'a.0': 1 } ) );
		} );

		it( 'should cross two arrays in one path', async () =>
		{
			assert.ok( await matches( { a: [ { b: [ { c: 1 } ] } ] }, { 'a.b.c': 1 } ) );
		} );

		it( 'should negate a condition on a field which is not there', async () =>
		{
			// $not is satisfied by a field which cannot meet the condition, including one
			// which is absent.
			assert.ok( await matches( { other: 1 }, { a: { $not: { $gt: 1 } } } ) );
			assert.ok( !await matches( { a: 5 }, { a: { $not: { $gt: 1 } } } ) );
		} );

		it( 'should anchor a regexp against the whole string', async () =>
		{
			assert.ok( await matches( { s: 'hello' }, { s: { $regex: '^h' } } ) );
			assert.ok( !await matches( { s: 'hello' }, { s: { $regex: '^e' } } ) );
		} );

		it( 'should apply the multiline flag through $options', async () =>
		{
			assert.ok( await matches( { s: 'a\nb' }, { s: { $regex: '^b', $options: 'm' } } ) );
			assert.ok( !await matches( { s: 'a\nb' }, { s: { $regex: '^b' } } ) );
		} );

		it( 'should match every document for an empty query', async () =>
		{
			assert.ok( await matches( { a: 1 }, {} ) );
		} );

	} );

};
