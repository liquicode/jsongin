'use strict';

const assert = require( 'assert' );
const JSON_ENGINE = require( '../src/jsongin' )( {
	PathExtensions: false,
	Explain: false,
} );


describe( '100) Core Tests', () =>
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
	describe( 'ShortType Tests', () =>
	{

		it( 'should support (b)oolean short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( true ) === 'b' );
			assert.ok( JSON_ENGINE.ShortType( false ) === 'b' );
		} );
		it( 'should support (n)umeric short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( 42 ) === 'n' );
			assert.ok( JSON_ENGINE.ShortType( 42.0 ) === 'n' );
			assert.ok( JSON_ENGINE.ShortType( 3.14 ) === 'n' );
		} );
		it( 'should support (s)tring short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( '' ) === 's' );
			assert.ok( JSON_ENGINE.ShortType( 'abc' ) === 's' );
		} );
		it( 'should support nul(l) short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( null ) === 'l' );
		} );
		it( 'should support (o)bject short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( {} ) === 'o' );
			assert.ok( JSON_ENGINE.ShortType( { value: 1 } ) === 'o' );
		} );
		it( 'should support (a)rray short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( [] ) === 'a' );
			assert.ok( JSON_ENGINE.ShortType( [ 1, 2, 3 ] ) === 'a' );
		} );
		it( 'should support (f)unction short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( function () { } ) === 'f' );
		} );
		it( 'should support (r)egex short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( /test/ ) === 'r' );
		} );
		it( 'should support (u)ndefined short type', () => 
		{
			assert.ok( JSON_ENGINE.ShortType() === 'u' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SplitPath Tests', () =>
	{

		it( 'should not allow non-string paths', () => 
		{
			assert.ok( JSON_ENGINE.SplitPath() === null );
			assert.ok( JSON_ENGINE.SplitPath( null ) === null );
		} );

		it( 'should return an empty array for an empty path', () => 
		{
			let elements = null;
			elements = JSON_ENGINE.SplitPath( '' );
			assert.ok( elements.length === 0 );
		} );

		it( 'should not allow the $ element within a path', () => 
		{
			assert.ok( JSON_ENGINE.SplitPath( 'a.$' ) === null );
			assert.ok( JSON_ENGINE.SplitPath( 'a.$.b' ) === null );
		} );

		it( 'should not allow the $ element at the root when path extensions are disabled', () => 
		{
			assert.ok( JSON_ENGINE.SplitPath( '$' ) === null );
			assert.ok( JSON_ENGINE.SplitPath( '$.a' ) === null );
		} );

		it( 'should ignore bracketed [] array indeces when path extensions are disabled', () => 
		{
			let elements = null;

			elements = JSON_ENGINE.SplitPath( 'a[1]' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 'a[1]' );
		} );

		it( 'should split a path', () => 
		{
			let elements = null;

			elements = JSON_ENGINE.SplitPath( 'a' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 'a' );

			elements = JSON_ENGINE.SplitPath( 'a.b.c' );
			assert.ok( elements.length === 3 );
			assert.ok( elements[ 0 ] === 'a' );
			assert.ok( elements[ 1 ] === 'b' );
			assert.ok( elements[ 2 ] === 'c' );

		} );

		it( 'should split a path containing array indeces', () => 
		{
			let elements = null;

			elements = JSON_ENGINE.SplitPath( '1' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] !== '1' );
			assert.ok( elements[ 0 ] === 1 );

			elements = JSON_ENGINE.SplitPath( 'a.2.c' );
			assert.ok( elements.length === 3 );
			assert.ok( elements[ 0 ] === 'a' );
			assert.ok( elements[ 1 ] !== '2' );
			assert.ok( elements[ 1 ] === 2 );
			assert.ok( elements[ 2 ] === 'c' );

		} );

	} );


	//---------------------------------------------------------------------
	describe( 'JoinPaths Tests', () =>
	{

		it( 'should return an empty string when empty paths are provided', () => 
		{
			assert.ok( JSON_ENGINE.JoinPaths() === '' );
			// assert.ok( JSON_ENGINE.JoinPaths( null ) === '' );
			assert.ok( JSON_ENGINE.JoinPaths( '' ) === '' );
			assert.ok( JSON_ENGINE.JoinPaths( '', '' ) === '' );
		} );

		it( 'should return an empty string when null is provided', () => 
		{
			assert.ok( JSON_ENGINE.JoinPaths( null ) === '' );
		} );

		it( 'should join paths', () => 
		{
			assert.ok( JSON_ENGINE.JoinPaths( 'a' ) === 'a' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', 'b' ) === 'a.b' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', 'b.c' ) === 'a.b.c' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '2' ) === 'a.2' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '2.c' ) === 'a.2.c' );
			assert.ok( JSON_ENGINE.JoinPaths( 'a', '2', 'c' ) === 'a.2.c' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'GetValue Tests', () =>
	{

		it( 'should return the given document if path is an empty string "", null, or undefined', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( 'abc', '' ) === 'abc' );
			assert.ok( JSON_ENGINE.GetValue( 'abc', null ) === 'abc' );
			assert.ok( JSON_ENGINE.GetValue( 'abc' ) === 'abc' );
		} );

		it( 'should get document values', () => 
		{
			assert.ok( JSON_ENGINE.ShortType( JSON_ENGINE.GetValue( document, '' ) ) === 'o' );
			assert.ok( JSON_ENGINE.GetValue( document, 'id' ) === 1001 );
			assert.ok( JSON_ENGINE.GetValue( document, 'user.name' ) === 'Alice' );
		} );

		it( 'should return an indexed array element, using dot notation', () => 
		{
			assert.ok( JSON_ENGINE.GetValue( [ 1, 2, 3 ], '1' ) === 2 );
			assert.ok( JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value.1' ) === 2 );
		} );

		it( 'should not allow the "$" root symbol when path extensions are disabled', () => 
		{
			assert.ok( typeof JSON_ENGINE.GetValue( document, '$.id' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( document, '$.user.name' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( document, '$.foo' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( document, '$.tags' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$.1' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, '$.value.1' ) === 'undefined' );
		} );

		it( 'should not allow the [] array indexing when path extensions are disabled', () => 
		{
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '$[1]' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '[1]' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value[1]' ) === 'undefined' );
		} );

		it( 'should return undefined if array index is out of bounds', () => 
		{
			assert.ok( typeof JSON_ENGINE.GetValue( [ 1, 2, 3 ], '3' ) === 'undefined' );
			assert.ok( typeof JSON_ENGINE.GetValue( { value: [ 1, 2, 3 ] }, 'value.3' ) === 'undefined' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SetValue Tests', () =>
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
			assert.ok( JSON_ENGINE.SetValue( data, null, 42 ) === false );
			assert.ok( JSON_ENGINE.SetValue( data, '', 42 ) === false );
			assert.ok( JSON_ENGINE.SetValue( data, '', { name: 'Alice' } ) === false );
		} );

		it( 'should create a top level value', () => 
		{
			data = {};
			assert.ok( JSON_ENGINE.SetValue( data, 'id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( JSON_ENGINE.SetValue( data, 'name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should set a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( JSON_ENGINE.SetValue( data, 'id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( JSON_ENGINE.SetValue( data, 'name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should remove a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( JSON_ENGINE.SetValue( data, 'id', undefined ) );
			assert.ok( typeof data.id === 'undefined' );
			assert.ok( JSON_ENGINE.SetValue( data, 'name', undefined ) );
			assert.ok( typeof data.name === 'undefined' );
		} );

		it( 'should create a nested value', () => 
		{
			data = { user: {} };
			assert.ok( JSON_ENGINE.SetValue( data, 'user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
			assert.ok( JSON_ENGINE.SetValue( data, 'profile.id', 1001 ) );
			assert.ok( data.profile.id === 1001 );
		} );

		it( 'should set a nested value', () => 
		{
			data = { user: { name: null } };
			assert.ok( JSON_ENGINE.SetValue( data, 'user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
		} );

		it( 'should remove a nested value', () => 
		{
			data = { user: { name: 'Alice' } };
			assert.ok( JSON_ENGINE.SetValue( data, 'user.name', undefined ) );
			assert.ok( typeof data.user.name === 'undefined' );
		} );

		it( 'should set an array value', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( JSON_ENGINE.SetValue( data, '0', 'admin' ) );
			assert.ok( data.length === 3 );
			assert.ok( data[ 0 ] === 'admin' );
		} );

		it( 'should insert nulls into new array elements', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( JSON_ENGINE.SetValue( data, '3', 'admin' ) );
			assert.ok( data.length === 4 );
			assert.ok( data[ 3 ] === 'admin' );
			assert.ok( JSON_ENGINE.SetValue( data, '6', 42 ) );
			assert.ok( data.length === 7 );
			assert.ok( data[ 4 ] === null );
			assert.ok( data[ 5 ] === null );
			assert.ok( data[ 6 ] === 42 );
		} );

		it( 'should remove an array value', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( JSON_ENGINE.SetValue( data, '3', 'admin' ) );
			assert.ok( data.length === 4 );
			assert.ok( data[ 3 ] === 'admin' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'ResolvePathTerminals Tests', () =>
	{

		let doc =
		{
			b: true,
			n: 3.14,
			s: 'abc',
			l: null,
			o: { a: 1, b: 2, c: 3 },
			a: [ 1, 2, 3 ],
			oa: { a1: [ 1, 2, 3 ], a2: [ 4, 5, 6 ] },
			ao: [ { a: 1, b: 2 }, { a: 3, b: 4 } ],
			aoa: [ { a: [ 11, 12 ] }, { a: [ 13, 14 ] } ],
		};

		it( 'should not resolve when path is null', () => 
		{
			JSON_ENGINE.PathTerminals( doc, null,
				function ( Value, ValueType, Path )
				{
					assert.fail();
				} );
		} );

		it( 'should resolve primitive types', () => 
		{
			JSON_ENGINE.PathTerminals( doc, 'b',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === true );
					assert.ok( ValueType === 'b' );
					assert.ok( Path === 'b' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'n',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3.14 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'n' );
				} );
		} );

		it( 'should resolve entire object', () => 
		{
			JSON_ENGINE.PathTerminals( doc, 'o',
				function ( Value, ValueType, Path )
				{
					assert.ok( JSON.stringify( Value ) === JSON.stringify( doc.o ) );
					assert.ok( ValueType === 'o' );
					assert.ok( Path === 'o' );
				} );
		} );

		it( 'should resolve object fields', () => 
		{
			JSON_ENGINE.PathTerminals( doc, 'o.a',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 1 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.a' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'o.b',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 2 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.b' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'o.c',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.c' );
				} );
		} );

		// it( 'should resolve entire array', () => 
		// {
		// 	JSON_ENGINE.ResolvePathTerminals( doc, 'a',
		// 		function ( Value, ValueType, Path )
		// 		{
		// 			assert.ok( JSON.stringify( Value ) === JSON.stringify( doc.a ) );
		// 			assert.ok( ValueType === 'a' );
		// 			assert.ok( Path === 'a' );
		// 		} );
		// } );

		it( 'should resolve indexed array elements', () => 
		{
			JSON_ENGINE.PathTerminals( doc, 'a.0',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 1 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.0' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'a.1',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 2 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.1' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'a.2',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.2' );
				} );
		} );

		it( 'should resolve complex structures', () => 
		{
			JSON_ENGINE.PathTerminals( doc, 'oa.a2.1',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 5 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'oa.a2.1' );
				} );
			JSON_ENGINE.PathTerminals( doc, 'ao.1.b',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 4 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'ao.1.b' );
				} );
		} );

		it( 'should iterate over arrays', () => 
		{
			let call_count = 0;
			JSON_ENGINE.PathTerminals( doc, 'ao.b',
				function ( Value, ValueType, Path )
				{
					if ( Path === 'ao.0.b' )
					{
						assert.ok( Value === 2 );
						assert.ok( ValueType === 'n' );
					}
					else if ( Path === 'ao.1.b' )
					{
						assert.ok( Value === 4 );
						assert.ok( ValueType === 'n' );
					}
					else
					{
						assert.fail();
					}
					call_count++;
				} );
			assert.ok( call_count === 2 );
		} );

		it( 'should iterate over nested arrays', () => 
		{
			let call_count = 0;
			JSON_ENGINE.PathTerminals( doc, 'aoa.a',
				function ( Value, ValueType, Path )
				{
					if ( Path === 'aoa.0.a.0' )
					{
						assert.ok( Value === 11 );
						assert.ok( ValueType === 'n' );
					}
					else if ( Path === 'aoa.0.a.1' )
					{
						assert.ok( Value === 12 );
						assert.ok( ValueType === 'n' );
					}
					else if ( Path === 'aoa.1.a.0' )
					{
						assert.ok( Value === 13 );
						assert.ok( ValueType === 'n' );
					}
					else if ( Path === 'aoa.1.a.1' )
					{
						assert.ok( Value === 14 );
						assert.ok( ValueType === 'n' );
					}
					else
					{
						assert.fail();
					}
					call_count++;
				} );
			assert.ok( call_count === 4 );
		} );

	} );


} );
