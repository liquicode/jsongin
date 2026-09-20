'use strict';

const assert = require( 'assert' );

/*
	The all positional operator, `$[]`, which is a path element rather than an update operator.

	***It is written inside a path and every update operator can use it.*** `'a.$[].n'` means
	the `n` of every element of `a`, so one update reaches the whole array. That is the only way
	to write through an array in MongoDB without naming an index: an ordinary path which reaches
	into an array by field name is not a write target at all.

	The questions worth asking before building it: what happens when the field is not an array,
	when the array is empty, when an element cannot hold the field being written, and whether
	`$[]` can stand at the end of a path as well as in the middle.

	Verified against MongoDB 7.0.40.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	async function applied( Document, Update )
	{
		await Driver.SetData( [ Document ] );
		let result = await Driver.Update( {}, Update );
		assert.ok( result, 'the update returned nothing' );
		assert.strictEqual( result.length, 1, 'the update did not report one document' );
		return result[ 0 ];
	}


	//---------------------------------------------------------------------
	async function refused( Document, Update )
	{
		try
		{
			let result = await applied( Document, Update );
			return ( JSON.stringify( result ) === JSON.stringify( Object.assign( { _id: result._id }, Document ) ) );
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'All Positional Tests', () =>
	{

		it( 'should set every element of an array', async () =>
		{
			let document = await applied( { a: [ 1, 2, 3 ] }, { $set: { 'a.$[]': 5 } } );
			assert.deepStrictEqual( document.a, [ 5, 5, 5 ] );
		} );

		it( 'should set a field of every element', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1 }, { n: 2 } ] }, { $set: { 'a.$[].n': 9 } } );
			assert.deepStrictEqual( document.a, [ { n: 9 }, { n: 9 } ] );
		} );

		it( 'should increment a field of every element', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1 }, { n: 2 } ] }, { $inc: { 'a.$[].n': 1 } } );
			assert.deepStrictEqual( document.a, [ { n: 2 }, { n: 3 } ] );
		} );

		it( 'should multiply a field of every element', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1 }, { n: 2 } ] }, { $mul: { 'a.$[].n': 10 } } );
			assert.deepStrictEqual( document.a, [ { n: 10 }, { n: 20 } ] );
		} );

		it( 'should remove a field from every element', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1, k: 'x' }, { n: 2, k: 'y' } ] }, { $unset: { 'a.$[].n': '' } } );
			assert.deepStrictEqual( document.a, [ { k: 'x' }, { k: 'y' } ] );
		} );

		it( 'should create the field on an element which does not have it', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1 }, { k: 'y' } ] }, { $set: { 'a.$[].n': 9 } } );
			assert.deepStrictEqual( document.a, [ { n: 9 }, { k: 'y', n: 9 } ] );
		} );

		it( 'should leave an empty array alone', async () =>
		{
			let document = await applied( { a: [] }, { $set: { 'a.$[]': 5 } } );
			assert.deepStrictEqual( document.a, [] );
		} );

		it( 'should reach a nested path below each element', async () =>
		{
			let document = await applied(
				{ a: [ { o: { n: 1 } }, { o: { n: 2 } } ] }, { $set: { 'a.$[].o.n': 9 } } );
			assert.deepStrictEqual( document.a, [ { o: { n: 9 } }, { o: { n: 9 } } ] );
		} );

		it( 'should reach through two levels of array', async () =>
		{
			let document = await applied(
				{ a: [ { b: [ { n: 1 }, { n: 2 } ] } ] },
				{ $set: { 'a.$[].b.$[].n': 9 } } );
			assert.deepStrictEqual( document.a, [ { b: [ { n: 9 }, { n: 9 } ] } ] );
		} );

		it( 'should push to an array field of every element', async () =>
		{
			let document = await applied(
				{ a: [ { t: [ 1 ] }, { t: [ 2 ] } ] }, { $push: { 'a.$[].t': 9 } } );
			assert.deepStrictEqual( document.a, [ { t: [ 1, 9 ] }, { t: [ 2, 9 ] } ] );
		} );

		it( 'should refuse a field which is not an array', async () =>
		{
			assert.strictEqual( await refused( { a: 5 }, { $set: { 'a.$[]': 9 } } ), true );
			assert.strictEqual( await refused( { a: { n: 1 } }, { $set: { 'a.$[].n': 9 } } ), true );
		} );

		it( 'should refuse a field which is not there', async () =>
		{
			assert.strictEqual( await refused( { b: 1 }, { $set: { 'a.$[]': 9 } } ), true );
		} );

		it( 'should refuse writing a field below an element which cannot hold one', async () =>
		{
			assert.strictEqual( await refused( { a: [ 1, 2 ] }, { $set: { 'a.$[].n': 9 } } ), true );
		} );

		it( 'should refuse a $rename through the all positional operator', async () =>
			{
				// ***Not every operator takes it.*** A rename names one source and one target,
				// and there is no sensible target for a source which expands to many, so
				// MongoDB refuses rather than picking one.
				assert.strictEqual(
					await refused( { a: [ { n: 1 }, { n: 2 } ] }, { $rename: { 'a.$[].n': 'x' } } ), true );
			} );

		it( 'should refuse an all positional path beside an index into the same array', async () =>
		{
			// 'a.$[].n' names the n of every element, so it already names 'a.0.n'. Writing
			// both is the same conflict as writing one path twice, and it is a conflict of
			// the paths ***as written***: an empty array, or an index past the end, does not
			// excuse it. jsongin used to expand the operator first and let the later of the
			// two writes win.
			assert.strictEqual( await refused( { a: [ { n: 1 }, { n: 2 } ] }, { $set: { 'a.$[].n': 0, 'a.0.n': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ 1, 2 ] }, { $set: { 'a.$[]': 0, 'a.1': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ 1 ] }, { $set: { 'a.$[]': 0, 'a.x': 9 } } ), true );
			assert.strictEqual( await refused( { a: [] }, { $set: { 'a.$[].n': 0, 'a.0.n': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ { n: 1 } ] }, { $set: { 'a.$[].n': 0, 'a.5.n': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ { n: 1 } ] }, { $set: { 'a.$[].n': 0 }, $inc: { 'a.0.n': 1 } } ), true );
			assert.strictEqual( await refused( { a: [ { n: [ 1 ] } ] }, { $set: { 'a.$[].n.$[]': 0, 'a.$[].n.0': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ [ 1 ] ] }, { $set: { 'a.$[].$[]': 0, 'a.0.0': 9 } } ), true );
			assert.strictEqual( await refused( { a: [ { b: [ 1 ] } ] }, { $set: { 'a.$[].b.$[]': 0, 'a.0.b.0': 9 } } ), true );
		} );

		it( 'should still write two fields of every element', async () =>
		{
			// The counterpart: different fields below the same elements do not conflict,
			// within one operator or across two.
			let document = await applied( { a: [ { n: 1 } ] }, { $set: { 'a.$[].n': 0, 'a.$[].m': 1 } } );
			assert.deepStrictEqual( document.a, [ { n: 0, m: 1 } ] );
			document = await applied( { a: [ { n: 1 } ] }, { $set: { 'a.$[].n': 0 }, $inc: { 'a.$[].m': 1 } } );
			assert.deepStrictEqual( document.a, [ { n: 0, m: 1 } ] );
		} );

		it( 'should apply the same rule to $min and $max', async () =>
		{
			let document = await applied(
				{ a: [ { n: 1 }, { n: 9 } ] }, { $min: { 'a.$[].n': 5 } } );
			assert.deepStrictEqual( document.a, [ { n: 1 }, { n: 5 } ] );
		} );

	} );

};
