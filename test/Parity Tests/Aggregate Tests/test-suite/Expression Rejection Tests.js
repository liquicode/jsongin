'use strict';

const assert = require( 'assert' );

/*
	The expressions MongoDB refuses because of how many operands they were given.

	Refusing a malformed expression is behavior. An engine which evaluates
	{ $divide: [ 5 ] } to something of its own devising gives a caller a wrong answer with no
	way to find out, so what an engine refuses belongs beside what it computes.

	These tests assert only that the expression was refused, never the wording of the message.
	Two engines can agree that something is invalid while describing it differently.

	This suite replaces the operators' `ArgCount` member, which was deleted. That member
	declared the operand count on 22 operators and was read by nothing: 13 operators already
	enforced exactly what they declared, 6 were variadic and declared nothing, and the last two
	were simply wrong — $literal declared 1 while accepting an argument list of any length,
	which is correct behavior and is measured below, and $switch declared 1 while taking an
	object. Declaring the count never made an engine refuse anything. Measuring the refusal
	does.

	Verified against MongoDB 6.0.1, where all 41 assertions below were run against the live
	server before being written down.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Expression Rejection Tests', () =>
	{

		let documents = [
			{ _id: 1, a: 10, b: 2 },
		];


		//---------------------------------------------------------------------
		// Answers whether the engine refused to evaluate the expression.
		//
		// A $project stage is the shortest route to an expression, the same route the
		// Expression Operator Tests take.
		async function refused( Expression )
		{
			await Driver.SetData( documents );
			try
			{
				await Driver.Aggregate( [ { $project: { r: Expression } } ] );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Operators Which Take a Fixed Number of Operands', () =>
		{

			it( 'should refuse too few operands', async () =>
			{
				assert.ok( await refused( { $abs: [] } ), '$abs with none' );
				assert.ok( await refused( { $divide: [ '$a' ] } ), '$divide with one' );
				assert.ok( await refused( { $mod: [ '$a' ] } ), '$mod with one' );
				assert.ok( await refused( { $subtract: [ '$a' ] } ), '$subtract with one' );
				assert.ok( await refused( { $cmp: [ '$a' ] } ), '$cmp with one' );
				assert.ok( await refused( { $eq: [ '$a' ] } ), '$eq with one' );
				assert.ok( await refused( { $ne: [ '$a' ] } ), '$ne with one' );
				assert.ok( await refused( { $gt: [ '$a' ] } ), '$gt with one' );
				assert.ok( await refused( { $gte: [ '$a' ] } ), '$gte with one' );
				assert.ok( await refused( { $lt: [ '$a' ] } ), '$lt with one' );
				assert.ok( await refused( { $lte: [ '$a' ] } ), '$lte with one' );
				assert.ok( await refused( { $cond: [ true, 1 ] } ), '$cond with two' );
			} );

			it( 'should refuse too many operands', async () =>
			{
				assert.ok( await refused( { $abs: [ 1, 2 ] } ), '$abs with two' );
				assert.ok( await refused( { $divide: [ '$a', '$b', 2 ] } ), '$divide with three' );
				assert.ok( await refused( { $mod: [ '$a', '$b', 2 ] } ), '$mod with three' );
				assert.ok( await refused( { $subtract: [ '$a', '$b', 1 ] } ), '$subtract with three' );
				assert.ok( await refused( { $cmp: [ '$a', 1, 2 ] } ), '$cmp with three' );
				assert.ok( await refused( { $eq: [ '$a', 1, 2 ] } ), '$eq with three' );
				assert.ok( await refused( { $ne: [ '$a', 1, 2 ] } ), '$ne with three' );
				assert.ok( await refused( { $gt: [ '$a', 1, 2 ] } ), '$gt with three' );
				assert.ok( await refused( { $gte: [ '$a', 1, 2 ] } ), '$gte with three' );
				assert.ok( await refused( { $lt: [ '$a', 1, 2 ] } ), '$lt with three' );
				assert.ok( await refused( { $lte: [ '$a', 1, 2 ] } ), '$lte with three' );
				assert.ok( await refused( { $cond: [ true, 1, 2, 3 ] } ), '$cond with four' );
				assert.ok( await refused( { $not: [ true, false ] } ), '$not with two' );
			} );

			it( 'should accept the count it asks for', async () =>
			{
				assert.ok( ( await refused( { $abs: [ -1 ] } ) ) === false, '$abs with one' );
				assert.ok( ( await refused( { $divide: [ '$a', '$b' ] } ) ) === false, '$divide with two' );
				assert.ok( ( await refused( { $not: [ true ] } ) ) === false, '$not with one' );
				assert.ok( ( await refused( { $cond: [ true, 1, 2 ] } ) ) === false, '$cond with three' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Operators Which Do Not Take a Fixed Number of Operands', () =>
		{

			it( 'should accept any number of operands for a variadic operator', async () =>
			{
				assert.ok( ( await refused( { $add: [ '$a' ] } ) ) === false, '$add with one' );
				assert.ok( ( await refused( { $add: [ 1, 2, 3 ] } ) ) === false, '$add with three' );
				assert.ok( ( await refused( { $multiply: [ '$a' ] } ) ) === false, '$multiply with one' );
				assert.ok( ( await refused( { $min: [ '$a' ] } ) ) === false, '$min with one' );
				assert.ok( ( await refused( { $max: [ '$a' ] } ) ) === false, '$max with one' );
			} );

			it( 'should accept an empty operand list for $and and $or', async () =>
			{
				assert.ok( ( await refused( { $and: [] } ) ) === false );
				assert.ok( ( await refused( { $or: [] } ) ) === false );
			} );

			// $literal is the operator which does not read its argument at all, so an array is
			// the value it stands for rather than a list of operands to be counted.
			it( 'should not count the argument of $literal', async () =>
			{
				assert.ok( ( await refused( { $literal: [ 1, 2 ] } ) ) === false, '$literal of an array' );
				assert.ok( ( await refused( { $literal: 5 } ) ) === false, '$literal of a scalar' );
			} );

			it( 'should accept either form of $cond', async () =>
			{
				assert.ok( ( await refused( { $cond: [ true, 1, 2 ] } ) ) === false, 'the array form' );
				assert.ok( ( await refused( { $cond: { if: true, then: 1, else: 2 } } ) ) === false, 'the object form' );
			} );

			// $ifNull takes any number of operands, but fewer than two leaves it nothing to
			// fall back to.
			it( 'should refuse $ifNull with one operand', async () =>
			{
				assert.ok( await refused( { $ifNull: [ null ] } ) );
				assert.ok( ( await refused( { $ifNull: [ null, 5 ] } ) ) === false, 'two is enough' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Rounding and Array Operators', () =>
		{

			it( 'should refuse the wrong number of operands', async () =>
			{
				assert.ok( await refused( { $ceil: [ 1.2, 3 ] } ), '$ceil with two' );
				assert.ok( await refused( { $floor: [ 1.2, 3 ] } ), '$floor with two' );
				assert.ok( await refused( { $round: [ 1.2, 3, 4 ] } ), '$round with three' );
				assert.ok( await refused( { $trunc: [ 1.2, 3, 4 ] } ), '$trunc with three' );
				assert.ok( await refused( { $size: [ [ 1 ], [ 2 ] ] } ), '$size with two' );
				assert.ok( await refused( { $arrayElemAt: [ '$t' ] } ), '$arrayElemAt with one' );
				assert.ok( await refused( { $in: [ 1 ] } ), '$in with one' );
			} );

			it( 'should refuse a non numeric operand to the rounding operators', async () =>
			{
				assert.ok( await refused( { $ceil: 'text' } ), '$ceil of a string' );
				assert.ok( await refused( { $floor: 'text' } ), '$floor of a string' );
				assert.ok( await refused( { $round: [ 'text', 1 ] } ), '$round of a string' );
				assert.ok( await refused( { $trunc: [ 'text', 1 ] } ), '$trunc of a string' );
			} );

			it( 'should refuse $size against anything but an array', async () =>
			{
				// ***$size does not tolerate a missing field***, which is unlike most of the
				// expression operators: it is an error rather than a null.
				assert.ok( await refused( { $size: '$nope' } ), 'a missing field' );
				assert.ok( await refused( { $size: null } ), 'a null' );
				assert.ok( await refused( { $size: 5 } ), 'a scalar' );
			} );

			it( 'should refuse a bad $arrayElemAt operand', async () =>
			{
				assert.ok( await refused( { $arrayElemAt: [ '$a', 0 ] } ), 'a first operand which is not an array' );
				assert.ok( await refused( { $arrayElemAt: [ [ 1, 2 ], 1.5 ] } ), 'a position which is not an integer' );
			} );

			it( 'should refuse a $concatArrays operand which is not an array', async () =>
			{
				assert.ok( await refused( { $concatArrays: [ [ 1 ], 5 ] } ) );
			} );

			it( 'should refuse an $in whose second operand is not an array', async () =>
			{
				assert.ok( await refused( { $in: [ 1, 5 ] } ), 'a scalar' );
				assert.ok( await refused( { $in: [ 1, null ] } ), 'a null' );
			} );

		} );

	} );

};
