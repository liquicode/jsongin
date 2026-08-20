'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
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

		// A field reference which crosses an array gathers the values of the elements.
		// Every case below was measured against MongoDB 6.0.1.

		it( 'should gather a field reference through an array', () =>
		{
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: 1 }, { x: 2 } ] }, '$a.x' ), [ 1, 2 ] );
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: 1 } ] }, '$a.x' ), [ 1 ] );
		} );

		it( 'should omit elements which do not have the field', () =>
		{
			// These used to gather to [ 5, undefined ] and [ undefined ], because GetValue
			// contributes a placeholder for every element. An aggregation expression omits.
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: 5 }, { y: 9 } ] }, '$a.x' ), [ 5 ] );
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { y: 9 } ] }, '$a.x' ), [] );
			assert.deepStrictEqual( jsongin.Evaluate( { a: [] }, '$a.x' ), [] );
		} );

		it( 'should evaluate a reference to a missing field as undefined', () =>
		{
			// Distinct from an empty array: nothing was traversed, so there is no value.
			assert.strictEqual( jsongin.Evaluate( { b: 1 }, '$a.x' ), undefined );
			assert.strictEqual( jsongin.Evaluate( { a: 5 }, '$a.x' ), undefined );
		} );

		it( 'should keep a field which really holds an array whole', () =>
		{
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: [ 5, 6 ] } ] }, '$a.x' ), [ [ 5, 6 ] ] );
		} );

		it( 'should gather through two levels of array', () =>
		{
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { b: [ { c: 1 } ] } ] }, '$a.b.c' ), [ [ 1 ] ] );
		} );

		it( 'should not index an array by number', () =>
		{
			// An aggregation field path never indexes an array, not even with a numeric key.
			// MongoDB applies every key to the elements, so '$a.1.x' gathers the field '1'
			// from each element and finds none. Positional access is $arrayElemAt, which is
			// a different thing. Verified against MongoDB 6.0.1.
			//
			// Query paths are the ones which index: { 'a.1.x': 2 } does match. The two
			// languages resolve a path differently and jsongin now follows each of them.
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: 1 }, { x: 2 } ] }, '$a.1.x' ), [] );
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ { x: 1 } ] }, '$a.9.x' ), [] );
			assert.deepStrictEqual( jsongin.Evaluate( { a: [ 1, 2, 3 ] }, '$a.-1' ), [] );
		} );

		it( 'should read a document field which is literally named with a number', () =>
		{
			// Against an object the key is a field name rather than an index, so it resolves.
			assert.strictEqual( jsongin.Evaluate( { a: { '1': { x: 7 } } }, '$a.1.x' ), 7 );
		} );

		it( 'should leave GetValue reading the same way it always has', () =>
		{
			// GetValue keeps the placeholder on purpose. Its result stays positionally
			// aligned with the array it read from, which is documented, and Sort depends on
			// it because MongoDB treats a missing element as null when building a sort key.
			assert.deepStrictEqual( jsongin.GetValue( { a: [ { x: 5 }, { y: 9 } ] }, 'a.x' ), [ 5, undefined ] );
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


	//---------------------------------------------------------------------
	describe( '$ceil and $floor Tests', () =>
	{

		it( 'should round up to the next integer with $ceil', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $ceil: 2.1 } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $ceil: -2.1 } ) === -2 );
		} );

		it( 'should round down to the previous integer with $floor', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $floor: 2.9 } ) === 2 );
			assert.ok( jsongin.Evaluate( {}, { $floor: -2.9 } ) === -3 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$round Tests', () =>
	{

		// $round rounds half to even, which is what MongoDB does and Math.round() does not.

		it( 'should round half to even', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $round: [ 2.5 ] } ) === 2 );
			assert.ok( jsongin.Evaluate( {}, { $round: [ 3.5 ] } ) === 4 );
			assert.ok( jsongin.Evaluate( {}, { $round: [ 2.4 ] } ) === 2 );
			assert.ok( jsongin.Evaluate( {}, { $round: [ 2.6 ] } ) === 3 );
		} );

		it( 'should round to a positive decimal place', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $round: [ 3.14159, 2 ] } ) === 3.14 );
		} );

		it( 'should round to a negative place, left of the decimal point', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $round: [ 1234, -1 ] } ) === 1230 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$trunc Tests', () =>
	{

		// $trunc discards digits past the place without rounding, so it cuts toward zero.

		it( 'should discard the digits past the decimal point', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $trunc: [ 2.9 ] } ) === 2 );
			assert.ok( jsongin.Evaluate( {}, { $trunc: [ -2.9 ] } ) === -2 );
		} );

		it( 'should truncate to a positive decimal place', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $trunc: [ 3.14159, 2 ] } ) === 3.14 );
		} );

		it( 'should truncate to a negative place, left of the decimal point', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $trunc: [ 1234, -1 ] } ) === 1230 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$size (expression) Tests', () =>
	{

		it( 'should return the length of an array', () =>
		{
			assert.ok( jsongin.Evaluate( { scores: [ 10, 20, 30 ] }, { $size: '$scores' } ) === 3 );
		} );

		it( 'should throw when the operand is not an array', () =>
		{
			assert.throws( function () { jsongin.Evaluate( { a: 5 }, { $size: '$a' } ); }, /requires an array/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$arrayElemAt Tests', () =>
	{

		it( 'should return the element at a position', () =>
		{
			let document = { scores: [ 10, 20, 30 ] };
			assert.ok( jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', 1 ] } ) === 20 );
		} );

		it( 'should count a negative position back from the end', () =>
		{
			let document = { scores: [ 10, 20, 30 ] };
			assert.ok( jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', -1 ] } ) === 30 );
		} );

		it( 'should give a missing value for a position outside the array', () =>
		{
			let document = { scores: [ 10, 20, 30 ] };
			assert.ok( jsongin.Evaluate( document, { $arrayElemAt: [ '$scores', 10 ] } ) === undefined );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$concatArrays Tests', () =>
	{

		it( 'should join arrays end to end', () =>
		{
			assert.deepEqual( jsongin.Evaluate( {}, { $concatArrays: [ [ 1, 2 ], [ 3 ] ] } ), [ 1, 2, 3 ] );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$in (expression) Tests', () =>
	{

		// The expression $in takes the value first and the array second, the reverse of the
		// query operator of the same name.

		it( 'should be true when the array holds the value', () =>
		{
			let document = { scores: [ 10, 20, 30 ] };
			assert.ok( jsongin.Evaluate( document, { $in: [ 20, '$scores' ] } ) === true );
			assert.ok( jsongin.Evaluate( document, { $in: [ 99, '$scores' ] } ) === false );
		} );

	} );


	//---------------------------------------------------------------------
	// $bsonSize measures a Javascript object, and a Javascript object can hold things BSON
	// cannot. Neither case below can be a parity test: a document carrying an `undefined` or a
	// function does not survive a round trip through a server, so MongoDB has no opinion to
	// compare against. What the size arithmetic does with them is still worth pinning down.
	describe( '$bsonSize Javascript Value Tests', () =>
	{

		it( 'should not count a field which is undefined', () =>
		{
			// The BSON serializer drops such an element, so it costs nothing and the size is
			// the same as the document without it.
			assert.ok( jsongin.Evaluate( {}, { $bsonSize: { $literal: { a: 1 } } } ) === 12 );
			assert.ok( jsongin.Evaluate( {}, { $bsonSize: { $literal: { a: 1, b: undefined } } } ) === 12 );
			assert.ok( jsongin.Evaluate( {}, { $bsonSize: { $literal: { b: undefined } } } ) === 5 );
		} );

		it( 'should refuse a value which has no encoding', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $bsonSize: { $literal: { a: function () { } } } } ); } );
			assert.throws( function () { jsongin.Evaluate( {}, { $bsonSize: { $literal: { a: Symbol( 'x' ) } } } ); } );
		} );

	} );


	//---------------------------------------------------------------------
	// ***A boundary, written down where it can be checked.***
	//
	// MongoDB has int, long, and double as three BSON types, and a conversion tags its result
	// with the one it converted to: { $type: { $toLong: 42 } } is 'long' there, and
	// { $type: { $toDouble: 42 } } is 'double', for the very same number.
	//
	// jsongin holds JSON, where there is one number kind, and $type reports what follows from
	// the value: a whole number inside the 32 bit range is an int, whatever produced it. The
	// converted values agree with MongoDB in every case - only what $type says about a number
	// afterwards does not.
	//
	// These are unit tests and not parity tests on purpose. MongoDB has an opinion here and
	// jsongin cannot share it, so there is nothing to compare; asserting jsongin's own answer
	// is what keeps the boundary from moving without anyone noticing.
	describe( 'Numeric Conversion Type Boundary Tests', () =>
	{

		it( 'should convert the value correctly, which is the part that matters', () =>
		{
			assert.ok( jsongin.Evaluate( {}, { $toLong: 42 } ) === 42 );
			assert.ok( jsongin.Evaluate( {}, { $toDouble: 42 } ) === 42 );
			assert.ok( jsongin.Evaluate( {}, { $toInt: 3.9 } ) === 3 );
			assert.ok( jsongin.Evaluate( {}, { $convert: { input: 5, to: 'long' } } ) === 5 );
		} );

		it( 'should report a number type from the value, not from the conversion', () =>
		{
			// MongoDB answers 'long' and 'double' to these two.
			assert.ok( jsongin.Evaluate( {}, { $type: { $toLong: 42 } } ) === 'int' );
			assert.ok( jsongin.Evaluate( {}, { $type: { $toDouble: 42 } } ) === 'int' );
			assert.ok( jsongin.Evaluate( {}, { $type: { $convert: { input: 5, to: 'long' } } } ) === 'int' );
		} );

		it( 'should never report a number as a long', () =>
		{
			// There is no value a Javascript number can hold which reports as one.
			assert.ok( jsongin.BsonType( 42, true ) === 'int' );
			assert.ok( jsongin.BsonType( 3000000000, true ) === 'double' );
			assert.ok( jsongin.BsonType( Number.MAX_SAFE_INTEGER, true ) === 'double' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$literal Tests', () =>
	{

		it( 'should return a $-string as text rather than as a field reference', () =>
		{
			assert.ok( jsongin.Evaluate( { a: 5 }, { $literal: '$a' } ) === '$a' );
		} );

		it( 'should return an operator-shaped document as data', () =>
		{
			assert.deepEqual( jsongin.Evaluate( {}, { $literal: { $add: [ 1, 2 ] } } ), { $add: [ 1, 2 ] } );
		} );

	} );


	//---------------------------------------------------------------------
	// The shorthand forms of the object field operators, which read a system variable.
	//
	// MongoDB lets { $getField: 'name' } stand for reading the field from $$CURRENT, and
	// { $setField: { ..., value: '$$REMOVE' } } stand for removing it. Both need an
	// expression variable scope, which jsongin does not have, so there is no behavior to
	// compare and these are unit tests rather than parity tests - the same reason the numeric
	// conversion boundary above is one.
	//
	// What is asserted is that they are ***refused by name***, and not quietly read as
	// something else. A '$$CURRENT' silently treated as a literal string, or a '$$REMOVE'
	// written into a field as text, would be the bad outcome here.
	describe( 'Object Field Operator Shorthand Tests', () =>
	{

		it( 'should refuse the $getField shorthand rather than guessing at it', () =>
		{
			assert.throws( function () { jsongin.Evaluate( { a: 1 }, { $getField: 'a' } ); } );
		} );

		it( 'should say which form to write instead', () =>
		{
			try
			{
				jsongin.Evaluate( { a: 1 }, { $getField: 'a' } );
				assert.fail( 'expected a refusal' );
			}
			catch ( error )
			{
				assert.ok( error.message.includes( '$$CURRENT' ) );
				assert.ok( error.message.includes( 'input' ) );
			}
		} );

		it( 'should refuse a $setField which removes with $$REMOVE', () =>
		{
			assert.throws(
				function () { jsongin.Evaluate( {}, { $setField: { field: 'a', input: { a: 1 }, value: '$$REMOVE' } } ); },
				/system variables are not supported/ );
		} );

		it( 'should remove a field with $unsetField instead', () =>
		{
			// The supported way to do what $$REMOVE does.
			assert.deepEqual(
				jsongin.Evaluate( {}, { $unsetField: { field: 'a', input: { a: 1, b: 2 } } } ),
				{ b: 2 } );
		} );

	} );


} );
