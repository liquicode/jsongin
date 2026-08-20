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

			it( 'should count the documents with the $count stage', async () =>
			{
				// The stage replaces the whole stream with one document, whose only field is
				// the one named here. This is the ***stage*** $count, which takes a field
				// name; the accumulator of the same name takes {} and is tested below.
				let result = await piped( [ { $count: 'total' } ] );
				assert.deepStrictEqual( result, [ { total: 4 } ] );
			} );

			it( 'should count what reaches the $count stage, not what started', async () =>
			{
				let result = await piped( [ { $match: { k: 'a' } }, { $count: 'howMany' } ] );
				assert.deepStrictEqual( result, [ { howMany: 2 } ] );
			} );

			it( 'should produce nothing for a $count over an empty stream', async () =>
			{
				// ***No document at all***, rather than one holding a zero.
				let result = await piped( [ { $match: { k: 'zzz' } }, { $count: 'total' } ] );
				assert.deepStrictEqual( result, [] );
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

			it( 'should index a preserved document as null', async () =>
			{
				// The two options together. A document kept only because it was preserved has
				// no element to number, so its index is null rather than 0 or missing.
				// _id 2 holds an empty array and _id 4 has no field at all.
				let result = await piped( [
					{ $sort: { _id: 1 } },
					{ $unwind: { path: '$t', preserveNullAndEmptyArrays: true, includeArrayIndex: 'i' } },
				] );
				assert.deepStrictEqual( result.map( function ( D ) { return D.i; } ), [ 0, 1, null, 0, null ] );

				// The empty array is removed from the preserved document rather than kept.
				let preserved = result[ 2 ];
				assert.strictEqual( preserved._id, 2 );
				assert.ok( !( 't' in preserved ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Refused Stages', () =>
		{

			/*
				A stage which cannot mean anything is refused, the same way a malformed query,
				update or projection is. These assert only that it was refused.
			*/

			async function refused( Pipeline )
			{
				await Driver.SetData( documents );
				try
				{
					await Driver.Aggregate( Pipeline );
					return false;
				}
				catch ( error )
				{
					return true;
				}
			}

			it( 'should refuse a $count field name which cannot be a field name', async () =>
			{
				assert.ok( await refused( [ { $count: '' } ] ), 'empty' );
				assert.ok( await refused( [ { $count: '$n' } ] ), 'begins with a $' );
				assert.ok( await refused( [ { $count: 'a.b' } ] ), 'contains a dot' );
			} );

			it( 'should refuse an empty $project specification', async () =>
			{
				// ***The opposite of the Project() rule***, where {} returns the whole document.
				// The stage states this itself because Project() cannot tell which of its
				// callers it is serving.
				assert.ok( await refused( [ { $project: {} } ] ) );
			} );

			it( 'should refuse an $unwind with no path after the $', async () =>
			{
				assert.ok( await refused( [ { $unwind: '$' } ] ) );
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

			it( 'should write a null when $first or $last finds no value', async () =>
			{
				// ***The field is written as a null, not left out.*** An expression which
				// produces no value leaves its field out of a $project, and it would be
				// reasonable to expect the same here - but a $group output field is always
				// written, and a missing value becomes a null.
				await Driver.SetData( documents );
				let result = await Driver.Aggregate( [
					{ $group: { _id: null, f: { $first: '$nope' }, l: { $last: '$nope' } } },
				] );
				assert.strictEqual( 'f' in result[ 0 ], true );
				assert.strictEqual( result[ 0 ].f, null );
				assert.strictEqual( result[ 0 ].l, null );
			} );

			it( 'should collect every value with $push', async () =>
			{
				assert.deepStrictEqual( await accumulated( { $push: '$n' } ), [ 1, 2, 3, 4 ] );
			} );

			it( 'should collect distinct values with $addToSet', async () =>
			{
				// Unlike $push, a value already collected is not collected again. ***The order
				// is not specified***, so the result is sorted before comparing: MongoDB makes
				// no promise about it and neither should the test.
				let keys = await accumulated( { $addToSet: '$k' } );
				assert.deepStrictEqual( keys.slice().sort(), [ 'a', 'b' ] );

				let numbers = await accumulated( { $addToSet: '$n' } );
				assert.deepStrictEqual( numbers.slice().sort(), [ 1, 2, 3, 4 ] );
			} );

			it( 'should compare by content in $addToSet', async () =>
			{
				// A document or an array is recognized as already present rather than being
				// added again because it is a different instance.
				let result = await piped( [
					{ $group: { _id: null, r: { $addToSet: '$t' } } },
				] );
				let sets = result[ 0 ].r.map( function ( V ) { return JSON.stringify( V ); } );
				assert.strictEqual( sets.length, 3, `expected three distinct arrays, got ${JSON.stringify( sets )}` );
			} );

			it( 'should skip a missing field in $addToSet', async () =>
			{
				assert.deepStrictEqual( await accumulated( { $addToSet: '$nope' } ), [] );
			} );

			// ***These four were asserted only by unit tests until 2026-08-20.*** Each states
			// something MongoDB has a definite opinion about, which a unit test can only ever
			// confirm rather than check - the blind spot which hid the $group defect. Written
			// as parity tests during the sweep for others of the same kind.

			it( 'should keep a null but drop a missing value in $push', async () =>
			{
				// ***The two part company here***, which is the interesting half: a null is a
				// value and is collected, while a document with no such field contributes
				// nothing at all rather than a null standing in for it.
				await Driver.SetData( [
					{ _id: 1, n: 1 }, { _id: 2, n: null }, { _id: 3 }, { _id: 4, n: 2 },
				] );
				let result = await Driver.Aggregate( [
					{ $sort: { _id: 1 } },
					{ $group: { _id: null, r: { $push: '$n' } } },
				] );
				assert.deepStrictEqual( result[ 0 ].r, [ 1, null, 2 ] );
			} );

			it( 'should keep a null but drop a missing value in $addToSet', async () =>
			{
				await Driver.SetData( [ { _id: 1, a: 1 }, { _id: 2, a: null }, { _id: 3 } ] );
				let result = await Driver.Aggregate( [
					{ $group: { _id: null, r: { $addToSet: '$a' } } },
				] );
				assert.strictEqual( result[ 0 ].r.length, 2 );
				assert.ok( result[ 0 ].r.includes( null ) );
				assert.ok( result[ 0 ].r.includes( 1 ) );
			} );

			it( 'should order mixed types by the BSON type order in $min and $max', async () =>
			{
				// A number sorts before a string, and a string before a boolean.
				await Driver.SetData( [
					{ _id: 1, n: 'abc' }, { _id: 2, n: true }, { _id: 3, n: 5 },
				] );
				let result = await Driver.Aggregate( [
					{ $group: { _id: null, low: { $min: '$n' }, high: { $max: '$n' } } },
				] );
				assert.strictEqual( result[ 0 ].low, 5 );
				assert.strictEqual( result[ 0 ].high, true );
			} );

			it( 'should ignore a null as well as a missing value in $min and $max', async () =>
			{
				await Driver.SetData( [
					{ _id: 1, n: 3 }, { _id: 2, n: null }, { _id: 3 }, { _id: 4, n: 2 },
				] );
				let result = await Driver.Aggregate( [
					{ $group: { _id: null, low: { $min: '$n' } } },
				] );
				assert.strictEqual( result[ 0 ].low, 2 );
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

			it( 'should take a NaN into the total rather than skipping it', async () =>
			{
				// A NaN is a number, so it is accumulated like one and takes the whole result
				// with it. It is not the same case as a non-numeric value, which is skipped —
				// the test below is the counterpart.
				await Driver.SetData( [ { _id: 1, n: 1 }, { _id: 2, n: NaN }, { _id: 3, n: 3 } ] );
				let result = await Driver.Aggregate( [ { $group: { _id: null, r: { $sum: '$n' } } } ] );
				assert.ok( Number.isNaN( result[ 0 ].r ) );

				let averaged = await Driver.Aggregate( [ { $group: { _id: null, r: { $avg: '$n' } } } ] );
				assert.ok( Number.isNaN( averaged[ 0 ].r ) );
			} );

			it( 'should skip a value which is not a number', async () =>
			{
				await Driver.SetData( [ { _id: 1, n: 1 }, { _id: 2, n: 'text' }, { _id: 3, n: 3 } ] );
				let result = await Driver.Aggregate( [ { $group: { _id: null, r: { $sum: '$n' } } } ] );
				assert.strictEqual( result[ 0 ].r, 4 );

				let averaged = await Driver.Aggregate( [ { $group: { _id: null, r: { $avg: '$n' } } } ] );
				assert.strictEqual( averaged[ 0 ].r, 2 );
			} );

		} );


		//---------------------------------------------------------------------
		// ***Behavior which only the unit tests had an opinion about.***
		//
		// Each of these states something MongoDB defines, and each was asserted only in
		// test/Unit Tests/, where a test can confirm what jsongin does but never disagree with
		// it. That is the blind spot which let $group drop a field for seven families. Written
		// here during the sweep for others of the same kind.
		describe( 'Swept In From the Unit Tests', () =>
		{

			it( 'should group a missing key with the nulls', async () =>
			{
				// A document which has no group key at all lands with the ones holding a null,
				// rather than forming a group of its own.
				await Driver.SetData( [
					{ _id: 1, g: null }, { _id: 2 }, { _id: 3, g: 'x' },
				] );
				let result = await Driver.Aggregate( [
					{ $group: { _id: '$g', n: { $sum: 1 } } },
					{ $sort: { n: -1 } },
				] );
				assert.strictEqual( result.length, 2 );
				assert.strictEqual( result[ 0 ]._id, null );
				assert.strictEqual( result[ 0 ].n, 2 );
			} );

			it( 'should not group values of different types together', async () =>
			{
				// ***The type is part of the key.*** A number and the string of that number
				// serialize alike and are still two groups.
				await Driver.SetData( [ { _id: 1, g: 1 }, { _id: 2, g: '1' } ] );
				let result = await Driver.Aggregate( [ { $group: { _id: '$g', n: { $sum: 1 } } } ] );
				assert.strictEqual( result.length, 2 );
			} );

			it( 'should not add a field whose expression produces no value in $addFields', async () =>
			{
				// ***Here the field is left out***, which is the opposite of what $group does
				// with an accumulator that produced nothing. The two rules sit next to each
				// other and disagree, which is exactly why assuming one from the other is how
				// the $group defect was written in the first place.
				await Driver.SetData( [ { _id: 1, a: 1 } ] );
				let result = await Driver.Aggregate( [ { $addFields: { x: '$nope' } } ] );
				assert.strictEqual( 'x' in result[ 0 ], false );
			} );

			it( 'should sort a document missing the sort field as though it were null', async () =>
			{
				await Driver.SetData( [
					{ _id: 1, s: 2 }, { _id: 2 }, { _id: 3, s: null }, { _id: 4, s: 1 },
				] );
				let result = await Driver.Aggregate( [
					{ $sort: { s: 1, _id: 1 } },
					{ $project: { _id: 1 } },
				] );
				// The missing one and the null one sort together, ahead of the numbers.
				assert.deepStrictEqual(
					result.map( function ( D ) { return D._id; } ), [ 2, 3, 4, 1 ] );
			} );

			it( 'should sort mixed types by the BSON type order', async () =>
			{
				await Driver.SetData( [
					{ _id: 1, s: 'abc' }, { _id: 2, s: true }, { _id: 3, s: 5 },
				] );
				let result = await Driver.Aggregate( [
					{ $sort: { s: 1 } },
					{ $project: { _id: 1 } },
				] );
				assert.deepStrictEqual(
					result.map( function ( D ) { return D._id; } ), [ 3, 1, 2 ] );
			} );

		} );

	} );

};
