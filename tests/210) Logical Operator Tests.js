'use strict';

const assert = require( 'assert' );
const JSON_ENGINE = require( '../src/jsongin' )( {
	PathExtensions: false,
	Explain: false,
} );


describe( '210) Logical Operator Tests', () =>
{


	describe( '$and Tests', () =>
	{

		it( 'should default to true when no conditions are specified', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$and.Query( { a: 1 }, [] ) );
		} );

		it( 'should be true when all of its conditions are true', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
					{ b: '2' },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$and.Query(
				{ a: 1, b: '2', c: 3 },
				[
					{ a: 1 },
					{ b: '2' },
					{ c: 3 },
				] ) );
		} );

		it( 'should be false when one of its conditions is false', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$and.Query(
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
			assert.ok( JSON_ENGINE.Operators.$or.Query( { a: 1 }, [] ) === false );
		} );

		it( 'should be true when one of its conditions are true', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$or.Query(
				{ a: 1 },
				[
					{ a: 1 },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$or.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
					{ a: 1 },
				] ) );
		} );

		it( 'should be false when all of its conditions are false', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
				] ) === false );
			assert.ok( JSON_ENGINE.Operators.$or.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
				] ) === false );
			assert.ok( JSON_ENGINE.Operators.$or.Query(
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
			assert.ok( JSON_ENGINE.Operators.$nor.Query( { a: 1 }, [] ) );
		} );

		it( 'should be true when none of its conditions are true', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
				] ) );
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: -1 },
					{ a: 0 },
					{ a: 42 },
				] ) );
		} );

		it( 'should be false when one of its conditions is true', () => 
		{
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: 1 },
				] ) === false );
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
				] ) === false );
			assert.ok( JSON_ENGINE.Operators.$nor.Query(
				{ a: 1 },
				[
					{ a: 0 },
					{ a: 1 },
					{ a: 42 },
				] ) === false );
		} );

	} );


} );

