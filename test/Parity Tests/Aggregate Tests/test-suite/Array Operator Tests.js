'use strict';

const assert = require( 'assert' );

/*
	The array expression operators which bind no variables.

	Fourteen of them: $isArray, $reverseArray, $range, $indexOfArray, $slice, $first, $last,
	$firstN, $lastN, $minN, $maxN, $arrayToObject, $sortArray, and $zip.

	***The other three are not here on purpose.*** $map, $filter, and $reduce each bind a
	variable over the elements of an array, and `Evaluate` has no variable scope to bind one
	in. They are the Bucket C cluster of .reviews/2026-08-19/review.md and wait on that one
	architectural change.

	$first and $last already exist as ***accumulators***. These are the expression forms, which
	are a different operator with the same name, registered in a different place. See the
	'Operators Which Share a Name' section of the Operator Reference.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Array Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				nums: [ 3, 1, 2 ],
				letters: [ 'a', 'b', 'c', 'b' ],
				empty_list: [],
				pairs: [ [ 'a', 1 ], [ 'b', 2 ] ],
				docs: [ { k: 'a', v: 1 }, { k: 'b', v: 2 } ],
				people: [ { name: 'Carol', age: 30 }, { name: 'Alice', age: 25 } ],
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
		describe( 'Asking About an Array', () =>
		{

			it( 'should answer whether a value is an array with $isArray', async () =>
			{
				assert.strictEqual( await evaluated( { $isArray: '$nums' } ), true );
				assert.strictEqual( await evaluated( { $isArray: '$empty_list' } ), true );
				assert.strictEqual( await evaluated( { $isArray: '$text' } ), false );
				// ***It answers rather than propagating***, so a null is false, not null.
				assert.strictEqual( await evaluated( { $isArray: '$empty' } ), false );
				assert.strictEqual( await evaluated( { $isArray: '$missing' } ), false );
				assert.strictEqual( await evaluated( { $isArray: [ [ 1, 2 ] ] } ), true );
			} );

			it( 'should find an element with $indexOfArray', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$letters', 'b' ] } ), 1 );
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$letters', 'z' ] } ), -1 );
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$empty_list', 'a' ] } ), -1 );
				// A start position, and a start and an end.
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$letters', 'b', 2 ] } ), 3 );
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$letters', 'b', 2, 3 ] } ), -1 );
				// Elements are compared by content.
				assert.strictEqual( await evaluated( { $indexOfArray: [ [ { a: 1 } ], { a: 1 } ] } ), 0 );
				// A null array propagates; something which is not an array is refused.
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$empty', 'a' ] } ), null );
				assert.strictEqual( await refused( { $indexOfArray: [ '$text', 'a' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Reshaping an Array', () =>
		{

			it( 'should reverse a list with $reverseArray', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $reverseArray: '$nums' } ), [ 2, 1, 3 ] );
				assert.deepStrictEqual( await evaluated( { $reverseArray: '$empty_list' } ), [] );
				assert.strictEqual( await evaluated( { $reverseArray: '$empty' } ), null );
				assert.strictEqual( await evaluated( { $reverseArray: '$missing' } ), null );
				assert.strictEqual( await refused( { $reverseArray: '$text' } ), true );
			} );

			it( 'should generate numbers with $range', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $range: [ 0, 4 ] } ), [ 0, 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $range: [ 0, 4, 2 ] } ), [ 0, 2 ] );
				assert.deepStrictEqual( await evaluated( { $range: [ 4, 0, -2 ] } ), [ 4, 2 ] );
				// ***The end is never reached***, and a range going the wrong way is empty.
				assert.deepStrictEqual( await evaluated( { $range: [ 0, 0 ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $range: [ 0, -4 ] } ), [] );
				assert.deepStrictEqual( await evaluated( { $range: [ 4, 0 ] } ), [] );
				// A step of zero would never end, and the bounds must be whole numbers.
				assert.strictEqual( await refused( { $range: [ 0, 4, 0 ] } ), true );
				assert.strictEqual( await refused( { $range: [ 0, 4.5 ] } ), true );
				assert.strictEqual( await refused( { $range: [ 0, 'x' ] } ), true );
				assert.strictEqual( await refused( { $range: [ 0 ] } ), true );
			} );

			it( 'should take a subset with $slice', async () =>
			{
				// Two operands: how many to take from the front, or from the back if negative.
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', 2 ] } ), [ 'a', 'b' ] );
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', -2 ] } ), [ 'c', 'b' ] );
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', 99 ] } ), [ 'a', 'b', 'c', 'b' ] );
				// Three operands: where to start, and how many from there.
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', 1, 2 ] } ), [ 'b', 'c' ] );
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', -2, 1 ] } ), [ 'c' ] );
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', 99, 2 ] } ), [] );
				assert.strictEqual( await evaluated( { $slice: [ '$empty', 2 ] } ), null );
				// ***In the three operand form the count cannot be negative***, where in the
				// two operand form it means counting from the back.
				assert.strictEqual( await refused( { $slice: [ '$letters', 1, -2 ] } ), true );
				assert.strictEqual( await refused( { $slice: [ '$text', 2 ] } ), true );
			} );

			it( 'should tell the expression $slice from the projection $slice', async () =>
			{
				// ***$slice is two operators sharing a name, and the stage decides which.***
				// Inside a $project stage there is no projection operator called $slice at
				// all: the name is the expression operator, whatever its argument looks like.
				// The projection form belongs to a find projection, and is tested there.
				await Driver.SetData( documents );

				// The expression form, computing a field which was not there.
				let computed = await Driver.Aggregate( [
					{ $match: { _id: 1 } },
					{ $project: { _id: 0, r: { $slice: [ '$letters', 2 ] } } },
				] );
				assert.deepStrictEqual( computed[ 0 ], { r: [ 'a', 'b' ] } );

				// It applies to a field which is already there just the same.
				computed = await Driver.Aggregate( [
					{ $match: { _id: 1 } },
					{ $project: { _id: 0, letters: { $slice: [ '$letters', 1, 2 ] } } },
				] );
				assert.deepStrictEqual( computed[ 0 ], { letters: [ 'b', 'c' ] } );

				// ***And the projection form is refused here***, because one operand is not
				// enough for the expression it is being read as.
				assert.strictEqual( await refused( { $slice: 2 } ), true );
			} );

			it( 'should sort elements with $sortArray', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $sortArray: { input: '$nums', sortBy: 1 } } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $sortArray: { input: '$nums', sortBy: -1 } } ), [ 3, 2, 1 ] );
				assert.deepStrictEqual( await evaluated( { $sortArray: { input: '$empty_list', sortBy: 1 } } ), [] );
				// Documents are sorted by a field.
				assert.deepStrictEqual( await evaluated( { $sortArray: { input: '$people', sortBy: { age: 1 } } } ),
					[ { name: 'Alice', age: 25 }, { name: 'Carol', age: 30 } ] );
				assert.deepStrictEqual( await evaluated( { $sortArray: { input: '$people', sortBy: { name: 1 } } } ),
					[ { name: 'Alice', age: 25 }, { name: 'Carol', age: 30 } ] );
				assert.strictEqual( await evaluated( { $sortArray: { input: '$empty', sortBy: 1 } } ), null );
				assert.strictEqual( await refused( { $sortArray: { input: '$text', sortBy: 1 } } ), true );
				assert.strictEqual( await refused( { $sortArray: { input: '$nums' } } ), true );
				assert.strictEqual( await refused( { $sortArray: { input: '$nums', sortBy: 0 } } ), true );
			} );

			it( 'should merge arrays element by element with $zip', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $zip: { inputs: [ [ 1, 2 ], [ 'a', 'b' ] ] } } ),
					[ [ 1, 'a' ], [ 2, 'b' ] ] );
				// ***The shortest input decides the length***, unless told otherwise.
				assert.deepStrictEqual( await evaluated( { $zip: { inputs: [ [ 1, 2, 3 ], [ 'a' ] ] } } ),
					[ [ 1, 'a' ] ] );
				assert.deepStrictEqual( await evaluated( { $zip: { inputs: [ [ 1, 2 ], [ 'a' ] ], useLongestLength: true } } ),
					[ [ 1, 'a' ], [ 2, null ] ] );
				// The longest may be any of them, not only the first.
				assert.deepStrictEqual( await evaluated( { $zip: { inputs: [ [ 1 ], [ 'a', 'b' ] ], useLongestLength: true } } ),
					[ [ 1, 'a' ], [ null, 'b' ] ] );
				assert.deepStrictEqual( await evaluated( { $zip: { inputs: [ [ 1, 2 ], [ 'a' ] ], useLongestLength: true, defaults: [ 0, 'z' ] } } ),
					[ [ 1, 'a' ], [ 2, 'z' ] ] );
				assert.strictEqual( await evaluated( { $zip: { inputs: [ [ 1 ], '$empty' ] } } ), null );
				assert.strictEqual( await refused( { $zip: { inputs: [ [ 1 ], 'x' ] } } ), true );
				// defaults are only meaningful alongside useLongestLength.
				assert.strictEqual( await refused( { $zip: { inputs: [ [ 1 ] ], defaults: [ 0 ] } } ), true );
			} );

			it( 'should build a document from pairs with $arrayToObject', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $arrayToObject: '$pairs' } ), { a: 1, b: 2 } );
				assert.deepStrictEqual( await evaluated( { $arrayToObject: '$docs' } ), { a: 1, b: 2 } );
				assert.deepStrictEqual( await evaluated( { $arrayToObject: '$empty_list' } ), {} );
				// ***A repeated key keeps the last value.***
				assert.deepStrictEqual( await evaluated( { $arrayToObject: [ [ [ 'a', 1 ], [ 'a', 2 ] ] ] } ), { a: 2 } );
				assert.strictEqual( await evaluated( { $arrayToObject: '$empty' } ), null );
				// A pair which is not a pair, and a key which is not a string.
				assert.strictEqual( await refused( { $arrayToObject: [ [ [ 'a' ] ] ] } ), true );
				assert.strictEqual( await refused( { $arrayToObject: [ [ [ 1, 1 ] ] ] } ), true );
				assert.strictEqual( await refused( { $arrayToObject: [ [ { k: 'a' } ] ] } ), true );
				assert.strictEqual( await refused( { $arrayToObject: '$text' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The Edges of the Array Family', () =>
		{

			it( 'should answer an empty array with nothing at all', async () =>
			{
				// ***$first and $last of an empty array are not null.*** They produce no value,
				// so the field they were computing is left out of the document entirely.
				assert.strictEqual( await evaluated( { $first: '$empty_list' } ), undefined );
				assert.strictEqual( await evaluated( { $last: '$empty_list' } ), undefined );
			} );

			it( 'should refuse a null input to the four N operators', async () =>
			{
				// ***These four do not propagate a null***, where most of the family does.
				// "Input must be an array" is what a null gets, and a missing field too.
				assert.strictEqual( await refused( { $firstN: { input: '$empty', n: 2 } } ), true );
				assert.strictEqual( await refused( { $lastN: { input: '$empty', n: 2 } } ), true );
				assert.strictEqual( await refused( { $minN: { input: '$empty', n: 2 } } ), true );
				assert.strictEqual( await refused( { $maxN: { input: '$empty', n: 2 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$missing', n: 2 } } ), true );
			} );

			it( 'should refuse an argument the operator does not have', async () =>
			{
				assert.strictEqual( await refused( { $firstN: { input: '$letters', n: 2, extra: 1 } } ), true );
				assert.strictEqual( await refused( { $sortArray: { input: '$nums', sortBy: 1, extra: 1 } } ), true );
				assert.strictEqual( await refused( { $zip: { inputs: [ [ 1 ] ], extra: 1 } } ), true );
			} );

			it( 'should bound the search range of $indexOfArray', async () =>
			{
				// A position which is not a position at all.
				assert.strictEqual( await refused( { $indexOfArray: [ '$letters', 'b', -1 ] } ), true );
				assert.strictEqual( await refused( { $indexOfArray: [ '$letters', 'b', 0, -1 ] } ), true );
				// An end past the end of the array is the end of the array.
				assert.strictEqual( await evaluated( { $indexOfArray: [ '$letters', 'b', 0, 99 ] } ), 1 );
			} );

			it( 'should start at the front when $slice reaches back too far', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $slice: [ '$letters', -99, 2 ] } ), [ 'a', 'b' ] );
			} );

			it( 'should refuse a sortBy which sorts nothing', async () =>
			{
				assert.strictEqual( await refused( { $sortArray: { input: '$nums', sortBy: 'x' } } ), true );
				assert.strictEqual( await refused( { $sortArray: { input: '$nums', sortBy: [ 1 ] } } ), true );
			} );

			it( 'should require $zip inputs to be written as an array', async () =>
			{
				// ***`inputs` is an array of expressions, not an expression giving an array.***
				// The elements are evaluated; the list itself has to be written out.
				assert.strictEqual( await refused( { $zip: { inputs: '$empty' } } ), true );
				assert.strictEqual( await refused( { $zip: { inputs: '$nums' } } ), true );
				// And there has to be something in it: zipping no arrays is refused, not empty.
				assert.strictEqual( await refused( { $zip: { inputs: [] } } ), true );
			} );

			it( 'should refuse a pair which is not a pair', async () =>
			{
				assert.strictEqual( await refused( { $arrayToObject: [ [ 'ab' ] ] } ), true );
				assert.strictEqual( await refused( { $arrayToObject: [ [ 5 ] ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking Elements From an Array', () =>
		{

			it( 'should take the first element with $first', async () =>
			{
				assert.strictEqual( await evaluated( { $first: '$nums' } ), 3 );
				assert.strictEqual( await evaluated( { $first: '$letters' } ), 'a' );
				assert.strictEqual( await evaluated( { $first: '$empty' } ), null );
				assert.strictEqual( await refused( { $first: '$text' } ), true );
			} );

			it( 'should take the last element with $last', async () =>
			{
				assert.strictEqual( await evaluated( { $last: '$nums' } ), 2 );
				assert.strictEqual( await evaluated( { $last: '$letters' } ), 'b' );
				assert.strictEqual( await evaluated( { $last: '$empty' } ), null );
				assert.strictEqual( await refused( { $last: '$text' } ), true );
			} );

			it( 'should take the first n with $firstN', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $firstN: { input: '$letters', n: 2 } } ), [ 'a', 'b' ] );
				// Asking for more than there is gives what there is.
				assert.deepStrictEqual( await evaluated( { $firstN: { input: '$letters', n: 99 } } ), [ 'a', 'b', 'c', 'b' ] );
				assert.deepStrictEqual( await evaluated( { $firstN: { input: '$empty_list', n: 2 } } ), [] );
				assert.strictEqual( await refused( { $firstN: { input: '$letters', n: 0 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$letters', n: -1 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$letters', n: 1.5 } } ), true );
				assert.strictEqual( await refused( { $firstN: { input: '$letters' } } ), true );
			} );

			it( 'should take the last n with $lastN', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $lastN: { input: '$letters', n: 2 } } ), [ 'c', 'b' ] );
				assert.deepStrictEqual( await evaluated( { $lastN: { input: '$letters', n: 99 } } ), [ 'a', 'b', 'c', 'b' ] );
				assert.deepStrictEqual( await evaluated( { $lastN: { input: '$empty_list', n: 2 } } ), [] );
			} );

			it( 'should take the smallest n with $minN', async () =>
			{
				// ***The smallest, in order***, which is not the order they were written in.
				assert.deepStrictEqual( await evaluated( { $minN: { input: '$nums', n: 2 } } ), [ 1, 2 ] );
				assert.deepStrictEqual( await evaluated( { $minN: { input: '$nums', n: 99 } } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $minN: { input: '$empty_list', n: 2 } } ), [] );
			} );

			it( 'should take the largest n with $maxN', async () =>
			{
				// The largest, largest first.
				assert.deepStrictEqual( await evaluated( { $maxN: { input: '$nums', n: 2 } } ), [ 3, 2 ] );
				assert.deepStrictEqual( await evaluated( { $maxN: { input: '$nums', n: 99 } } ), [ 3, 2, 1 ] );
				assert.deepStrictEqual( await evaluated( { $maxN: { input: '$empty_list', n: 2 } } ), [] );
			} );

		} );

	} );

};
