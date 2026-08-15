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

		// Inclusion through an array keeps the array and produces one object per element.
		// This is a different rule from the one an aggregation expression follows: '$a.x'
		// gathers to [ 1, 2 ] while { 'a.x': 1 } produces [ { x: 1 }, { x: 2 } ].
		// Every case below was measured against MongoDB 6.0.1.

		it( 'should include a field through an array, keeping the array', () =>
		{
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] }, { 'a.x': 1 } ),
				{ a: [ { x: 1 }, { x: 3 } ] } );
		} );

		it( 'should give an empty object for an element which lacks the field', () =>
		{
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1 }, { y: 9 } ] }, { 'a.x': 1 } ),
				{ a: [ { x: 1 }, {} ] } );

			assert.deepStrictEqual(
				jsongin.Project( { a: [ { y: 9 } ] }, { 'a.x': 1 } ),
				{ a: [ {} ] } );
		} );

		it( 'should drop an element which cannot carry the field', () =>
		{
			// A scalar contributes nothing, so a path into an array of scalars is empty.
			assert.deepStrictEqual( jsongin.Project( { a: [ 1, 2, 3 ] }, { 'a.x': 1 } ), { a: [] } );
			assert.deepStrictEqual( jsongin.Project( { a: [ { x: 1 }, 5, { x: 2 } ] }, { 'a.x': 1 } ), { a: [ { x: 1 }, { x: 2 } ] } );
			assert.deepStrictEqual( jsongin.Project( { a: [ { x: 1 }, null ] }, { 'a.x': 1 } ), { a: [ { x: 1 } ] } );
			assert.deepStrictEqual( jsongin.Project( { a: [] }, { 'a.x': 1 } ), { a: [] } );
		} );

		it( 'should include through two levels of array', () =>
		{
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { b: [ { c: 1, d: 2 } ] } ] }, { 'a.b.c': 1 } ),
				{ a: [ { b: [ { c: 1 } ] } ] } );
		} );

		it( 'should descend into an array inside an array', () =>
		{
			// Projection does this. A query path does not, which is a genuine difference
			// between the two mechanisms.
			assert.deepStrictEqual(
				jsongin.Project( { a: [ [ { c: 1, d: 2 } ] ] }, { 'a.c': 1 } ),
				{ a: [ [ { c: 1 } ] ] } );
		} );

		it( 'should gather two fields from the same array into one object', () =>
		{
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1, y: 2, w: 3 } ] }, { 'a.x': 1, 'a.y': 1 } ),
				{ a: [ { x: 1, y: 2 } ] } );
		} );

		it( 'should treat a numeric path element as a field name', () =>
		{
			// MongoDB does not index the array here. No element has a field named '0'.
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.0': 1 } ),
				{ a: [ {}, {} ] } );

			// Against an object it names the field, which does exist here.
			assert.deepStrictEqual(
				jsongin.Project( { a: { '0': 'zero', z: 9 } }, { 'a.0': 1 } ),
				{ a: { '0': 'zero' } } );
		} );

		it( 'should omit a field whose path runs below a scalar', () =>
		{
			assert.deepStrictEqual( jsongin.Project( { a: 5 }, { 'a.x': 1 } ), {} );
		} );

		it( 'should keep an ordinary path working', () =>
		{
			assert.deepStrictEqual( jsongin.Project( { a: { x: 1, y: 2 } }, { 'a.x': 1 } ), { a: { x: 1 } } );
			assert.deepStrictEqual( jsongin.Project( { a: [ { x: 1 } ], z: 9 }, { 'a.x': 1, z: 1 } ), { a: [ { x: 1 } ], z: 9 } );
			assert.deepStrictEqual( jsongin.Project( { a: [ { x: 1, y: 2 } ] }, { a: 1 } ), { a: [ { x: 1, y: 2 } ] } );
		} );

		it( 'should not alias the document it projected from', () =>
		{
			let document = { a: [ { x: { n: 1 } } ] };
			let projected = jsongin.Project( document, { 'a.x': 1 } );
			projected.a[ 0 ].x.n = 999;
			assert.strictEqual( document.a[ 0 ].x.n, 1 );
		} );

		it( 'should exclude a field through an array, keeping the array', () =>
		{
			// MongoDB removes the field from every element and keeps the array.
			// Verified against MongoDB 6.0.1.
			//
			// Exclusion used to route through DeleteValue, which follows the $unset update
			// operator and refuses a path reaching into an array by field name unless the
			// PathExtensions setting is on. That made this exclusion remove nothing.
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1, y: 2 } ] }, { 'a.x': 0 } ),
				{ a: [ { y: 2 } ] } );

			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] }, { 'a.x': 0 } ),
				{ a: [ { y: 2 }, { y: 4 } ] } );

			// An element which does not have the field is left alone.
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { x: 1 }, { y: 9 } ] }, { 'a.x': 0 } ),
				{ a: [ {}, { y: 9 } ] } );
		} );

		it( 'should exclude through two levels of array', () =>
		{
			assert.deepStrictEqual(
				jsongin.Project( { a: [ { b: [ { c: 1, d: 2 } ] } ] }, { 'a.b.c': 0 } ),
				{ a: [ { b: [ { d: 2 } ] } ] } );
		} );

		it( 'should exclude an array element by index', () =>
		{
			let projected = jsongin.Project( { a: [ 1, 2, 3 ] }, { 'a.1': 0 } );
			assert.strictEqual( projected.a.length, 3 );
			assert.strictEqual( Object.prototype.hasOwnProperty.call( projected.a, 1 ), false );
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

		/*
			A field reference such as '$user' evaluates to the value inside the document rather
			than to a copy of it, so a computed field needs the same clone an included field
			gets. Only the included fields used to be cloned.
		*/

		it( 'should not alias the source document through a computed field', () =>
		{
			let source = { user: { name: 'Alice' } };
			let projected = jsongin.Project( source, { copy: '$user' } );
			projected.copy.name = 'Bob';
			assert.strictEqual( source.user.name, 'Alice' );
		} );

		it( 'should not alias an array through a computed field', () =>
		{
			let source = { tags: [ 'a', 'b' ] };
			let projected = jsongin.Project( source, { t: '$tags' } );
			projected.t.push( 'c' );
			assert.strictEqual( source.tags.length, 2 );
		} );

		it( 'should keep a date through a computed field', () =>
		{
			let source = { when: new Date( 1000 ) };
			let projected = jsongin.Project( source, { w: '$when' } );
			assert.ok( projected.w instanceof Date );
			assert.strictEqual( projected.w.getTime(), 1000 );
		} );

	} );


} );
