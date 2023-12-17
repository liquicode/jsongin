'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )
	.NewJsongin( {
		PathExtensions: false,
		Explain: false,
	} );


describe( '210) Logical Operator Tests', () =>
{


	describe( '$and Tests', () =>
	{

		it( 'should default to true when no conditions are specified', () => 
		{
			assert.ok( jsongin.QueryOperators.$and.Query( { a: 1 }, [] ) );
		} );

		it( 'should be true when all of its conditions are true', () => 
		{
			assert.ok( jsongin.QueryOperators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
				] ) );
			assert.ok( jsongin.QueryOperators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
					{ b: '2' },
				] ) );
			assert.ok( jsongin.QueryOperators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
					{ b: '2' },
					{ c: 3 },
				] ) );
		} );

		it( 'should be false when one of its conditions is false', () => 
		{
			assert.ok( jsongin.QueryOperators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
					{ b: 2 },
					{ c: 3 },
				] ) === false );
		} );

	} );


	describe( '$or Tests', () =>
	{

		it( 'should default to false when no conditions are specified', () => 
		{
			assert.ok( jsongin.QueryOperators.$or.Query( { a: 1 }, [] ) === false );
		} );

		it( 'should be true when one of its conditions are true', () => 
		{
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: 1 },
				] ) );
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
				] ) );
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
					{ a: 1 },
				] ) );
		} );

		it( 'should be false when all of its conditions are false', () => 
		{
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
				] ) === false );
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
				] ) === false );
			assert.ok( jsongin.QueryOperators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
					{ a: 42 },
				] ) === false );
		} );

	} );


	describe( '$nor Tests', () =>
	{

		it( 'should default to true when no conditions are specified', () => 
		{
			assert.ok( jsongin.QueryOperators.$nor.Query( { a: 1 }, [] ) );
		} );

		it( 'should be true when none of its conditions are true', () => 
		{
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
				] ) );
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
				] ) );
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
					{ a: 42 },
				] ) );
		} );

		it( 'should be false when one of its conditions is true', () => 
		{
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: 1 },
				] ) === false );
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
				] ) === false );
			assert.ok( jsongin.QueryOperators.$nor.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
					{ a: 42 },
				] ) === false );
		} );

	} );


} );

