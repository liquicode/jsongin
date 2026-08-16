'use strict';

const assert = require( 'assert' );

/*
	The pipeline stages and the group accumulators, measured one option at a time.

	Ad-Hoc Tests exercises these in combination, the way a caller uses them. This suite takes
	them apart instead, so that a single option which drifts is named by the failure rather
	than hidden inside a larger pipeline.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Stage and Accumulator Tests', () =>
	{

		let documents = [
			{ _id: 1, k: 'a', n: 1, t: [ 1, 2 ] },
			{ _id: 2, k: 'a', n: 2, t: [] },
			{ _id: 3, k: 'b', n: 3, t: [ 5 ] },
			{ _id: 4, k: 'b', n: 4 },
		];


		//---------------------------------------------------------------------
		async function piped( Pipeline )
		{
			await Driver.SetData( documents );
			return await Driver.Aggregate( Pipeline );
		}


		//---------------------------------------------------------------------
		describe( 'Stages', () =>
		{

			it( 'should select documents with $match', async () =>
			{
				let result = await piped( [ { $match: { k: 'a' } } ] );
				assert.strictEqual( result.length, 2 );
			} );

			it( 'should select with an operator in $match', async () =>
			{
				let result = await piped( [ { $match: { n: { $gt: 2 } } } ] );
				assert.strictEqual( result.length, 2 );
			} );

			it( 'should order by one key and by several with $sort', async () =>
			{
				let one = await piped( [ { $sort: { n: -1 } }, { $project: { _id: 0, n: 1 } } ] );
				assert.deepStrictEqual( one.map( function ( D ) { return D.n; } ), [ 4, 3, 2, 1 ] );

				let two = await piped( [ { $sort: { k: 1, n: -1 } }, { $project: { _id: 0, n: 1 } } ] );
				assert.deepStrictEqual( two.map( function ( D ) { return D.n; } ), [ 2, 1, 4, 3 ] );
			} );

			it( 'should take and drop documents with $limit and $skip', async () =>
			{
				let limited = await piped( [ { $sort: { n: 1 } }, { $limit: 2 } ] );
				assert.deepStrictEqual( limited.map( function ( D ) { return D.n; } ), [ 1, 2 ] );

				let skipped = await piped( [ { $sort: { n: 1 } }, { $skip: 3 } ] );
				assert.deepStrictEqual( skipped.map( function ( D ) { return D.n; } ), [ 4 ] );
			} );

			it( 'should add a field with $addFields without removing the others', async () =>
			{
				let result = await piped( [ { $match: { _id: 1 } }, { $addFields: { extra: 9 } } ] );
				assert.strictEqual( result[ 0 ].extra, 9 );
				assert.strictEqual( result[ 0 ].n, 1 );
			} );

			it( 'should compute a field with $addFields', async () =>
			{
				let result = await piped( [ { $match: { _id: 1 } }, { $addFields: { doubled: { $multiply: [ '$n', 2 ] } } } ] );
				assert.strictEqual( result[ 0 ].doubled, 2 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$unwind', () =>
		{

			it( 'should produce one document per element', async () =>
			{
				let result = await piped( [ { $unwind: '$t' }, { $project: { _id: 0, t: 1 } } ] );
				assert.deepStrictEqual( result.map( function ( D ) { return D.t; } ), [ 1, 2, 5 ] );
			} );

			it( 'should drop a document whose array is empty or missing', async () =>
			{
				// _id 2 holds an empty array and _id 4 has no field at all. Both are dropped.
				let result = await piped( [ { $unwind: '$t' } ] );
				assert.strictEqual( result.length, 3 );
			} );

			it( 'should keep those documents with preserveNullAndEmptyArrays', async () =>
			{
				let result = await piped( [ { $unwind: { path: '$t', preserveNullAndEmptyArrays: true } } ] );
				assert.strictEqual( result.length, 5 );
			} );

			it( 'should number the elements with includeArrayIndex', async () =>
			{
				let result = await piped( [
					{ $match: { _id: 1 } },
					{ $unwind: { path: '$t', includeArrayIndex: 'i' } },
					{ $project: { _id: 0, i: 1 } },
				] );
				assert.deepStrictEqual( result.map( function ( D ) { return D.i; } ), [ 0, 1 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$group', () =>
		{

			it( 'should group by a field', async () =>
			{
				let result = await piped( [
					{ $group: { _id: '$k', total: { $sum: '$n' } } },
					{ $sort: { _id: 1 } },
				] );
				assert.deepStrictEqual( result, [ { _id: 'a', total: 3 }, { _id: 'b', total: 7 } ] );
			} );

			it( 'should group every document together with a null key', async () =>
			{
				let result = await piped( [ { $group: { _id: null, total: { $sum: '$n' } } } ] );
				assert.strictEqual( result.length, 1 );
				assert.strictEqual( result[ 0 ].total, 10 );
			} );

			it( 'should group by a compound key', async () =>
			{
				let result = await piped( [
					{ $group: { _id: { k: '$k' }, c: { $sum: 1 } } },
					{ $sort: { '_id.k': 1 } },
				] );
				assert.deepStrictEqual( result, [ { _id: { k: 'a' }, c: 2 }, { _id: { k: 'b' }, c: 2 } ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Accumulators', () =>
		{

			async function accumulated( Accumulator )
			{
				let result = await piped( [ { $sort: { n: 1 } }, { $group: { _id: null, r: Accumulator } } ] );
				return result[ 0 ].r;
			}

			it( 'should total with $sum', async () =>
			{
				assert.strictEqual( await accumulated( { $sum: '$n' } ), 10 );
				assert.strictEqual( await accumulated( { $sum: 1 } ), 4 );
			} );

			it( 'should average with $avg', async () =>
			{
				assert.strictEqual( await accumulated( { $avg: '$n' } ), 2.5 );
			} );

			it( 'should take the extremes with $min and $max', async () =>
			{
				assert.strictEqual( await accumulated( { $min: '$n' } ), 1 );
				assert.strictEqual( await accumulated( { $max: '$n' } ), 4 );
			} );

			it( 'should take the ends with $first and $last', async () =>
			{
				assert.strictEqual( await accumulated( { $first: '$n' } ), 1 );
				assert.strictEqual( await accumulated( { $last: '$n' } ), 4 );
			} );

			it( 'should collect every value with $push', async () =>
			{
				assert.deepStrictEqual( await accumulated( { $push: '$n' } ), [ 1, 2, 3, 4 ] );
			} );

			it( 'should count the group with the $count accumulator', async () =>
			{
				assert.strictEqual( await accumulated( { $count: {} } ), 4 );
			} );

			it( 'should ignore a field which is not there', async () =>
			{
				// $sum of nothing is zero, and $avg of nothing is null rather than zero.
				assert.strictEqual( await accumulated( { $sum: '$nope' } ), 0 );
				assert.strictEqual( await accumulated( { $avg: '$nope' } ), null );
				assert.strictEqual( await accumulated( { $min: '$nope' } ), null );
			} );

		} );

	} );

};
