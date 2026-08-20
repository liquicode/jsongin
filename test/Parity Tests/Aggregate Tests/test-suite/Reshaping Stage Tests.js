'use strict';

const assert = require( 'assert' );

/*
	The pipeline stages which reshape the stream without computing over it.

	Six of them: $unset, $replaceRoot, $replaceWith, $sortByCount, $sample, and $facet.

	***These change what a document looks like or how many there are***, rather than computing
	a new value, which is what separates them from the bucketing and filling stages measured
	elsewhere. Four are shorthands for something the pipeline could already say - $unset is a
	$project of exclusions, $replaceWith is $replaceRoot, $sortByCount is a $group and a $sort -
	and the tests below say so where it matters, because a shorthand which disagrees with the
	long form is a bug rather than a feature.

	***$sample is random***, so the tests assert how many documents come back and that each one
	came from the collection. Asserting which documents would be asserting a coin toss.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Reshaping Stage Tests', () =>
	{

		let documents = [
			{ _id: 1, k: 'a', n: 3, sub: { p: 1, q: 2 }, deep: { x: { y: 5 } } },
			{ _id: 2, k: 'a', n: 1, sub: { p: 9 } },
			{ _id: 3, k: 'b', n: 4, sub: { p: 7, q: 8 } },
			{ _id: 4, k: 'c', n: 2 },
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
		describe( 'Removing Fields ($unset)', () =>
		{

			it( 'should remove one field named as a string', async () =>
			{
				let result = await piped( [ { $match: { _id: 1 } }, { $unset: 'k' } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, n: 3, sub: { p: 1, q: 2 }, deep: { x: { y: 5 } } } );
			} );

			it( 'should remove several fields named as an array', async () =>
			{
				let result = await piped( [ { $match: { _id: 1 } }, { $unset: [ 'k', 'n', 'deep' ] } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, sub: { p: 1, q: 2 } } );
			} );

			it( 'should remove a nested field by dotted path', async () =>
			{
				// ***A path here, not a name*** - the opposite of $unsetField, which names one
				// field and reads a dot as part of the name.
				let result = await piped( [ { $match: { _id: 1 } }, { $unset: 'sub.q' } ] );
				assert.deepStrictEqual( result[ 0 ].sub, { p: 1 } );
			} );

			it( 'should leave a document without the field alone', async () =>
			{
				let result = await piped( [ { $match: { _id: 4 } }, { $unset: [ 'sub', 'nope' ] } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 4, k: 'c', n: 2 } );
			} );

			it( 'should remove _id when asked', async () =>
			{
				let result = await piped( [ { $match: { _id: 4 } }, { $unset: '_id' } ] );
				assert.deepStrictEqual( result[ 0 ], { k: 'c', n: 2 } );
			} );

			it( 'should refuse an empty specification', async () =>
			{
				assert.strictEqual( await refused( [ { $unset: [] } ] ), true );
				assert.strictEqual( await refused( [ { $unset: '' } ] ), true );
			} );

			it( 'should refuse a specification which is not a string or an array of them', async () =>
			{
				assert.strictEqual( await refused( [ { $unset: 3 } ] ), true );
				assert.strictEqual( await refused( [ { $unset: { k: 0 } } ] ), true );
				assert.strictEqual( await refused( [ { $unset: [ 'k', 3 ] } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Promoting a Document ($replaceRoot and $replaceWith)', () =>
		{

			it( 'should promote a sub-document to the top level', async () =>
			{
				// ***_id does not survive*** unless the new root carries one. The stage
				// replaces the document rather than merging into it.
				let result = await piped( [ { $match: { _id: 1 } }, { $replaceRoot: { newRoot: '$sub' } } ] );
				assert.deepStrictEqual( result[ 0 ], { p: 1, q: 2 } );
			} );

			it( 'should promote a computed document', async () =>
			{
				let result = await piped( [
					{ $match: { _id: 1 } },
					{ $replaceRoot: { newRoot: { key: '$k', doubled: { $multiply: [ '$n', 2 ] } } } },
				] );
				assert.deepStrictEqual( result[ 0 ], { key: 'a', doubled: 6 } );
			} );

			it( 'should treat $replaceWith as the same stage without the newRoot wrapper', async () =>
			{
				// Document 4 has no sub, and a missing new root fails the whole pipeline, so
				// it is matched out here rather than being the thing this test measures.
				let root = await piped( [
					{ $match: { sub: { $exists: true } } },
					{ $sort: { _id: 1 } },
					{ $replaceRoot: { newRoot: '$sub' } },
				] );
				let with_ = await piped( [
					{ $match: { sub: { $exists: true } } },
					{ $sort: { _id: 1 } },
					{ $replaceWith: '$sub' },
				] );
				assert.deepStrictEqual( with_, root );
				assert.strictEqual( with_.length, 3 );
			} );

			it( 'should refuse a new root which is missing', async () =>
			{
				// Document 4 has no sub. ***The whole pipeline fails***, rather than that one
				// document being dropped, which is why $ifNull is the usual guard.
				assert.strictEqual( await refused( [ { $replaceRoot: { newRoot: '$sub' } } ] ), true );
				assert.strictEqual( await refused( [ { $replaceWith: '$sub' } ] ), true );
			} );

			it( 'should refuse a new root which is not a document', async () =>
			{
				assert.strictEqual( await refused( [ { $replaceRoot: { newRoot: '$n' } } ] ), true );
				assert.strictEqual( await refused( [ { $replaceWith: '$k' } ] ), true );
			} );

			it( 'should accept a guarded new root', async () =>
			{
				let result = await piped( [
					{ $sort: { _id: 1 } },
					{ $replaceWith: { $ifNull: [ '$sub', { p: 0 } ] } },
				] );
				assert.deepStrictEqual( result[ 3 ], { p: 0 } );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $replaceRoot: {} } ] ), true );
				assert.strictEqual( await refused( [ { $replaceRoot: { newRoot: '$sub', extra: 1 } } ] ), true );
			} );

			it( 'should not complain about a bad new root when no document reaches it', async () =>
			{
				// ***$replaceWith takes any expression*** and only the ***result*** has to be a
				// document, so there is nothing to refuse until a document arrives to be
				// replaced. Over an empty stream it answers an empty stream.
				//
				// $replaceRoot is not the same: its argument document is malformed whatever
				// flows through, so it is refused up front.
				let result = await piped( [ { $match: { _id: 99 } }, { $replaceWith: '$n' } ] );
				assert.deepStrictEqual( result, [] );

				assert.strictEqual(
					await refused( [ { $match: { _id: 99 } }, { $replaceRoot: { wrong: 1 } } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Counting by Value ($sortByCount)', () =>
		{

			it( 'should group by the expression and sort by count, descending', async () =>
			{
				let result = await piped( [ { $sortByCount: '$k' } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 'a', count: 2 } );
				assert.strictEqual( result.length, 3 );
			} );

			it( 'should produce the same rows as the $group and $sort it stands for', async () =>
			{
				let short = await piped( [ { $sortByCount: '$k' } ] );
				let long = await piped( [
					{ $group: { _id: '$k', count: { $sum: 1 } } },
					{ $sort: { count: -1 } },
				] );
				// The two agree on the counts; only the order among equal counts is unspecified.
				assert.deepStrictEqual(
					short.slice().sort( function ( A, B ) { return A._id < B._id ? -1 : 1; } ),
					long.slice().sort( function ( A, B ) { return A._id < B._id ? -1 : 1; } ) );
			} );

			it( 'should group a missing value as null', async () =>
			{
				let result = await piped( [ { $sortByCount: '$sub.q' } ] );
				let null_row = result.find( function ( D ) { return D._id === null; } );
				assert.strictEqual( null_row.count, 2 );
			} );

			it( 'should take an expression operator as well as a path', async () =>
			{
				let result = await piped( [ { $sortByCount: { $toUpper: '$k' } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 'A', count: 2 } );
			} );

			it( 'should refuse an argument which is not a path or an operator', async () =>
			{
				// ***Narrower than "any expression".*** $group would take { k: 1 } as an
				// expression object and group every document under it, which answers a
				// question nobody asked; this stage refuses it. A bare constant is refused
				// for the same reason.
				assert.strictEqual( await refused( [ { $sortByCount: { k: 1 } } ] ), true );
				assert.strictEqual( await refused( [ { $sortByCount: 'k' } ] ), true );
				assert.strictEqual( await refused( [ { $sortByCount: 5 } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking a Sample ($sample)', () =>
		{

			it( 'should take the number of documents asked for', async () =>
			{
				let result = await piped( [ { $sample: { size: 2 } } ] );
				assert.strictEqual( result.length, 2 );
			} );

			it( 'should take documents which are actually in the collection', async () =>
			{
				let result = await piped( [ { $sample: { size: 3 } } ] );
				let ids = result.map( function ( D ) { return D._id; } );
				for ( let index = 0; index < ids.length; index++ )
				{
					assert.ok( [ 1, 2, 3, 4 ].includes( ids[ index ] ), `got ${ids[ index ]}` );
				}
				// ***Without replacement*** - no document appears twice in one sample.
				assert.strictEqual( new Set( ids ).size, ids.length );
			} );

			it( 'should take the whole collection when asked for more than it holds', async () =>
			{
				let result = await piped( [ { $sample: { size: 99 } } ] );
				assert.strictEqual( result.length, 4 );
			} );

			it( 'should take nothing for a size of zero', async () =>
			{
				let result = await piped( [ { $sample: { size: 0 } } ] );
				assert.strictEqual( result.length, 0 );
			} );

			it( 'should truncate a fractional size rather than refusing it', async () =>
			{
				// ***A whole number is not required***, which is worth pinning because the
				// neighbouring N accumulators do require one. A size of 1.5 takes one document.
				let result = await piped( [ { $sample: { size: 1.5 } } ] );
				assert.strictEqual( result.length, 1 );
			} );

			it( 'should refuse a negative size and one which is not a number', async () =>
			{
				assert.strictEqual( await refused( [ { $sample: { size: -1 } } ] ), true );
				assert.strictEqual( await refused( [ { $sample: { size: 'two' } } ] ), true );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $sample: {} } ] ), true );
				assert.strictEqual( await refused( [ { $sample: { size: 1, extra: 1 } } ] ), true );
				assert.strictEqual( await refused( [ { $sample: 2 } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Several Pipelines at Once ($facet)', () =>
		{

			it( 'should run each pipeline over the same input and name its result', async () =>
			{
				let result = await piped( [ {
					$facet: {
						counted: [ { $count: 'total' } ],
						biggest: [ { $sort: { n: -1 } }, { $limit: 1 }, { $project: { _id: 0, n: 1 } } ],
					}
				} ] );

				// ***One document comes out***, whatever went in, with one field per branch.
				assert.strictEqual( result.length, 1 );
				assert.deepStrictEqual( result[ 0 ].counted, [ { total: 4 } ] );
				assert.deepStrictEqual( result[ 0 ].biggest, [ { n: 4 } ] );
			} );

			it( 'should give each branch the whole input, not what another branch left', async () =>
			{
				// If the branches shared a stream, the second would see one document.
				let result = await piped( [ {
					$facet: {
						first: [ { $limit: 1 } ],
						all: [ { $count: 'total' } ],
					}
				} ] );
				assert.strictEqual( result[ 0 ].first.length, 1 );
				assert.deepStrictEqual( result[ 0 ].all, [ { total: 4 } ] );
			} );

			it( 'should answer an empty branch with an empty array', async () =>
			{
				let result = await piped( [ {
					$facet: {
						none: [ { $match: { _id: 99 } } ],
						empty_pipeline: [],
					}
				} ] );
				assert.deepStrictEqual( result[ 0 ].none, [] );
				assert.strictEqual( result[ 0 ].empty_pipeline.length, 4 );
			} );

			it( 'should refuse a branch which is not a pipeline', async () =>
			{
				assert.strictEqual( await refused( [ { $facet: { a: 'nope' } } ] ), true );
				assert.strictEqual( await refused( [ { $facet: { a: [ 'nope' ] } } ] ), true );
			} );

			it( 'should refuse an empty facet and a non-document one', async () =>
			{
				assert.strictEqual( await refused( [ { $facet: {} } ] ), true );
				assert.strictEqual( await refused( [ { $facet: [] } ] ), true );
			} );

		} );

	} );

};
