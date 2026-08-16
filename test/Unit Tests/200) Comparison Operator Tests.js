'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
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

		// Regexp handling here follows MongoDB, verified against MongoDB 6.0.1:
		// { field: { $eq: /re/ } } is an equality test against a regexp valued field,
		// not a pattern match. The implicit form { field: /re/ } is the one which
		// pattern matches. See ImplicitEq and the $regex operator.

		it( 'should equate two regexp values with the same source and flags', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( /hello/, /hello/ ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( /hello/gi, /hello/gi ) === true );
		} );

		it( 'should not equate regexp values which differ in source or flags', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( /hello/, /world/ ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( /hello/, /hello/i ) === false );
		} );

		it( 'should not pattern match a string with a regexp match value', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( 'hello', /ell/ ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( 'hello', /hello/ ) === false );
		} );

		it( 'should not equate a regexp with a non-regexp value', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( 42, /42/ ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( [ 'hi', 'hello' ], /ell/ ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( undefined, /ell/ ) === false );
		} );

		// $eq resolves its path to a list of candidate values rather than to one gathered
		// value, so a path which crosses an array asks whether any element satisfies it.
		// Every case below was measured against MongoDB 6.0.1.

		it( 'should match through a path which crosses an array', () =>
		{
			let document = { a: [ { x: 1 }, { x: 2 } ] };
			assert.strictEqual( jsongin.Query( document, { 'a.x': { $eq: 1 } } ), true );
			assert.strictEqual( jsongin.Query( document, { 'a.x': { $eq: 2 } } ), true );
			assert.strictEqual( jsongin.Query( document, { 'a.x': { $eq: 9 } } ), false );

			// The explicit form now agrees with the implicit one, which always worked.
			assert.strictEqual( jsongin.Query( document, { 'a.x': 1 } ), true );
		} );

		it( 'should match an array field by element or as a whole', () =>
		{
			// { tags: 'red' } matches an element, { tags: [ 'red' ] } matches the whole array.
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $eq: 'red' } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $eq: [ 'red', 'blue' ] } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $eq: [ 'red' ] } } ), false );

			// An element which is itself an array matches as the array it is.
			assert.strictEqual( jsongin.Query( { tags: [ [ 'red' ] ] }, { tags: { $eq: [ 'red' ] } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ [ 'red' ] ] }, { tags: { $eq: 'red' } } ), false );
		} );

		it( 'should match through two levels of array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { b: [ { c: 1 } ] } ] }, { 'a.b.c': { $eq: 1 } } ), true );
		} );

		it( 'should not descend into an array inside an array without an index', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ [ { c: 1 } ] ] }, { 'a.c': { $eq: 1 } } ), false );
		} );

		it( 'should match null against a field which is not there', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $eq: null } } ), true );
			assert.strictEqual( jsongin.Query( { a: null }, { a: { $eq: null } } ), true );
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: { $eq: null } } ), false );
		} );

		it( 'should tell a gathered value from a real array', () =>
		{
			// Both of these gather to [ 1, 2 ] through GetValue. The candidate list keeps them
			// distinct, which is what a later $size fix depends on.
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $eq: [ 1, 2 ] } } ), false );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 1, 2 ] } ] }, { 'a.x': { $eq: [ 1, 2 ] } } ), true );
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

		// $gte resolves its path to a list of candidate values, so a path which crosses an
		// array asks whether any element satisfies it. Measured against MongoDB 6.0.1.

		it( 'should match through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $gte: 2 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $gte: 3 } } ), false );
		} );

		it( 'should reach the elements of a field which holds an array', () =>
		{
			// The field really is [ 5, 6 ], so 5 and 6 are each candidates.
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $gte: 6 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $gte: 7 } } ), false );
		} );

		it( 'should satisfy a null match value with a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $gte: null } } ), true );
			assert.strictEqual( jsongin.Query( { a: null }, { a: { $gte: null } } ), true );
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

		// $gt resolves its path to a list of candidate values, so a path which crosses an
		// array asks whether any element satisfies it. Measured against MongoDB 6.0.1.

		it( 'should match through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $gt: 1 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $gt: 2 } } ), false );
		} );

		it( 'should reach the elements of a field which holds an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $gt: 1 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $gt: 6 } } ), false );
		} );

		it( 'should bracket the comparison by type', () =>
		{
			// MongoDB never matches a string against a numeric range, however the BSON
			// ordering ranks the two.
			assert.strictEqual( jsongin.Query( { a: [ { x: 'hello' } ] }, { 'a.x': { $gt: 1 } } ), false );
			assert.strictEqual( jsongin.Query( { a: 'hello' }, { a: { $gt: 1 } } ), false );
			assert.strictEqual( jsongin.Query( { a: 5 }, { a: { $gt: 'abc' } } ), false );
		} );

		it( 'should not match a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $gt: 1 } } ), false );
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

		// $lte resolves its path to a list of candidate values, so a path which crosses an
		// array asks whether any element satisfies it. Measured against MongoDB 6.0.1.

		it( 'should match through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $lte: 1 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $lte: 0 } } ), false );
		} );

		it( 'should reach the elements of a field which holds an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $lte: 6 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $lte: 4 } } ), false );
		} );

		it( 'should satisfy a null match value with a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $lte: null } } ), true );
			assert.strictEqual( jsongin.Query( { a: null }, { a: { $lte: null } } ), true );
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

		// $lt resolves its path to a list of candidate values, so a path which crosses an
		// array asks whether any element satisfies it. Measured against MongoDB 6.0.1.

		it( 'should match through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $lt: 2 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $lt: 1 } } ), false );
		} );

		it( 'should reach the elements of a field which holds an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $lt: 9 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $lt: 5 } } ), false );
		} );

		it( 'should bracket the comparison by type', () =>
		{
			// This was a false positive: the old code compared the array [ 5, 6 ] against
			// 'zzz', which Javascript coerces to the string comparison '5,6' < 'zzz'.
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $lt: 'zzz' } } ), false );
			assert.strictEqual( jsongin.Query( { a: [ 5, 6 ] }, { a: { $lt: 'zzz' } } ), false );
			assert.strictEqual( jsongin.Query( { a: 'hello' }, { a: { $lt: 9 } } ), false );
		} );

		it( 'should not match a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $lt: 9 } } ), false );
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


	//---------------------------------------------------------------------
	describe( 'Implicit Equality Tests', () =>
	{

		// The implicit form { field: value } resolves the path to every value it can mean,
		// the same way the explicit operators do. Measured against MongoDB 6.0.1.

		it( 'should match through two levels of array', () =>
		{
			// The hand rolled traversal this replaced handled one array level, so this
			// document did not match while the explicit { $eq: 1 } form did.
			assert.strictEqual( jsongin.Query( { a: [ { b: [ { c: 1 } ] } ] }, { 'a.b.c': 1 } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { b: { c: 1 } } ] }, { 'a.b.c': 1 } ), true );
			assert.strictEqual( jsongin.Query( { a: { b: [ { c: 1 } ] } }, { 'a.b.c': 1 } ), true );
			assert.strictEqual( jsongin.Query( { a: { b: { c: 1 } } }, { 'a.b.c': 1 } ), true );
		} );

		it( 'should agree with the explicit form', () =>
		{
			let documents = [
				{ a: [ { b: [ { c: 1 } ] } ] },
				{ a: [ { x: 1 }, { x: 2 } ] },
				{ a: [ { x: [ 5, 6 ] } ] },
				{ tags: [ 'red', 'blue' ] },
				{ tags: 'red' },
			];
			let paths = [ 'a.b.c', 'a.x', 'tags' ];
			let values = [ 1, 2, 5, 'red', [ 'red' ] ];

			for ( let d = 0; d < documents.length; d++ )
			{
				for ( let p = 0; p < paths.length; p++ )
				{
					for ( let v = 0; v < values.length; v++ )
					{
						let implicit_query = {};
						implicit_query[ paths[ p ] ] = values[ v ];
						let explicit_query = {};
						explicit_query[ paths[ p ] ] = { $eq: values[ v ] };

						assert.strictEqual(
							jsongin.Query( documents[ d ], implicit_query ),
							jsongin.Query( documents[ d ], explicit_query ),
							`implicit and explicit disagree for ${paths[ p ]} = ${JSON.stringify( values[ v ] )} on ${JSON.stringify( documents[ d ] )}` );
					}
				}
			}
		} );

		it( 'should not descend into an array inside an array without an index', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ [ { c: 1 } ] ] }, { 'a.c': 1 } ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$regex Tests', () =>
	{

		// Measured against MongoDB 6.0.1.

		it( 'should pattern match a string field', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 'hello' }, { a: { $regex: /ell/ } } ), true );
			assert.strictEqual( jsongin.Query( { a: 'hello' }, { a: { $regex: 'ell' } } ), true );
			assert.strictEqual( jsongin.Query( { a: 'hello' }, { a: { $regex: /zzz/ } } ), false );
		} );

		it( 'should pattern match the elements of an array field', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ 'hi', 'hello' ] }, { a: { $regex: /ell/ } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 'hello' } ] }, { 'a.x': { $regex: /ell/ } } ), true );
		} );

		it( 'should match a regexp field only when it is the same regexp', () =>
		{
			// The field is tested as a value here rather than as text. It used to be handed
			// to RegExp.test(), which stringified /ell/i to '/ell/i' and matched /ell/.
			assert.strictEqual( jsongin.Query( { a: /ell/ }, { a: { $regex: /ell/ } } ), true );
			assert.strictEqual( jsongin.Query( { a: /ell/i }, { a: { $regex: /ell/ } } ), false );
			assert.strictEqual( jsongin.Query( { a: /abc/ }, { a: { $regex: /ell/ } } ), false );
		} );

		it( 'should not pattern match a non string value', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 12345 }, { a: { $regex: /234/ } } ), false );
			assert.strictEqual( jsongin.Query( { a: [ 1, 2 ] }, { a: { $regex: /1,2/ } } ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$type Tests', () =>
	{

		// $type asks about each value the path can mean. Measured against MongoDB 6.0.1.

		it( 'should match a type by alias and by number', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 42 }, { a: { $type: 'int' } } ), true );
			assert.strictEqual( jsongin.Query( { a: 42 }, { a: { $type: 16 } } ), true );
			assert.strictEqual( jsongin.Query( { a: 42 }, { a: { $type: 'string' } } ), false );
		} );

		it( 'should accept a list of types', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 'abc' }, { a: { $type: [ 'int', 'string' ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: true }, { a: { $type: [ 'int', 'string' ] } } ), false );
		} );

		it( 'should treat number as an alias for every numeric type', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 42 }, { a: { $type: 'number' } } ), true );
			assert.strictEqual( jsongin.Query( { a: 3.14 }, { a: { $type: 'number' } } ), true );
			assert.strictEqual( jsongin.Query( { a: 'abc' }, { a: { $type: 'number' } } ), false );
		} );

		it( 'should find an array field with the array type', () =>
		{
			// The array itself is one of the values the path can mean, so this needs no
			// special case.
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $type: 'array' } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [] }, { tags: { $type: 'array' } } ), true );
			assert.strictEqual( jsongin.Query( { tags: 'red' }, { tags: { $type: 'array' } } ), false );
		} );

		it( 'should also match the types of an array field elements', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $type: 'string' } } ), true );
		} );

		it( 'should match through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $type: 'int' } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 'hello' } ] }, { 'a.x': { $type: 'string' } } ), true );

			// The gathered value is not a candidate, so this is not an array.
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $type: 'array' } } ), false );
		} );

		it( 'should reach the elements of a field which holds an array', () =>
		{
			// Both answers at once: the field is an array, and its elements are ints.
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $type: 'int' } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $type: 'array' } } ), true );
		} );

		it( 'should not match a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $type: 'null' } } ), false );
			assert.strictEqual( jsongin.Query( { a: null }, { a: { $type: 'null' } } ), true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$all Tests', () =>
	{

		// $all is an AND of the given values, each tested as ordinary equality against the
		// field, which is why it works against a field which is not an array.
		// Measured against MongoDB 6.0.1.

		it( 'should require every value to be present', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $all: [ 'red', 'blue' ] } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $all: [ 'red' ] } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $all: [ 'red', 'green' ] } } ), false );
		} );

		it( 'should select against a field which is not an array', () =>
		{
			// MongoDB documents this: "you may use the $all operator to select against a
			// non-array field".
			assert.strictEqual( jsongin.Query( { tags: 'red' }, { tags: { $all: [ 'red' ] } } ), true );
			assert.strictEqual( jsongin.Query( { tags: 'red' }, { tags: { $all: [ 'blue' ] } } ), false );
		} );

		it( 'should match a field which really holds an array', () =>
		{
			// This gathered to [ [ 5, 6 ] ] through GetValue, which holds neither 5 nor 6.
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $all: [ 5, 6 ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $all: [ 5 ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $all: [ 5, 7 ] } } ), false );
		} );

		it( 'should gather values from across array elements', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $all: [ 1, 2 ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $all: [ 1, 9 ] } } ), false );

			// Two elements each holding a value is not a two element array.
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $all: [ 5, 6 ] } } ), false );
		} );

		it( 'should match an element which is itself an array', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: [ [ 'red' ] ] }, { tags: { $all: [ [ 'red' ] ] } } ), true );
		} );

		it( 'should select nothing for an empty match array', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: [ 'red' ] }, { tags: { $all: [] } } ), false );
			assert.strictEqual( jsongin.Query( { tags: [] }, { tags: { $all: [] } } ), false );
		} );

		it( 'should not match a missing field', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { zzz: { $all: [ 1 ] } } ), false );
		} );

		it( 'should reject a non array match value', () =>
		{
			assert.strictEqual( jsongin.QueryOperators.$all.Query( { a: [ 1 ] }, 1, 'a' ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$size Tests', () =>
	{

		// $size asks about an array, so only a candidate which is an array can satisfy it.
		// Measured against MongoDB 6.0.1.

		it( 'should measure an array field', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $size: 2 } } ), true );
			assert.strictEqual( jsongin.Query( { tags: [ 'red', 'blue' ] }, { tags: { $size: 3 } } ), false );
			assert.strictEqual( jsongin.Query( { tags: [] }, { tags: { $size: 0 } } ), true );
		} );

		it( 'should not measure a value which is not an array', () =>
		{
			assert.strictEqual( jsongin.Query( { tags: 'red' }, { tags: { $size: 1 } } ), false );
			assert.strictEqual( jsongin.Query( { tags: 3 }, { tags: { $size: 1 } } ), false );
			assert.strictEqual( jsongin.Query( { b: 1 }, { tags: { $size: 0 } } ), false );
		} );

		it( 'should not measure a value gathered from array elements', () =>
		{
			// The false positive this operator motivated the candidate list for. GetValue
			// gathered these two elements into [ 1, 2 ], whose length is 2, so the document
			// matched even though x is not an array at all.
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $size: 2 } } ), false );
		} );

		it( 'should measure a field which really holds an array', () =>
		{
			// The matching false negative. This gathered to [ [ 5, 6 ] ], whose length is 1.
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $size: 2 } } ), true );
			assert.strictEqual( jsongin.Query( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $size: 1 } } ), false );
		} );

		it( 'should reject a non numeric match value', () =>
		{
			assert.strictEqual( jsongin.QueryOperators.$size.Query( { a: [ 1, 2 ] }, 'two', 'a' ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$exists Tests', () =>
	{

		// $exists does not examine a value. It asks whether the path resolves to anything,
		// which is what an empty candidate list reports.
		// Measured against MongoDB 6.0.1.

		it( 'should find a field which is there', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: { $exists: true } } ), true );
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: { $exists: false } } ), false );
		} );

		it( 'should not find a field which is not there', () =>
		{
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $exists: true } } ), false );
			assert.strictEqual( jsongin.Query( { b: 1 }, { a: { $exists: false } } ), true );
		} );

		it( 'should find a field holding null', () =>
		{
			assert.strictEqual( jsongin.Query( { a: null }, { a: { $exists: true } } ), true );
		} );

		it( 'should find a field through a path which crosses an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $exists: true } } ), true );

			// Present in one element is enough.
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 }, { y: 2 } ] }, { 'a.x': { $exists: true } } ), true );
		} );

		it( 'should not find a field which no array element holds', () =>
		{
			// This gathered to [ undefined ] through GetValue, which is an array rather than
			// undefined, so the field used to read as present.
			assert.strictEqual( jsongin.Query( { a: [ { y: 1 } ] }, { 'a.x': { $exists: true } } ), false );
			assert.strictEqual( jsongin.Query( { a: [ { y: 1 } ] }, { 'a.x': { $exists: false } } ), true );
		} );

		it( 'should not find a field below an array inside an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ [ { c: 1 } ] ] }, { 'a.c': { $exists: true } } ), false );
		} );

		it( 'should treat a field holding undefined as present', () =>
		{
			// The key is there, and Object.keys() and the `in` operator both report it.
			// This is the same rule DeleteValue follows, which removes a key rather than
			// setting it to undefined so that the two states stay distinguishable.
			// MongoDB has no say here: modern BSON cannot store undefined.
			assert.strictEqual( jsongin.Query( { a: undefined }, { a: { $exists: true } } ), true );
			assert.strictEqual( jsongin.Query( { a: undefined }, { a: { $exists: false } } ), false );
		} );

		it( 'should reject a non boolean match value', () =>
		{
			assert.strictEqual( jsongin.QueryOperators.$exists.Query( { a: 1 }, 'yes', 'a' ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Date Comparison Tests', () =>
	{

		// Two Date objects are never === or == to each other, so every comparison operator
		// needs to compare their time values instead. These call the operators directly.

		const EARLIER = new Date( 1600000000000 );
		const WHEN = new Date( 1700000000000 );
		const SAME = new Date( 1700000000000 );
		const LATER = new Date( 1800000000000 );

		it( 'should equate dates with $eq', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( WHEN, SAME ) === true );
			assert.ok( jsongin.QueryOperators.$eq.Query( WHEN, EARLIER ) === false );
		} );

		it( 'should equate dates with $eqx', () =>
		{
			assert.ok( jsongin.QueryOperators.$eqx.Query( WHEN, SAME ) === true );
			assert.ok( jsongin.QueryOperators.$eqx.Query( WHEN, EARLIER ) === false );
		} );

		it( 'should not equate a date to a non-date', () =>
		{
			assert.ok( jsongin.QueryOperators.$eq.Query( WHEN, WHEN.toISOString() ) === false );
			assert.ok( jsongin.QueryOperators.$eq.Query( WHEN, WHEN.getTime() ) === false );
			assert.ok( jsongin.QueryOperators.$eqx.Query( WHEN, WHEN.toISOString() ) === false );
			assert.ok( jsongin.QueryOperators.$eqx.Query( WHEN, {} ) === false );
		} );

		it( 'should differentiate dates with $ne and $nex', () =>
		{
			assert.ok( jsongin.QueryOperators.$ne.Query( WHEN, EARLIER ) === true );
			assert.ok( jsongin.QueryOperators.$ne.Query( WHEN, SAME ) === false );
			assert.ok( jsongin.QueryOperators.$nex.Query( WHEN, EARLIER ) === true );
			assert.ok( jsongin.QueryOperators.$nex.Query( WHEN, SAME ) === false );
		} );

		it( 'should order dates with $gt and $gte', () =>
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( WHEN, EARLIER ) === true );
			assert.ok( jsongin.QueryOperators.$gt.Query( WHEN, LATER ) === false );
			assert.ok( jsongin.QueryOperators.$gt.Query( WHEN, SAME ) === false );
			assert.ok( jsongin.QueryOperators.$gte.Query( WHEN, SAME ) === true );
			assert.ok( jsongin.QueryOperators.$gte.Query( WHEN, LATER ) === false );
		} );

		it( 'should order dates with $lt and $lte', () =>
		{
			assert.ok( jsongin.QueryOperators.$lt.Query( WHEN, LATER ) === true );
			assert.ok( jsongin.QueryOperators.$lt.Query( WHEN, EARLIER ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( WHEN, SAME ) === false );
			assert.ok( jsongin.QueryOperators.$lte.Query( WHEN, SAME ) === true );
			assert.ok( jsongin.QueryOperators.$lte.Query( WHEN, EARLIER ) === false );
		} );

		it( 'should find dates with $in and $nin', () =>
		{
			assert.ok( jsongin.QueryOperators.$in.Query( WHEN, [ EARLIER, SAME ] ) === true );
			assert.ok( jsongin.QueryOperators.$in.Query( WHEN, [ EARLIER, LATER ] ) === false );
			assert.ok( jsongin.QueryOperators.$nin.Query( WHEN, [ EARLIER, LATER ] ) === true );
			assert.ok( jsongin.QueryOperators.$nin.Query( WHEN, [ SAME ] ) === false );
		} );

		it( 'should not compare a date against a value of another type', () =>
		{
			assert.ok( jsongin.QueryOperators.$gt.Query( WHEN, 0 ) === false );
			assert.ok( jsongin.QueryOperators.$lt.Query( WHEN, 'abc' ) === false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'ImplicitEq Type Combination Tests', () =>
	{

		/*
			$ImplicitEq runs on every { field: value } clause anyone writes, so it is the most
			travelled code in the library, but several of its type combinations had no test.
			It dispatches on the pair of short types, and these are the pairings which the rest
			of the suite never produced.
		*/

		it( 'should not match a primitive field against an array', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: [ 1, 2 ] } ), false );
		} );

		it( 'should not match a primitive field against an object', () =>
		{
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: { x: 1 } } ), false );
		} );

		it( 'should find a date within an array holding other types', () =>
		{
			// The elements which are not dates are skipped rather than compared by reference.
			assert.strictEqual( jsongin.Query( { a: [ 'x', 9, new Date( 0 ) ] }, { a: new Date( 0 ) } ), true );
			assert.strictEqual( jsongin.Query( { a: [ 'x', 9, new Date( 5 ) ] }, { a: new Date( 0 ) } ), false );
		} );

		it( 'should match a regular expression when any element of an array matches', () =>
		{
			// An array field matches when any one element matches, as it does in MongoDB.
			// This once required every element to match, so an array of more than one value
			// almost never matched a regular expression.
			assert.strictEqual( jsongin.Query( { a: [ 'abc' ] }, { a: /b/ } ), true );
			assert.strictEqual( jsongin.Query( { a: [ 'abc', 'def' ] }, { a: /b/ } ), true );
			assert.strictEqual( jsongin.Query( { a: [ 'zzz', 'abc' ] }, { a: /b/ } ), true );
			assert.strictEqual( jsongin.Query( { a: [ 'abc', 'def' ] }, { a: /e/ } ), true );
		} );

		it( 'should not match a regular expression when no element of an array matches', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ 'abc', 'def' ] }, { a: /z/ } ), false );
			assert.strictEqual( jsongin.Query( { a: [] }, { a: /b/ } ), false );
		} );

		it( 'should filter documents by a regular expression on an array field', () =>
		{
			let documents = [ { t: [ 'staff', 'x' ] }, { t: [ 'y' ] }, { t: [ 'z', 'stone' ] } ];
			let filtered = jsongin.Filter( documents, { t: /^st/ } );
			assert.strictEqual( filtered.length, 2 );
		} );

		it( 'should match an object field against an object', () =>
		{
			assert.strictEqual( jsongin.Query( { a: { x: 1 } }, { a: { x: 1 } } ), true );
			assert.strictEqual( jsongin.Query( { a: { x: 1 } }, { a: { x: 2 } } ), false );
		} );

		it( 'should return false for a type pairing it cannot compare', () =>
		{
			assert.strictEqual( jsongin.Query( { a: { x: 1 } }, { a: /z/ } ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'eqx Type Combination Tests', () =>
	{

		it( 'should not equate a date to a non-date', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( new Date( 0 ), 'x' ), false );
			assert.strictEqual( jsongin.LooseEquals( new Date( 0 ), 0 ), false );
		} );

		it( 'should not equate a primitive to a non-primitive', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( 1, { a: 1 } ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: 1 }, [ 1 ] ), false );
		} );

		it( 'should not equate arrays of different lengths', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( [ 1, 2 ], [ 1 ] ), false );
			assert.strictEqual( jsongin.LooseEquals( [ 1 ], [ 1, 2 ] ), false );
		} );

		it( 'should equate arrays holding the same values in a different order', () =>
		{
			// This is what makes it the loose comparison. StrictEquals does not do this.
			assert.strictEqual( jsongin.LooseEquals( [ 1, 2 ], [ 2, 1 ] ), true );
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ), false );
		} );

		it( 'should not equate arrays of the same length holding different values', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( [ 1, 2 ], [ 1, 3 ] ), false );
		} );

	} );


} );

