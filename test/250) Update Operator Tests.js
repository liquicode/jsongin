'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )( {
	PathExtensions: false,
	Explain: false,
} );


describe( '250) Update Operator Tests', () =>
{


	describe( 'Field Update Operator Tests', () =>
	{


		describe( '$set Tests', () =>
		{

			it( 'should set values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$set.Update( document, { a: 101, b: 102, c: 103 } );
				assert.ok( result );
				assert.ok( document.a === 101 );
				assert.ok( document.b === 102 );
				assert.ok( document.c === 103 );
			} );

			it( 'should set nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$set.Update( document, { 'nest.a': 101, 'nest.b': 102, 'nest.c': 103 } );
				assert.ok( result );
				assert.ok( document.nest.a === 101 );
				assert.ok( document.nest.b === 102 );
				assert.ok( document.nest.c === 103 );
			} );


		} );


		describe( '$unset Tests', () =>
		{

			it( 'should unset values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$unset.Update( document, { a: 1, b: 1, c: 1 } );
				assert.ok( result );
				assert.ok( typeof document.a === 'undefined' );
				assert.ok( typeof document.b === 'undefined' );
				assert.ok( typeof document.c === 'undefined' );
			} );

			it( 'should set nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$unset.Update( document, { 'nest.a': 1, 'nest.c': 1 } );
				assert.ok( result );
				assert.ok( typeof document.nest.a === 'undefined' );
				assert.ok( document.nest.b === 2 );
				assert.ok( typeof document.nest.c === 'undefined' );
			} );


		} );


		describe( '$rename Tests', () =>
		{

			it( 'should rename values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$rename.Update( document, { a: 'ax', b: 'bx', c: 'cx' } );
				assert.ok( result );
				assert.ok( typeof document.a === 'undefined' );
				assert.ok( typeof document.b === 'undefined' );
				assert.ok( typeof document.c === 'undefined' );
				assert.ok( document.ax === 1 );
				assert.ok( document.bx === 2 );
				assert.ok( document.cx === 3 );
			} );

			it( 'should rename nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$rename.Update( document, { 'nest.a': 'nest.ax', 'nest.b': 'nest.bx', 'nest.c': 'nest.cx' } );
				assert.ok( result );
				assert.ok( typeof document.nest.a === 'undefined' );
				assert.ok( typeof document.nest.b === 'undefined' );
				assert.ok( typeof document.nest.c === 'undefined' );
				assert.ok( document.nest.ax === 1 );
				assert.ok( document.nest.bx === 2 );
				assert.ok( document.nest.cx === 3 );
			} );

			it( 'should move values and create topography', () => 
			{
				let document = { a: 1, b: 2, c: 3, d: { x: 4 } };
				let result = jsongin.UpdateOperators.$rename.Update( document, { a: 'a.x', b: 'b.x', c: 'c.x', 'd.x': 'd' } );
				assert.ok( result );
				assert.ok( typeof document.d.x === 'undefined' );
				assert.ok( document.a.x === 1 );
				assert.ok( document.b.x === 2 );
				assert.ok( document.c.x === 3 );
				assert.ok( document.d === 4 );
			} );


		} );


		describe( '$inc Tests', () =>
		{

			it( 'should increment values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$inc.Update( document, { a: 1, b: 2, c: 3 } );
				assert.ok( result );
				assert.ok( document.a === 2 );
				assert.ok( document.b === 4 );
				assert.ok( document.c === 6 );
			} );

			it( 'should increment nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$inc.Update( document, { 'nest.a': 1, 'nest.b': 2, 'nest.c': 3 } );
				assert.ok( result );
				assert.ok( document.nest.a === 2 );
				assert.ok( document.nest.b === 4 );
				assert.ok( document.nest.c === 6 );
			} );

			it( 'should decrement values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$inc.Update( document, { a: -1, b: -2, c: -3 } );
				assert.ok( result );
				assert.ok( document.a === 0 );
				assert.ok( document.b === 0 );
				assert.ok( document.c === 0 );
			} );


		} );


		describe( '$min Tests', () =>
		{

			it( 'should set min values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$min.Update( document, { a: 1, b: 1, c: 100 } );
				assert.ok( result );
				assert.ok( document.a === 1 );
				assert.ok( document.b === 1 );
				assert.ok( document.c === 3 );
			} );

			it( 'should set min nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$min.Update( document, { 'nest.a': 1, 'nest.b': 1, 'nest.c': 100 } );
				assert.ok( result );
				assert.ok( document.nest.a === 1 );
				assert.ok( document.nest.b === 1 );
				assert.ok( document.nest.c === 3 );
			} );


		} );


		describe( '$max Tests', () =>
		{

			it( 'should set min values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$max.Update( document, { a: 1, b: 1, c: 100 } );
				assert.ok( result );
				assert.ok( document.a === 1 );
				assert.ok( document.b === 2 );
				assert.ok( document.c === 100 );
			} );

			it( 'should set min nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$max.Update( document, { 'nest.a': 1, 'nest.b': 1, 'nest.c': 100 } );
				assert.ok( result );
				assert.ok( document.nest.a === 1 );
				assert.ok( document.nest.b === 2 );
				assert.ok( document.nest.c === 100 );
			} );


		} );


		describe( '$mul Tests', () =>
		{

			it( 'should multiply values', () => 
			{
				let document = { a: 1, b: 2, c: 3 };
				let result = jsongin.UpdateOperators.$mul.Update( document, { a: 1, b: 2, c: 3 } );
				assert.ok( result );
				assert.ok( document.a === 1 );
				assert.ok( document.b === 4 );
				assert.ok( document.c === 9 );
			} );

			it( 'should multiply nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$mul.Update( document, { 'nest.a': 1, 'nest.b': 2, 'nest.c': 3 } );
				assert.ok( result );
				assert.ok( document.nest.a === 1 );
				assert.ok( document.nest.b === 4 );
				assert.ok( document.nest.c === 9 );
			} );


		} );


		describe( '$currentDate Tests', () =>
		{

			it( 'should set the current date', () => 
			{
				let document = {};
				let result = jsongin.UpdateOperators.$currentDate.Update( document, { a: true, b: { $type: 'timestamp' }, c: { $type: 'date' } } );
				assert.ok( result );

				assert.ok( typeof document.a === 'string' );
				let a = jsongin.AsDate( document.a );
				assert.ok( a !== null );

				assert.ok( typeof document.b === 'number' );
				let b = jsongin.AsDate( document.b );
				assert.ok( b !== null );

				assert.ok( typeof document.c === 'string' );
				let c = jsongin.AsDate( document.c );
				assert.ok( c !== null );

				assert.ok( a.toISOString() === b.toISOString() );
				assert.ok( a.toDateString() === c.toDateString() );

			} );

			it( 'should set the current date for nested values', () => 
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$currentDate.Update( document, { 'nest.a': true, 'nest.b': { $type: 'timestamp' }, 'nest.c': { $type: 'date' } } );
				assert.ok( result );

				assert.ok( typeof document.nest.a === 'string' );
				let a = jsongin.AsDate( document.nest.a );
				assert.ok( a !== null );

				assert.ok( typeof document.nest.b === 'number' );
				let b = jsongin.AsDate( document.nest.b );
				assert.ok( b !== null );

				assert.ok( typeof document.nest.c === 'string' );
				let c = jsongin.AsDate( document.nest.c );
				assert.ok( c !== null );

				assert.ok( a.toISOString() === b.toISOString() );
				assert.ok( a.toDateString() === c.toDateString() );

			} );


		} );


	} );


	describe( 'Array Update Operator Tests', () =>
	{


		describe( '$addToSet Tests', () =>
		{

			it( 'should add to a set of values', () => 
			{
				let document = { a: [ 1, 2, 3 ] };
				let result = jsongin.UpdateOperators.$addToSet.Update( document, { a: 4 } );
				assert.ok( result );
				assert.ok( document.a.length === 4 );
				assert.ok( document.a[ 0 ] === 1 );
				assert.ok( document.a[ 1 ] === 2 );
				assert.ok( document.a[ 2 ] === 3 );
				assert.ok( document.a[ 3 ] === 4 );
			} );

			it( 'should not add to a set of values if the value already exists', () => 
			{
				let document = { a: [ 1, 2, 3, 4 ] };
				let result = jsongin.UpdateOperators.$addToSet.Update( document, { a: 4 } );
				assert.ok( result );
				assert.ok( document.a.length === 4 );
				assert.ok( document.a[ 0 ] === 1 );
				assert.ok( document.a[ 1 ] === 2 );
				assert.ok( document.a[ 2 ] === 3 );
				assert.ok( document.a[ 3 ] === 4 );
			} );


		} );


		describe( '$pop Tests', () =>
		{

			it( 'should remove from the end of an array', () => 
			{
				let document = { a: [ 1, 2, 3 ] };
				let result = jsongin.UpdateOperators.$pop.Update( document, { a: 1 } );
				assert.ok( result );
				assert.ok( document.a.length === 2 );
				assert.ok( document.a[ 0 ] === 1 );
				assert.ok( document.a[ 1 ] === 2 );
			} );

			it( 'should remove from the beginning of an array', () => 
			{
				let document = { a: [ 1, 2, 3 ] };
				let result = jsongin.UpdateOperators.$pop.Update( document, { a: -1 } );
				assert.ok( result );
				assert.ok( document.a.length === 2 );
				assert.ok( document.a[ 0 ] === 2 );
				assert.ok( document.a[ 1 ] === 3 );
			} );


		} );


		describe( '$push Tests', () =>
		{

			it( 'should push values to the end of an array', () => 
			{
				let document = { a: [ 1, 2, 3 ] };
				let result = jsongin.UpdateOperators.$push.Update( document, { a: 4 } );
				assert.ok( result );
				assert.ok( document.a.length === 4 );
				assert.ok( document.a[ 0 ] === 1 );
				assert.ok( document.a[ 1 ] === 2 );
				assert.ok( document.a[ 2 ] === 3 );
				assert.ok( document.a[ 3 ] === 4 );
			} );


		} );


		describe( '$pullAll Tests', () =>
		{

			it( 'should pull values from the array', () => 
			{
				let document = { a: [ 1, 2, 3 ] };
				let result = jsongin.UpdateOperators.$pullAll.Update( document, { a: [ 1, 4 ] } );
				assert.ok( result );
				assert.ok( document.a.length === 2 );
				assert.ok( document.a[ 0 ] === 2 );
				assert.ok( document.a[ 1 ] === 3 );
			} );


		} );


	} );


} );

