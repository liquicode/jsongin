'use strict';

const assert = require( 'assert' );

/*
	The update operators, as MongoDB implements them.

	Migrated from test/Unit Tests/250) Update Operator Tests.js, which called each operator's
	Update() directly and so could never be checked against a server.

	What did not come across, and why:

	- Assertions about aliasing the update document, and about applying the same update
	  document twice. Those are statements about jsongin's cloning, not about MongoDB.
	- Assertions which call an operator's Update() directly. The driver applies a whole update
	  document, which is how a caller uses it.
	- $currentDate. Its value is the wall clock, so there is nothing stable to compare.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Applies one update to one document and returns the result.
	async function applied( Document, Update )
	{
		await Driver.SetData( [ Document ] );
		let result = await Driver.Update( {}, Update );
		assert.ok( result, 'the update returned nothing' );
		assert.strictEqual( result.length, 1, 'the update did not report one document' );
		return result[ 0 ];
	}


	//---------------------------------------------------------------------
	describe( 'Update Operator Tests', () =>
	{


		//---------------------------------------------------------------------
		describe( '$set Tests', () =>
		{

			it( 'should set values', async () =>
			{
				let document = await applied( { a: 1, b: 2 }, { $set: { a: 101, b: 102 } } );
				assert.strictEqual( document.a, 101 );
				assert.strictEqual( document.b, 102 );
			} );

			it( 'should set nested values', async () =>
			{
				let document = await applied( { nest: { a: 1 } }, { $set: { 'nest.a': 101 } } );
				assert.strictEqual( document.nest.a, 101 );
			} );

			it( 'should create the path when it is not there', async () =>
			{
				let document = await applied( { a: 1 }, { $set: { 'x.y.z': 5 } } );
				assert.strictEqual( document.x.y.z, 5 );
			} );

			it( 'should store a date as a date', async () =>
			{
				let document = await applied( { a: 1 }, { $set: { when: new Date( 1000 ) } } );
				assert.ok( document.when instanceof Date );
				assert.strictEqual( document.when.getTime(), 1000 );
			} );

			it( 'should set an element of an array by index', async () =>
			{
				let document = await applied( { a: [ 1, 2, 3 ] }, { $set: { 'a.1': 99 } } );
				assert.deepStrictEqual( document.a, [ 1, 99, 3 ] );
			} );

			it( 'should fill the gap with nulls when it writes past the end of an array', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $set: { 'a.3': 9 } } );
				assert.deepStrictEqual( document.a, [ 1, null, null, 9 ] );
			} );

			it( 'should fill the gap ahead of a document it creates in an array', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $set: { 'a.2.b': 9 } } );
				assert.deepStrictEqual( document.a, [ 1, null, { b: 9 } ] );
			} );

			/*
				A path element which is not there becomes a document, whatever the key looks
				like. Only the array update operators ever create an array, so a numeric key
				here is a field name rather than an index.
			*/

			it( 'should create a document for a numeric key rather than an array', async () =>
			{
				let document = await applied( { other: 1 }, { $set: { 'a.0': 9 } } );
				assert.strictEqual( Array.isArray( document.a ), false );
				assert.deepStrictEqual( document.a, { 0: 9 } );
			} );

			it( 'should create a document for a numeric key at depth', async () =>
			{
				let document = await applied( { other: 1 }, { $set: { 'a.1.b': 9 } } );
				assert.strictEqual( Array.isArray( document.a ), false );
				assert.deepStrictEqual( document.a, { 1: { b: 9 } } );
			} );

			it( 'should index an array which is already there', async () =>
			{
				// The rule above applies to a path which is not there. An array which exists is
				// still indexed by a numeric key.
				let document = await applied( { a: [] }, { $set: { 'a.0': 9 } } );
				assert.deepStrictEqual( document.a, [ 9 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$unset Tests', () =>
		{

			it( 'should remove a field', async () =>
			{
				let document = await applied( { a: 1, b: 2 }, { $unset: { a: '' } } );
				assert.ok( !( 'a' in document ) );
				assert.strictEqual( document.b, 2 );
			} );

			it( 'should remove a nested field', async () =>
			{
				let document = await applied( { nest: { a: 1, b: 2 } }, { $unset: { 'nest.a': '' } } );
				assert.ok( !( 'a' in document.nest ) );
			} );

			it( 'should ignore a field which is not there', async () =>
			{
				let document = await applied( { a: 1 }, { $unset: { zz: '' } } );
				assert.strictEqual( document.a, 1 );
			} );

			it( 'should leave a null hole when it removes an array element', async () =>
			{
				let document = await applied( { a: [ 1, 2, 3 ] }, { $unset: { 'a.1': '' } } );
				assert.deepStrictEqual( document.a, [ 1, null, 3 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$rename Tests', () =>
		{

			it( 'should rename a field', async () =>
			{
				let document = await applied( { a: 1 }, { $rename: { a: 'b' } } );
				assert.ok( !( 'a' in document ) );
				assert.strictEqual( document.b, 1 );
			} );

			it( 'should overwrite the target field', async () =>
			{
				let document = await applied( { a: 1, b: 2 }, { $rename: { a: 'b' } } );
				assert.ok( !( 'a' in document ) );
				assert.strictEqual( document.b, 1 );
			} );

			it( 'should ignore a source field which is not there', async () =>
			{
				let document = await applied( { b: 1 }, { $rename: { a: 'c' } } );
				assert.strictEqual( document.b, 1 );
				assert.ok( !( 'c' in document ) );
			} );

			it( 'should move a value and create the topography', async () =>
			{
				let document = await applied( { a: 1 }, { $rename: { a: 'x.y' } } );
				assert.strictEqual( document.x.y, 1 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$inc Tests', () =>
		{

			it( 'should increment a value', async () =>
			{
				let document = await applied( { a: 1 }, { $inc: { a: 5 } } );
				assert.strictEqual( document.a, 6 );
			} );

			it( 'should decrement with a negative value', async () =>
			{
				let document = await applied( { a: 10 }, { $inc: { a: -3 } } );
				assert.strictEqual( document.a, 7 );
			} );

			it( 'should increment a nested value', async () =>
			{
				let document = await applied( { nest: { a: 1 } }, { $inc: { 'nest.a': 5 } } );
				assert.strictEqual( document.nest.a, 6 );
			} );

			it( 'should set a field which is not there to the increment', async () =>
			{
				let document = await applied( { other: 1 }, { $inc: { a: 5 } } );
				assert.strictEqual( document.a, 5 );
			} );

			it( 'should create the path for a nested field which is not there', async () =>
			{
				let document = await applied( { other: 1 }, { $inc: { 'x.y': 5 } } );
				assert.strictEqual( document.x.y, 5 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$mul Tests', () =>
		{

			it( 'should multiply a value', async () =>
			{
				let document = await applied( { a: 3 }, { $mul: { a: 4 } } );
				assert.strictEqual( document.a, 12 );
			} );

			it( 'should set a field which is not there to zero', async () =>
			{
				let document = await applied( { other: 1 }, { $mul: { a: 5 } } );
				assert.strictEqual( document.a, 0 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$min and $max Tests', () =>
		{

			it( 'should keep the smaller value for $min', async () =>
			{
				assert.strictEqual( ( await applied( { a: 5 }, { $min: { a: 2 } } ) ).a, 2 );
				assert.strictEqual( ( await applied( { a: 5 }, { $min: { a: 9 } } ) ).a, 5 );
			} );

			it( 'should keep the larger value for $max', async () =>
			{
				assert.strictEqual( ( await applied( { a: 5 }, { $max: { a: 9 } } ) ).a, 9 );
				assert.strictEqual( ( await applied( { a: 5 }, { $max: { a: 2 } } ) ).a, 5 );
			} );

			it( 'should set a field which is not there', async () =>
			{
				assert.strictEqual( ( await applied( { other: 1 }, { $min: { a: 5 } } ) ).a, 5 );
				assert.strictEqual( ( await applied( { other: 1 }, { $max: { a: 5 } } ) ).a, 5 );
			} );

			it( 'should compare strings', async () =>
			{
				assert.strictEqual( ( await applied( { s: 'xyz' }, { $min: { s: 'abc' } } ) ).s, 'abc' );
			} );

			it( 'should compare across types by the BSON ordering', async () =>
			{
				// A string outranks a number, so $max replaces and $min does not.
				assert.strictEqual( ( await applied( { n: 5 }, { $max: { n: 'abc' } } ) ).n, 'abc' );
				assert.strictEqual( ( await applied( { n: 5 }, { $min: { n: 'abc' } } ) ).n, 5 );
			} );

			it( 'should treat null as lower than any number', async () =>
			{
				assert.strictEqual( ( await applied( { n: null }, { $min: { n: 5 } } ) ).n, null );
				assert.strictEqual( ( await applied( { n: null }, { $max: { n: 5 } } ) ).n, 5 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$push Tests', () =>
		{

			it( 'should append a value', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $push: { a: 2 } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should create the array when the field is not there', async () =>
			{
				let document = await applied( { other: 1 }, { $push: { a: 1 } } );
				assert.deepStrictEqual( document.a, [ 1 ] );
			} );

			it( 'should append each value with $each', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $push: { a: { $each: [ 2, 3 ] } } } );
				assert.deepStrictEqual( document.a, [ 1, 2, 3 ] );
			} );

			it( 'should insert at a position with $position', async () =>
			{
				let document = await applied( { a: [ 1, 4 ] }, { $push: { a: { $each: [ 2 ], $position: 1 } } } );
				assert.deepStrictEqual( document.a, [ 1, 2, 4 ] );
			} );

			it( 'should trim with $slice', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $push: { a: { $each: [ 2, 3 ], $slice: 2 } } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should order with $sort', async () =>
			{
				let document = await applied( { a: [ 3 ] }, { $push: { a: { $each: [ 1, 2 ], $sort: 1 } } } );
				assert.deepStrictEqual( document.a, [ 1, 2, 3 ] );
			} );

			it( 'should append a modifier written without $each as a value', async () =>
			{
				// $each is what makes a document a modifier document, so without one there is
				// nothing to read as a modifier and the object is ordinary data.
				let document = await applied( { a: [ 1 ] }, { $push: { a: { $slice: 1 } } } );
				assert.deepStrictEqual( document.a, [ 1, { $slice: 1 } ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$addToSet Tests', () =>
		{

			it( 'should add a value which is not present', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $addToSet: { a: 2 } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should not add a value which is already present', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $addToSet: { a: 1 } } );
				assert.deepStrictEqual( document.a, [ 1 ] );
			} );

			it( 'should add each value with $each', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $addToSet: { a: { $each: [ 1, 2 ] } } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should create the array when the field is not there', async () =>
			{
				let document = await applied( { other: 1 }, { $addToSet: { a: 1 } } );
				assert.deepStrictEqual( document.a, [ 1 ] );
			} );

			it( 'should create the array for $each when the field is not there', async () =>
			{
				let document = await applied( { other: 1 }, { $addToSet: { a: { $each: [ 1, 2 ] } } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$pop Tests', () =>
		{

			it( 'should remove the last element for 1', async () =>
			{
				let document = await applied( { a: [ 1, 2, 3 ] }, { $pop: { a: 1 } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should remove the first element for -1', async () =>
			{
				let document = await applied( { a: [ 1, 2, 3 ] }, { $pop: { a: -1 } } );
				assert.deepStrictEqual( document.a, [ 2, 3 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$pullAll Tests', () =>
		{

			it( 'should remove every matching value', async () =>
			{
				let document = await applied( { a: [ 1, 2, 3, 2 ] }, { $pullAll: { a: [ 2 ] } } );
				assert.deepStrictEqual( document.a, [ 1, 3 ] );
			} );

			it( 'should ignore a value which is not present', async () =>
			{
				let document = await applied( { a: [ 1, 2 ] }, { $pullAll: { a: [ 9 ] } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should remove matching documents', async () =>
			{
				let document = await applied( { a: [ { x: 1 }, { x: 2 } ] }, { $pullAll: { a: [ { x: 1 } ] } } );
				assert.deepStrictEqual( document.a, [ { x: 2 } ] );
			} );

			it( 'should leave a field which is not there alone', async () =>
			{
				let document = await applied( { other: 1 }, { $pullAll: { a: [ 1 ] } } );
				assert.ok( !( 'a' in document ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$currentDate Tests', () =>
		{

			it( 'should store a date for true', async () =>
			{
				let document = await applied( { d: 0 }, { $currentDate: { d: true } } );
				assert.ok( document.d instanceof Date );
			} );

			it( 'should store a date for the date type', async () =>
			{
				let document = await applied( { d: 0 }, { $currentDate: { d: { $type: 'date' } } } );
				assert.ok( document.d instanceof Date );
			} );

			it( 'should create the field when it is not there', async () =>
			{
				let document = await applied( { other: 1 }, { $currentDate: { d: true } } );
				assert.ok( document.d instanceof Date );
			} );

			it( 'should give each field its own date', async () =>
			{
				let document = await applied( { other: 1 }, { $currentDate: { a: true, b: true } } );
				assert.ok( document.a instanceof Date );
				assert.ok( document.b instanceof Date );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Operator Edge Cases', () =>
		{

			it( 'should apply $inc to a fractional value', async () =>
			{
				let document = await applied( { a: 1.5 }, { $inc: { a: 0.25 } } );
				assert.strictEqual( document.a, 1.75 );
			} );

			it( 'should rename from a nested path', async () =>
			{
				let document = await applied( { a: { b: 1 } }, { $rename: { 'a.b': 'c' } } );
				assert.strictEqual( document.c, 1 );
				assert.deepStrictEqual( document.a, {} );
			} );

			it( 'should accept an empty set of fields', async () =>
			{
				let document = await applied( { a: 1 }, { $set: {} } );
				assert.strictEqual( document.a, 1 );
			} );

			it( 'should pop nothing from an empty array', async () =>
			{
				let document = await applied( { a: [] }, { $pop: { a: 1 } } );
				assert.deepStrictEqual( document.a, [] );
			} );

			it( 'should leave a field which is not there alone for $pop', async () =>
			{
				let document = await applied( { other: 1 }, { $pop: { a: 1 } } );
				assert.ok( !( 'a' in document ) );
			} );

			it( 'should not add a document which is already in the set', async () =>
			{
				let document = await applied( { a: [ { x: 1 } ] }, { $addToSet: { a: { x: 1 } } } );
				assert.deepStrictEqual( document.a, [ { x: 1 } ] );
			} );

			it( 'should not add an array which is already in the set', async () =>
			{
				let document = await applied( { a: [ [ 1 ] ] }, { $addToSet: { a: [ 1 ] } } );
				assert.deepStrictEqual( document.a, [ [ 1 ] ] );
			} );

			it( 'should keep the last elements for a negative $slice', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $push: { a: { $each: [ 2, 3 ], $slice: -2 } } } );
				assert.deepStrictEqual( document.a, [ 2, 3 ] );
			} );

			it( 'should order documents with a $sort specification', async () =>
			{
				let document = await applied(
					{ a: [ { n: 2 }, { n: 1 } ] },
					{ $push: { a: { $each: [ { n: 3 } ], $sort: { n: 1 } } } } );
				assert.deepStrictEqual( document.a, [ { n: 1 }, { n: 2 }, { n: 3 } ] );
			} );

			it( 'should append at the end for a $position past the end', async () =>
			{
				let document = await applied( { a: [ 1, 2 ] }, { $push: { a: { $each: [ 3 ], $position: 9 } } } );
				assert.deepStrictEqual( document.a, [ 1, 2, 3 ] );
			} );

		} );


		//---------------------------------------------------------------------
		// ***A second pass of the migration this file's header describes.***
		//
		// Each of these was asserted only in test/Unit Tests/250), where a test can confirm
		// what jsongin does but never disagree with it. They are the ones whose answers a
		// reasonable implementation could get wrong.
		describe( 'Swept In From the Unit Tests', () =>
		{

			it( 'should add a value repeated within one $each only once', async () =>
			{
				// ***The set rule applies within the $each as well as against the array.***
				let document = await applied( { a: [] }, { $addToSet: { a: { $each: [ 1, 1, 2 ] } } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should compare strictly in $addToSet, without coercing a type', async () =>
			{
				let document = await applied( { a: [ 1 ] }, { $addToSet: { a: '1' } } );
				assert.strictEqual( document.a.length, 2 );
			} );

			it( 'should apply a $push $sort before its $slice', async () =>
			{
				// ***The order of the two modifiers is the whole answer here.*** Sorting first
				// gives [ 1, 2, 3 ] and keeps [ 1, 2 ]; slicing first would keep [ 3, 1 ] and
				// answer [ 1, 3 ]. Both are defensible and only one is MongoDB.
				let document = await applied( { a: [] },
					{ $push: { a: { $each: [ 3, 1, 2 ], $sort: 1, $slice: 2 } } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

			it( 'should remove a numeric key from a document rather than nulling it', async () =>
			{
				// ***A numeric key against a document is a field name***, so it is removed the
				// way any other field is. Nulling is what happens to an array element, and the
				// difference is decided by what the path reaches, not by how the key looks.
				let document = await applied( { o: { '0': 1, b: 2 } }, { $unset: { 'o.0': '' } } );
				assert.deepStrictEqual( document.o, { b: 2 } );
			} );

			it( 'should leave an array alone for an index which is out of range', async () =>
			{
				let document = await applied( { a: [ 1, 2 ] }, { $unset: { 'a.5': '' } } );
				assert.deepStrictEqual( document.a, [ 1, 2 ] );
			} );

		} );


	} );

};
