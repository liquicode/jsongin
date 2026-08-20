'use strict';

const assert = require( 'assert' );

/*
	The group accumulators beyond the first nine.

	Thirteen of them, in four groups which behave quite differently:

		$stdDevPop, $stdDevSamp        reduce a group of numbers to one number
		$mergeObjects                  reduces a group of documents to one document
		$firstN, $lastN, $minN, $maxN  take several values rather than one
		$top, $bottom, $topN, $bottomN take values by a sort of their own
		$median, $percentile           MongoDB 7.0, so not measurable against the baseline

	***The N accumulators and the top/bottom accumulators answer different questions***, and
	the difference is worth stating because the names suggest otherwise. $minN takes the
	smallest values ***of one field***; $topN takes whole documents by a sort spec and then
	reads a field of each. When the sort and the field are the same they agree, which is
	exactly when a test cannot tell a wrong implementation from a right one - so the tests
	below sort by one field and output another.

	***An accumulator's order is not the pipeline's order.*** $firstN and $lastN read the group
	in the order it arrived, so they depend on a $sort earlier in the pipeline; $top and
	$bottom carry their own sortBy and do not. Both are exercised here.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Accumulator Operator Tests', () =>
	{

		// ***The written order differs from the sorted order on purpose***, so that a test
		// which should read the group in arrival order cannot pass by accident when it reads
		// it in sorted order instead.
		let documents = [
			{ _id: 1, k: 'a', n: 3, s: 'c', d: { p: 1 } },
			{ _id: 2, k: 'a', n: 1, s: 'a', d: { q: 2 } },
			{ _id: 3, k: 'b', n: 4, s: 'd', d: { p: 9 } },
			{ _id: 4, k: 'b', n: 2, s: 'b' },
		];


		//---------------------------------------------------------------------
		// Accumulates over every document, in ascending n order.
		async function accumulated( Accumulator )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $sort: { n: 1 } },
				{ $group: { _id: null, r: Accumulator } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		// Accumulates over a group built from values given here rather than from `documents`.
		async function accumulated_over( Values, Accumulator )
		{
			let group = [];
			for ( let index = 0; index < Values.length; index++ )
			{
				group.push( { _id: index + 1, n: Values[ index ] } );
			}
			await Driver.SetData( group );
			let result = await Driver.Aggregate( [
				{ $sort: { _id: 1 } },
				{ $group: { _id: null, r: Accumulator } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		async function refused( Accumulator )
		{
			try
			{
				await accumulated( Accumulator );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Standard Deviation', () =>
		{

			it( 'should divide by the count with $stdDevPop', async () =>
			{
				// mean 5, squared deviations 9+1+1+1+0+0+4+16 = 32, over 8 is 4, root is 2.
				assert.strictEqual(
					await accumulated_over( [ 2, 4, 4, 4, 5, 5, 7, 9 ], { $stdDevPop: '$n' } ), 2 );
			} );

			it( 'should divide by one less than the count with $stdDevSamp', async () =>
			{
				// The same 32, over 7 rather than 8.
				let value = await accumulated_over( [ 2, 4, 4, 4, 5, 5, 7, 9 ], { $stdDevSamp: '$n' } );
				assert.ok( Math.abs( value - Math.sqrt( 32 / 7 ) ) < 1e-12, `got ${value}` );
			} );

			it( 'should answer a single value with zero and null', async () =>
			{
				// ***The two part company here***, and it follows from the divisor: a
				// population of one has no spread, and a sample of one cannot say.
				assert.strictEqual( await accumulated_over( [ 5 ], { $stdDevPop: '$n' } ), 0 );
				assert.strictEqual( await accumulated_over( [ 5 ], { $stdDevSamp: '$n' } ), null );
			} );

			it( 'should ignore a value which is not a number', async () =>
			{
				// The same rule as $sum and $avg, and unlike the expression operators, which
				// throw on a non-numeric operand.
				assert.strictEqual(
					await accumulated_over( [ 2, 'text', 4, null, 6 ], { $stdDevPop: '$n' } ),
					Math.sqrt( 8 / 3 ) );
			} );

			it( 'should answer a group with nothing numeric in it with null', async () =>
			{
				assert.strictEqual( await accumulated_over( [ 'a', 'b' ], { $stdDevPop: '$n' } ), null );
				assert.strictEqual( await accumulated( { $stdDevPop: '$nope' } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Merging a Group ($mergeObjects)', () =>
		{

			it( 'should merge every document in the group', async () =>
			{
				// In ascending n order: { q: 2 }, nothing, { p: 1 }, { p: 9 }.
				assert.deepStrictEqual( await accumulated( { $mergeObjects: '$d' } ), { q: 2, p: 9 } );
			} );

			it( 'should ignore a missing or null value', async () =>
			{
				assert.deepStrictEqual( await accumulated( { $mergeObjects: '$nope' } ), {} );
			} );

			it( 'should refuse a value which is not a document', async () =>
			{
				assert.strictEqual( await refused( { $mergeObjects: '$n' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking Several Values ($firstN, $lastN, $minN, $maxN)', () =>
		{

			it( 'should take from the ends of the group with $firstN and $lastN', async () =>
			{
				// The group arrives in ascending n order because of the $sort.
				assert.deepStrictEqual( await accumulated( { $firstN: { input: '$n', n: 2 } } ), [ 1, 2 ] );
				assert.deepStrictEqual( await accumulated( { $lastN: { input: '$n', n: 2 } } ), [ 3, 4 ] );
			} );

			it( 'should take the extremes with $minN and $maxN', async () =>
			{
				// ***Sorted, and $maxN counts down***, so the first element of either result
				// is the most extreme one.
				assert.deepStrictEqual( await accumulated( { $minN: { input: '$n', n: 2 } } ), [ 1, 2 ] );
				assert.deepStrictEqual( await accumulated( { $maxN: { input: '$n', n: 2 } } ), [ 4, 3 ] );
			} );

			it( 'should take the whole group when n is larger than it', async () =>
			{
				assert.deepStrictEqual( await accumulated( { $firstN: { input: '$n', n: 99 } } ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( await accumulated( { $maxN: { input: '$n', n: 99 } } ), [ 4, 3, 2, 1 ] );
			} );

			it( 'should keep a missing value in $firstN but not in $minN', async () =>
			{
				// ***The two families disagree about a missing value.*** $firstN is positional
				// and reports what it found; $minN is comparative and has nothing to compare.
				assert.deepStrictEqual( await accumulated( { $firstN: { input: '$d', n: 4 } } ),
					[ { q: 2 }, null, { p: 1 }, { p: 9 } ] );
				assert.deepStrictEqual( await accumulated( { $minN: { input: '$nope', n: 2 } } ), [] );
			} );

			it( 'should refuse an n which is not a positive whole number', async () =>
			{
				assert.strictEqual( await refused( { $firstN: { input: '$n', n: 0 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$n', n: -1 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$n', n: 1.5 } } ), true );
			} );

			it( 'should refuse an unknown argument and a missing one', async () =>
			{
				assert.strictEqual( await refused( { $firstN: { input: '$n', n: 2, extra: 1 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$n' } } ), true );
				assert.strictEqual( await refused( { $firstN: { n: 2 } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking by a Sort of Their Own ($top, $bottom, $topN, $bottomN)', () =>
		{

			it( 'should take one document by sortBy and read its output', async () =>
			{
				// ***Sorting by one field and reading another*** is what tells these apart
				// from $minN and $maxN, which can only do both to the same field.
				assert.strictEqual(
					await accumulated( { $top: { sortBy: { n: -1 }, output: '$s' } } ), 'd' );
				assert.strictEqual(
					await accumulated( { $bottom: { sortBy: { n: -1 }, output: '$s' } } ), 'a' );
			} );

			it( 'should ignore the order the group arrived in', async () =>
			{
				// The pipeline sorts ascending and the accumulator sorts descending. The
				// accumulator's own sortBy is the one that decides.
				assert.strictEqual(
					await accumulated( { $top: { sortBy: { n: 1 }, output: '$s' } } ), 'a' );
			} );

			it( 'should take several with $topN and $bottomN', async () =>
			{
				assert.deepStrictEqual(
					await accumulated( { $topN: { n: 2, sortBy: { n: -1 }, output: '$s' } } ), [ 'd', 'c' ] );
				assert.deepStrictEqual(
					await accumulated( { $bottomN: { n: 2, sortBy: { n: -1 }, output: '$s' } } ), [ 'b', 'a' ] );
			} );

			it( 'should sort by several keys', async () =>
			{
				assert.deepStrictEqual(
					await accumulated( { $topN: { n: 2, sortBy: { k: 1, n: -1 }, output: '$s' } } ), [ 'c', 'a' ] );
			} );

			it( 'should output a computed value', async () =>
			{
				assert.deepStrictEqual(
					await accumulated( { $top: { sortBy: { n: -1 }, output: [ '$k', '$n' ] } } ), [ 'b', 4 ] );
			} );

			it( 'should refuse a missing sortBy or output', async () =>
			{
				assert.strictEqual( await refused( { $top: { output: '$s' } } ), true );
				assert.strictEqual( await refused( { $top: { sortBy: { n: -1 } } } ), true );
				assert.strictEqual( await refused( { $topN: { sortBy: { n: -1 }, output: '$s' } } ), true );
			} );

			it( 'should refuse a sortBy which is not a sort specification', async () =>
			{
				assert.strictEqual( await refused( { $top: { sortBy: 'n', output: '$s' } } ), true );
				assert.strictEqual( await refused( { $top: { sortBy: { n: 2 }, output: '$s' } } ), true );
			} );

			it( 'should accept an empty sortBy rather than refusing it', async () =>
			{
				// ***An empty sortBy is not a refusal***, which is worth pinning because it
				// looks like one: a specification naming no field sorts nothing.
				//
				// ***Which document comes back is deliberately not asserted.*** A sort that
				// orders nothing leaves MongoDB free to answer with any document of the group,
				// and it does not answer the way the name suggests - $bottom with an empty
				// sortBy gives the same document as $top, not the far end of the group. That
				// is an artifact of an unordered group rather than a rule, so the test asks
				// only that a value from the group comes back. jsongin answers in arrival
				// order, which is deterministic; see the note on $group ordering.
				let top = await accumulated( { $top: { sortBy: {}, output: '$s' } } );
				assert.ok( [ 'a', 'b', 'c', 'd' ].includes( top ), `got ${JSON.stringify( top )}` );

				let bottom = await accumulated( { $bottom: { sortBy: {}, output: '$s' } } );
				assert.ok( [ 'a', 'b', 'c', 'd' ].includes( bottom ), `got ${JSON.stringify( bottom )}` );
			} );

			it( 'should refuse an argument which is not a document', async () =>
			{
				assert.strictEqual( await refused( { $top: '$s' } ), true );
				assert.strictEqual( await refused( { $topN: 2 } ), true );
			} );

			it( 'should refuse an unknown argument', async () =>
			{
				assert.strictEqual(
					await refused( { $top: { sortBy: { n: -1 }, output: '$s', extra: 1 } } ), true );
				assert.strictEqual(
					await refused( { $topN: { n: 2, sortBy: { n: -1 }, output: '$s', extra: 1 } } ), true );
				// ***n is not an argument of $top***, only of $topN, so giving it one is a
				// mistake rather than a harmless extra.
				assert.strictEqual(
					await refused( { $top: { n: 2, sortBy: { n: -1 }, output: '$s' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The 7.0 Accumulators ($median, $percentile)', () =>
		{

			// These were introduced in MongoDB 7.0 and the parity baseline is 6.0.1, so what
			// is recorded here is that the baseline does not have them. If the baseline server
			// is ever upgraded, these two assertions are the ones to replace with real ones.

			it( 'should not be available on the baseline server', async () =>
			{
				assert.strictEqual(
					await refused( { $median: { input: '$n', method: 'approximate' } } ), true );
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', p: [ 0.5 ], method: 'approximate' } } ), true );
			} );

		} );

	} );

};
