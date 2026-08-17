'use strict';

const assert = require( 'assert' );

/*
	Sorting by a path which crosses an array.

	A sort key is built from a SET of candidates rather than from a single resolved value:

		- Every array crossed while walking the path applies the remaining path to each of
		  its elements. An empty array crossed this way yields null, because the path
		  cannot be followed into it.
		- An array found at the END of the path contributes each of its elements as a
		  candidate. Those elements are not expanded any further. An empty array here
		  contributes nothing, and a document with no candidates sorts below every value.
		- The key is the smallest candidate ascending and the largest descending.

	So the number of array levels which get expanded depends on the shape of the PATH and
	not on the shape of the value. { a: [ { x: [ 0, 7 ] } ] } sorted by 'a.x' expands two
	levels and sorts by 0, while { v: [ [ 3, 4 ], [ 1, 2 ] ] } sorted by 'v' expands one
	and sorts by the array [ 1, 2 ].

	Every case here is sorted with an _id tiebreaker. MongoDB does not guarantee an order
	for documents with equal sort keys, and several of these cases have tied keys.
*/

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	describe( 'Sort Through Array Tests', () =>
	{


		//---------------------------------------------------------------------
		async function check( Documents, Path, Ascending, Descending )
		{
			assert.ok( await Driver.SetData( JSON.parse( JSON.stringify( Documents ) ) ) );

			let up = {};
			up[ Path ] = 1;
			up._id = 1;
			let result = await Driver.Aggregate( [ { $sort: up } ] );
			assert.ok( result );
			assert.deepStrictEqual( result.map( function ( document ) { return document._id; } ), Ascending );

			let down = {};
			down[ Path ] = -1;
			down._id = 1;
			result = await Driver.Aggregate( [ { $sort: down } ] );
			assert.ok( result );
			assert.deepStrictEqual( result.map( function ( document ) { return document._id; } ), Descending );
		};


		//---------------------------------------------------------------------
		it( 'should reduce through every array the path crosses', async () =>
		{
			await check(
				[
					{ _id: 1, a: [ { x: 3 }, { x: 1 } ] },
					{ _id: 2, a: [ { x: 2 } ] },
					{ _id: 3, a: [ { x: 5 }, { y: 9 } ] },
					{ _id: 4, a: [ { y: 9 } ] },
					{ _id: 5, b: 1 },
					{ _id: 6, a: [ { x: [ 0, 7 ] } ] },
				],
				'a.x', [ 3, 4, 5, 6, 1, 2 ], [ 6, 3, 1, 2, 4, 5 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should expand only one level when the path crosses no array', async () =>
		{
			await check(
				[
					{ _id: 1, v: [ [ 3, 4 ], [ 1, 2 ] ] },
					{ _id: 2, v: 5 },
					{ _id: 3, v: [ [ 9 ] ] },
					{ _id: 4, v: 0 },
				],
				'v', [ 4, 2, 1, 3 ], [ 3, 1, 2, 4 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should expand a level for each array the path crosses', async () =>
		{
			await check(
				[
					{ _id: 1, a: [ { b: [ { c: 4 }, { c: 1 } ] } ] },
					{ _id: 2, a: [ { b: [ { c: [ 8, 2 ] } ] } ] },
					{ _id: 3, a: [ { b: [ { c: 3 } ] } ] },
				],
				'a.b.c', [ 1, 2, 3 ], [ 2, 1, 3 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should treat an empty array element as an ordinary array value', async () =>
		{
			// _id 1 sorts FIRST descending. Its key is the empty array, which wins the
			// max because an array outranks every number.
			await check(
				[
					{ _id: 1, v: [ 3, [] ] },
					{ _id: 2, v: 2 },
					{ _id: 3, v: 9 },
					{ _id: 4, v: 4 },
					{ _id: 5, v: null },
				],
				'v', [ 5, 2, 1, 4, 3 ], [ 1, 3, 4, 2, 5 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should sort a field holding only an empty array with the arrays', async () =>
		{
			// _id 1 is [ [] ] and sorts by the array rank. _id 4 is [] and sorts below null.
			await check(
				[
					{ _id: 1, v: [ [] ] },
					{ _id: 2, v: null },
					{ _id: 3, v: 5 },
					{ _id: 4, v: [] },
					{ _id: 5, x: 1 },
				],
				'v', [ 4, 2, 5, 3, 1 ], [ 1, 3, 2, 5, 4 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should sort the existing empty array cases unchanged', async () =>
		{
			await check(
				[
					{ _id: 1, v: [] },
					{ _id: 2, v: null },
					{ _id: 3, v: 5 },
					{ _id: 4, v: [ 3 ] },
					{ _id: 5, v: 'a' },
					{ _id: 6, x: 1 },
				],
				'v', [ 1, 2, 6, 4, 3, 5 ], [ 5, 3, 4, 2, 6, 1 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should order two empty arrays against each other', async () =>
		{
			// ***Two documents which both offer no sort key at all.*** An empty array at the
			// end of the path contributes no candidate, unlike a missing field or an empty
			// array crossed by a longer path, which each contribute a null. The cases above
			// have only one such document, so they never compare two of them, and the answer
			// for a pair of them is the whole question here: they are equal, and both sort
			// below the nulls in either direction.
			await check(
				[
					{ _id: 1, v: [] },
					{ _id: 2, v: [] },
					{ _id: 3, v: null },
					{ _id: 4, v: 5 },
				],
				'v', [ 1, 2, 3, 4 ], [ 4, 3, 1, 2 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should sort an empty array reached through a path below every value', async () =>
		{
			await check(
				[
					{ _id: 1, a: [ { x: [ 0, 7 ] } ] },
					{ _id: 2, a: [ { x: [] } ] },
					{ _id: 3, a: [ { x: 2 } ] },
					{ _id: 4, a: [ { x: null } ] },
					{ _id: 5, b: 1 },
					{ _id: 6, a: [ { x: 9 } ] },
				],
				'a.x', [ 2, 4, 5, 1, 3, 6 ], [ 6, 1, 3, 4, 5, 2 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should sort an empty array crossed by a path as null', async () =>
		{
			// _id 1 is { a: [] }, crossed by the path, and sorts with the nulls.
			// _id 2 holds the empty array at the end of the path and sorts below them.
			await check(
				[
					{ _id: 1, a: [] },
					{ _id: 2, a: [ { x: [] } ] },
					{ _id: 3, a: [ { x: null } ] },
					{ _id: 4, b: 1 },
					{ _id: 5, a: [ { x: 5 } ] },
				],
				'a.x', [ 2, 1, 3, 4, 5 ], [ 5, 1, 3, 4, 2 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should order mixed types among the candidates by value order', async () =>
		{
			await check(
				[
					{ _id: 1, a: [ { x: [ 'b', 2 ] } ] },
					{ _id: 2, a: [ { x: [ true, 'a' ] } ] },
					{ _id: 3, a: [ { x: 1 } ] },
					{ _id: 4, a: [ { x: [ null, 9 ] } ] },
					{ _id: 5, a: [ { x: [ [ 'z' ], 6 ] } ] },
				],
				'a.x', [ 4, 3, 1, 5, 2 ], [ 2, 5, 1, 4, 3 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should sort an empty array beside a string by the array rank', async () =>
		{
			await check(
				[
					{ _id: 1, v: [ 'm', [] ] },
					{ _id: 2, v: [ [], [] ] },
					{ _id: 3, v: 'z' },
					{ _id: 4, v: 'a' },
				],
				'v', [ 4, 1, 3, 2 ], [ 1, 2, 3, 4 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should honor an explicit array index in the sort path', async () =>
		{
			await check(
				[
					{ _id: 1, a: [ { x: 9 }, { x: 1 } ] },
					{ _id: 2, a: [ { x: 4 }, { x: 8 } ] },
					{ _id: 3, a: [ { x: 6 } ] },
				],
				'a.0.x', [ 2, 3, 1 ], [ 1, 3, 2 ] );
		} );


		//---------------------------------------------------------------------
		it( 'should not index the sort path from the end of an array', async () =>
		{
			// A negative index is read as a field name, which an array does not have, so the
			// sort key is missing for every document and none of them can be ordered by it.
			// The engine is left to hold its input order, both ways.
			//
			// jsongin used to index from the end here, which ordered these by their last
			// element: ascending 1, 2, 3 and descending 3, 2, 1.
			await check(
				[
					{ _id: 1, a: [ 9, 1 ] },
					{ _id: 2, a: [ 4, 2 ] },
					{ _id: 3, a: [ 6, 3 ] },
				],
				'a.-1', [ 1, 2, 3 ], [ 1, 2, 3 ] );
		} );


	} );


};
