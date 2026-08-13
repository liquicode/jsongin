'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )
	.NewJsongin( {
		PathExtensions: false,
		Explain: false,
	} );


describe( '220) Expression Operator Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Evaluate Tests', () =>
	{

		it( 'should resolve field references', () =>
		{
			let document = { dmg: 8, user: { name: 'Alice' } };
			assert.ok( jsongin.Evaluate( document, '$dmg' ) === 8 );
			assert.ok( jsongin.Evaluate( document, '$user.name' ) === 'Alice' );
		} );

		it( 'should resolve missing field references to undefined', () =>
		{
			assert.ok( jsongin.Evaluate( { dmg: 8 }, '$armor' ) === undefined );
			assert.ok( jsongin.Evaluate( {}, '$user.name' ) === undefined );
		} );

		it( 'should treat non-$ values as literals', () =>
		{
			assert.ok( jsongin.Evaluate( {}, 'abc' ) === 'abc' );
			assert.ok( jsongin.Evaluate( {}, 42 ) === 42 );
			assert.ok( jsongin.Evaluate( {}, true ) === true );
			assert.ok( jsongin.Evaluate( {}, null ) === null );
		} );

		it( 'should return literal values with $literal, without evaluating them', () =>
		{
			assert.ok( jsongin.Evaluate( { dmg: 8 }, { $literal: '$dmg' } ) === '$dmg' );
			assert.ok( jsongin.Evaluate( {}, { $literal: 42 } ) === 42 );
			assert.ok( jsongin.StrictEquals( jsongin.Evaluate( {}, { $literal: { $add: [ 1, 2 ] } } ), { $add: [ 1, 2 ] } ) );
		} );

		it( 'should evaluate arrays element-wise', () =>
		{
			let result = jsongin.Evaluate( { dmg: 8 }, [ '$dmg', 2, 'abc' ] );
			assert.ok( jsongin.StrictEquals( result, [ 8, 2, 'abc' ] ) );
		} );

		it( 'should evaluate the field values of an expression object', () =>
		{
			let result = jsongin.Evaluate( { dmg: 8, armor: 5 }, { power: '$dmg', net: { $subtract: [ '$dmg', '$armor' ] } } );
			assert.ok( jsongin.StrictEquals( result, { power: 8, net: 3 } ) );
		} );

		it( 'should throw when an expression operator is not recognized', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $bogus: [ 1, 2 ] } ); }, /Unrecognized expression operator/ );
		} );

		it( 'should throw when system variables are used', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, '$$ROOT' ); }, /system variables are not supported/ );
			assert.throws( function () { jsongin.Evaluate( {}, '$$NOW' ); }, /system variables are not supported/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$add Tests', () =>
	{

		it( 'should add numbers', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $add: [ 1, 2 ] } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $add: [ 1, 2, 3, 4 ] } ) === 10 );
			assert.ok( jsongin.Evaluate( { a: 8, b: 5 }, { $add: [ '$a', '$b' ] } ) === 13 );
		} );

		it( 'should add zero', () =>
		{
			assert.ok( jsongin.Evaluate( { a: 0 }, { $add: [ '$a', 5 ] } ) === 5 );
			assert.ok( jsongin.Evaluate( {}, { $add: [ 0, 0 ] } ) === 0 );
		} );

		it( 'should return null when an operand is null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $add: [ '$missing', 5 ] } ) === null );
			assert.ok( jsongin.Evaluate( { a: null }, { $add: [ '$a', 5 ] } ) === null );
		} );

		it( 'should add milliseconds to a date', () =>
		{
			let result = jsongin.Evaluate( { when: new Date( 1000 ) }, { $add: [ '$when', 500 ] } );
			assert.ok( result instanceof Date );
			assert.ok( result.getTime() === 1500 );
		} );

		it( 'should throw when an operand is not numeric', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $add: [ 'abc', 1 ] } ); }, /requires numeric operands/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $add: [ true, 1 ] } ); }, /requires numeric operands/ );
		} );

		it( 'should be callable directly from the operator registry', () =>
		{
			assert.ok( jsongin.ExpressionOperators.$add.Evaluate( { a: 1 }, [ '$a', 2 ] ) === 3 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$subtract Tests', () =>
	{

		it( 'should subtract numbers', () =>
		{
			assert.ok( jsongin.Evaluate( { dmg: 8, armor: 5 }, { $subtract: [ '$dmg', '$armor' ] } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $subtract: [ 5, 8 ] } ) === -3 );
		} );

		it( 'should return the milliseconds between two dates', () =>
		{
			let document = { a: new Date( 5000 ), b: new Date( 2000 ) };
			assert.ok( jsongin.Evaluate( document, { $subtract: [ '$a', '$b' ] } ) === 3000 );
		} );

		it( 'should subtract milliseconds from a date', () =>
		{
			let result = jsongin.Evaluate( { a: new Date( 5000 ) }, { $subtract: [ '$a', 2000 ] } );
			assert.ok( result instanceof Date );
			assert.ok( result.getTime() === 3000 );
		} );

		it( 'should return null when an operand is null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $subtract: [ '$missing', 5 ] } ) === null );
		} );

		it( 'should throw when the argument count is wrong', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $subtract: [ 1 ] } ); }, /requires at least 2/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $subtract: [ 1, 2, 3 ] } ); }, /requires at most 2/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$multiply Tests', () =>
	{

		it( 'should multiply numbers', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $multiply: [ 3, 4 ] } ) === 12 );
			assert.ok( jsongin.Evaluate( {}, { $multiply: [ 2, 3, 4 ] } ) === 24 );
		} );

		it( 'should multiply by zero', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $multiply: [ 3, 0 ] } ) === 0 );
		} );

		it( 'should return null when an operand is null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $multiply: [ '$missing', 5 ] } ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$divide Tests', () =>
	{

		it( 'should divide numbers', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $divide: [ 12, 4 ] } ) === 3 );
			assert.ok( jsongin.Evaluate( { hp: 3, max: 10 }, { $divide: [ '$hp', '$max' ] } ) === 0.3 );
		} );

		it( 'should return zero when the dividend is zero', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $divide: [ 0, 4 ] } ) === 0 );
		} );

		it( 'should return null when an operand is null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $divide: [ '$missing', 4 ] } ) === null );
		} );

		it( 'should throw when dividing by zero', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $divide: [ 12, 0 ] } ); }, /cannot divide by zero/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$mod Tests', () =>
	{

		it( 'should return the remainder', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $mod: [ 13, 5 ] } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $mod: [ 10, 5 ] } ) === 0 );
		} );

		it( 'should throw when dividing by zero', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $mod: [ 13, 0 ] } ); }, /cannot divide by zero/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$abs Tests', () =>
	{

		it( 'should return the absolute value', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $abs: -7 } ) === 7 );
			assert.ok( jsongin.Evaluate( {}, { $abs: 7 } ) === 7 );
			assert.ok( jsongin.Evaluate( {}, { $abs: 0 } ) === 0 );
			assert.ok( jsongin.Evaluate( { a: -3 }, { $abs: '$a' } ) === 3 );
		} );

		it( 'should accept a single argument within an array', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $abs: [ -7 ] } ) === 7 );
		} );

		it( 'should return null when the operand is null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $abs: '$missing' } ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$min and $max Tests', () =>
	{

		it( 'should select the smallest and largest values', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $min: [ 3, 1, 2 ] } ) === 1 );
			assert.ok( jsongin.Evaluate( {}, { $max: [ 3, 1, 2 ] } ) === 3 );
		} );

		it( 'should select from the values of a single array operand', () =>
		{
			let document = { scores: [ 30, 10, 20 ] };
			assert.ok( jsongin.Evaluate( document, { $min: '$scores' } ) === 10 );
			assert.ok( jsongin.Evaluate( document, { $max: '$scores' } ) === 30 );
		} );

		it( 'should ignore null and missing values', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $min: [ 3, null, 1 ] } ) === 1 );
			assert.ok( jsongin.Evaluate( {}, { $max: [ '$missing', 5 ] } ) === 5 );
		} );

		it( 'should return null when all of the values are null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $min: [ null, null ] } ) === null );
			assert.ok( jsongin.Evaluate( {}, { $max: [ '$missing' ] } ) === null );
		} );

		it( 'should select zero, which is a value and not a missing value', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $min: [ 3, 0 ] } ) === 0 );
			assert.ok( jsongin.Evaluate( {}, { $max: [ -3, 0 ] } ) === 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$eq and $ne Tests', () =>
	{

		it( 'should compare primitive values', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $eq: [ 1, 1 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $eq: [ 1, 2 ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $ne: [ 1, 2 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $eq: [ 'abc', 'abc' ] } ) === true );
		} );

		it( 'should not equate values of different types', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $eq: [ 1, '1' ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $eq: [ 0, false ] } ) === false );
		} );

		it( 'should equate null and missing values', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $eq: [ '$missing', null ] } ) === true );
			assert.ok( jsongin.Evaluate( { a: null }, { $eq: [ '$a', '$missing' ] } ) === true );
		} );

		it( 'should compare document fields to each other', () =>
		{
			assert.ok( jsongin.Evaluate( { a: 1, b: 1 }, { $eq: [ '$a', '$b' ] } ) === true );
			assert.ok( jsongin.Evaluate( { a: 1, b: 2 }, { $eq: [ '$a', '$b' ] } ) === false );
		} );

		it( 'should compare arrays and objects by value', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $eq: [ [ 1, 2 ], [ 1, 2 ] ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $eq: [ [ 1, 2 ], [ 2, 1 ] ] } ) === false );
			assert.ok( jsongin.Evaluate( { a: { x: 1 } }, { $eq: [ '$a', { $literal: { x: 1 } } ] } ) === true );
		} );

		it( 'should throw when the argument count is wrong', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $eq: [ 1 ] } ); }, /requires exactly two arguments/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$gt, $gte, $lt, $lte, and $cmp Tests', () =>
	{

		it( 'should compare numbers', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $gt: [ 2, 1 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $gt: [ 1, 1 ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $gte: [ 1, 1 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $lt: [ 1, 2 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $lte: [ 1, 1 ] } ) === true );
		} );

		it( 'should compare document fields to each other', () =>
		{
			let document = { dmg: 8, armor: 5 };
			assert.ok( jsongin.Evaluate( document, { $gt: [ '$dmg', '$armor' ] } ) === true );
			assert.ok( jsongin.Evaluate( document, { $lt: [ '$dmg', '$armor' ] } ) === false );
		} );

		it( 'should return -1, 0, and 1 from $cmp', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $cmp: [ 1, 2 ] } ) === -1 );
			assert.ok( jsongin.Evaluate( {}, { $cmp: [ 2, 2 ] } ) === 0 );
			assert.ok( jsongin.Evaluate( {}, { $cmp: [ 3, 2 ] } ) === 1 );
		} );

		it( 'should order values of different types', () =>
		{
			// null < numbers < strings < objects < arrays < booleans
			assert.ok( jsongin.Evaluate( {}, { $lt: [ null, 5 ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $lt: [ 5, 'abc' ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $lt: [ 'abc', true ] } ) === true );
		} );

		it( 'should agree with $eq when values are equal', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $cmp: [ [ 1, 2 ], [ 1, 2 ] ] } ) === 0 );
			assert.ok( jsongin.Evaluate( {}, { $eq: [ [ 1, 2 ], [ 1, 2 ] ] } ) === true );
		} );

		it( 'should compare dates', () =>
		{
			let document = { a: new Date( 5000 ), b: new Date( 2000 ) };
			assert.ok( jsongin.Evaluate( document, { $gt: [ '$a', '$b' ] } ) === true );
			assert.ok( jsongin.Evaluate( document, { $eq: [ '$a', '$a' ] } ) === true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$and, $or, and $not Tests', () =>
	{

		it( 'should evaluate logical expressions', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $and: [ true, true ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $and: [ true, false ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $or: [ false, true ] } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $or: [ false, false ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $not: false } ) === true );
			assert.ok( jsongin.Evaluate( {}, { $not: [ true ] } ) === false );
		} );

		it( 'should treat false, zero, null, and missing values as false', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $and: [ 0 ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $and: [ null ] } ) === false );
			assert.ok( jsongin.Evaluate( {}, { $and: [ '$missing' ] } ) === false );
		} );

		it( 'should treat the empty string and the empty array as true', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $and: [ { $literal: '' } ] } ) === true );
			assert.ok( jsongin.Evaluate( { a: [] }, { $and: [ '$a' ] } ) === true );
		} );

		it( 'should combine comparison expressions', () =>
		{
			let document = { hp: 3, max: 10, poisoned: true };
			let expression = {
				$and: [
					{ $gt: [ '$hp', 0 ] },
					{ $lte: [ { $divide: [ '$hp', '$max' ] }, 0.5 ] },
				]
			};
			assert.ok( jsongin.Evaluate( document, expression ) === true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$cond Tests', () =>
	{

		it( 'should select a branch using the array form', () =>
		{
			assert.ok( jsongin.Evaluate( { hp: 3 }, { $cond: [ { $gt: [ '$hp', 0 ] }, 'alive', 'dead' ] } ) === 'alive' );
			assert.ok( jsongin.Evaluate( { hp: 0 }, { $cond: [ { $gt: [ '$hp', 0 ] }, 'alive', 'dead' ] } ) === 'dead' );
		} );

		it( 'should select a branch using the object form', () =>
		{
			let expression = { $cond: { if: { $gt: [ '$hp', 0 ] }, then: 'alive', else: 'dead' } };
			assert.ok( jsongin.Evaluate( { hp: 3 }, expression ) === 'alive' );
			assert.ok( jsongin.Evaluate( { hp: 0 }, expression ) === 'dead' );
		} );

		it( 'should not evaluate the branch which is not selected', () =>
		{
			// The else branch would throw if it were evaluated.
			let expression = { $cond: [ true, 'ok', { $divide: [ 1, 0 ] } ] };
			assert.ok( jsongin.Evaluate( {}, expression ) === 'ok' );
		} );

		it( 'should throw when the argument count is wrong', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $cond: [ true, 1 ] } ); }, /requires exactly three arguments/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$ifNull Tests', () =>
	{

		it( 'should return the first value which is not null or missing', () =>
		{
			assert.ok( jsongin.Evaluate( { a: 5 }, { $ifNull: [ '$a', 0 ] } ) === 5 );
			assert.ok( jsongin.Evaluate( {}, { $ifNull: [ '$a', 0 ] } ) === 0 );
			assert.ok( jsongin.Evaluate( { a: null }, { $ifNull: [ '$a', 0 ] } ) === 0 );
		} );

		it( 'should accept more than two expressions', () =>
		{
			assert.ok( jsongin.Evaluate( { c: 3 }, { $ifNull: [ '$a', '$b', '$c', 0 ] } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $ifNull: [ '$a', '$b', '$c', 0 ] } ) === 0 );
		} );

		it( 'should return zero rather than treating it as a missing value', () =>
		{
			assert.ok( jsongin.Evaluate( { a: 0 }, { $ifNull: [ '$a', 99 ] } ) === 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$switch Tests', () =>
	{

		it( 'should return the first matching branch', () =>
		{
			let expression = {
				$switch: {
					branches: [
						{ case: { $lte: [ '$hp', 0 ] }, then: 'dead' },
						{ case: { $lt: [ '$hp', 5 ] }, then: 'wounded' },
					],
					default: 'healthy',
				}
			};
			assert.ok( jsongin.Evaluate( { hp: 0 }, expression ) === 'dead' );
			assert.ok( jsongin.Evaluate( { hp: 3 }, expression ) === 'wounded' );
			assert.ok( jsongin.Evaluate( { hp: 9 }, expression ) === 'healthy' );
		} );

		it( 'should throw when no branch matches and no default was given', () =>
		{
			let expression = { $switch: { branches: [ { case: false, then: 'never' } ] } };
			assert.throws( function () { jsongin.Evaluate( {}, expression ); }, /no branch matched/ );
		} );

		it( 'should throw when the branches are malformed', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: {} } ); }, /requires a \[branches\] array/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: { branches: [] } } ); }, /at least one branch/ );
		} );

	} );


} );
