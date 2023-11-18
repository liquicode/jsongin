'use strict';

const assert = require( 'assert' );


describe( '010) Javascript Compatibility Tests', () =>
{


	describe( '===, !==', () =>
	{

		describe( 'Matching', () =>
		{

			it( 'should match two booleans', () => 
			{
				assert.ok( false === false );
				assert.ok( false !== true );
				assert.ok( true !== false );
				assert.ok( true === true );
			} );

			it( 'should match two numerics', () => 
			{
				assert.ok( 0 === 0 );
				assert.ok( 0 !== 1 );
				assert.ok( 1 !== 0 );
				assert.ok( 1 === 1 );
			} );

			it( 'should match two strings', () => 
			{
				assert.ok( '0' === '0' );
				assert.ok( '0' !== '1' );
				assert.ok( '1' !== '0' );
				assert.ok( '1' === '1' );
			} );

			it( 'should match two nulls', () => 
			{
				assert.ok( null === null );
			} );

			it( 'should not match two objects', () => 
			{
				let a = { a: 1 };
				let b = { a: 1 };
				assert.ok( a !== b );
			} );

			it( 'should not match two arrays', () => 
			{
				let a = [ 1, 2, 3 ];
				let b = [ 1, 2, 3 ];
				assert.ok( a !== b );
			} );

			it( 'should match two undefineds', () => 
			{
				assert.ok( undefined === undefined );
			} );

		} );


		describe( 'Coercion', () =>
		{

			it( 'should not coerce booleans to numerics (b → n)', () => 
			{
				assert.ok( false !== 0 );
				assert.ok( true !== 1 );
			} );

			it( 'should not coerce booleans to strings (b → s)', () => 
			{
				assert.ok( false !== '0' );
				assert.ok( true !== '1' );
				assert.ok( false !== '' );
			} );

			it( 'should not coerce numerics to strings (n → s)', () => 
			{
				assert.ok( 42 !== '42' );
				assert.ok( 42 !== '42.0' );
			} );

			it( 'should not coerce booleans to null (l → b)', () => 
			{
				assert.ok( false !== null );
			} );

			it( 'should not coerce numerics to null (l → n)', () => 
			{
				assert.ok( 0 !== null );
			} );

			it( 'should not match null and undefined (l == u)', () => 
			{
				assert.ok( null !== undefined );
			} );

			it( 'false !== 0, true !== 1', () => 
			{
				assert.ok( false !== 0 );
				assert.ok( true !== 1 );
			} );

			it( '0 !== "", 3.14 !== "3.14"', () => 
			{
				assert.ok( 0 !== '' );
				assert.ok( 3.14 !== '3.14' );
			} );

		} );


	} );


	describe( '==, !=', () =>
	{

		describe( 'Matching', () =>
		{

			it( 'should match two booleans', () => 
			{
				assert.ok( false == false );
				assert.ok( false != true );
				assert.ok( true != false );
				assert.ok( true == true );
			} );

			it( 'should match two numerics', () => 
			{
				assert.ok( 0 == 0 );
				assert.ok( 0 != 1 );
				assert.ok( 1 != 0 );
				assert.ok( 1 == 1 );
			} );

			it( 'should match two strings', () => 
			{
				assert.ok( '0' == '0' );
				assert.ok( '0' != '1' );
				assert.ok( '1' != '0' );
				assert.ok( '1' == '1' );
			} );

			it( 'should match two nulls', () => 
			{
				assert.ok( null == null );
			} );

			it( 'should not match two objects', () => 
			{
				let a = { a: 1 };
				let b = { a: 1 };
				assert.ok( a != b );
			} );

			it( 'should not match two arrays', () => 
			{
				let a = [ 1, 2, 3 ];
				let b = [ 1, 2, 3 ];
				assert.ok( a != b );
			} );

			it( 'should match two undefineds', () => 
			{
				assert.ok( undefined == undefined );
			} );

		} );


		describe( 'Coercion', () =>
		{

			it( 'should coerce booleans to numerics (b → n)', () => 
			{
				assert.ok( false == 0 );
				assert.ok( true == 1 );
			} );

			it( 'should coerce booleans to strings (b → s)', () => 
			{
				assert.ok( false == '0' );
				assert.ok( true == '1' );
				assert.ok( false == '' );
			} );

			it( 'should coerce numerics to strings (n → s)', () => 
			{
				assert.ok( 42 == '42' );
				assert.ok( 42 == '42.0' );
			} );

			it( 'should not coerce booleans to null (l → b)', () => 
			{
				assert.ok( false != null );
			} );

			it( 'should not coerce numerics to null (l → n)', () => 
			{
				assert.ok( 0 != null );
			} );

			it( 'should match null and undefined (l == u)', () => 
			{
				assert.ok( null == undefined );
			} );

		} );


	} );


	describe( '>=, <=, >, <', () =>
	{

		describe( 'Matching', () =>
		{

			it( 'should match two booleans', () => 
			{
				assert.ok( false <= false );
				assert.ok( false >= false );
				assert.ok( false < true );
				assert.ok( false <= true );
				assert.ok( true > false );
				assert.ok( true >= false );
				assert.ok( true <= true );
				assert.ok( true >= true );
			} );

			it( 'should match two numerics', () => 
			{
				assert.ok( 0 <= 0 );
				assert.ok( 0 >= 0 );
				assert.ok( 0 < 1 );
				assert.ok( 0 <= 1 );
				assert.ok( 1 > 0 );
				assert.ok( 1 >= 0 );
				assert.ok( 1 <= 1 );
				assert.ok( 1 >= 1 );
			} );

			it( 'should match two strings', () => 
			{
				assert.ok( ( 'abc' <= 'abc' ) === true );
				assert.ok( ( 'abc' >= 'abc' ) === true );
				assert.ok( ( 'abc' < 'def' ) === true );
				assert.ok( ( 'abc' > 'def' ) === false );
				assert.ok( ( 'abc' < 'abcd' ) === true );
				assert.ok( ( 'abc' > 'abcd' ) === false );
				assert.ok( ( 'abc' < '' ) === false );
				assert.ok( ( 'abc' > '' ) === true );
			} );

			it( 'should match two nulls', () => 
			{
				assert.ok( ( null <= null ) === true );
				assert.ok( ( null >= null ) === true );
				assert.ok( ( null < null ) === false );
				assert.ok( ( null > null ) === false );
			} );

			it( 'should match two objects', () => 
			{
				let a = { a: 1 };
				let b = { a: 1 };
				let c = { foo: 42, bar: 'baz' };
				assert.ok( ( a <= b ) === true );
				assert.ok( ( a >= b ) === true );
				assert.ok( ( a <= c ) === true );
				assert.ok( ( a >= c ) === true );
				assert.ok( ( a < b ) === false );
				assert.ok( ( a > b ) === false );
				assert.ok( ( a < c ) === false );
				assert.ok( ( a > c ) === false );
			} );

			it( 'should match two arrays', () => 
			{
				let a = [ 1, 2, 3 ];
				let b = [ 1, 2, 3 ];
				let c = [ 4, 5, 6 ];
				assert.ok( ( a <= b ) === true );
				assert.ok( ( a >= b ) === true );
				assert.ok( ( a <= c ) === true );
				assert.ok( ( a >= c ) === false );
				assert.ok( ( a < b ) === false );
				assert.ok( ( a > b ) === false );
				assert.ok( ( a < c ) === true );
				assert.ok( ( a > c ) === false );
			} );

			it( 'should not match two undefineds', () => 
			{
				assert.ok( ( undefined <= undefined ) === false );
				assert.ok( ( undefined >= undefined ) === false );
				assert.ok( ( undefined < undefined ) === false );
				assert.ok( ( undefined > undefined ) === false );
			} );

		} );


		describe( 'Coercion', () =>
		{

			it( 'should coerce booleans to numerics (b → n)', () => 
			{
				assert.ok( ( false <= 0 ) === true );
				assert.ok( ( false >= 0 ) === true );
				assert.ok( ( true <= 1 ) === true );
				assert.ok( ( true >= 1 ) === true );
				assert.ok( ( false <= 1 ) === true );
				assert.ok( ( true >= 0 ) === true );
			} );

			it( 'should coerce booleans to strings (b → s)', () => 
			{
				assert.ok( ( false <= '0' ) === true );
				assert.ok( ( false >= '0' ) === true );
				assert.ok( ( true <= '1' ) === true );
				assert.ok( ( true >= '1' ) === true );
				assert.ok( ( false <= '1' ) === true );
				assert.ok( ( true >= '0' ) === true );
				assert.ok( ( false <= '' ) === true );
				assert.ok( ( true >= '' ) === true );
			} );

			it( 'should coerce numerics to strings (n → s)', () => 
			{
				assert.ok( ( 42 >= '42' ) === true );
				assert.ok( ( 42 >= '42.0' ) === true );
				assert.ok( ( 42 > '39.9' ) === true );
			} );

			it( 'should coerce booleans to null (l → b)', () => 
			{
				assert.ok( ( false <= null ) === true );
				assert.ok( ( false >= null ) === true );
				assert.ok( ( true > null ) === true );
			} );

			it( 'should coerce numerics to null (l → n)', () => 
			{
				assert.ok( ( 0 >= null ) === true );
				assert.ok( ( 0 <= null ) === true );
				assert.ok( ( 1 > null ) === true );
			} );

			it( 'should not match null and undefined (l == u)', () => 
			{
				assert.ok( ( null <= undefined ) === false );
				assert.ok( ( null >= undefined ) === false );
				assert.ok( ( null < undefined ) === false );
				assert.ok( ( null > undefined ) === false );
			} );

		} );


	} );


	describe( 'All Coercion', () =>
	{


		it( 'b → l', () => 
		{
			assert.ok( ( false === null ) === false );
			assert.ok( !( true !== null ) === false );
			assert.ok( ( false == null ) === false );
			assert.ok( !( true != null ) === false );
			assert.ok( ( false >= null ) === true );
			assert.ok( ( false <= null ) === true );
			assert.ok( ( true >= null ) === true );
			assert.ok( ( true > null ) === true );
			assert.ok( !( false < null ) === true );
		} );

		it( 'n → b', () => 
		{
			assert.ok( ( 0 === false ) === false );
			assert.ok( ( 1 === true ) === false );
			assert.ok( !( 1 !== false ) === false );
			assert.ok( !( 0 !== true ) === false );

			assert.ok( ( 0 == false ) === true );
			assert.ok( ( 1 == true ) === true );
			assert.ok( ( 0 != true ) === true );
			assert.ok( ( 1 != false ) === true );

			assert.ok( ( 0 >= false ) === true );
			assert.ok( ( 1 >= false ) === true );
			assert.ok( ( 1 >= true ) === true );
			assert.ok( ( 0 <= false ) === true );
			assert.ok( ( 1 <= true ) === true );
			assert.ok( ( 0 <= true ) === true );

			assert.ok( ( 1 > false ) === true );
			assert.ok( ( 0 < true ) === true );
		} );

		it( 'n → l', () => 
		{
			assert.ok( ( 0 === null ) === false );
			assert.ok( !( 1 !== null ) === false );

			assert.ok( ( 0 == null ) === false );
			assert.ok( !( 1 != null ) === false );

			assert.ok( ( 0 >= null ) === true );
			assert.ok( ( 1 >= null ) === true );
			assert.ok( ( 0 <= null ) === true );

			assert.ok( ( 1 > null ) === true );
			// assert.ok( ( 0 < null ) === true );
		} );

		it( 's → b', () => 
		{
			assert.ok( ( '' === false ) === false );
			assert.ok( ( '1' === true ) === false );
			assert.ok( !( '1' !== false ) === false );
			assert.ok( !( '0' !== true ) === false );

			assert.ok( ( '' == false ) === true );
			assert.ok( ( '0' == false ) === true );
			assert.ok( ( '1' == true ) === true );
			assert.ok( !( '0' != true ) === false );
			assert.ok( !( '1' != false ) === false );

			assert.ok( ( '0' >= false ) === true );
			assert.ok( ( '1' >= false ) === true );
			assert.ok( ( '1' >= true ) === true );
			assert.ok( ( '' <= false ) === true );
			assert.ok( ( '0' <= false ) === true );
			assert.ok( ( '1' <= true ) === true );
			assert.ok( ( '0' <= true ) === true );

			assert.ok( ( '1' > false ) === true );
			assert.ok( ( '' < true ) === true );
			assert.ok( ( '0' < true ) === true );
		} );

		it( 's → n', () => 
		{
			assert.ok( ( '' === 0 ) === false );
			assert.ok( ( '1' === 1 ) === false );
			assert.ok( !( '1' !== 1 ) === false );

			assert.ok( ( '' == 0 ) === true );
			assert.ok( ( '1' == 1 ) === true );
			assert.ok( !( '1' != 1 ) === true );

			assert.ok( ( '' <= 1 ) === true );
			assert.ok( ( '1' <= 1 ) === true );
			assert.ok( ( '1' <= 2 ) === true );
			assert.ok( ( '' >= 0 ) === true );
			assert.ok( ( '1' >= 0 ) === true );

			assert.ok( ( '' < 1 ) === true );
			assert.ok( ( '1' < 2 ) === true );
			assert.ok( ( '1' > 0 ) === true );
		} );

		it( 'l → u', () => 
		{
			assert.ok( ( null === undefined ) === false );
			assert.ok( !( null !== undefined ) === false );

			assert.ok( ( null == undefined ) === true );
			assert.ok( !( null != undefined ) === true );

			assert.ok( ( null <= undefined ) === false );
			assert.ok( ( null >= undefined ) === false );

			assert.ok( ( null < undefined ) === false );
			assert.ok( ( null > undefined ) === false );
		} );

		it( 'Rules', () => 
		{

			assert.ok( ( false == 0 ) === true );
			assert.ok( ( false == '' ) === true );

			assert.ok( ( false == null ) === false );
			assert.ok( ( false == undefined ) === false );

			assert.ok( ( true == 1 ) === true );
			assert.ok( ( true == '1' ) === true );

			assert.ok( ( 42 == '42' ) === true );
			assert.ok( ( 42.0 == '42' ) === true );
			assert.ok( ( 42 == '42.0' ) === true );

			assert.ok( ( undefined == null ) === true );

			assert.ok( ( false <= 0 ) === true );
			assert.ok( ( false <= '' ) === true );
			assert.ok( ( false <= null ) === true );

			assert.ok( ( false <= undefined ) === false );

		} );


	} );


	describe( 'Json stringify/parse', () =>
	{


		it( 'should stringify special fields', () => 
		{
			let json = JSON.stringify( { l: { $eq: 3.14 } } );
			let doc = JSON.parse( json );
			assert.ok( doc );
			assert.ok( doc.l );
			assert.ok( doc.l.$eq );
			assert.ok( doc.l.$eq === 3.14 );
		} );


		it( 'should not stringify regular expressions', () => 
		{
			let json = JSON.stringify( { l: /abc/ } );
			let doc = JSON.parse( json );
			assert.ok( doc );
			assert.ok( doc.l );
			assert.deepStrictEqual( doc.l, {} );
		} );


		it( 'should not stringify functions', () => 
		{
			let json = JSON.stringify( { l: { f: function () { } } } );
			let doc = JSON.parse( json );
			assert.ok( doc );
			assert.ok( doc.l );
			assert.deepStrictEqual( doc.l, {} );
		} );


	} );


} );

