'use strict';

const assert = require( 'assert' );

/*
	The shape of a projected document, as MongoDB produces it.

	The Ad-Hoc suite beside this one covers inclusion and exclusion of named fields. This one
	covers the cases which decide the shape of the result rather than its contents: what an
	empty projection means, what a path which crosses an array produces, and which fields
	survive when a projection selects nothing.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Projects one document and returns the result, with _id removed so that a test can state
	// the whole expected shape. Whether _id survives is asserted separately, where it is the
	// subject rather than noise.
	async function projected( Document, Projection )
	{
		await Driver.SetData( [ Document ] );
		let found = await Driver.Find( {}, Projection );
		assert.strictEqual( found.length, 1, 'the projection did not return one document' );
		let result = found[ 0 ];
		delete result._id;
		return result;
	}


	//---------------------------------------------------------------------
	describe( 'Projection Shape Tests', () =>
	{

		it( 'should return the whole document for an empty projection', async () =>
		{
			// An empty projection selects nothing to include and nothing to exclude, which
			// leaves the document as it was.
			let result = await projected( { a: 1, b: 2 }, {} );
			assert.deepStrictEqual( result, { a: 1, b: 2 } );
		} );

		it( 'should keep _id by default', async () =>
		{
			await Driver.SetData( [ { _id: 1, a: 1, b: 2 } ] );
			let found = await Driver.Find( {}, { a: 1 } );
			assert.strictEqual( found[ 0 ]._id, 1 );
			assert.strictEqual( found[ 0 ].a, 1 );
			assert.ok( !( 'b' in found[ 0 ] ) );
		} );

		it( 'should suppress _id on request', async () =>
		{
			await Driver.SetData( [ { _id: 1, a: 1 } ] );
			let found = await Driver.Find( {}, { a: 1, _id: 0 } );
			assert.deepStrictEqual( found[ 0 ], { a: 1 } );
		} );

		it( 'should return everything but _id when only _id is suppressed', async () =>
		{
			await Driver.SetData( [ { _id: 1, a: 1, b: 2 } ] );
			let found = await Driver.Find( {}, { _id: 0 } );
			assert.deepStrictEqual( found[ 0 ], { a: 1, b: 2 } );
		} );

		it( 'should omit a field which is not in the document', async () =>
		{
			let result = await projected( { a: 1 }, { zz: 1 } );
			assert.deepStrictEqual( result, {} );
		} );

		it( 'should keep the array when a path crosses one', async () =>
		{
			let result = await projected( { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] }, { 'a.x': 1 } );
			assert.deepStrictEqual( result, { a: [ { x: 1 }, { x: 3 } ] } );
		} );

		it( 'should exclude through an array element by element', async () =>
		{
			let result = await projected( { a: [ { x: 1, y: 2 } ] }, { 'a.y': 0 } );
			assert.deepStrictEqual( result, { a: [ { x: 1 } ] } );
		} );

		it( 'should not exclude an array element by index', async () =>
		{
			// A projection does not index an array, with any numeric key. Every key applies
			// to the elements, so there is nothing named '1' to remove and the array comes
			// back whole. This is the projection rule, not the query rule: { 'a.1': 1 } in a
			// query does index.
			//
			// jsongin used to index and delete the element, which disagreed with MongoDB and
			// left a sparse hole that JSON cannot represent.
			assert.deepStrictEqual( await projected( { a: [ 1, 2, 3 ] }, { 'a.1': 0 } ), { a: [ 1, 2, 3 ] } );
			assert.deepStrictEqual( await projected( { a: [ 1, 2, 3 ] }, { 'a.-1': 0 } ), { a: [ 1, 2, 3 ] } );
			assert.deepStrictEqual(
				await projected( { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] }, { 'a.0.x': 0 } ),
				{ a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] } );
		} );

		it( 'should take two fields from the same array into one object per element', async () =>
		{
			let result = await projected( { a: [ { x: 1, y: 2, w: 3 } ] }, { 'a.x': 1, 'a.y': 1 } );
			assert.deepStrictEqual( result, { a: [ { x: 1, y: 2 } ] } );
		} );

		it( 'should keep a nested document shape', async () =>
		{
			let result = await projected( { a: { x: 1, y: 2 } }, { 'a.x': 1 } );
			assert.deepStrictEqual( result, { a: { x: 1 } } );
		} );

	} );

};
