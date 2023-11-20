'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )( {
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
			assert.ok( jsongin.ShortType( true ) === 'b' );
			assert.ok( jsongin.ShortType( false ) === 'b' );
		} );
		it( 'should support (n)umeric short type', () => 
		{
			assert.ok( jsongin.ShortType( 42 ) === 'n' );
			assert.ok( jsongin.ShortType( 42.0 ) === 'n' );
			assert.ok( jsongin.ShortType( 3.14 ) === 'n' );
		} );
		it( 'should support (s)tring short type', () => 
		{
			assert.ok( jsongin.ShortType( '' ) === 's' );
			assert.ok( jsongin.ShortType( 'abc' ) === 's' );
		} );
		it( 'should support nul(l) short type', () => 
		{
			assert.ok( jsongin.ShortType( null ) === 'l' );
		} );
		it( 'should support (o)bject short type', () => 
		{
			assert.ok( jsongin.ShortType( {} ) === 'o' );
			assert.ok( jsongin.ShortType( { value: 1 } ) === 'o' );
		} );
		it( 'should support (a)rray short type', () => 
		{
			assert.ok( jsongin.ShortType( [] ) === 'a' );
			assert.ok( jsongin.ShortType( [ 1, 2, 3 ] ) === 'a' );
		} );
		it( 'should support (f)unction short type', () => 
		{
			assert.ok( jsongin.ShortType( function () { } ) === 'f' );
		} );
		it( 'should support (r)egex short type', () => 
		{
			assert.ok( jsongin.ShortType( /test/ ) === 'r' );
		} );
		it( 'should support (u)ndefined short type', () => 
		{
			assert.ok( jsongin.ShortType() === 'u' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SplitPath Tests', () =>
	{

		it( 'should not allow non-string paths', () => 
		{
			assert.ok( jsongin.SplitPath() === null );
			assert.ok( jsongin.SplitPath( null ) === null );
		} );

		it( 'should return an empty array for an empty path', () => 
		{
			let elements = null;
			elements = jsongin.SplitPath( '' );
			assert.ok( elements.length === 0 );
		} );

		it( 'should not allow the $ element within a path', () => 
		{
			assert.ok( jsongin.SplitPath( 'a.$' ) === null );
			assert.ok( jsongin.SplitPath( 'a.$.b' ) === null );
		} );

		it( 'should not allow the $ element at the root when path extensions are disabled', () => 
		{
			assert.ok( jsongin.SplitPath( '$' ) === null );
			assert.ok( jsongin.SplitPath( '$.a' ) === null );
		} );

		it( 'should ignore bracketed [] array indeces when path extensions are disabled', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath( 'a[1]' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 'a[1]' );
		} );

		it( 'should split a path', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath( 'a' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 'a' );

			elements = jsongin.SplitPath( 'a.b.c' );
			assert.ok( elements.length === 3 );
			assert.ok( elements[ 0 ] === 'a' );
			assert.ok( elements[ 1 ] === 'b' );
			assert.ok( elements[ 2 ] === 'c' );

		} );

		it( 'should split a path containing array indeces', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath( '1' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] !== '1' );
			assert.ok( elements[ 0 ] === 1 );

			elements = jsongin.SplitPath( 'a.2.c' );
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
			assert.ok( jsongin.JoinPaths() === '' );
			// assert.ok( jsongin.JoinPaths( null ) === '' );
			assert.ok( jsongin.JoinPaths( '' ) === '' );
			assert.ok( jsongin.JoinPaths( '', '' ) === '' );
		} );

		it( 'should return an empty string when null is provided', () => 
		{
			assert.ok( jsongin.JoinPaths( null ) === '' );
		} );

		it( 'should join paths', () => 
		{
			assert.ok( jsongin.JoinPaths( 'a' ) === 'a' );
			assert.ok( jsongin.JoinPaths( 'a', 'b' ) === 'a.b' );
			assert.ok( jsongin.JoinPaths( 'a', 'b.c' ) === 'a.b.c' );
			assert.ok( jsongin.JoinPaths( 'a', '2' ) === 'a.2' );
			assert.ok( jsongin.JoinPaths( 'a', '2.c' ) === 'a.2.c' );
			assert.ok( jsongin.JoinPaths( 'a', '2', 'c' ) === 'a.2.c' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'GetValue Tests', () =>
	{

		it( 'should return the given document if path is an empty string "", null, or undefined', () => 
		{
			assert.ok( jsongin.GetValue( 'abc', '' ) === 'abc' );
			assert.ok( jsongin.GetValue( 'abc', null ) === 'abc' );
			assert.ok( jsongin.GetValue( 'abc' ) === 'abc' );
		} );

		it( 'should get document values', () => 
		{
			assert.ok( jsongin.ShortType( jsongin.GetValue( document, '' ) ) === 'o' );
			assert.ok( jsongin.GetValue( document, 'id' ) === 1001 );
			assert.ok( jsongin.GetValue( document, 'user.name' ) === 'Alice' );
		} );

		it( 'should return an indexed array element, using dot notation', () => 
		{
			assert.ok( jsongin.GetValue( [ 1, 2, 3 ], '1' ) === 2 );
			assert.ok( jsongin.GetValue( { value: [ 1, 2, 3 ] }, 'value.1' ) === 2 );
		} );

		it( 'should not allow the "$" root symbol when path extensions are disabled', () => 
		{
			assert.ok( typeof jsongin.GetValue( document, '$.id' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( document, '$.user.name' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( document, '$.foo' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( document, '$.tags' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( [ 1, 2, 3 ], '$.1' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( { value: [ 1, 2, 3 ] }, '$.value.1' ) === 'undefined' );
		} );

		it( 'should not allow the [] array indexing when path extensions are disabled', () => 
		{
			assert.ok( typeof jsongin.GetValue( [ 1, 2, 3 ], '$[1]' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( [ 1, 2, 3 ], '[1]' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( { value: [ 1, 2, 3 ] }, 'value[1]' ) === 'undefined' );
		} );

		it( 'should return undefined if array index is out of bounds', () => 
		{
			assert.ok( typeof jsongin.GetValue( [ 1, 2, 3 ], '3' ) === 'undefined' );
			assert.ok( typeof jsongin.GetValue( { value: [ 1, 2, 3 ] }, 'value.3' ) === 'undefined' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SetValue Tests', () =>
	{
		let data = null;

		it( 'requires a non-empty document', () => 
		{
			assert.ok( jsongin.SetValue( undefined, 'value', 42 ) === false );
			assert.ok( jsongin.SetValue( null, 'value', 42 ) === false );
		} );

		it( 'requires a non-empty path', () => 
		{
			data = {};
			assert.ok( jsongin.SetValue( data, null, 42 ) === false );
			assert.ok( jsongin.SetValue( data, '', 42 ) === false );
			assert.ok( jsongin.SetValue( data, '', { name: 'Alice' } ) === false );
		} );

		it( 'should create a top level value', () => 
		{
			data = {};
			assert.ok( jsongin.SetValue( data, 'id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( jsongin.SetValue( data, 'name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should set a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( jsongin.SetValue( data, 'id', 1001 ) );
			assert.ok( data.id === 1001 );
			assert.ok( jsongin.SetValue( data, 'name', 'Alice' ) );
			assert.ok( data.name === 'Alice' );
		} );

		it( 'should remove a top level value', () => 
		{
			data = { id: null, name: null };
			assert.ok( jsongin.SetValue( data, 'id', undefined ) );
			assert.ok( typeof data.id === 'undefined' );
			assert.ok( jsongin.SetValue( data, 'name', undefined ) );
			assert.ok( typeof data.name === 'undefined' );
		} );

		it( 'should create a nested value', () => 
		{
			data = { user: {} };
			assert.ok( jsongin.SetValue( data, 'user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
			assert.ok( jsongin.SetValue( data, 'profile.id', 1001 ) );
			assert.ok( data.profile.id === 1001 );
		} );

		it( 'should set a nested value', () => 
		{
			data = { user: { name: null } };
			assert.ok( jsongin.SetValue( data, 'user.name', 'Alice' ) );
			assert.ok( data.user.name === 'Alice' );
		} );

		it( 'should remove a nested value', () => 
		{
			data = { user: { name: 'Alice' } };
			assert.ok( jsongin.SetValue( data, 'user.name', undefined ) );
			assert.ok( typeof data.user.name === 'undefined' );
		} );

		it( 'should set an array value', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( jsongin.SetValue( data, '0', 'admin' ) );
			assert.ok( data.length === 3 );
			assert.ok( data[ 0 ] === 'admin' );
		} );

		it( 'should insert nulls into new array elements', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( jsongin.SetValue( data, '3', 'admin' ) );
			assert.ok( data.length === 4 );
			assert.ok( data[ 3 ] === 'admin' );
			assert.ok( jsongin.SetValue( data, '6', 42 ) );
			assert.ok( data.length === 7 );
			assert.ok( data[ 4 ] === null );
			assert.ok( data[ 5 ] === null );
			assert.ok( data[ 6 ] === 42 );
		} );

		it( 'should remove an array value', () => 
		{
			data = [ 1, 2, 3 ];
			assert.ok( jsongin.SetValue( data, '3', 'admin' ) );
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
			jsongin.PathTerminals( doc, null,
				function ( Value, ValueType, Path )
				{
					assert.fail();
				} );
		} );

		it( 'should resolve primitive types', () => 
		{
			jsongin.PathTerminals( doc, 'b',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === true );
					assert.ok( ValueType === 'b' );
					assert.ok( Path === 'b' );
				} );
			jsongin.PathTerminals( doc, 'n',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3.14 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'n' );
				} );
		} );

		it( 'should resolve entire object', () => 
		{
			jsongin.PathTerminals( doc, 'o',
				function ( Value, ValueType, Path )
				{
					assert.ok( JSON.stringify( Value ) === JSON.stringify( doc.o ) );
					assert.ok( ValueType === 'o' );
					assert.ok( Path === 'o' );
				} );
		} );

		it( 'should resolve object fields', () => 
		{
			jsongin.PathTerminals( doc, 'o.a',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 1 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.a' );
				} );
			jsongin.PathTerminals( doc, 'o.b',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 2 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.b' );
				} );
			jsongin.PathTerminals( doc, 'o.c',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'o.c' );
				} );
		} );

		// it( 'should resolve entire array', () => 
		// {
		// 	jsongin.ResolvePathTerminals( doc, 'a',
		// 		function ( Value, ValueType, Path )
		// 		{
		// 			assert.ok( JSON.stringify( Value ) === JSON.stringify( doc.a ) );
		// 			assert.ok( ValueType === 'a' );
		// 			assert.ok( Path === 'a' );
		// 		} );
		// } );

		it( 'should resolve indexed array elements', () => 
		{
			jsongin.PathTerminals( doc, 'a.0',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 1 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.0' );
				} );
			jsongin.PathTerminals( doc, 'a.1',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 2 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.1' );
				} );
			jsongin.PathTerminals( doc, 'a.2',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 3 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'a.2' );
				} );
		} );

		it( 'should resolve complex structures', () => 
		{
			jsongin.PathTerminals( doc, 'oa.a2.1',
				function ( Value, ValueType, Path )
				{
					assert.ok( Value === 5 );
					assert.ok( ValueType === 'n' );
					assert.ok( Path === 'oa.a2.1' );
				} );
			jsongin.PathTerminals( doc, 'ao.1.b',
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
			jsongin.PathTerminals( doc, 'ao.b',
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
			jsongin.PathTerminals( doc, 'aoa.a',
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


	//---------------------------------------------------------------------
	describe( 'SafeClone Tests', () =>
	{

		it( 'should clone a simple object', () => 
		{
			let doc = { b: true, n: 3.14, s: 'abc' };
			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.b === true );
			assert.ok( clone.n === 3.14 );
			assert.ok( clone.s === 'abc' );
		} );

		it( 'should clone a nested objects', () => 
		{
			let doc = { o: { b: true, n: 3.14, s: 'abc' } };
			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.o );
			assert.ok( clone.o.b === true );
			assert.ok( clone.o.n === 3.14 );
			assert.ok( clone.o.s === 'abc' );
		} );

		it( 'should clone an array', () => 
		{
			let doc = { a: [ 1, 2, 3 ] };
			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.a );
			assert.ok( clone.a.length = 3 );
			assert.ok( clone.a[ 0 ] === 1 );
			assert.ok( clone.a[ 1 ] === 2 );
			assert.ok( clone.a[ 2 ] === 3 );
		} );

		it( 'should clone an array of objects', () => 
		{
			let doc = { a: [ { one: 1 }, { two: 2 } ] };
			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.a );
			assert.ok( clone.a.length = 2 );
			assert.ok( clone.a[ 0 ].one === 1 );
			assert.ok( clone.a[ 1 ].two === 2 );
		} );

		it( 'should clone non-value fields', () => 
		{
			let doc = { l: null, r: /test/, e: new Error( 'hello' ), f: function () { }, u: undefined };
			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.l === null );
			assert.ok( clone.r instanceof RegExp );
			assert.ok( clone.e instanceof Error );
			assert.ok( typeof clone.f === 'function' );
			assert.ok( typeof clone.u === 'undefined' );
		} );

		it( 'should selectively clone with the AssignNotClone parameter', () => 
		{
			function ObjectId( value ) { return value; }
			let doc = { good: 'value', bad: new ObjectId( '1' ) };
			let clone = jsongin.SafeClone( doc, [ 'bad' ] );
			assert.ok( clone );
			assert.ok( typeof clone.bad !== 'undefined' );
			// assert.ok( clone._id === null );
		} );

	} );


} );
