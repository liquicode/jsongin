'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' );

/*
	Covers the projection behaviors which were added alongside the aggregation work:
	computed fields, projection validation, and the removal of two long standing warts.

	Every case in this file was verified against a MongoDB 8.0 server.
*/

const DOCUMENT = {
	_id: 1,
	name: 'Alice',
	dmg: 8,
	armor: 5,
	when: new Date( 1700000000000 ),
	user: { name: 'alice', role: 'admin' },
};


describe( '510) Projection Computed Field Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Computed Fields', () =>
	{

		it( 'should compute a field from an expression', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } );
			assert.strictEqual( projected.name, 'Alice' );
			assert.strictEqual( projected.net, 3 );
			assert.strictEqual( projected._id, 1 );
		} );

		it( 'should treat a computed field as an inclusion projection', () =>
		{
			// Only _id and the computed field are returned, not the whole document.
			let projected = jsongin.Project( DOCUMENT, { net: { $subtract: [ '$dmg', '$armor' ] } } );
			assert.ok( jsongin.StrictEquals( Object.keys( projected ), [ '_id', 'net' ] ) );
		} );

		it( 'should compute a field while suppressing _id', () =>
		{
			// This case previously inverted into an exclusion and returned the whole document.
			let projected = jsongin.Project( DOCUMENT, { _id: 0, net: { $subtract: [ '$dmg', '$armor' ] } } );
			assert.ok( jsongin.StrictEquals( Object.keys( projected ), [ 'net' ] ) );
			assert.strictEqual( projected.net, 3 );
		} );

		it( 'should rename a field with a field reference', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { alias: '$name' } );
			assert.strictEqual( projected.alias, 'Alice' );
		} );

		it( 'should build a nested output field', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { 'stats.net': { $subtract: [ '$dmg', '$armor' ] } } );
			assert.strictEqual( projected.stats.net, 3 );
		} );

		it( 'should set a computed field which evaluates to null', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { net: { $subtract: [ '$dmg', '$missing' ] } } );
			assert.ok( 'net' in projected );
			assert.strictEqual( projected.net, null );
		} );

		it( 'should omit a computed field which evaluates to a missing value', () =>
		{
			// A missing value is not the same as null. MongoDB omits the field.
			let projected = jsongin.Project( DOCUMENT, { alias: '$nothere' } );
			assert.strictEqual( 'alias' in projected, false );
			assert.ok( jsongin.StrictEquals( Object.keys( projected ), [ '_id' ] ) );
		} );

		it( 'should support $literal within a projection', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { flag: { $literal: true } } );
			assert.strictEqual( projected.flag, true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Projection Validation', () =>
	{

		it( 'should reject a projection combining inclusion and exclusion', () =>
		{
			assert.strictEqual( jsongin.Project( DOCUMENT, { name: 1, dmg: 0 } ), null );
		} );

		it( 'should reject an expression within an exclusion projection', () =>
		{
			assert.strictEqual( jsongin.Project( DOCUMENT, { name: 0, net: { $subtract: [ '$dmg', '$armor' ] } } ), null );
		} );

		it( 'should allow _id to be suppressed alongside an inclusion', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { _id: 0, name: 1 } );
			assert.ok( jsongin.StrictEquals( Object.keys( projected ), [ 'name' ] ) );
		} );

		it( 'should accept booleans in place of 1 and 0', () =>
		{
			assert.ok( jsongin.StrictEquals( jsongin.Project( { a: 1, b: 2 }, { a: true } ), { a: 1 } ) );
			assert.ok( jsongin.StrictEquals( jsongin.Project( { a: 1, b: 2 }, { a: false } ), { b: 2 } ) );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Projected Document Shape', () =>
	{

		it( 'should remove excluded fields rather than leaving them undefined', () =>
		{
			// The excluded keys were once still present, holding undefined.
			let projected = jsongin.Project( DOCUMENT, { dmg: 0, armor: 0 } );
			assert.strictEqual( 'dmg' in projected, false );
			assert.strictEqual( 'armor' in projected, false );
			assert.strictEqual( Object.keys( projected ).includes( 'dmg' ), false );
		} );

		it( 'should not add an _id to a document which does not have one', () =>
		{
			// An inclusion projection once always produced an _id key holding undefined.
			let projected = jsongin.Project( { name: 'no id here' }, { name: 1 } );
			assert.ok( jsongin.StrictEquals( Object.keys( projected ), [ 'name' ] ) );
			assert.strictEqual( '_id' in projected, false );
		} );

		it( 'should omit an included field which is not in the document', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { nothere: 1 } );
			assert.strictEqual( 'nothere' in projected, false );
		} );

		it( 'should keep dates through a projection', () =>
		{
			let projected = jsongin.Project( DOCUMENT, { when: 1 } );
			assert.ok( projected.when instanceof Date );
			assert.strictEqual( projected.when.getTime(), DOCUMENT.when.getTime() );
		} );

		it( 'should not alias the source document', () =>
		{
			let source = { _id: 1, user: { name: 'Alice' } };
			let projected = jsongin.Project( source, { user: 1 } );
			projected.user.name = 'Bob';
			assert.strictEqual( source.user.name, 'Alice' );
		} );

	} );


} );
