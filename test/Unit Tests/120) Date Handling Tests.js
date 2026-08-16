'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );

/*
	Runs a date through every public function and asserts that it survives.

	A Date has the short type 'd'. Before that short type existed a Date reported as 'o', and
	any function which walked an object member-wise found no members and silently produced an
	empty object. This file exists so that class of defect cannot return unnoticed.
*/

const WHEN = new Date( 1700000000000 );  // 2023-11-14T22:13:20.000Z
const EARLIER = new Date( 1600000000000 );
const LATER = new Date( 1800000000000 );


describe( '120) Date Handling Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Data Types', () =>
	{

		it( 'should give a Date its own short type', () =>
		{
			assert.strictEqual( jsongin.ShortType( WHEN ), 'd' );
			assert.notStrictEqual( jsongin.ShortType( WHEN ), 'o' );
		} );

		it( 'should not classify numbers or strings which look like dates', () =>
		{
			// Every number is a valid timestamp. Only the type identifies a date.
			assert.strictEqual( jsongin.ShortType( 1700000000000 ), 'n' );
			assert.strictEqual( jsongin.ShortType( '2023-11-14T22:13:20.000Z' ), 's' );
		} );

		it( 'should report the date BSON type', () =>
		{
			assert.strictEqual( jsongin.BsonType( WHEN, true ), 'date' );
			assert.strictEqual( jsongin.BsonType( WHEN, false ), 9 );
		} );

		it( 'should convert dates with AsDate', () =>
		{
			assert.strictEqual( jsongin.AsDate( WHEN ).getTime(), WHEN.getTime() );
			assert.strictEqual( jsongin.AsDate( 0 ).getTime(), 0 );
		} );

		it( 'should treat a date as true', () =>
		{
			assert.strictEqual( jsongin.AsBoolean( WHEN ), true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Comparison and Equality', () =>
	{

		it( 'should compare dates by their time value', () =>
		{
			assert.strictEqual( jsongin.CompareValues( EARLIER, LATER ), -1 );
			assert.strictEqual( jsongin.CompareValues( LATER, EARLIER ), 1 );
			assert.strictEqual( jsongin.CompareValues( WHEN, new Date( WHEN.getTime() ) ), 0 );
		} );

		it( 'should order dates above booleans and below regular expressions', () =>
		{
			assert.strictEqual( jsongin.CompareValues( true, WHEN ), -1 );
			assert.strictEqual( jsongin.CompareValues( WHEN, /abc/ ), -1 );
		} );

		it( 'should equate equal dates strictly', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( WHEN, new Date( WHEN.getTime() ) ), true );
			assert.strictEqual( jsongin.StrictEquals( EARLIER, LATER ), false );
		} );

		it( 'should equate equal dates loosely, and only equal ones', () =>
		{
			// Two dates once compared equal regardless of value, because a Date presents no
			// members to the member-wise object comparison.
			assert.strictEqual( jsongin.LooseEquals( WHEN, new Date( WHEN.getTime() ) ), true );
			assert.strictEqual( jsongin.LooseEquals( EARLIER, LATER ), false );
		} );

		it( 'should not equate a date to a non-date', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( WHEN, WHEN.toISOString() ), false );
			assert.strictEqual( jsongin.LooseEquals( WHEN, WHEN.getTime() ), false );
			assert.strictEqual( jsongin.LooseEquals( WHEN, {} ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Query', () =>
	{

		let document = { id: 1, when: WHEN, log: [ EARLIER, WHEN ] };

		it( 'should match a date field', () =>
		{
			assert.strictEqual( jsongin.Query( document, { when: new Date( WHEN.getTime() ) } ), true );
			assert.strictEqual( jsongin.Query( document, { when: EARLIER } ), false );
		} );

		it( 'should support date range queries', () =>
		{
			assert.strictEqual( jsongin.Query( document, { when: { $gt: EARLIER } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $gte: WHEN } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $lt: LATER } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $lte: WHEN } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $gt: LATER } } ), false );
			assert.strictEqual( jsongin.Query( document, { when: { $lt: EARLIER } } ), false );
		} );

		it( 'should support $ne on dates', () =>
		{
			assert.strictEqual( jsongin.Query( document, { when: { $ne: EARLIER } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $ne: new Date( WHEN.getTime() ) } } ), false );
		} );

		it( 'should support $in and $nin on dates', () =>
		{
			assert.strictEqual( jsongin.Query( document, { when: { $in: [ new Date( WHEN.getTime() ) ] } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $in: [ EARLIER, LATER ] } } ), false );
			assert.strictEqual( jsongin.Query( document, { when: { $nin: [ EARLIER, LATER ] } } ), true );
		} );

		it( 'should match a date within an array field', () =>
		{
			assert.strictEqual( jsongin.Query( document, { log: new Date( EARLIER.getTime() ) } ), true );
			assert.strictEqual( jsongin.Query( document, { log: LATER } ), false );
		} );

		it( 'should select dates with $type', () =>
		{
			assert.strictEqual( jsongin.Query( document, { when: { $type: 'date' } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $type: 9 } } ), true );
			assert.strictEqual( jsongin.Query( document, { when: { $type: 'object' } } ), false );
			assert.strictEqual( jsongin.Query( document, { id: { $type: 'date' } } ), false );
		} );

		it( 'should support $expr on dates', () =>
		{
			assert.strictEqual( jsongin.Query( document, { $expr: { $gt: [ '$when', { $literal: EARLIER } ] } } ), true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Filter and Sort', () =>
	{

		it( 'should filter by date', () =>
		{
			let documents = [ { d: EARLIER }, { d: WHEN }, { d: LATER } ];
			let filtered = jsongin.Filter( documents, { d: { $gte: WHEN } } );
			assert.strictEqual( filtered.length, 2 );
		} );

		it( 'should sort by date', () =>
		{
			let documents = [ { d: LATER }, { d: EARLIER }, { d: WHEN } ];
			jsongin.Sort( documents, { d: 1 } );
			assert.strictEqual( documents[ 0 ].d.getTime(), EARLIER.getTime() );
			assert.strictEqual( documents[ 1 ].d.getTime(), WHEN.getTime() );
			assert.strictEqual( documents[ 2 ].d.getTime(), LATER.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Evaluate', () =>
	{

		it( 'should return a literal date unchanged', () =>
		{
			let result = jsongin.Evaluate( {}, WHEN );
			assert.ok( result instanceof Date );
			assert.strictEqual( result.getTime(), WHEN.getTime() );
		} );

		it( 'should resolve a date field reference', () =>
		{
			let result = jsongin.Evaluate( { when: WHEN }, '$when' );
			assert.ok( result instanceof Date );
			assert.strictEqual( result.getTime(), WHEN.getTime() );
		} );

		it( 'should subtract two dates into milliseconds', () =>
		{
			let result = jsongin.Evaluate( { a: LATER, b: EARLIER }, { $subtract: [ '$a', '$b' ] } );
			assert.strictEqual( result, LATER.getTime() - EARLIER.getTime() );
		} );

		it( 'should add milliseconds to a date', () =>
		{
			let result = jsongin.Evaluate( { a: WHEN }, { $add: [ '$a', 1000 ] } );
			assert.ok( result instanceof Date );
			assert.strictEqual( result.getTime(), WHEN.getTime() + 1000 );
		} );

		it( 'should compare dates within an expression', () =>
		{
			assert.strictEqual( jsongin.Evaluate( { a: LATER, b: EARLIER }, { $gt: [ '$a', '$b' ] } ), true );
			assert.strictEqual( jsongin.Evaluate( { a: WHEN, b: WHEN }, { $eq: [ '$a', '$b' ] } ), true );
		} );

		it( 'should select the smallest and largest date', () =>
		{
			let document = { a: LATER, b: EARLIER, c: WHEN };
			assert.strictEqual( jsongin.Evaluate( document, { $min: [ '$a', '$b', '$c' ] } ).getTime(), EARLIER.getTime() );
			assert.strictEqual( jsongin.Evaluate( document, { $max: [ '$a', '$b', '$c' ] } ).getTime(), LATER.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Document Mechanics', () =>
	{

		it( 'should clone dates by value with SafeClone', () =>
		{
			let clone = jsongin.SafeClone( { when: WHEN } );
			assert.ok( clone.when instanceof Date );
			assert.strictEqual( clone.when.getTime(), WHEN.getTime() );
			assert.notStrictEqual( clone.when, WHEN );
		} );

		it( 'should keep dates through Update', () =>
		{
			// Update clones with SafeClone. It once cloned with Clone, which turned every date
			// in the document into an ISO string.
			let updated = jsongin.Update( { when: WHEN, count: 1 }, { $set: { count: 2 } } );
			assert.strictEqual( updated.count, 2 );
			assert.ok( updated.when instanceof Date );
			assert.strictEqual( updated.when.getTime(), WHEN.getTime() );
		} );

		it( 'should set a date with an update operator', () =>
		{
			let updated = jsongin.Update( { id: 1 }, { $set: { when: WHEN } } );
			assert.ok( updated.when instanceof Date );
			assert.strictEqual( updated.when.getTime(), WHEN.getTime() );
		} );

		it( 'should keep dates through Merge', () =>
		{
			let merged = jsongin.Merge( { when: WHEN }, { id: 1 } );
			assert.ok( merged.when instanceof Date );
			assert.strictEqual( merged.when.getTime(), WHEN.getTime() );
		} );

		it( 'should keep a date as a leaf value when flattening', () =>
		{
			let flattened = jsongin.Flatten( { user: { when: WHEN } } );
			assert.ok( flattened[ 'user.when' ] instanceof Date );
			assert.strictEqual( flattened[ 'user.when' ].getTime(), WHEN.getTime() );
		} );

		it( 'should round trip a date through Flatten and Expand', () =>
		{
			let result = jsongin.Expand( jsongin.Flatten( { user: { when: WHEN } } ) );
			assert.ok( result.user.when instanceof Date );
			assert.strictEqual( result.user.when.getTime(), WHEN.getTime() );
		} );

		it( 'should round trip a date through Hybridize and Unhybridize', () =>
		{
			let result = jsongin.Unhybridize( jsongin.Hybridize( { when: WHEN } ) );
			assert.ok( result.when instanceof Date );
			assert.strictEqual( result.when.getTime(), WHEN.getTime() );
		} );

		it( 'should format a date the way JSON.stringify does', () =>
		{
			assert.ok( jsongin.Format( { when: WHEN } ).includes( WHEN.toISOString() ) );
		} );

		it( 'should not descend into a date when resolving a path', () =>
		{
			// A Date is a value, not a document with fields.
			assert.strictEqual( jsongin.GetValue( { when: WHEN }, 'when.getTime' ), undefined );
			assert.ok( jsongin.GetValue( { when: WHEN }, 'when' ) instanceof Date );
		} );

		it( 'should set a date as a value', () =>
		{
			let document = {};
			jsongin.SetValue( document, 'user.when', WHEN );
			assert.ok( document.user.when instanceof Date );
			assert.strictEqual( document.user.when.getTime(), WHEN.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Projection', () =>
	{

		it( 'should keep a date through an inclusion projection', () =>
		{
			let projected = jsongin.Project( { _id: 1, when: WHEN, name: 'Alice' }, { when: 1 } );
			assert.ok( projected.when instanceof Date );
			assert.strictEqual( projected.when.getTime(), WHEN.getTime() );
		} );

		it( 'should keep a date through an exclusion projection', () =>
		{
			let projected = jsongin.Project( { _id: 1, when: WHEN, name: 'Alice' }, { name: 0 } );
			assert.ok( projected.when instanceof Date );
		} );

		it( 'should compute with a date in a projection', () =>
		{
			let projected = jsongin.Project(
				{ _id: 1, started: EARLIER, ended: WHEN },
				{ elapsed: { $subtract: [ '$ended', '$started' ] } } );
			assert.strictEqual( projected.elapsed, WHEN.getTime() - EARLIER.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Aggregate', () =>
	{

		let documents = [
			{ _id: 1, team: 'a', when: EARLIER },
			{ _id: 2, team: 'a', when: LATER },
			{ _id: 3, team: 'b', when: WHEN },
		];

		it( 'should carry dates through the pass-through stages', () =>
		{
			let result = jsongin.Aggregate( documents, [ { $match: { when: { $gte: WHEN } } }, { $sort: { when: 1 } } ] );
			assert.strictEqual( result.length, 2 );
			assert.ok( result[ 0 ].when instanceof Date );
			assert.strictEqual( result[ 0 ].when.getTime(), WHEN.getTime() );
			assert.strictEqual( result[ 1 ].when.getTime(), LATER.getTime() );
		} );

		it( 'should carry dates through the cloning stages', () =>
		{
			let result = jsongin.Aggregate( documents, [ { $addFields: { copied: '$when' } }, { $project: { when: 1, copied: 1 } } ] );
			assert.ok( result[ 0 ].when instanceof Date );
			assert.ok( result[ 0 ].copied instanceof Date );
			assert.strictEqual( result[ 0 ].copied.getTime(), EARLIER.getTime() );
			// The clone carries the value, not the reference.
			assert.notStrictEqual( result[ 0 ].when, documents[ 0 ].when );
		} );

		it( 'should compute with dates in a pipeline', () =>
		{
			let result = jsongin.Aggregate(
				[ { started: EARLIER, ended: WHEN } ],
				[ { $addFields: { elapsed: { $subtract: [ '$ended', '$started' ] } } } ] );
			assert.strictEqual( result[ 0 ].elapsed, WHEN.getTime() - EARLIER.getTime() );
		} );

		it( 'should accumulate dates', () =>
		{
			let result = jsongin.Aggregate( documents, [
				{ $group: { _id: '$team', first: { $first: '$when' }, earliest: { $min: '$when' }, latest: { $max: '$when' } } },
			] );
			assert.strictEqual( result.length, 2 );
			assert.ok( result[ 0 ].first instanceof Date );
			assert.strictEqual( result[ 0 ].first.getTime(), EARLIER.getTime() );
			assert.strictEqual( result[ 0 ].earliest.getTime(), EARLIER.getTime() );
			assert.strictEqual( result[ 0 ].latest.getTime(), LATER.getTime() );
		} );

		it( 'should group by a date, without confusing it for its ISO string', () =>
		{
			let mixed = [ { when: WHEN }, { when: new Date( WHEN.getTime() ) }, { when: WHEN.toISOString() } ];
			let result = jsongin.Aggregate( mixed, [ { $group: { _id: '$when', count: { $sum: 1 } } } ] );
			assert.strictEqual( result.length, 2 );
			assert.ok( result[ 0 ]._id instanceof Date );
			assert.strictEqual( result[ 0 ].count, 2 );
			assert.strictEqual( typeof result[ 1 ]._id, 'string' );
			assert.strictEqual( result[ 1 ].count, 1 );
		} );

		it( 'should not modify a date in the input documents', () =>
		{
			jsongin.Aggregate( documents, [ { $addFields: { when: LATER } } ] );
			assert.ok( documents[ 0 ].when instanceof Date );
			assert.strictEqual( documents[ 0 ].when.getTime(), EARLIER.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Snapshots', () =>
	{

		it( 'should not report a difference between two equal dates', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { when: WHEN }, { when: new Date( WHEN.getTime() ) } ), {} );
		} );

		it( 'should carry a date into the patch as a date, by value', () =>
		{
			let after = { when: LATER };
			let patch = jsongin.Diff( { when: WHEN }, after );
			assert.ok( patch.$set.when instanceof Date );
			assert.strictEqual( patch.$set.when.getTime(), LATER.getTime() );
			assert.notStrictEqual( patch.$set.when, after.when );
		} );

		it( 'should apply and undo a date change, keeping the type', () =>
		{
			let before = { when: WHEN };
			let patch = jsongin.Diff( before, { when: LATER } );

			let applied = jsongin.Update( before, patch );
			assert.ok( applied.when instanceof Date );
			assert.strictEqual( applied.when.getTime(), LATER.getTime() );

			let undone = jsongin.Update( applied, jsongin.Invert( before, patch ) );
			assert.ok( undone.when instanceof Date );
			assert.strictEqual( undone.when.getTime(), WHEN.getTime() );
		} );

		it( 'should restore a removed date', () =>
		{
			let before = { id: 1, when: WHEN };
			let patch = jsongin.Diff( before, { id: 1 } );
			let undone = jsongin.Update( jsongin.Update( before, patch ), jsongin.Invert( before, patch ) );
			assert.ok( undone.when instanceof Date );
			assert.strictEqual( undone.when.getTime(), WHEN.getTime() );
		} );

		it( 'should not modify a date in either document', () =>
		{
			let before = { when: WHEN };
			jsongin.Diff( before, { when: LATER } );
			assert.ok( before.when instanceof Date );
			assert.strictEqual( before.when.getTime(), WHEN.getTime() );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Known Conversions', () =>
	{

		/*
			These functions convert a date rather than carrying it. Each is asserted here so
			that the conversion is a recorded decision rather than an unnoticed defect.
		*/

		it( 'should convert a date to a string with Clone, which uses stringify and parse', () =>
		{
			// This is inherent to Clone's documented approach. Use SafeClone to keep dates.
			let clone = jsongin.Clone( { when: WHEN } );
			assert.strictEqual( typeof clone.when, 'string' );
			assert.strictEqual( clone.when, WHEN.toISOString() );
		} );

		it( 'should format a date as an ISO string, which Parse reads back as a string', () =>
		{
			// Format matches JSON.stringify, so the Format/Parse round trip does not restore
			// the Date type, exactly as JSON.stringify/JSON.parse does not.
			// Use Hybridize/Unhybridize when the round trip must preserve the type.
			let text = jsongin.Format( { when: WHEN } );
			assert.ok( text.includes( WHEN.toISOString() ) );

			let parsed = jsongin.Parse( text );
			assert.strictEqual( typeof parsed.when, 'string' );
			assert.strictEqual( parsed.when, WHEN.toISOString() );

			let round_tripped = jsongin.Unhybridize( jsongin.Hybridize( { when: WHEN } ) );
			assert.ok( round_tripped.when instanceof Date );
		} );

	} );


} );
