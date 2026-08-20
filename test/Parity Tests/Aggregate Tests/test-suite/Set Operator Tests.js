'use strict';

const assert = require( 'assert' );

/*
	The set expression operators.

	Seven of them: $setEquals, $setIntersection, $setUnion, $setDifference, $setIsSubset,
	$allElementsTrue, and $anyElementTrue.

	***An array is read as a set here, and that changes what it means.*** Order stops
	mattering and repeats stop counting, so [ 1, 1, 2 ] and [ 2, 1 ] are the same set. Every
	test below states which of those two rules it is asking about, because an implementation
	can easily get one right and the other wrong.

	***The order of the results was the open question, and the answer is BSON order.*** A set
	has no order, so an operator returning one has to pick something to hand back. The tests
	use inputs whose sorted order differs from their written order, and MongoDB returns them
	sorted - including across types, where null comes before numbers, then strings, then
	objects, then arrays, then booleans.

	***The family is not consistent about a null operand***, which is reproduced rather than
	smoothed over: $setUnion, $setIntersection, and $setDifference answer a null with a null,
	while $setEquals, $setIsSubset, $allElementsTrue, and $anyElementTrue refuse one.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Set Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				a: [ 3, 1, 2 ],
				b: [ 3, 4 ],
				dup: [ 1, 1, 2 ],
				empty_list: [],
				mixed: [ 2, 'x', null, true ],
				empty: null,
				text: 'nope',
			},
		];


		//---------------------------------------------------------------------
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
		async function refused( Expression )
		{
			try
			{
				await evaluated( Expression );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Comparing Sets', () =>
		{

			it( 'should compare sets with $setEquals', async () =>
			{
				// Order does not matter and repeats do not count.
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1, 2 ], [ 2, 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1, 1, 2 ], [ 1, 2 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setEquals: [ '$dup', [ 2, 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1, 2 ], [ 1, 3 ] ] } ), false );
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1, 2 ], [ 1 ] ] } ), false );
				// More than two sets are compared with each other.
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1 ], [ 1 ], [ 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1 ], [ 1 ], [ 2 ] ] } ), false );
				// Two empty sets are equal.
				assert.strictEqual( await evaluated( { $setEquals: [ [], [] ] } ), true );
				// ***Elements are compared by content***, so documents and arrays work.
				assert.strictEqual( await evaluated( { $setEquals: [ [ { a: 1 } ], [ { a: 1 } ] ] } ), true );
				assert.strictEqual( await evaluated( { $setEquals: [ [ [ 1, 2 ] ], [ [ 1, 2 ] ] ] } ), true );
				// One set is not enough, and a set has to be an array.
				assert.strictEqual( await refused( { $setEquals: [ [ 1 ] ] } ), true );
				assert.strictEqual( await refused( { $setEquals: [ [ 1 ], 'x' ] } ), true );
				assert.strictEqual( await refused( { $setEquals: [ [ 1 ], null ] } ), true );
			} );

			it( 'should test containment with $setIsSubset', async () =>
			{
				assert.strictEqual( await evaluated( { $setIsSubset: [ [ 1, 2 ], [ 1, 2, 3 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setIsSubset: [ [ 1, 4 ], [ 1, 2, 3 ] ] } ), false );
				// A set is a subset of itself, and the empty set is a subset of everything.
				assert.strictEqual( await evaluated( { $setIsSubset: [ [ 1, 2 ], [ 2, 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setIsSubset: [ [], [ 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $setIsSubset: [ [], [] ] } ), true );
				assert.strictEqual( await evaluated( { $setIsSubset: [ [ 1 ], [] ] } ), false );
				// Repeats do not make it any less of a subset.
				assert.strictEqual( await evaluated( { $setIsSubset: [ '$dup', [ 1, 2 ] ] } ), true );
				// Exactly two sets, and both must be arrays.
				assert.strictEqual( await refused( { $setIsSubset: [ [ 1 ] ] } ), true );
				assert.strictEqual( await refused( { $setIsSubset: [ [ 1 ], [ 1 ], [ 1 ] ] } ), true );
				assert.strictEqual( await refused( { $setIsSubset: [ [ 1 ], 'x' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Combining Sets', () =>
		{

			it( 'should combine sets with $setUnion', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ 1, 2 ], [ 2, 3 ] ] } ), [ 1, 2, 3 ] );
				// The input is written out of order, so this says what order comes back.
				assert.deepStrictEqual( await evaluated( { $setUnion: [ '$a', [ 2 ] ] } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $setUnion: [ '$dup', [] ] } ), [ 1, 2 ] );
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [], [] ] } ), [] );
				// One set, and more than two.
				assert.deepStrictEqual( await evaluated( { $setUnion: [ '$a' ] } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ 1 ], [ 2 ], [ 3 ] ] } ), [ 1, 2, 3 ] );
				assert.strictEqual( await refused( { $setUnion: [ [ 1 ], 'x' ] } ), true );
			} );

			it( 'should find common elements with $setIntersection', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ '$a', '$b' ] } ), [ 3 ] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ [ 1, 2 ], [ 3 ] ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ [ 3, 1, 2 ], [ 2, 3, 1 ] ] } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ '$dup', [ 1 ] ] } ), [ 1 ] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ [], [ 1 ] ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ [ 1 ], [ 1 ], [ 1 ] ] } ), [ 1 ] );
				assert.strictEqual( await refused( { $setIntersection: [ [ 1 ], 'x' ] } ), true );
			} );

			it( 'should remove elements with $setDifference', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $setDifference: [ '$a', '$b' ] } ), [ 1, 2 ] );
				assert.deepStrictEqual( await evaluated( { $setDifference: [ [ 1, 2 ], [ 1, 2 ] ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $setDifference: [ [], [ 1 ] ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $setDifference: [ [ 1 ], [] ] } ), [ 1 ] );
				assert.deepStrictEqual( await evaluated( { $setDifference: [ '$dup', [ 2 ] ] } ), [ 1 ] );
				// ***Exactly two sets***, unlike the other combining operators.
				assert.strictEqual( await refused( { $setDifference: [ [ 1 ] ] } ), true );
				assert.strictEqual( await refused( { $setDifference: [ [ 1 ], [ 2 ], [ 3 ] ] } ), true );
				assert.strictEqual( await refused( { $setDifference: [ [ 1 ], 'x' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'What Order, and What Counts as the Same Element', () =>
		{

			it( 'should return a set in BSON order rather than in the order written', async () =>
			{
				// ***This is the answer to the open question above.*** The elements come back
				// sorted by MongoDB's type order - null, then numbers, then strings, then
				// objects, then arrays, then booleans - and not in the order they were given.
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ true, 'x', 2, null ] ] } ),
					[ null, 2, 'x', true ] );
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ 'b', 'a' ], [ 'c' ] ] } ),
					[ 'a', 'b', 'c' ] );
				assert.deepStrictEqual( await evaluated( { $setIntersection: [ '$mixed', [ true, null, 2, 'x' ] ] } ),
					[ null, 2, 'x', true ] );
			} );

			it( 'should count elements the same by content, not by type alone', async () =>
			{
				// A number and the string of that number are different elements.
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1 ], [ '1' ] ] } ), false );
				assert.strictEqual( await evaluated( { $setEquals: [ [ 1 ], [ true ] ] } ), false );
				// Documents and arrays are the same element when their contents are.
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ { a: 1 }, { a: 1 } ] ] } ), [ { a: 1 } ] );
				assert.deepStrictEqual( await evaluated( { $setUnion: [ [ [ 1 ], [ 1 ] ] ] } ), [ [ 1 ] ] );
				// ***And field order does not make two documents different.***
				assert.strictEqual( await evaluated( { $setEquals: [ [ { a: 1, b: 2 } ], [ { b: 2, a: 1 } ] ] } ), false );
			} );

			it( 'should propagate a null through the combining operators', async () =>
			{
				assert.strictEqual( await evaluated( { $setUnion: [ [ 1 ], '$empty' ] } ), null );
				assert.strictEqual( await evaluated( { $setIntersection: [ [ 1 ], '$empty' ] } ), null );
				assert.strictEqual( await evaluated( { $setDifference: [ [ 1 ], '$empty' ] } ), null );
				assert.strictEqual( await evaluated( { $setUnion: [ [ 1 ], '$missing' ] } ), null );
			} );

			it( 'should refuse a null where the combining operators would have propagated it', async () =>
			{
				// ***The family is not consistent about this, and that is reproduced rather
				// than smoothed over.*** $setUnion answers a null with a null; $setIsSubset
				// refuses one outright, in either position.
				assert.strictEqual( await refused( { $setIsSubset: [ [ 1 ], '$empty' ] } ), true );
				assert.strictEqual( await refused( { $setIsSubset: [ '$empty', [ 1 ] ] } ), true );
				assert.strictEqual( await refused( { $allElementsTrue: [ '$empty' ] } ), true );
				assert.strictEqual( await refused( { $anyElementTrue: [ '$empty' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Testing Every Element', () =>
		{

			it( 'should test every element with $allElementsTrue', async () =>
			{
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [ true, 1, 'x' ] ] } ), true );
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [ true, 0 ] ] } ), false );
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [ true, null ] ] } ), false );
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [ true, false ] ] } ), false );
				// ***Everything else is true***, including an empty string and an empty array.
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [ '', [], {} ] ] } ), true );
				// All of nothing is true.
				assert.strictEqual( await evaluated( { $allElementsTrue: [ [] ] } ), true );
				assert.strictEqual( await refused( { $allElementsTrue: [ 'x' ] } ), true );
			} );

			it( 'should test any element with $anyElementTrue', async () =>
			{
				assert.strictEqual( await evaluated( { $anyElementTrue: [ [ false, 1 ] ] } ), true );
				assert.strictEqual( await evaluated( { $anyElementTrue: [ [ false, 0, null ] ] } ), false );
				assert.strictEqual( await evaluated( { $anyElementTrue: [ [ '' ] ] } ), true );
				// ***Any of nothing is false***, where all of nothing was true.
				assert.strictEqual( await evaluated( { $anyElementTrue: [ [] ] } ), false );
				assert.strictEqual( await refused( { $anyElementTrue: [ 'x' ] } ), true );
			} );

		} );

	} );

};
