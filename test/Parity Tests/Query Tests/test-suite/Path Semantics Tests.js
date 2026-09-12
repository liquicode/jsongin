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

		it( 'should match null below a scalar reached by field name', async () =>
		{
			// A field which is not there matches null, and so does a path which runs on below
			// a scalar or a null: neither has the field, and MongoDB reads both as missing.
			assert.ok( await matches( { other: 1 }, { 'a.b': null } ) );
			assert.ok( await matches( { a: 5 }, { 'a.b': null } ) );
			assert.ok( await matches( { a: null }, { 'a.b': null } ) );
			assert.ok( await matches( { a: { b: 5 } }, { 'a.b.c': null } ) );
			assert.ok( await matches( { a: [ { b: 5 } ] }, { 'a.b.c': null } ) );
		} );

		it( 'should not match null through an array which offers no document to descend into', async () =>
		{
			// A path which crosses an array by field name is looked for in each element which
			// is a document. An array with no such element - empty, or holding scalars, nulls
			// or arrays - is not a document lacking the field. It is a path which reached
			// nothing, and nothing is not null.
			//
			// jsongin used to match every one of these: a path which resolved to no value
			// was compared as though it were a missing field, whatever had emptied it.
			assert.ok( !await matches( { a: [] }, { 'a.b': null } ) );
			assert.ok( !await matches( { a: [ 1 ] }, { 'a.b': null } ) );
			assert.ok( !await matches( { a: [ null ] }, { 'a.b': null } ) );
			assert.ok( !await matches( { a: [ [ {} ] ] }, { 'a.b': null } ) );
			assert.ok( !await matches( { a: [ { b: [] } ] }, { 'a.b.c': null } ) );
			assert.ok( !await matches( { a: { b: [ 5 ] } }, { 'a.b.c': null } ) );
			// The explicit forms follow the same rule.
			assert.ok( !await matches( { a: [] }, { 'a.b': { $eq: null } } ) );
			assert.ok( !await matches( { a: [] }, { 'a.b': { $in: [ null, 1 ] } } ) );
			assert.ok( !await matches( { a: [] }, { 'a.b': { $gte: null } } ) );
			assert.ok( !await matches( { a: [] }, { 'a.b': { $lte: null } } ) );
			// And their negations.
			assert.ok( await matches( { a: [] }, { 'a.b': { $ne: null } } ) );
			assert.ok( await matches( { a: [] }, { 'a.b': { $nin: [ null ] } } ) );
			assert.ok( await matches( { a: [] }, { 'a.b': { $not: { $eq: null } } } ) );
		} );

		it( 'should match null through an array which holds a document lacking the field', async () =>
		{
			// The counterpart: one element which is a document without the field is enough,
			// whatever else the array holds.
			assert.ok( await matches( { a: [ { c: 1 } ] }, { 'a.b': null } ) );
			assert.ok( await matches( { a: [ { b: 1 }, { c: 1 } ] }, { 'a.b': null } ) );
			assert.ok( await matches( { a: [ 1, {} ] }, { 'a.b': null } ) );
			assert.ok( await matches( { a: [ { b: [ {}, 1 ] } ] }, { 'a.b.c': null } ) );
			assert.ok( await matches( { a: [ { b: 1 }, { c: 1 } ] }, { 'a.b': { $in: [ null ] } } ) );
			assert.ok( await matches( { a: [ { b: 1 }, { c: 1 } ] }, { 'a.b': { $gte: null } } ) );
			assert.ok( !await matches( { a: [ { b: 1 }, { c: 1 } ] }, { 'a.b': { $ne: null } } ) );
			// A document which has the field, holding something else, does not.
			assert.ok( !await matches( { a: [ { b: 1 } ] }, { 'a.b': null } ) );
		} );

		it( 'should not match null at an index an array does not have', async () =>
		{
			// An index past the end reaches nothing rather than a missing field, so it is not
			// null - unlike a field name the document lacks, which is.
			assert.ok( !await matches( { a: [] }, { 'a.0': null } ) );
			assert.ok( !await matches( { a: [ 1 ] }, { 'a.5': null } ) );
			assert.ok( !await matches( { a: { b: [ 1 ] } }, { 'a.b.1': null } ) );
			assert.ok( !await matches( { a: [ 1 ] }, { 'a.1': { $gte: null } } ) );
			assert.ok( await matches( { a: {} }, { 'a.0': null } ) );
		} );

		it( 'should not match null below an element reached by index', async () =>
		{
			// An index leads to one element. When that element is a scalar or a null the path
			// runs on below it, which is not the missing field it would be below a field.
			assert.ok( !await matches( { a: [ 1 ] }, { 'a.0.b': null } ) );
			assert.ok( !await matches( { a: [ null ] }, { 'a.0.b': null } ) );
			assert.ok( !await matches( { a: [ [ 1 ] ] }, { 'a.0.b': null } ) );
			// An element which is a document or an array carries on with ordinary semantics.
			assert.ok( await matches( { a: [ {} ] }, { 'a.0.b': null } ) );
			assert.ok( await matches( { a: [ [ {} ] ] }, { 'a.0.b': null } ) );
			assert.ok( await matches( { a: [ { b: 1 } ] }, { 'a.0.b.c': null } ) );
		} );

		it( 'should read a numeric path element on an array as an index and as a field name', async () =>
		{
			// Against an array, '0' is an index into it ***and*** a field name looked for in
			// each element which is a document. Both readings contribute, so a document
			// element with a field called '0' is reached without an index into it.
			// jsongin used to read it as an index only.
			assert.ok( await matches( { a: [ { '0': 'x' } ] }, { 'a.0': 'x' } ) );
			assert.ok( await matches( { a: [ 'y', { '0': 'x' } ] }, { 'a.0': 'x' } ) );
			assert.ok( await matches( { a: [ { '1': 'x' } ] }, { 'a.1': 'x' } ) );
			assert.ok( await matches( { a: [ { '0': { b: 1 } } ] }, { 'a.0.b': 1 } ) );
			assert.ok( await matches( { a: [ { '0': 5 } ] }, { 'a.0': { $gt: 4 } } ) );
			assert.ok( await matches( { a: [ { '0': [ 1, 2 ] } ] }, { 'a.0': { $size: 2 } } ) );
			assert.ok( await matches( { a: [ { '0': 'x' } ] }, { 'a.0': { $type: 'string' } } ) );
			assert.ok( await matches( { a: [ { '0': 'x' } ] }, { 'a.0': { $type: 'object' } } ) );
			assert.ok( !await matches( { a: [ { '0': 'x' } ] }, { 'a.0': { $ne: 'x' } } ) );
			// The field name reading makes a document element lacking it a missing field.
			assert.ok( await matches( { a: [ {} ] }, { 'a.1': null } ) );
			assert.ok( await matches( { a: [ { b: [] } ] }, { 'a.0.b.c': null } ) );
		} );

		it( 'should read an empty field name', async () =>
		{
			// A field may be called ''. A path element which is empty names it, below a field
			// or above one. jsongin used to drop the empty element while joining the path, so
			// 'a.' read as 'a'.
			//
			// A field called '' at the very top of the document is the one place a path cannot
			// name it, since the empty path is the document itself; that is a recorded gap in
			// Query Gaps.js rather than a case here.
			assert.ok( await matches( { a: { '': 1 } }, { 'a.': 1 } ) );
			assert.ok( await matches( { a: { '': 1 } }, { 'a.': { $gt: 0 } } ) );
			assert.ok( await matches( { a: { '': [ 1 ] } }, { 'a.': { $size: 1 } } ) );
			assert.ok( await matches( { a: { '': { b: 1 } } }, { 'a..b': 1 } ) );
			assert.ok( await matches( { '': { a: 1 } }, { '.a': 1 } ) );
			assert.ok( !await matches( { a: { '': 1 } }, { 'a.': null } ) );
			assert.ok( await matches( { a: 1 }, { 'a.': null } ) );
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
