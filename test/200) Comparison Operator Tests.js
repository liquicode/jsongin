'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )( {
	PathExtensions: false,
	Explain: false,
} );


describe( '200) Comparison Operator Tests', () =>
{


	describe( '$eq Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( true, true ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( true, false ) === false );
		} );

		it( 'should not equate boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( true, 1 ) === false );
		} );

		it( 'should not equate boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( true, '1' ) === false );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, 42 ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, 42.0 ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, 3.14 ) === false );
		} );

		it( 'should not equate numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( 3.14, '3.14' ) === false );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( 'abc', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( null, null ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( null, 'abcd' ) === false );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( { a: 1, b: 2 }, { user: {} } ) === false );
		} );

		it( 'should equate object values, but values must be strictly === to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === false );
		} );

		it( 'should equate complex object', () => 
		{
			let document = {
				id: 101,
				user: {
					name: 'Alice',
					location: 'East',
					history: [
						{ seq: 1, action: 'login' },
						{ seq: 2, action: 'read document' },
						{ seq: 3, action: 'write document' },
					],
				},
				profile: {
					login: 'alice',
					role: 'admin',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};
			assert.ok( jsongin.QueryOperators.$eq.Query( document, document ) === true );
		} );

		it( 'should equate complex arrays', () => 
		{
			let document = {
				users: [
					{ id: 101, user: { name: 'Alice' } },
					{ id: 102, user: { name: 'Bob' } },
					{ id: 103, user: { name: 'Eve' } },
				]
			};
			assert.ok( jsongin.QueryOperators.$eq.Query( document, document ) === true );
		} );

		it( 'should not equate object values with keys in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
		} );

		it( 'should not equate arrays with elements in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === false );
		} );

		it( 'should equate arrays, but values must be strictly === to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( [ 1, 2, 3 ], [ 1, '2', 3 ] ) === false );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( function () { }, function () { } ) === false );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( undefined, undefined ) === true );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( null, undefined ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( undefined, null ) === true );
		} );

	} );


	describe( '$eqx Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( true, true ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( true, false ) === false );
		} );

		it( 'should equate boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( false, 0 ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( true, 1 ) === true );
		} );

		it( 'should equate boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( false, '0' ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( true, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( 42, 42 ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( 42, 42.0 ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( 42, 3.14 ) === false );
		} );

		it( 'should equate numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( 42, '42' ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( 42, '42.0' ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( 3.14, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( 'abc', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( null, null ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( null, 'abcd' ) === false );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( { a: 1, b: 2 }, { user: {} } ) === false );
		} );

		it( 'should equate object values and values can be loosely == to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === true );
		} );

		it( 'should equate object values with keys in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query(
				{ id: 101, user: { name: 'Alice' } },
				{ user: { name: 'Alice' }, id: 101 } ) === true );
		} );

		it( 'should equate complex object', () => 
		{
			let document = {
				id: 101,
				user: {
					name: 'Alice',
					location: 'East',
					history: [
						{ seq: 1, action: 'login' },
						{ seq: 2, action: 'read document' },
						{ seq: 3, action: 'write document' },
					],
				},
				profile: {
					login: 'alice',
					role: 'admin',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};
			assert.ok( jsongin.QueryOperators.$eqx.Query( document, document ) === true );
		} );

		it( 'should equate complex arrays', () => 
		{
			let document1 = {
				users: [
					{ id: 101, user: { name: 'Alice' } },
					{ id: 102, user: { name: 'Bob' } },
					{ id: 103, user: { name: 'Eve' } },
				]
			};
			let document2 = {
				users: [
					{ user: { name: 'Eve' }, id: 103 },
					{ user: { name: 'Bob' }, id: 102 },
					{ user: { name: 'Alice' }, id: 101 },
				]
			};
			assert.ok( jsongin.QueryOperators.$eqx.Query( document1, document2 ) === true );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
		} );

		it( 'should equate arrays with elements in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === true );
		} );

		it( 'should equate arrays and values can be loosely == to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( [ 1, 2, 3 ], [ 1, '2.0', 3 ] ) === true );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( function () { }, function () { } ) === false );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( undefined, undefined ) === true );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( null, undefined ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( undefined, null ) === true );
		} );

	} );


	describe( '$ne Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( true, true ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( true, false ) === true );
		} );

		it( 'should not equate boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( false, 0 ) === true );
			assert.ok( jsongin.QueryOperators.$ne.Query( true, 1 ) === true );
		} );

		it( 'should not equate boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( false, '0' ) === true );
			assert.ok( jsongin.QueryOperators.$ne.Query( true, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( 42, 42 ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( 42, 42.0 ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( 42, 3.14 ) === true );
		} );

		it( 'should not equate numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( 42, '42' ) === true );
			assert.ok( jsongin.QueryOperators.$ne.Query( 42, '42.0' ) === true );
			assert.ok( jsongin.QueryOperators.$ne.Query( 3.14, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( 'abc', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( null, null ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( null, 'abcd' ) === true );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( { a: 1, b: 2 }, { user: {} } ) === true );
		} );

		it( 'should equate object values, but values must be strictly === to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === true );
		} );

		it( 'should not equate object values with keys in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === true );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not equate arrays with elements in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === true );
		} );

		it( 'should equate arrays, but values must be strictly === to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( [ 1, 2, 3 ], [ 1, '2', 3 ] ) === true );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( function () { }, function () { } ) === true );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( undefined, undefined ) === false );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( null, undefined ) === false );
			assert.ok( jsongin.QueryOperators.$ne.Query( undefined, null ) === false );
		} );

	} );


	describe( '$nex Tests', () =>
	{

		it( 'should equate boolean values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( true, true ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( false, false ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( true, false ) === true );
			assert.ok( jsongin.QueryOperators.$nex.Query( false, true ) === true );
		} );

		it( 'should equate boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( true, 1 ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( true, 0 ) === true );
			assert.ok( jsongin.QueryOperators.$nex.Query( false, 1 ) === true );
		} );

		it( 'should equate boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( true, '1' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( true, '0' ) === true );
			assert.ok( jsongin.QueryOperators.$nex.Query( false, '1' ) === true );
		} );

		it( 'should equate numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, 42 ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, 42.0 ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, 3.14 ) === true );
		} );

		it( 'should equate numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 3.14, '3.14' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 42, '3.14' ) === true );
		} );

		it( 'should equate string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( 'abc', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should equate null values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( null, null ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( null, 'abcd' ) === true );
		} );

		it( 'should equate object values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( { a: 1, b: 2 }, { user: {} } ) === true );
		} );

		it( 'should equate object values and values can be loosely == to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( { a: 1, b: 2 }, { a: 1, b: '2.0' } ) === false );
		} );

		it( 'should equate object values with keys in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( { a: 1, b: 2 }, { b: 2, a: 1 } ) === false );
		} );

		it( 'should equate array values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should equate arrays with elements in different order', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( [ 1, 2, 3 ], [ 3, 2, 1 ] ) === false );
		} );

		it( 'should equate arrays and values can be loosely == to each other', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( [ 1, 2, 3 ], [ 1, '2.0', 3 ] ) === false );
		} );

		it( 'should not equate function values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( function () { }, function () { } ) === true );
		} );

		it( 'should equate undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( undefined, undefined ) === false );
		} );

		it( 'should equate null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$nex.Query( null, undefined ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( undefined, null ) === false );
		} );

	} );


	describe( '$gte Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( false, false ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, true ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, false ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( false, true ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, 1 ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, '1' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( true, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, 42 ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, 42.0 ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, 3.14 ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( 3.14, 42 ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( 42, '3.14' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( 'abc', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( 'abcd', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( null, null ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( null, false ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( false, null ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( null, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( 0, null ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( null, '' ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( function () { }, function () { } ) === false );
		} );

		it( 'should compare undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( undefined, undefined ) === true );
		} );

		it( 'should compare null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gte.Query( null, undefined ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( undefined, null ) === true );
		} );

	} );


	describe( '$gt Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( false, false ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, true ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, false ) === true );
			assert.ok( jsongin.QueryOperators.$gt.Query( false, true ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, 1 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, '1' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( true, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, 42 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, 42.0 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, 3.14 ) === true );
			assert.ok( jsongin.QueryOperators.$gt.Query( 3.14, 42 ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 42, '3.14' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( 'abc', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 'abcd', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$gt.Query( 'abc', 'abcd' ) === false );
		} );

		it( 'should not compare two nulls', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( null, null ) === false );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( null, false ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( false, null ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( null, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( 0, null ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( null, '' ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( function () { }, function () { } ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( undefined, undefined ) === false );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( null, undefined ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( undefined, null ) === false );
		} );

	} );


	describe( '$lte Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( false, false ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, true ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, false ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( false, true ) === true );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, 1 ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, '1' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( true, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, 42 ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, 42.0 ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, 3.14 ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 3.14, 42 ) === true );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 42, '3.14' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( 'abc', 'abc' ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( 'abcd', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( null, null ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( null, false ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( false, null ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( null, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( 0, null ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( null, '' ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( function () { }, function () { } ) === false );
		} );

		it( 'should compare undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( undefined, undefined ) === true );
		} );

		it( 'should compare null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lte.Query( null, undefined ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( undefined, null ) === true );
		} );

	} );


	describe( '$lt Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( false, false ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, true ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, false ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( false, true ) === true );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( false, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, 1 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( false, 1 ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( false, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, '1' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( true, '0' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( false, '1' ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, 42 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, 42.0 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, 3.14 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 3.14, 42 ) === true );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, '42' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, '42.0' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 42, '3.14' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 3.14, '42' ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( 'abc', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 'abcd', 'abc' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 'abc', 'abcd' ) === true );
		} );

		it( 'should not compare two nulls', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( null, null ) === false );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( null, false ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( false, null ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( null, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( 0, null ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( null, '' ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( '', null ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( { a: 1, b: 2 }, { a: 1, b: 2 } ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( [ 1, 2, 3 ], [ 1, 2, 3 ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( function () { }, function () { } ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( undefined, undefined ) === false );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( null, undefined ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( undefined, null ) === false );
		} );

	} );


	describe( '$in Tests', () =>
	{

		it( 'should compare two booleans', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ false ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ true ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ false ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ true ] ) === false );
		} );

		it( 'should not compare boolean values and numeric values', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ 0 ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ 1 ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ 0 ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ 1 ] ) === false );
		} );

		it( 'should not compare boolean values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ '0' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ '1' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( true, [ '0' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ '1' ] ) === false );
		} );

		it( 'should compare two numerics', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ 42 ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ 42.0 ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ 3.14 ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 3.14, [ 42 ] ) === false );
		} );

		it( 'should not compare numeric values and string values', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ '42' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ '42.0' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 42, [ '3.14' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 3.14, [ '42' ] ) === false );
		} );

		it( 'should compare two strings', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( 'abc', [ 'abc' ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( 'abcd', [ 'abc' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 'abc', [ 'abcd' ] ) === false );
		} );

		it( 'should compare two nulls', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( null, [ null ] ) === true );
		} );

		it( 'should not compare null to other types (bns)', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( null, [ false ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( false, [ null ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( null, [ 0 ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( 0, [ null ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( null, [ '' ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( '', [ null ] ) === false );
		} );

		it( 'should not compare objects', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( { a: 1, b: 2 }, [ { a: 1, b: 2 } ] ) === false );
		} );

		it( 'should not compare arrays', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( [ [ 1, 2, 3 ] ], [ [ 1, 2, 3 ] ] ) === false );
		} );

		it( 'should not compare functions', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( function () { }, [ function () { } ] ) === false );
		} );

		it( 'should not compare undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( undefined, [ undefined ] ) === true );
		} );

		it( 'should not compare null and undefined values', () => 
		{
			assert.ok( jsongin.QueryOperators.$in.Query( null, [ undefined ] ) === false );
			assert.ok( jsongin.QueryOperators.$in.Query( undefined, [ null ] ) === false );
		} );

	} );


} );

