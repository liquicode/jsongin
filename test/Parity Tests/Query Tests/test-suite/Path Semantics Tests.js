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

		it( 'should not index an array from the end', async () =>
		{
			// There is no reverse indexing. A negative number is read as a field name like any
			// other, and an array has no field called '-1', so the path reaches nothing.
			//
			// jsongin used to index from the end here, as a path extension shared by GetValue,
			// SetValue, DeleteValue, Sort, and the query resolver. The extension has been
			// removed rather than gated, on both sides of the engine.
			assert.ok( !await matches( { a: [ 'x', 'y' ] }, { 'a.-1': 'y' } ) );
			assert.ok( !await matches( { a: [ 'x', 'y' ] }, { 'a.-2': 'x' } ) );
			assert.ok( !await matches( { a: [ 'x', 'y' ] }, { 'a.-9': 'x' } ) );
		} );

		it( 'should read a negative path element as a field name on a document', async () =>
		{
			// The counterpart: against a document '-1' is an ordinary field name, and a field
			// may legitimately be called that. Removing reverse indexing must not take this
			// with it.
			assert.ok( await matches( { a: { '-1': 5 } }, { 'a.-1': 5 } ) );
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

		it( 'should apply the dotall flag through $options', async () =>
		{
			assert.ok( await matches( { s: 'a\nb' }, { s: { $regex: 'a.b', $options: 's' } } ) );
			assert.ok( !await matches( { s: 'a\nb' }, { s: { $regex: 'a.b' } } ) );
		} );

		it( 'should apply the extended flag through $options', async () =>
		{
			// MongoDB's 'x' ignores unescaped whitespace in the pattern, and everything from an
			// unescaped '#' to the end of the line. Javascript's RegExp has no such flag, so
			// this is not simply a flag to pass along.
			assert.ok( await matches( { s: 'ab' }, { s: { $regex: 'a b', $options: 'x' } } ) );
			assert.ok( await matches( { s: 'ab' }, { s: { $regex: 'a b # trailing note\n', $options: 'x' } } ) );
			assert.ok( !await matches( { s: 'a b' }, { s: { $regex: 'a b', $options: 'x' } } ) );

			// An escaped space is still a space.
			assert.ok( await matches( { s: 'a b' }, { s: { $regex: 'a\\ b', $options: 'x' } } ) );
		} );

		it( 'should keep whitespace inside a character class under the extended flag', async () =>
		{
			// Whitespace ***inside a character class*** is part of the class rather than layout,
			// which is what PCRE does and what MongoDB inherits. So '[a b]' still matches a
			// space, even though the same space outside a class would be ignored.
			assert.ok( await matches( { s: 'a b' }, { s: { $regex: '^[a b]+$', $options: 'x' } } ) );

			// The class ends at its ']', so whitespace after it is layout again.
			assert.ok( await matches( { s: 'ac' }, { s: { $regex: '^[ab] c$', $options: 'x' } } ) );
			assert.ok( !await matches( { s: 'a c' }, { s: { $regex: '^[ab] c$', $options: 'x' } } ) );

			// A '#' inside a class is a literal too, not the start of a comment.
			assert.ok( await matches( { s: '#' }, { s: { $regex: '^[#]$', $options: 'x' } } ) );
		} );

		it( 'should match every document for an empty query', async () =>
		{
			assert.ok( await matches( { a: 1 }, {} ) );
		} );

	} );

};
