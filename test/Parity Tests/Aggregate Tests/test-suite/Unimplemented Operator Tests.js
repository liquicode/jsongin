'use strict';

const assert = require( 'assert' );

/*
	Operators MongoDB implements and jsongin does not.

	***These tests are expected to fail under jsongin.*** They are not broken tests, and they
	are not waiting for a bug fix: they are the feature gap, written down where the parity
	report will keep reporting it. A missing operator which nothing measures is a missing
	operator nobody remembers.

	Each one passes against MongoDB, so `npm run parity-test-mongodb` stays green and the
	failures under `npm run parity-test-jsongin` are the whole of the difference.

	Delete a test from here by implementing the operator it names. Nothing else should make
	these pass.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Unimplemented Operator Tests', () =>
	{

		let documents = [
			{ _id: 1, n: 1.567, t: [ 1, 2 ], k: 'a' },
			{ _id: 2, n: -2.5, t: [ 5 ], k: 'a' },
			{ _id: 3, n: 4.25, t: [], k: 'b' },
		];


		//---------------------------------------------------------------------
		// Runs one expression against the first document and returns what it produced.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		describe( 'Arithmetic Expression Operators', () =>
		{

			it( 'should round up with $ceil', async () =>
			{
				assert.strictEqual( await evaluated( { $ceil: 1.2 } ), 2 );
				assert.strictEqual( await evaluated( { $ceil: '$n' } ), 2 );
			} );

			it( 'should round down with $floor', async () =>
			{
				assert.strictEqual( await evaluated( { $floor: 1.8 } ), 1 );
				assert.strictEqual( await evaluated( { $floor: '$n' } ), 1 );
			} );

			it( 'should round to a place with $round', async () =>
			{
				assert.strictEqual( await evaluated( { $round: [ 1.567, 2 ] } ), 1.57 );
				assert.strictEqual( await evaluated( { $round: [ '$n', 1 ] } ), 1.6 );
			} );

			it( 'should truncate to a place with $trunc', async () =>
			{
				assert.strictEqual( await evaluated( { $trunc: [ 1.567, 1 ] } ), 1.5 );
				assert.strictEqual( await evaluated( { $trunc: [ '$n', 0 ] } ), 1 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Array Expression Operators', () =>
		{

			it( 'should count the elements of an array with $size', async () =>
			{
				assert.strictEqual( await evaluated( { $size: '$t' } ), 2 );
				assert.strictEqual( await evaluated( { $size: [ [ 1, 2, 3 ] ] } ), 3 );
			} );

			it( 'should read one element with $arrayElemAt', async () =>
			{
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', 0 ] } ), 1 );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', -1 ] } ), 2 );
			} );

			it( 'should join arrays with $concatArrays', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $concatArrays: [ [ 1 ], [ 2, 3 ] ] } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $concatArrays: [ '$t', [ 9 ] ] } ), [ 1, 2, 9 ] );
			} );

			it( 'should test for membership with the $in expression', async () =>
			{
				// The expression $in takes [ value, array ], which is not the query operator
				// of the same name. See the Operators Which Share a Name reference.
				assert.strictEqual( await evaluated( { $in: [ 2, '$t' ] } ), true );
				assert.strictEqual( await evaluated( { $in: [ 9, '$t' ] } ), false );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Accumulators and Stages', () =>
		{

			it( 'should collect distinct values with the $addToSet accumulator', async () =>
			{
				await Driver.SetData( documents );
				let result = await Driver.Aggregate( [
					{ $group: { _id: null, r: { $addToSet: '$k' } } },
				] );
				assert.deepStrictEqual( result[ 0 ].r.sort(), [ 'a', 'b' ] );
			} );

			it( 'should count documents with the $count stage', async () =>
			{
				await Driver.SetData( documents );
				let result = await Driver.Aggregate( [ { $count: 'total' } ] );
				assert.strictEqual( result[ 0 ].total, 3 );
			} );

		} );

	} );

};
