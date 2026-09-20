'use strict';

const assert = require( 'assert' );

/*
	The group accumulators beyond the first nine.

	Thirteen of them, in four groups which behave quite differently:

		$stdDevPop, $stdDevSamp        reduce a group of numbers to one number
		$mergeObjects                  reduces a group of documents to one document
		$firstN, $lastN, $minN, $maxN  take several values rather than one
		$top, $bottom, $topN, $bottomN take values by a sort of their own
		$median, $percentile           select a value by rank, and are the baseline's own arrivals

	***The N accumulators and the top/bottom accumulators answer different questions***, and
	the difference is worth stating because the names suggest otherwise. $minN takes the
	smallest values ***of one field***; $topN takes whole documents by a sort spec and then
	reads a field of each. When the sort and the field are the same they agree, which is
	exactly when a test cannot tell a wrong implementation from a right one - so the tests
	below sort by one field and output another.

	***An accumulator's order is not the pipeline's order.*** $firstN and $lastN read the group
	in the order it arrived, so they depend on a $sort earlier in the pipeline; $top and
	$bottom carry their own sortBy and do not. Both are exercised here.

	Verified against MongoDB 7.0.40.
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

			// ***These two arrived with MongoDB 7.0, which is the parity baseline.*** Every
			// rule below was measured before it was written down, across seven group sizes and
			// thirteen p values, by jsonx/.plans/tools/percentile-rank-probe.js.
			//
			// ***One behavior is deliberately not asserted here.*** At p 1.0, where the largest
			// value is not positive, MongoDB answers 2.2250738585072014e-308 rather than the
			// maximum - identically on 7.0.40 and 8.3.8, so a defect of long standing rather
			// than a version difference. jsongin answers the maximum. A parity suite cannot
			// hold a case the two engines answer differently on purpose, so that one is pinned
			// in the unit tests and described in the guides.

			it( 'should select a value by rank rather than interpolating', async () =>
			{
				// Values ten apart, so an interpolated answer could not be mistaken for one of
				// the inputs. The rule is index = ceil( p * count ) - 1, counting from zero.
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.25 ], method: 'approximate' } } ), [ 10 ] );
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.3 ], method: 'approximate' } } ), [ 20 ] );
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.6 ], method: 'approximate' } } ), [ 30 ] );
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.8 ], method: 'approximate' } } ), [ 40 ] );
			} );

			it( 'should answer the ends at p 0 and p 1', async () =>
			{
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30 ],
						{ $percentile: { input: '$n', p: [ 0, 1 ], method: 'approximate' } } ), [ 10, 30 ] );
			} );

			it( 'should answer one value per p, in the order they were asked for', async () =>
			{
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.75, 0.25 ], method: 'approximate' } } ), [ 30, 10 ] );
				// A repeated p is answered twice rather than collapsed.
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $percentile: { input: '$n', p: [ 0.5, 0.5 ], method: 'approximate' } } ), [ 20, 20 ] );
			} );

			it( 'should read $median as p 0.5, answering a value rather than an array', async () =>
			{
				assert.strictEqual(
					await accumulated_over( [ 10, 20, 30 ],
						{ $median: { input: '$n', method: 'approximate' } } ), 20 );
				// ***An even count answers the lower of the two middle values***, which falls
				// out of selecting by rank rather than averaging the pair.
				assert.strictEqual(
					await accumulated_over( [ 10, 20, 30, 40 ],
						{ $median: { input: '$n', method: 'approximate' } } ), 20 );
			} );

			it( 'should ignore what it cannot rank', async () =>
			{
				// A string, a null and a missing field are left out, the same rule $sum and
				// $avg follow. Three numbers remain, so p 0.5 is the second of them.
				assert.deepStrictEqual(
					await accumulated_over( [ 10, 'x', 20, 30 ],
						{ $percentile: { input: '$n', p: [ 0.5 ], method: 'approximate' } } ), [ 20 ] );
				assert.deepStrictEqual(
					await accumulated_over( [ 10, null, 20, 30 ],
						{ $percentile: { input: '$n', p: [ 0.5 ], method: 'approximate' } } ), [ 20 ] );
				// ***A NaN is left out as well***, where $sum and $avg keep it: a value which
				// compares false against everything cannot be put in rank order.
				assert.deepStrictEqual(
					await accumulated_over( [ 10, NaN, 20, 30 ],
						{ $percentile: { input: '$n', p: [ 0, 0.5, 1 ], method: 'approximate' } } ), [ 10, 20, 30 ] );
			} );

			it( 'should keep an infinity, which sorts to its end', async () =>
			{
				assert.deepStrictEqual(
					await accumulated_over( [ 10, Infinity, 20, 30 ],
						{ $percentile: { input: '$n', p: [ 1 ], method: 'approximate' } } ), [ Infinity ] );
				assert.deepStrictEqual(
					await accumulated_over( [ 10, -Infinity, 20, 30 ],
						{ $percentile: { input: '$n', p: [ 0 ], method: 'approximate' } } ), [ -Infinity ] );
			} );

			it( 'should answer null when nothing in the group is numeric', async () =>
			{
				assert.deepStrictEqual(
					await accumulated_over( [ 'a', 'b' ],
						{ $percentile: { input: '$n', p: [ 0.5 ], method: 'approximate' } } ), [ null ] );
				assert.strictEqual(
					await accumulated_over( [ 'a', 'b' ],
						{ $median: { input: '$n', method: 'approximate' } } ), null );
			} );

			it( 'should require input and method, and take only approximate', async () =>
			{
				assert.strictEqual( await refused( { $median: { method: 'approximate' } } ), true );
				assert.strictEqual( await refused( { $median: { input: '$n' } } ), true );
				assert.strictEqual( await refused( { $median: { input: '$n', method: 'exact' } } ), true );
				// ***The comparison is case sensitive.***
				assert.strictEqual( await refused( { $median: { input: '$n', method: 'Approximate' } } ), true );
			} );

			it( 'should refuse a field the argument document does not have', async () =>
			{
				// Stricter than most of the surface: a misspelled option is an error here
				// rather than something quietly ignored.
				assert.strictEqual(
					await refused( { $median: { input: '$n', method: 'approximate', extra: 1 } } ), true );
			} );

			it( 'should refuse an argument which is not a document', async () =>
			{
				assert.strictEqual( await refused( { $median: [ 1, 2, 3 ] } ), true );
				assert.strictEqual( await refused( { $median: '$n' } ), true );
			} );

			it( 'should require p of $percentile, and only as constants within 0 and 1', async () =>
			{
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', method: 'approximate' } } ), true );
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', p: [ 1.5 ], method: 'approximate' } } ), true );
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', p: 0.5, method: 'approximate' } } ), true );
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', p: [], method: 'approximate' } } ), true );
				// ***A field path cannot supply p***, though a $literal holding the array can.
				assert.strictEqual(
					await refused( { $percentile: { input: '$n', p: '$n', method: 'approximate' } } ), true );
			} );

			it( 'should never give $median a p', async () =>
			{
				assert.strictEqual(
					await refused( { $median: { input: '$n', p: [ 0.5 ], method: 'approximate' } } ), true );
			} );

		} );
	} );

};
