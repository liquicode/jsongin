'use strict';

const assert = require( 'assert' );
const JSON_ENGINE = require( '../src/jsongin' )( {
	PathExtensions: true,
	Explain: false,
} );


describe( '150) Core with Path Extensions Tests', () =>
{


	let document =
	{
		id: 1001,
		user:
		{
			name: 'Alice',
			location: 'East',
		},
		profile:
		{
			login: 'alice',
			role: 'admin',
		},
		tags: [ 'Staff', 'Dept. A' ],
	};


	//---------------------------------------------------------------------
	describe( 'SplitPath Tests with Path Extensions', () =>
	{

		it( 'should not allow the $ element within a path', () => 
		{
			assert.ok( JSON_ENGINE.SplitPath( 'a.$' ) === null );
			assert.ok( JSON_ENGINE.SplitPath( 'a.$.b' ) === null );
		} );

		it( 'should allow, but remove, the $ element at the root', () => 
		{
			let elements = null;

			elements = JSON_ENGINE.SplitPath( '$' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === '' );

			elements = JSON_ENGINE.SplitPath( '$.a' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a' );

			elements = JSON_ENGINE.SplitPath( '$.a.1.b' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.1.b' );
		} );

		it( 'should allow bracketed [] array indeces', () => 
		{
			let elements = null;

			elements = JSON_ENGINE.SplitPath( '[1]' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === '1' );

			elements = JSON_ENGINE.SplitPath( '$[1]' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === '1' );

			elements = JSON_ENGINE.SplitPath( '$.[1]' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === '1' );

			elements = JSON_ENGINE.SplitPath( 'a[1]' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.1' );

			elements = JSON_ENGINE.SplitPath( 'a.[1]' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.1' );

			elements = JSON_ENGINE.SplitPath( 'a.b[42].c' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.b.42.c' );

			elements = JSON_ENGINE.SplitPath( 'a.b.[42].c' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.b.42.c' );

			elements = JSON_ENGINE.SplitPath( 'a.b.[42].c' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.b.42.c' );

			elements = JSON_ENGINE.SplitPath( '$.a.b.[42].c' );
			assert.ok( elements );
			assert.ok( elements.join( '.' ) === 'a.b.42.c' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'JoinPaths Tests with Path Extensions', () =>
	{

		it( 'should join paths with root $ element', () => 
		{
			assert.ok( JSON_ENGINE.JoinPaths( '$.a' ) === 'a' );
			assert.ok( JSON_ENGINE.JoinPaths( '$.a', '$.b' ) === 'a.b' );
			assert.ok( JSON_ENGINE.JoinPaths( '$.a', 'b.c' ) === 'a.b.c' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '$.2' ) === 'a.2' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '$.2.c' ) === 'a.2.c' );
		} );

		it( 'should join paths with bracketed [] array indeces', () => 
		{
			assert.ok( JSON_ENGINE.JoinPaths( 'a[1]' ) === 'a.1' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a.[1]' ) === 'a.1' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '[1]' ) === 'a.1' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a[1]', 'b.c' ) === 'a.1.b.c' );
			assert.ok( JSON_ENGINE.JoinPaths( '$.a[1]', '$.b.c' ) === 'a.1.b.c' );
			assert.ok( JSON_ENGINE.JoinPaths( '$.a', '$.[1]', '$.b.c' ) === 'a.1.b.c' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'GetValue Tests with Path Extensions', () =>
	{

		it( 'should return the given document if path is an empty string "", null, or undefined', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( 'abc', '' ) === 'abc' );
			assert.ok( JSON_ENGINE.GetValue( 'abc', null ) === 'abc' );
			assert.ok( JSON_ENGINE.GetValue( 'abc' ) === 'abc' );
		} );

		it( 'should return the given document if path is $', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( 'abc', '$' ) === 'abc' );
		} );

		it( 'should get document values', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( document, 'id' ) === 1001 );
			assert.ok( JSON_ENGINE.GetValue( document, '$.id' ) === 1001 );
			assert.ok( JSON_ENGINE.GetValue( document, 'user.name' ) === 'Alice' );
			assert.ok( JSON_ENGINE.GetValue( document, '$.user.name' ) === 'Alice' );
			assert.ok( typeof JSON_ENGINE.GetValue( document, 'foo' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( document, '$.foo' ) === 'undefined' );
		} );

		it( 'should return an indexed array element, using dot notation', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '1' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$.1' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value.1' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, '$.value.1' ) === 2 );
		} );

		it( 'should return an indexed array element, using bracketed [] array indeces', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '[1]' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$[1]' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$.[1]' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value[1]' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, '$.value[1]' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, '$.value.[1]' ) === 2 );
		} );

		it( 'should return undefined if array index is out of bounds', () => 
		{
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '3' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '[3]' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$.3' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$[3]' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value.3' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value[3]' ) === 'undefined' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SetValue Tests with Path Extensions', () =>
	{
		let data = null;

		it( 'requires a non-empty document', () => 
		{
			assert.ok( JSON_ENGINE.SetValue( undefined, 'value', 42 ) === false );
			assert.ok( JSON_ENGINE.SetValue( null, 'value', 42 ) === false );
		} );

		it( 'requires a non-empty path', () => 
		{
			data = {};
			assert.ok( JSON_ENGINE.SetValue( data, undefined, 42 ) === false );
			assert.ok( JSON_ENGINE.SetValue( data, null, 42 ) === false );
			assert.ok( JSON_ENGINE.SetValue( data, '', 42 ) === false );
		} );

		it( 'requires a non-root path', () => 
		{
			data = {};
			assert.ok( JSON_ENGINE.SetValue( data, '$', 42 ) === false );
		} );

		it( 'should create a top level value', () => 
		{
			data = {};
			assert.ok( JSON_ENGINE.SetValue( data, '$.id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( JSON_ENGINE.SetValue( data, '$.name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should set a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( JSON_ENGINE.SetValue( data, '$.id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( JSON_ENGINE.SetValue( data, '$.name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should remove a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( JSON_ENGINE.SetValue( data, '$.id', undefined ) );
			assert.ok( typeof data.id === 'undefined' );
			assert.ok( JSON_ENGINE.SetValue( data, '$.name', undefined ) );
			assert.ok( typeof data.name === 'undefined' );
		} );

		it( 'should create a nested value', () => 
		{
			data = { user: {} };
			assert.ok( JSON_ENGINE.SetValue( data, '$.user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
			assert.ok( JSON_ENGINE.SetValue( data, '$.profile.id', 1001 ) );
			assert.ok( data.profile.id === 1001 );
		} );

		it( 'should set a nested value', () => 
		{
			data = { user: { name: null } };
			assert.ok( JSON_ENGINE.SetValue( data, '$.user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
		} );

		it( 'should remove a nested value', () => 
		{
			data = { user: { name: 'Alice' } };
			assert.ok( JSON_ENGINE.SetValue( data, '$.user.name', undefined ) );
			assert.ok( typeof data.user.name === 'undefined' );
		} );

		it( 'should set an array value', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( JSON_ENGINE.SetValue( data, '$.0', 'admin' ) );
			assert.ok( data.length === 3 );
			assert.ok( data[ 0 ] === 'admin' );
		} );

		it( 'should set an array value using barcketed [] array indeces', () => 
		{
			data = [ 1, 2, 3 ];

			assert.ok( JSON_ENGINE.SetValue( data, '[0]', 'one' ) );
			assert.ok( data.length === 3 );
			assert.ok( data[ 0 ] === 'one' );

			assert.ok( JSON_ENGINE.SetValue( data, '$[0]', 'two' ) );
			assert.ok( data.length === 3 );
			assert.ok( data[ 0 ] === 'two' );
		} );

		it( 'should insert nulls into new array elements', () => 
		{
			data = [ 1, 2, 3 ];

			assert.ok( JSON_ENGINE.SetValue( data, '$.3', 'admin' ) );
			assert.ok( data.length === 4 );
			assert.ok( data[ 3 ] === 'admin' );

			assert.ok( JSON_ENGINE.SetValue( data, '$.6', 42 ) );
			assert.ok( data.length === 7 );
			assert.ok( data[ 4 ] === null );
			assert.ok( data[ 5 ] === null );
			assert.ok( data[ 6 ] === 42 );
		} );

		it( 'should remove an array value', () => 
		{
			data = [ 1, 2, 3 ];

			assert.ok( JSON_ENGINE.SetValue( data, '$.3', 'admin' ) );
			assert.ok( data.length === 4 );
			assert.ok( data[ 3 ] === 'admin' );

		} );

	} );


} );
