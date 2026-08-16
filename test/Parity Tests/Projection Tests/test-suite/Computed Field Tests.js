'use strict';

const assert = require( 'assert' );

/*
	Computed fields in a projection, and the projections MongoDB refuses.

	A projection value which is neither a truthy nor a falsy flag is an ***expression***, so a
	projection is a small aggregation. That makes a computed field an inclusion, which is why
	combining one with an exclusion is refused.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
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
	// Answers whether the engine refused the projection.
	async function refused( Document, Projection )
	{
		await Driver.SetData( [ Document ] );
		try
		{
			await Driver.Find( {}, Projection );
			return false;
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'Computed Field Tests', () =>
	{

		let document = { _id: 7, n: 5, s: 'hello', o: { x: 1, y: 2 }, t: [ 1, 2, 3 ] };


		it( 'should compute a field from an expression', async () =>
		{
			let result = await projected( document, { _id: 0, doubled: { $multiply: [ '$n', 2 ] } } );
			assert.deepStrictEqual( result, { doubled: 10 } );
		} );

		it( 'should copy a field with a field path', async () =>
		{
			let result = await projected( document, { _id: 0, copy: '$s' } );
			assert.deepStrictEqual( result, { copy: 'hello' } );
		} );

		it( 'should take a nested field with a field path', async () =>
		{
			let result = await projected( document, { _id: 0, taken: '$o.x' } );
			assert.deepStrictEqual( result, { taken: 1 } );
		} );

		it( 'should store a literal with $literal', async () =>
		{
			let result = await projected( document, { _id: 0, lit: { $literal: 3 } } );
			assert.deepStrictEqual( result, { lit: 3 } );
		} );

		it( 'should build a nested document of computed fields', async () =>
		{
			let result = await projected( document, { _id: 0, nested: { deep: '$n' } } );
			assert.deepStrictEqual( result, { nested: { deep: 5 } } );
		} );

		it( 'should carry an included field alongside a computed one', async () =>
		{
			let result = await projected( document, { _id: 0, n: 1, doubled: { $multiply: [ '$n', 2 ] } } );
			assert.deepStrictEqual( result, { n: 5, doubled: 10 } );
		} );

		it( 'should treat a truthy number and true alike', async () =>
		{
			assert.deepStrictEqual( await projected( document, { _id: 0, n: 1 } ), { n: 5 } );
			assert.deepStrictEqual( await projected( document, { _id: 0, n: true } ), { n: 5 } );
		} );

		it( 'should include a nested path', async () =>
		{
			let result = await projected( document, { _id: 0, 'o.x': 1 } );
			assert.deepStrictEqual( result, { o: { x: 1 } } );
		} );

		it( 'should exclude a nested path', async () =>
		{
			let result = await projected( document, { _id: 0, 'o.x': 0 } );
			assert.deepStrictEqual( result, { n: 5, s: 'hello', o: { y: 2 }, t: [ 1, 2, 3 ] } );
		} );

		it( 'should ignore an excluded field which is not in the document', async () =>
		{
			let result = await projected( document, { _id: 0, nope: 0 } );
			assert.deepStrictEqual( result, { n: 5, s: 'hello', o: { x: 1, y: 2 }, t: [ 1, 2, 3 ] } );
		} );

		it( 'should keep _id through an exclusion which does not name it', async () =>
		{
			await Driver.SetData( [ document ] );
			let found = await Driver.Find( {}, { n: 0 } );
			assert.strictEqual( found[ 0 ]._id, 7 );
		} );


		//---------------------------------------------------------------------
		describe( 'Refused Projections', () =>
		{

			it( 'should refuse an inclusion and an exclusion together', async () =>
			{
				// There is no sensible meaning for it, and _id is the one exception.
				assert.ok( await refused( document, { n: 1, s: 0 } ) );
			} );

			it( 'should refuse a computed field within an exclusion', async () =>
			{
				// A computed field is an inclusion, so this is the case above in disguise.
				assert.ok( await refused( document, { n: 0, doubled: { $multiply: [ '$n', 2 ] } } ) );
			} );

		} );

	} );

};
