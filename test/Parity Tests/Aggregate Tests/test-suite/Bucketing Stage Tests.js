'use strict';

const assert = require( 'assert' );

/*
	The pipeline stages which put documents into buckets, and the two which cannot be measured
	here at all.

	$bucket and $bucketAuto both group by a computed value and reduce each group the way $group
	does, so what is new is ***how the groups are decided***: $bucket is told the boundaries and
	$bucketAuto is told how many buckets to find.

	***The boundary cases are the whole difficulty.*** Which side of a boundary a value falls
	on, what happens to a value outside every bucket, and whether an empty bucket is reported
	are the three questions an implementation can get wrong while passing every simple test, so
	each is asked below before anything else.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Bucketing Stage Tests', () =>
	{

		let documents = [
			{ _id: 1, n: 1, k: 'a' },
			{ _id: 2, n: 5, k: 'b' },
			{ _id: 3, n: 12, k: 'c' },
			{ _id: 4, n: 18, k: 'd' },
			{ _id: 5, n: 25, k: 'e' },
		];


		//---------------------------------------------------------------------
		async function piped( Pipeline )
		{
			await Driver.SetData( documents );
			return await Driver.Aggregate( Pipeline );
		}


		//---------------------------------------------------------------------
		async function refused( Pipeline )
		{
			try
			{
				await piped( Pipeline );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Bucketing by Boundaries ($bucket)', () =>
		{

			it( 'should put each document in the bucket its value falls in', async () =>
			{
				// ***A boundary belongs to the bucket above it***: the ranges are half open,
				// so 10 is the first value of the second bucket rather than the last of the
				// first. The _id of a bucket is its lower boundary.
				let result = await piped( [ {
					$bucket: { groupBy: '$n', boundaries: [ 0, 10, 20 ], default: 'over' }
				} ] );
				assert.deepStrictEqual( result, [
					{ _id: 0, count: 2 },
					{ _id: 10, count: 2 },
					{ _id: 'over', count: 1 },
				] );
			} );

			it( 'should count with a default output of count', async () =>
			{
				// Not given an output, the stage counts. Given one, it does only what it says.
				let result = await piped( [ {
					$bucket: {
						groupBy: '$n', boundaries: [ 0, 20 ], default: 'over',
						output: { total: { $sum: '$n' }, names: { $push: '$k' } },
					}
				} ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 0, total: 36, names: [ 'a', 'b', 'c', 'd' ] } );
				assert.strictEqual( typeof result[ 0 ].count, 'undefined' );
			} );

			it( 'should put a value outside every bucket into the default', async () =>
			{
				let result = await piped( [ {
					$bucket: { groupBy: '$n', boundaries: [ 10, 20 ], default: 'other' }
				} ] );
				assert.deepStrictEqual( result, [
					{ _id: 10, count: 2 },
					{ _id: 'other', count: 3 },
				] );
			} );

			it( 'should refuse a value outside every bucket when there is no default', async () =>
			{
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: [ 0, 10 ] } } ] ), true );
			} );

			it( 'should accept no default when every value falls in a bucket', async () =>
			{
				let result = await piped( [ { $bucket: { groupBy: '$n', boundaries: [ 0, 30 ] } } ] );
				assert.deepStrictEqual( result, [ { _id: 0, count: 5 } ] );
			} );

			it( 'should leave out a bucket which nothing fell into', async () =>
			{
				// ***An empty bucket is not reported at all***, rather than reported with a
				// count of zero. Nothing falls between 30 and 40, and there is no row for it.
				// The same is true of the default: it appears only if something landed there.
				let result = await piped( [ {
					$bucket: { groupBy: '$n', boundaries: [ 0, 30, 40 ], default: 'over' }
				} ] );
				assert.deepStrictEqual( result, [ { _id: 0, count: 5 } ] );
			} );

			it( 'should refuse boundaries which are too few or out of order', async () =>
			{
				assert.strictEqual( await refused( [ { $bucket: { groupBy: '$n', boundaries: [ 0 ] } } ] ), true );
				assert.strictEqual( await refused( [ { $bucket: { groupBy: '$n', boundaries: [] } } ] ), true );
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: [ 20, 10 ], default: 'x' } } ] ), true );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $bucket: { boundaries: [ 0, 10 ] } } ] ), true );
				assert.strictEqual( await refused( [ { $bucket: { groupBy: '$n' } } ] ), true );
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: [ 0, 30 ], extra: 1 } } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Bucketing by Count ($bucketAuto)', () =>
		{

			it( 'should spread the documents across the number of buckets asked for', async () =>
			{
				// ***The _id is a range***, not a single boundary, which is the visible
				// difference from $bucket.
				//
				// ***An odd document goes to the earlier bucket.*** Five values across two
				// buckets is three then two, not two then three, and the boundary lands on the
				// first value of the later bucket. The max of one bucket is the min of the
				// next, so the ranges are half open the same way $bucket's are - except the
				// last, whose max is the largest value rather than one past it.
				let result = await piped( [ { $bucketAuto: { groupBy: '$n', buckets: 2 } } ] );
				assert.strictEqual( result.length, 2 );
				assert.deepStrictEqual( result[ 0 ]._id, { min: 1, max: 18 } );
				assert.deepStrictEqual( result[ 1 ]._id, { min: 18, max: 25 } );
				assert.strictEqual( result[ 0 ].count, 3 );
				assert.strictEqual( result[ 1 ].count, 2 );
			} );

			it( 'should take an output the same way $bucket does', async () =>
			{
				let result = await piped( [ {
					$bucketAuto: { groupBy: '$n', buckets: 1, output: { total: { $sum: '$n' } } }
				} ] );
				assert.deepStrictEqual( result, [ { _id: { min: 1, max: 25 }, total: 61 } ] );
			} );

			it( 'should produce fewer buckets than asked for when it cannot fill them', async () =>
			{
				// Five documents cannot be spread across ten buckets.
				let result = await piped( [ { $bucketAuto: { groupBy: '$n', buckets: 10 } } ] );
				assert.ok( result.length <= 5, `got ${result.length}` );
				let total = result.reduce( function ( Sum, D ) { return Sum + D.count; }, 0 );
				assert.strictEqual( total, 5 );
			} );

			it( 'should refuse a buckets count which is not a positive whole number', async () =>
			{
				assert.strictEqual( await refused( [ { $bucketAuto: { groupBy: '$n', buckets: 0 } } ] ), true );
				assert.strictEqual( await refused( [ { $bucketAuto: { groupBy: '$n', buckets: -1 } } ] ), true );
				assert.strictEqual( await refused( [ { $bucketAuto: { groupBy: '$n', buckets: 1.5 } } ] ), true );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $bucketAuto: { groupBy: '$n' } } ] ), true );
				assert.strictEqual( await refused( [ { $bucketAuto: { buckets: 2 } } ] ), true );
				assert.strictEqual(
					await refused( [ { $bucketAuto: { groupBy: '$n', buckets: 2, extra: 1 } } ] ), true );
			} );

			it( 'should answer an empty stream with no buckets', async () =>
			{
				let result = await piped( [
					{ $match: { _id: 99 } },
					{ $bucketAuto: { groupBy: '$n', buckets: 2 } },
				] );
				assert.deepStrictEqual( result, [] );
			} );

			it( 'should not split documents which share a value across a boundary', async () =>
			{
				// ***This is why fewer buckets come back than were asked for.*** Grouping by
				// n modulo 2 gives two zeros and three ones; a bucket which would end in the
				// middle of the ones keeps taking until they are all in, so two buckets
				// collapse into one.
				let result = await piped( [
					{ $bucketAuto: { groupBy: { $mod: [ '$n', 2 ] }, buckets: 2 } },
				] );
				assert.strictEqual( result.length, 1 );
				assert.strictEqual( result[ 0 ].count, 5 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'What Both Stages Share', () =>
		{

			it( 'should refuse an output which is not a document of accumulators', async () =>
			{
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: [ 0, 30 ], output: 'nope' } } ] ), true );
				assert.strictEqual(
					await refused( [ { $bucketAuto: { groupBy: '$n', buckets: 1, output: 5 } } ] ), true );
			} );

			it( 'should accept an output which names no accumulator, and disagree about it', async () =>
			{
				// ***An empty output is not a refusal***, which is worth pinning because the
				// neighbouring $project refuses an empty specification.
				//
				// ***And the two stages do not treat it the same way.*** $bucket takes an
				// empty output literally and answers the _id alone, while $bucketAuto treats
				// it as no output at all and falls back to counting. Reproduced rather than
				// smoothed over, since a caller's pipeline has to mean the same thing here as
				// it does against a server.
				let bucketed = await piped( [
					{ $bucket: { groupBy: '$n', boundaries: [ 0, 30 ], output: {} } } ] );
				assert.deepStrictEqual( bucketed, [ { _id: 0 } ] );

				let auto = await piped( [ { $bucketAuto: { groupBy: '$n', buckets: 1, output: {} } } ] );
				assert.deepStrictEqual( auto, [ { _id: { min: 1, max: 25 }, count: 5 } ] );
			} );

			it( 'should keep a field whose accumulator produced no value', async () =>
			{
				// ***The field is written as a null rather than left out***, and $group agrees,
				// so this is a rule about accumulators rather than about bucketing.
				let bucketed = await piped( [ {
					$bucket: {
						groupBy: '$n', boundaries: [ 0, 30 ],
						output: { seen: { $sum: 1 }, missing: { $first: '$nope' } },
					}
				} ] );
				assert.strictEqual( bucketed[ 0 ].seen, 5 );
				assert.strictEqual( bucketed[ 0 ].missing, null );

				let grouped = await piped( [ {
					$group: { _id: null, seen: { $sum: 1 }, missing: { $first: '$nope' } }
				} ] );
				assert.strictEqual( 'missing' in grouped[ 0 ], 'missing' in bucketed[ 0 ] );
			} );

			it( 'should refuse boundaries which are not an array', async () =>
			{
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: 'nope', default: 'x' } } ] ), true );
				assert.strictEqual(
					await refused( [ { $bucket: { groupBy: '$n', boundaries: 5, default: 'x' } } ] ), true );
			} );

		} );

	} );

};
