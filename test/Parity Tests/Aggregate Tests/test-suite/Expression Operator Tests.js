'use strict';

const assert = require( 'assert' );

/*
	The expression operators, measured one at a time.

	These reach the operators through a $project stage, which is the shortest route to an
	expression. The aggregation pipeline is the only place they are reachable, apart from
	$expr within a query, which has its own suite.

	Note that the expression comparison operators are ***not*** bracketed by type, which is
	the opposite of the query operators of the same name: { $gt: [ 'abc', 1 ] } is true here
	by the BSON ordering, while { a: { $gt: 1 } } never matches a string. See the
	Operators Which Share a Name section of the operator reference.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Expression Operator Tests', () =>
	{

		let documents = [
			{ _id: 1, n: 4, s: 'text', b: true, l: null, o: { x: 7 }, t: [ 1, 2 ] },
		];


		//---------------------------------------------------------------------
		// Returns what one expression produced for the stock document.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [ { $project: { _id: 0, r: Expression } } ] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		// Answers whether the field was produced at all. A field path which resolves to
		// nothing omits the field rather than setting it to null.
		async function produced_a_field( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [ { $project: { _id: 0, r: Expression } } ] );
			return ( 'r' in result[ 0 ] );
		}


		//---------------------------------------------------------------------
		describe( 'Field Paths and $literal', () =>
		{

			it( 'should read a field by its path', async () =>
			{
				assert.strictEqual( await evaluated( '$n' ), 4 );
				assert.strictEqual( await evaluated( '$s' ), 'text' );
			} );

			it( 'should read a nested field by its path', async () =>
			{
				assert.strictEqual( await evaluated( '$o.x' ), 7 );
			} );

			it( 'should read an array field whole', async () =>
			{
				assert.deepStrictEqual( await evaluated( '$t' ), [ 1, 2 ] );
			} );

			it( 'should omit the field for a path which resolves to nothing', async () =>
			{
				assert.strictEqual( await produced_a_field( '$nope' ), false );
			} );

			it( 'should return a field path as text with $literal', async () =>
			{
				assert.strictEqual( await evaluated( { $literal: '$n' } ), '$n' );
				assert.strictEqual( await evaluated( { $literal: 3 } ), 3 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Arithmetic Expression Operators', () =>
		{

			it( 'should add with $add', async () =>
			{
				assert.strictEqual( await evaluated( { $add: [ 1, 2 ] } ), 3 );
				assert.strictEqual( await evaluated( { $add: [ '$n', 10 ] } ), 14 );
				assert.strictEqual( await evaluated( { $add: [ 1, 2, 3 ] } ), 6 );
			} );

			it( 'should subtract with $subtract', async () =>
			{
				assert.strictEqual( await evaluated( { $subtract: [ 10, 4 ] } ), 6 );
				assert.strictEqual( await evaluated( { $subtract: [ '$n', 1 ] } ), 3 );
			} );

			it( 'should multiply with $multiply', async () =>
			{
				assert.strictEqual( await evaluated( { $multiply: [ 3, 4 ] } ), 12 );
				assert.strictEqual( await evaluated( { $multiply: [ 2, 3, 4 ] } ), 24 );
			} );

			it( 'should divide with $divide', async () =>
			{
				assert.strictEqual( await evaluated( { $divide: [ 10, 4 ] } ), 2.5 );
			} );

			it( 'should take the remainder with $mod', async () =>
			{
				assert.strictEqual( await evaluated( { $mod: [ 10, 3 ] } ), 1 );
			} );

			it( 'should take the magnitude with $abs', async () =>
			{
				assert.strictEqual( await evaluated( { $abs: -5 } ), 5 );
				assert.strictEqual( await evaluated( { $abs: 5 } ), 5 );
			} );

			it( 'should give null for an operand which is not there', async () =>
			{
				// An arithmetic operator returns null rather than omitting the field, which is
				// how it differs from a bare field path.
				assert.strictEqual( await evaluated( { $add: [ '$nope', 1 ] } ), null );
				assert.strictEqual( await evaluated( { $multiply: [ '$nope', 2 ] } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Comparison Expression Operators', () =>
		{

			it( 'should compare for equality with $eq and $ne', async () =>
			{
				assert.strictEqual( await evaluated( { $eq: [ 1, 1 ] } ), true );
				assert.strictEqual( await evaluated( { $eq: [ 1, 2 ] } ), false );
				assert.strictEqual( await evaluated( { $eq: [ '$s', 'text' ] } ), true );
				assert.strictEqual( await evaluated( { $ne: [ 1, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $ne: [ 1, 1 ] } ), false );
			} );

			it( 'should order with $gt, $gte, $lt, and $lte', async () =>
			{
				assert.strictEqual( await evaluated( { $gt: [ 2, 1 ] } ), true );
				assert.strictEqual( await evaluated( { $gt: [ 1, 2 ] } ), false );
				assert.strictEqual( await evaluated( { $gte: [ 2, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lt: [ 1, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lte: [ 2, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lte: [ 3, 2 ] } ), false );
			} );

			it( 'should rank with $cmp', async () =>
			{
				assert.strictEqual( await evaluated( { $cmp: [ 2, 1 ] } ), 1 );
				assert.strictEqual( await evaluated( { $cmp: [ 1, 2 ] } ), -1 );
				assert.strictEqual( await evaluated( { $cmp: [ 1, 1 ] } ), 0 );
			} );

			it( 'should compare across types by the BSON ordering', async () =>
			{
				// The query operator of the same name brackets by type and would match
				// nothing here. The expression operator ranks the types instead.
				assert.strictEqual( await evaluated( { $gt: [ 'abc', 1 ] } ), true );
				assert.strictEqual( await evaluated( { $lt: [ 1, 'abc' ] } ), true );
				assert.strictEqual( await evaluated( { $gt: [ 1, null ] } ), true );
			} );

			it( 'should compare dates by their time value', async () =>
			{
				assert.strictEqual( await evaluated( { $gt: [ new Date( 2000 ), new Date( 1000 ) ] } ), true );
				assert.strictEqual( await evaluated( { $eq: [ new Date( 1000 ), new Date( 1000 ) ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Boolean Expression Operators', () =>
		{

			it( 'should combine with $and and $or', async () =>
			{
				assert.strictEqual( await evaluated( { $and: [ true, true ] } ), true );
				assert.strictEqual( await evaluated( { $and: [ true, false ] } ), false );
				assert.strictEqual( await evaluated( { $or: [ false, true ] } ), true );
				assert.strictEqual( await evaluated( { $or: [ false, false ] } ), false );
			} );

			it( 'should negate with $not', async () =>
			{
				assert.strictEqual( await evaluated( { $not: [ false ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ true ] } ), false );
			} );

			it( 'should treat a value as true unless it is false, zero, null, or missing', async () =>
			{
				// The boolean operators coerce, and only those four are false.
				assert.strictEqual( await evaluated( { $and: [ 1, 'abc' ] } ), true );
				assert.strictEqual( await evaluated( { $and: [ 0, true ] } ), false );
				assert.strictEqual( await evaluated( { $not: [ null ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ 0 ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ '$nope' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Conditional Expression Operators', () =>
		{

			it( 'should choose with the $cond array form', async () =>
			{
				assert.strictEqual( await evaluated( { $cond: [ true, 'yes', 'no' ] } ), 'yes' );
				assert.strictEqual( await evaluated( { $cond: [ false, 'yes', 'no' ] } ), 'no' );
			} );

			it( 'should choose with the $cond document form', async () =>
			{
				assert.strictEqual( await evaluated( { $cond: { if: false, then: 'yes', else: 'no' } } ), 'no' );
				assert.strictEqual( await evaluated( { $cond: { if: { $gt: [ '$n', 1 ] }, then: 'big', else: 'small' } } ), 'big' );
			} );

			it( 'should substitute a value with $ifNull', async () =>
			{
				assert.strictEqual( await evaluated( { $ifNull: [ '$nope', 'fallback' ] } ), 'fallback' );
				assert.strictEqual( await evaluated( { $ifNull: [ '$l', 'fallback' ] } ), 'fallback' );
				assert.strictEqual( await evaluated( { $ifNull: [ '$n', 'fallback' ] } ), 4 );
			} );

			it( 'should take the first matching branch with $switch', async () =>
			{
				assert.strictEqual( await evaluated( {
					$switch: { branches: [ { case: false, then: 1 }, { case: true, then: 2 } ], default: 3 },
				} ), 2 );
			} );

			it( 'should fall through to the $switch default', async () =>
			{
				assert.strictEqual( await evaluated( {
					$switch: { branches: [ { case: false, then: 1 } ], default: 3 },
				} ), 3 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Expression $min and $max', () =>
		{

			it( 'should take the smallest and largest of a list', async () =>
			{
				assert.strictEqual( await evaluated( { $min: [ 3, 1, 2 ] } ), 1 );
				assert.strictEqual( await evaluated( { $max: [ 3, 1, 2 ] } ), 3 );
			} );

			it( 'should take the smallest and largest within an array field', async () =>
			{
				assert.strictEqual( await evaluated( { $min: '$t' } ), 1 );
				assert.strictEqual( await evaluated( { $max: '$t' } ), 2 );
			} );

		} );

	} );

};
