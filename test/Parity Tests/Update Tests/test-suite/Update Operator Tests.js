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

		} );


	} );

};
