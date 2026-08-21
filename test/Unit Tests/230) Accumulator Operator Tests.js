'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
		Explain: false,
	} );


//---------------------------------------------------------------------
function accumulate( Name, Documents, Args )
{
	// An accumulator now needs a scope, the same as every other operator. A direct call is
	// the caller's to supply one for - see docs/guides/Operator-Authoring.md.
	return jsongin.AccumulatorOperators[ Name ].Accumulate( Documents, Args, jsongin.Scope.NewPipeline() );
}


describe( '230) Accumulator Operator Tests', () =>
{


	//---------------------------------------------------------------------
	describe( '$sum Tests', () =>
	{

		it( 'should sum the numeric values in a group', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			assert.ok( accumulate( '$sum', documents, '$n' ) === 6 );
		} );

		it( 'should count the documents in a group with $sum: 1', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			assert.ok( accumulate( '$sum', documents, 1 ) === 3 );
		} );

		it( 'should sum the result of an expression', () =>
		{
			let documents = [ { a: 2, b: 3 }, { a: 4, b: 1 } ];
			assert.ok( accumulate( '$sum', documents, { $multiply: [ '$a', '$b' ] } ) === 10 );
		} );

		it( 'should ignore non-numeric values', () =>
		{
			let documents = [ { n: 1 }, { n: 'abc' }, { n: null }, {}, { n: true }, { n: [ 1, 2 ] }, { n: 4 } ];
			assert.ok( accumulate( '$sum', documents, '$n' ) === 5 );
		} );

		it( 'should not coerce numeric strings', () =>
		{
			let documents = [ { n: 1 }, { n: '2' } ];
			assert.ok( accumulate( '$sum', documents, '$n' ) === 1 );
		} );

		it( 'should return zero for an empty group', () =>
		{
			assert.ok( accumulate( '$sum', [], '$n' ) === 0 );
		} );

		it( 'should return zero when nothing in the group is numeric', () =>
		{
			let documents = [ { n: 'abc' }, { n: null }, {} ];
			assert.ok( accumulate( '$sum', documents, '$n' ) === 0 );
		} );

		it( 'should ignore what the expression operator $add throws on', () =>
		{
			// The asymmetry is deliberate. An expression is authored against one document,
			// where a type error is worth surfacing. An accumulator runs across a whole group,
			// where one malformed document should not abort the report.
			let documents = [ { n: 1 }, { n: 'abc' } ];
			assert.ok( accumulate( '$sum', documents, '$n' ) === 1 );
			assert.throws( function () { jsongin.Evaluate( { n: 'abc' }, { $add: [ '$n', 1 ] } ); }, /requires numeric operands/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$avg Tests', () =>
	{

		it( 'should average the numeric values in a group', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			assert.ok( accumulate( '$avg', documents, '$n' ) === 2 );
		} );

		it( 'should ignore non-numeric values, and not count them in the divisor', () =>
		{
			let documents = [ { n: 2 }, { n: 'abc' }, { n: null }, {}, { n: 4 } ];
			assert.ok( accumulate( '$avg', documents, '$n' ) === 3 );
		} );

		it( 'should return null for an empty group', () =>
		{
			assert.ok( accumulate( '$avg', [], '$n' ) === null );
		} );

		it( 'should return null when nothing in the group is numeric', () =>
		{
			let documents = [ { n: 'abc' }, { n: null }, {} ];
			assert.ok( accumulate( '$avg', documents, '$n' ) === null );
		} );

		it( 'should ignore what the expression operator $add throws on', () =>
		{
			let documents = [ { n: 4 }, { n: 'abc' } ];
			assert.ok( accumulate( '$avg', documents, '$n' ) === 4 );
			assert.throws( function () { jsongin.Evaluate( { n: 'abc' }, { $add: [ '$n', 1 ] } ); }, /requires numeric operands/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$min Tests', () =>
	{

		it( 'should return the smallest value in a group', () =>
		{
			let documents = [ { n: 3 }, { n: 1 }, { n: 2 } ];
			assert.ok( accumulate( '$min', documents, '$n' ) === 1 );
		} );

		it( 'should ignore null and missing values', () =>
		{
			let documents = [ { n: 3 }, { n: null }, {}, { n: 2 } ];
			assert.ok( accumulate( '$min', documents, '$n' ) === 2 );
		} );

		it( 'should order mixed types by the BSON type order', () =>
		{
			let documents = [ { n: 'abc' }, { n: true }, { n: 5 } ];
			assert.ok( accumulate( '$min', documents, '$n' ) === 5 );
		} );

		it( 'should return null for an empty group', () =>
		{
			assert.ok( accumulate( '$min', [], '$n' ) === null );
		} );

		it( 'should return null when every value is null or missing', () =>
		{
			let documents = [ { n: null }, {}, { n: null } ];
			assert.ok( accumulate( '$min', documents, '$n' ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$max Tests', () =>
	{

		it( 'should return the largest value in a group', () =>
		{
			let documents = [ { n: 3 }, { n: 1 }, { n: 2 } ];
			assert.ok( accumulate( '$max', documents, '$n' ) === 3 );
		} );

		it( 'should ignore null and missing values', () =>
		{
			let documents = [ { n: null }, {}, { n: 2 } ];
			assert.ok( accumulate( '$max', documents, '$n' ) === 2 );
		} );

		it( 'should order mixed types by the BSON type order', () =>
		{
			let documents = [ { n: 'abc' }, { n: true }, { n: 5 } ];
			assert.ok( accumulate( '$max', documents, '$n' ) === true );
		} );

		it( 'should return null for an empty group', () =>
		{
			assert.ok( accumulate( '$max', [], '$n' ) === null );
		} );

		it( 'should return null when every value is null or missing', () =>
		{
			let documents = [ { n: null }, {}, { n: null } ];
			assert.ok( accumulate( '$max', documents, '$n' ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$count Tests', () =>
	{

		it( 'should count the documents in a group', () =>
		{
			let documents = [ { n: 1 }, { n: 'abc' }, {} ];
			assert.ok( accumulate( '$count', documents, {} ) === 3 );
		} );

		it( 'should return zero for an empty group', () =>
		{
			assert.ok( accumulate( '$count', [], {} ) === 0 );
		} );

		it( 'should throw when the argument is not an empty object', () =>
		{
			assert.throws( function () { accumulate( '$count', [], '$n' ); }, /requires an empty object/ );
			assert.throws( function () { accumulate( '$count', [], { n: 1 } ); }, /requires an empty object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$push Tests', () =>
	{

		it( 'should collect every value in group order', () =>
		{
			let documents = [ { n: 3 }, { n: 1 }, { n: 3 } ];
			assert.ok( jsongin.StrictEquals( accumulate( '$push', documents, '$n' ), [ 3, 1, 3 ] ) );
		} );

		it( 'should keep nulls', () =>
		{
			let documents = [ { n: 1 }, { n: null }, { n: 2 } ];
			assert.ok( jsongin.StrictEquals( accumulate( '$push', documents, '$n' ), [ 1, null, 2 ] ) );
		} );

		it( 'should not push a missing value', () =>
		{
			let documents = [ { n: 1 }, {}, { n: 2 } ];
			assert.ok( jsongin.StrictEquals( accumulate( '$push', documents, '$n' ), [ 1, 2 ] ) );
		} );

		it( 'should push the result of an expression', () =>
		{
			let documents = [ { a: 1, b: 2 }, { a: 3, b: 4 } ];
			let result = accumulate( '$push', documents, { sum: { $add: [ '$a', '$b' ] } } );
			assert.ok( jsongin.StrictEquals( result, [ { sum: 3 }, { sum: 7 } ] ) );
		} );

		it( 'should return an empty array for an empty group', () =>
		{
			assert.ok( jsongin.StrictEquals( accumulate( '$push', [], '$n' ), [] ) );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$first Tests', () =>
	{

		it( 'should return the value from the first document in the group', () =>
		{
			let documents = [ { n: 3 }, { n: 1 }, { n: 2 } ];
			assert.ok( accumulate( '$first', documents, '$n' ) === 3 );
		} );

		it( 'should return null when the first value is null', () =>
		{
			let documents = [ { n: null }, { n: 1 } ];
			assert.ok( accumulate( '$first', documents, '$n' ) === null );
		} );

		it( 'should return a missing value when the first document does not have the field', () =>
		{
			let documents = [ {}, { n: 1 } ];
			assert.ok( accumulate( '$first', documents, '$n' ) === undefined );
		} );

		it( 'should return null for an empty group', () =>
		{
			assert.ok( accumulate( '$first', [], '$n' ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$last Tests', () =>
	{

		it( 'should return the value from the last document in the group', () =>
		{
			let documents = [ { n: 3 }, { n: 1 }, { n: 2 } ];
			assert.ok( accumulate( '$last', documents, '$n' ) === 2 );
		} );

		it( 'should return null when the last value is null', () =>
		{
			let documents = [ { n: 1 }, { n: null } ];
			assert.ok( accumulate( '$last', documents, '$n' ) === null );
		} );

		it( 'should return a missing value when the last document does not have the field', () =>
		{
			let documents = [ { n: 1 }, {} ];
			assert.ok( accumulate( '$last', documents, '$n' ) === undefined );
		} );

		it( 'should return null for an empty group', () =>
		{
			assert.ok( accumulate( '$last', [], '$n' ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$addToSet Tests', () =>
	{

		// $addToSet collects the distinct values. Its order is not specified, so these tests
		// compare a sorted copy of the result.

		it( 'should collect the distinct values, compared by content', () =>
		{
			let documents = [ { a: 1 }, { a: 1 }, { a: 2 } ];
			let result = accumulate( '$addToSet', documents, '$a' ).slice().sort();
			assert.deepEqual( result, [ 1, 2 ] );
		} );

		it( 'should recognize an equal document as already present', () =>
		{
			let documents = [ { a: { x: 1 } }, { a: { x: 1 } } ];
			let result = accumulate( '$addToSet', documents, '$a' );
			assert.strictEqual( result.length, 1 );
			assert.deepEqual( result[ 0 ], { x: 1 } );
		} );

		it( 'should keep a null and skip a missing value', () =>
		{
			let documents = [ { a: 1 }, { a: null }, {} ];
			let result = accumulate( '$addToSet', documents, '$a' );
			// null is a value; a missing field contributes nothing.
			assert.strictEqual( result.length, 2 );
			assert.ok( result.includes( 1 ) );
			assert.ok( result.includes( null ) );
		} );

		it( 'should return an empty array for an empty group', () =>
		{
			assert.deepEqual( accumulate( '$addToSet', [], '$a' ), [] );
		} );

	} );


} );
