'use strict';

const assert = require( 'assert' );
const JSON_ENGINE = require( '../src/jsongin' )( {
	PathExtensions: false,
	Explain: false,
} );


describe( '200) Comparison Operator Tests', () =>
{


	describe( '$eq Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( true, true ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( true, false ) === false );
		} );

		it( 'should not equate boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( true, 1 ) === false );
		} );

		it( 'should not equate boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( true, '1' ) === false );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 42, 42 ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 42, 42.0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 42, 3.14 ) === false );
		} );

		it( 'should not equate numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 3.14, '3.14' ) === false );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 'abc', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( null, null ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( null, 'abcd' ) === false );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( { a: 1, b: 2 }, { user: {} } ) === false );
		} );

		it( 'should equate object values, but values must be strictly === to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === false );
		} );

		it( 'should not equate object values with keys in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
		} );

		it( 'should not equate arrays with elements in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === false );
		} );

		it( 'should equate arrays, but values must be strictly === to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( [ 1, 2, 3 ], [ 1, '2', 3 ] ) === false );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( function () { }, function () { } ) === false );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( undefined, undefined ) === true );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eq.Query( null, undefined ) === true );
			assert.ok( JSON_ENGINE.Operators.$eq.Query( undefined, null ) === true );
		} );

	} );


	describe( '$eqx Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( true, true ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( true, false ) === false );
		} );

		it( 'should equate boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( false, 0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( true, 1 ) === true );
		} );

		it( 'should equate boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( false, '0' ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( true, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 42, 42 ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 42, 42.0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 42, 3.14 ) === false );
		} );

		it( 'should equate numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 42, '42' ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 42, '42.0' ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 3.14, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 'abc', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( null, null ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( null, 'abcd' ) === false );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( { a: 1, b: 2 }, { user: {} } ) === false );
		} );

		it( 'should equate object values and values can be loosely == to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === true );
		} );

		it( 'should equate object values with keys in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
		} );

		it( 'should equate arrays with elements in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === true );
		} );

		it( 'should equate arrays and values can be loosely == to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( [ 1, 2, 3 ], [ 1, '2.0', 3 ] ) === true );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( function () { }, function () { } ) === false );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( undefined, undefined ) === true );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( null, undefined ) === true );
			assert.ok( JSON_ENGINE.Operators.$eqx.Query( undefined, null ) === true );
		} );

	} );


	describe( '$ne Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( true, true ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( true, false ) === true );
		} );

		it( 'should not equate boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( false, 0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( true, 1 ) === true );
		} );

		it( 'should not equate boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( false, '0' ) === true );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( true, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 42, 42 ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 42, 42.0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 42, 3.14 ) === true );
		} );

		it( 'should not equate numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 42, '42' ) === true );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 42, '42.0' ) === true );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 3.14, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 'abc', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( null, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( null, 'abcd' ) === true );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( { a: 1, b: 2 }, { user: {} } ) === true );
		} );

		it( 'should equate object values, but values must be strictly === to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === true );
		} );

		it( 'should not equate object values with keys in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not equate arrays with elements in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === true );
		} );

		it( 'should equate arrays, but values must be strictly === to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( [ 1, 2, 3 ], [ 1, '2', 3 ] ) === true );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( function () { }, function () { } ) === true );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( undefined, undefined ) === false );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$ne.Query( null, undefined ) === false );
			assert.ok( JSON_ENGINE.Operators.$ne.Query( undefined, null ) === false );
		} );

	} );


	describe( '$nex Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, true ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, false ) === true );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, true ) === true );
		} );

		it( 'should equate boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, 1 ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, 0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, 1 ) === true );
		} );

		it( 'should equate boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, '1' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( true, '0' ) === true );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( false, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, 42 ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, 42.0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, 3.14 ) === true );
		} );

		it( 'should equate numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 3.14, '3.14' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 42, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 'abc', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( null, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( null, 'abcd' ) === true );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( { a: 1, b: 2 }, { user: {} } ) === true );
		} );

		it( 'should equate object values and values can be loosely == to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === false );
		} );

		it( 'should equate object values with keys in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should equate arrays with elements in different order', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === false );
		} );

		it( 'should equate arrays and values can be loosely == to each other', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( [ 1, 2, 3 ], [ 1, '2.0', 3 ] ) === false );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( function () { }, function () { } ) === true );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( undefined, undefined ) === false );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nex.Query( null, undefined ) === false );
			assert.ok( JSON_ENGINE.Operators.$nex.Query( undefined, null ) === false );
		} );

	} );


	describe( '$gte Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, false ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, true ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, false ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, true ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, 1 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, '1' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( true, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, 42 ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, 42.0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, 3.14 ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 3.14, 42 ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 42, '3.14' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 'abc', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 'abcd', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( null, null ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( null, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( false, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( null, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( 0, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( null, '' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( function () { }, function () { } ) === false );
		} );

		it( 'should compare undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( undefined, undefined ) === true );
		} );

		it( 'should compare null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gte.Query( null, undefined ) === true );
			assert.ok( JSON_ENGINE.Operators.$gte.Query( undefined, null ) === true );
		} );

	} );


	describe( '$gt Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, true ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, false ) === true );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, true ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, 1 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, '1' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( true, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, 42 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, 42.0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, 3.14 ) === true );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 3.14, 42 ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 42, '3.14' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 'abc', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 'abcd', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should not compare two nulls', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( null, null ) === false );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( null, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( false, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( null, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( 0, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( null, '' ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( function () { }, function () { } ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( undefined, undefined ) === false );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$gt.Query( null, undefined ) === false );
			assert.ok( JSON_ENGINE.Operators.$gt.Query( undefined, null ) === false );
		} );

	} );


	describe( '$lte Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, false ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, true ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, true ) === true );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, 1 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, '1' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( true, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, 42 ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, 42.0 ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, 3.14 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 3.14, 42 ) === true );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 42, '3.14' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 'abc', 'abc' ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 'abcd', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( null, null ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( null, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( false, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( null, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( 0, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( null, '' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( function () { }, function () { } ) === false );
		} );

		it( 'should compare undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( undefined, undefined ) === true );
		} );

		it( 'should compare null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lte.Query( null, undefined ) === true );
			assert.ok( JSON_ENGINE.Operators.$lte.Query( undefined, null ) === true );
		} );

	} );


	describe( '$lt Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, true ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, true ) === true );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, 1 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, '1' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( true, '0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, 42 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, 42.0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, 3.14 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 3.14, 42 ) === true );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, '42' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, '42.0' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 42, '3.14' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 'abc', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 'abcd', 'abc' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should not compare two nulls', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( null, null ) === false );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( null, false ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( false, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( null, 0 ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( 0, null ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( null, '' ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( function () { }, function () { } ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( undefined, undefined ) === false );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$lt.Query( null, undefined ) === false );
			assert.ok( JSON_ENGINE.Operators.$lt.Query( undefined, null ) === false );
		} );

	} );


	describe( '$in Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ false ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ true ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ false ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ true ] ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ 0 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ 1 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ 0 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ 1 ] ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ '0' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ '1' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( true, [ '0' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ '1' ] ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ 42 ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ 42.0 ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ 3.14 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 3.14, [ 42 ] ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ '42' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ '42.0' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 42, [ '3.14' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 3.14, [ '42' ] ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( 'abc', [ 'abc' ] ) === true );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 'abcd', [ 'abc' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 'abc', [ 'abcd' ] ) === false );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( null, [ null ] ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( null, [ false ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( false, [ null ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( null, [ 0 ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( 0, [ null ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( null, [ '' ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( '', [ null ] ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( { a: 1, b: 2 }, [ { a: 1, b: 2 } ] ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( [ [ 1, 2, 3 ] ], [ [ 1, 2, 3 ] ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( function () { }, [ function () { } ] ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( undefined, [ undefined ] ) === true );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$in.Query( null, [ undefined ] ) === false );
			assert.ok( JSON_ENGINE.Operators.$in.Query( undefined, [ null ] ) === false );
		} );

	} );


} );

