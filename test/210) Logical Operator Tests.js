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


	//---------------------------------------------------------------------
	describe( '$noop Tests', () =>
	{

		// $noop matches anything and performs no operation, so a clause can be commented
		// out by renaming its key to $noop.

		it( 'should ignore a commented out clause at the top level of a query', () =>
		{
			let document = { a: 1, b: 2 };
			assert.ok( jsongin.Query( document, { a: 1, $noop: { b: 999 } } ) === true );
			assert.ok( jsongin.Query( document, { $noop: { a: 999 } } ) === true );
		} );

		it( 'should not affect the rest of the query', () =>
		{
			let document = { a: 1, b: 2 };
			// The remaining clauses are still evaluated normally.
			assert.ok( jsongin.Query( document, { a: 1, $noop: { z: 1 } } ) === true );
			assert.ok( jsongin.Query( document, { a: 999, $noop: { z: 1 } } ) === false );
		} );

		it( 'should ignore a commented out clause within a field', () =>
		{
			assert.ok( jsongin.Query( { a: 1 }, { a: { $noop: 999 } } ) === true );
		} );

		it( 'should accept any value', () =>
		{
			let document = { a: 1 };
			assert.ok( jsongin.Query( document, { $noop: 42 } ) === true );
			assert.ok( jsongin.Query( document, { $noop: 'abc' } ) === true );
			assert.ok( jsongin.Query( document, { $noop: null } ) === true );
			assert.ok( jsongin.Query( document, { $noop: [ 1, 2 ] } ) === true );
			assert.ok( jsongin.Query( document, { $noop: { $bogus: 1 } } ) === true );
		} );

		it( 'should still reject an undefined value', () =>
		{
			// Query rejects undefined for every operator, so that a missing variable in a
			// query is not silently ignored. $noop is not an exception.
			assert.ok( jsongin.Query( { a: 1 }, { $noop: undefined } ) === false );
		} );

		it( 'should be callable directly', () =>
		{
			assert.ok( jsongin.QueryOperators.$noop.Query( { a: 1 }, 'anything', '' ) === true );
		} );

	} );


} );

