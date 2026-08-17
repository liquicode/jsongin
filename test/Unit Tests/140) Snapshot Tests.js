'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
		Explain: false,
	} );

const WHEN = new Date( 1700000000000 );
const LATER = new Date( 1800000000000 );


//---------------------------------------------------------------------
// Asserts that two documents hold the same content.
// StrictEquals is not used for this, because it is sensitive to key order and a patch cannot
// reposition a key: a field which is removed and re-added lands at the end of its object.
// An empty Diff is the exact statement wanted here. It ignores key order and still compares
// leaf values strictly.
function assert_same_content( Actual, Expected, Message )
{
	let difference = jsongin.Diff( Actual, Expected );
	assert.deepStrictEqual( difference, {}, `${Message}: ${jsongin.Format( difference )}` );
}


describe( '140) Snapshot Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Diff Tests', () =>
	{

		it( 'should return an empty patch for identical documents', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: 1 } ), {} );
			assert.deepStrictEqual( jsongin.Diff( {}, {} ), {} );
		} );

		it( 'should ignore key order', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1, b: 2 }, { b: 2, a: 1 } ), {} );
		} );

		it( 'should set a changed field', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: 2 } ), { $set: { a: 2 } } );
		} );

		it( 'should set an added field', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: 1, b: 2 } ), { $set: { b: 2 } } );
		} );

		it( 'should unset a removed field', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1, b: 2 }, { a: 1 } ), { $unset: { b: '' } } );
		} );

		it( 'should describe a change at the deepest path which changed', () =>
		{
			let before = { user: { name: 'Alice', role: 'admin' } };
			let after = { user: { name: 'Alice', role: 'user' } };
			assert.deepStrictEqual( jsongin.Diff( before, after ), { $set: { 'user.role': 'user' } } );
		} );

		it( 'should describe several changes at once', () =>
		{
			let before = { a: 1, b: 2, n: { x: 1 } };
			let after = { a: 9, n: { x: 1, y: 2 }, c: 3 };
			assert.deepStrictEqual( jsongin.Diff( before, after ),
				{
					$set: { a: 9, 'n.y': 2, c: 3 },
					$unset: { b: '' },
				} );
		} );

		it( 'should not distinguish a key holding undefined from a missing key', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1, b: undefined }, { a: 1 } ), {} );
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: 1, b: undefined } ), {} );
		} );

		it( 'should set a field which changed to null', () =>
		{
			// Null is a value. Only a missing field is an absence.
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: null } ), { $set: { a: null } } );
			assert.deepStrictEqual( jsongin.Diff( { a: null }, { a: 1 } ), { $set: { a: 1 } } );
		} );

		it( 'should not confuse values of different types', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: 1 }, { a: '1' } ), { $set: { a: '1' } } );
			assert.deepStrictEqual( jsongin.Diff( { a: 0 }, { a: false } ), { $set: { a: false } } );
		} );

		it( 'should throw when either parameter is not an object', () =>
		{
			assert.throws( function () { jsongin.Diff( [ 1 ], {} ); }, /Before must be an object/ );
			assert.throws( function () { jsongin.Diff( {}, 'abc' ); }, /After must be an object/ );
			assert.throws( function () { jsongin.Diff( null, {} ); }, /Before must be an object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Diff Array Tests', () =>
	{

		/*
			Arrays are atomic. A change anywhere inside an array replaces the whole array.
			Describing an array element-wise would need a way to shorten an array, which the
			update operators cannot express.
		*/

		it( 'should replace an array whose element changed', () =>
		{
			assert.deepStrictEqual(
				jsongin.Diff( { t: [ 'a', 'b', 'c' ] }, { t: [ 'a', 'z', 'c' ] } ),
				{ $set: { t: [ 'a', 'z', 'c' ] } } );
		} );

		it( 'should replace an array which grew', () =>
		{
			assert.deepStrictEqual(
				jsongin.Diff( { t: [ 'a' ] }, { t: [ 'a', 'b' ] } ),
				{ $set: { t: [ 'a', 'b' ] } } );
		} );

		it( 'should replace an array which shrank', () =>
		{
			assert.deepStrictEqual(
				jsongin.Diff( { t: [ 'a', 'b', 'c' ] }, { t: [ 'a' ] } ),
				{ $set: { t: [ 'a' ] } } );
		} );

		it( 'should emit nothing for an unchanged array', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { t: [ 1, { a: 2 } ] }, { t: [ 1, { a: 2 } ] } ), {} );
		} );

		it( 'should treat element order as a change', () =>
		{
			assert.deepStrictEqual(
				jsongin.Diff( { t: [ 'a', 'b' ] }, { t: [ 'b', 'a' ] } ),
				{ $set: { t: [ 'b', 'a' ] } } );
		} );

		it( 'should not alias the array it emits', () =>
		{
			let after = { t: [ 1, 2 ] };
			let patch = jsongin.Diff( { t: [ 1 ] }, after );
			assert.notStrictEqual( patch.$set.t, after.t );
			assert.deepStrictEqual( patch.$set.t, [ 1, 2 ] );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Diff Object Tests', () =>
	{

		it( 'should set a whole object which was added', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( {}, { a: { b: 1 } } ), { $set: { a: { b: 1 } } } );
		} );

		it( 'should set an empty object which was added', () =>
		{
			// Flatten drops empty objects, which is why Diff does not use it.
			assert.deepStrictEqual( jsongin.Diff( {}, { a: {} } ), { $set: { a: {} } } );
		} );

		it( 'should unset the keys of an object which was emptied, leaving the object', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: { x: 1 } }, { a: {} } ), { $unset: { 'a.x': '' } } );
		} );

		it( 'should unset a whole object which was removed', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: { x: 1 } }, {} ), { $unset: { a: '' } } );
		} );

		it( 'should set the whole value when the type changed', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { a: { x: 1 } }, { a: 5 } ), { $set: { a: 5 } } );
			assert.deepStrictEqual( jsongin.Diff( { a: 5 }, { a: { x: 1 } } ), { $set: { a: { x: 1 } } } );
			assert.deepStrictEqual( jsongin.Diff( { a: { x: 1 } }, { a: [ 1 ] } ), { $set: { a: [ 1 ] } } );
		} );

		it( 'should not alias the object it emits', () =>
		{
			let after = { a: { b: 1 } };
			let patch = jsongin.Diff( {}, after );
			assert.notStrictEqual( patch.$set.a, after.a );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Diff Date Tests', () =>
	{

		it( 'should emit nothing for two equal dates', () =>
		{
			assert.deepStrictEqual( jsongin.Diff( { d: WHEN }, { d: new Date( WHEN.getTime() ) } ), {} );
		} );

		it( 'should set a changed date', () =>
		{
			let patch = jsongin.Diff( { d: WHEN }, { d: LATER } );
			assert.ok( patch.$set.d instanceof Date );
			assert.strictEqual( patch.$set.d.getTime(), LATER.getTime() );
		} );

		it( 'should clone the date it emits', () =>
		{
			let after = { d: LATER };
			let patch = jsongin.Diff( { d: WHEN }, after );
			assert.notStrictEqual( patch.$set.d, after.d );
		} );

		it( 'should not confuse a date with its ISO string', () =>
		{
			let patch = jsongin.Diff( { d: WHEN }, { d: WHEN.toISOString() } );
			assert.strictEqual( typeof patch.$set.d, 'string' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Invert Tests', () =>
	{

		it( 'should undo a changed field', () =>
		{
			let before = { a: 1 };
			let patch = { $set: { a: 2 } };
			assert.deepStrictEqual( jsongin.Invert( before, patch ), { $set: { a: 1 } } );
		} );

		it( 'should undo an added field by unsetting it', () =>
		{
			let before = { a: 1 };
			let patch = { $set: { b: 2 } };
			assert.deepStrictEqual( jsongin.Invert( before, patch ), { $unset: { b: '' } } );
		} );

		it( 'should undo a removed field by setting it back', () =>
		{
			let before = { a: 1, b: 2 };
			let patch = { $unset: { b: '' } };
			assert.deepStrictEqual( jsongin.Invert( before, patch ), { $set: { b: 2 } } );
		} );

		it( 'should return an empty patch when the patch changed nothing', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { a: 1 }, { $set: { a: 1 } } ), {} );
			assert.deepStrictEqual( jsongin.Invert( { a: 1 }, {} ), {} );
			assert.deepStrictEqual( jsongin.Invert( { a: 1 }, { $unset: { nope: '' } } ), {} );
		} );

		it( 'should undo a nested change', () =>
		{
			let before = { n: { x: 1, y: 2 } };
			let patch = { $set: { 'n.x': 9 }, $unset: { 'n.y': '' } };
			assert.deepStrictEqual( jsongin.Invert( before, patch ), { $set: { 'n.x': 1, 'n.y': 2 } } );
		} );

		it( 'should throw when Before is not an object', () =>
		{
			assert.throws( function () { jsongin.Invert( 'abc', {} ); }, /Before must be an object/ );
		} );

		it( 'should throw when the patch is not a valid update document', () =>
		{
			assert.throws( function () { jsongin.Invert( { a: 1 }, 'abc' ); }, /not a valid update document/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Invert Tests: patches which Diff did not write', () =>
	{

		/*
			Invert applies the patch and diffs the result back toward the original, so it never
			inspects the operators in the patch. Every update operator inverts, not only the
			$set and $unset which Diff emits.
		*/

		it( 'should undo $inc', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { n: 5 }, { $inc: { n: 3 } } ), { $set: { n: 5 } } );
		} );

		it( 'should undo $mul', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { n: 5 }, { $mul: { n: 4 } } ), { $set: { n: 5 } } );
		} );

		it( 'should undo $push', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { t: [ 'a' ] }, { $push: { t: 'b' } } ), { $set: { t: [ 'a' ] } } );
		} );

		it( 'should undo $pop', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { t: [ 'a', 'b' ] }, { $pop: { t: 1 } } ), { $set: { t: [ 'a', 'b' ] } } );
		} );

		it( 'should undo $rename', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { a: 1 }, { $rename: { a: 'b' } } ),
				{ $set: { a: 1 }, $unset: { b: '' } } );
		} );

		it( 'should undo $min and $max', () =>
		{
			assert.deepStrictEqual( jsongin.Invert( { hp: 5 }, { $max: { hp: 9 } } ), { $set: { hp: 5 } } );
			assert.deepStrictEqual( jsongin.Invert( { hp: 5 }, { $min: { hp: 0 } } ), { $set: { hp: 5 } } );
		} );

		it( 'should undo several operators at once', () =>
		{
			let before = { hp: 5, tags: [ 'a' ], gone: 1 };
			let patch = { $inc: { hp: -2 }, $push: { tags: 'b' }, $unset: { gone: '' } };
			let inverse = jsongin.Invert( before, patch );
			assert_same_content( jsongin.Update( jsongin.Update( before, patch ), inverse ), before, 'undo' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Round Trip Properties', () =>
	{

		/*
			One corpus, exercising both properties for every pair:
				Update( A, Diff( A, B ) )                     holds the content of B
				Update( Update( A, P ), Invert( A, P ) )      holds the content of A
		*/

		let pairs = [
			{ name: 'no change', a: { x: 1 }, b: { x: 1 } },
			{ name: 'scalar change', a: { x: 1 }, b: { x: 2 } },
			{ name: 'field added', a: { x: 1 }, b: { x: 1, y: 2 } },
			{ name: 'field removed', a: { x: 1, y: 2 }, b: { x: 1 } },
			{ name: 'nested change', a: { n: { x: 1, y: 2 } }, b: { n: { x: 9, y: 2 } } },
			{ name: 'nested removal', a: { n: { x: 1, y: 2 } }, b: { n: { y: 2 } } },
			{ name: 'object emptied', a: { n: { x: 1 } }, b: { n: {} } },
			{ name: 'object filled', a: { n: {} }, b: { n: { x: 1 } } },
			{ name: 'object removed', a: { n: { x: 1 } }, b: {} },
			{ name: 'type change', a: { v: { x: 1 } }, b: { v: 'scalar' } },
			{ name: 'null introduced', a: { v: 1 }, b: { v: null } },
			{ name: 'array changed', a: { t: [ 1, 2, 3 ] }, b: { t: [ 1, 9 ] } },
			{ name: 'array emptied', a: { t: [ 1, 2 ] }, b: { t: [] } },
			{ name: 'array of objects', a: { t: [ { k: 1 } ] }, b: { t: [ { k: 1 }, { k: 2 } ] } },
			{ name: 'dates', a: { d: WHEN, n: 1 }, b: { d: LATER, n: 1 } },
			{ name: 'date removed', a: { d: WHEN }, b: {} },
			{ name: 'deeply nested', a: { a: { b: { c: { d: 1 } } } }, b: { a: { b: { c: { d: 2, e: 3 } } } } },
			{ name: 'nothing in common', a: { a: 1, b: 2 }, b: { c: 3, d: 4 } },
			{ name: 'empty to full', a: {}, b: { a: 1, n: { x: 1 }, t: [ 1 ] } },
			{ name: 'full to empty', a: { a: 1, n: { x: 1 }, t: [ 1 ] }, b: {} },
		];

		for ( let index = 0; index < pairs.length; index++ )
		{
			let pair = pairs[ index ];

			it( `should round trip: ${pair.name}`, () =>
			{
				let patch = jsongin.Diff( pair.a, pair.b );
				let applied = jsongin.Update( pair.a, patch );
				assert_same_content( applied, pair.b, 'apply' );

				let inverse = jsongin.Invert( pair.a, patch );
				let undone = jsongin.Update( applied, inverse );
				assert_same_content( undone, pair.a, 'undo' );
			} );
		}

		it( 'should leave a real Date in place through a round trip', () =>
		{
			let a = { d: WHEN, n: 1 };
			let b = { d: LATER, n: 1 };
			let patch = jsongin.Diff( a, b );
			let applied = jsongin.Update( a, patch );
			assert.ok( applied.d instanceof Date );
			assert.strictEqual( applied.d.getTime(), LATER.getTime() );

			let undone = jsongin.Update( applied, jsongin.Invert( a, patch ) );
			assert.ok( undone.d instanceof Date );
			assert.strictEqual( undone.d.getTime(), WHEN.getTime() );
		} );

		it( 'should remove the key of an unset field, not merely blank it', () =>
		{
			let applied = jsongin.Update( { a: 1, b: 2 }, jsongin.Diff( { a: 1, b: 2 }, { a: 1 } ) );
			assert.deepStrictEqual( Object.keys( applied ), [ 'a' ] );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Immutability', () =>
	{

		it( 'should not modify either document given to Diff', () =>
		{
			let before = { a: 1, n: { x: 1 }, t: [ 1 ], d: WHEN };
			let after = { a: 2, n: {}, t: [ 1, 2 ] };
			let before_text = jsongin.Format( before );
			let after_text = jsongin.Format( after );

			jsongin.Diff( before, after );

			assert.strictEqual( jsongin.Format( before ), before_text );
			assert.strictEqual( jsongin.Format( after ), after_text );
			assert.ok( before.d instanceof Date );
		} );

		it( 'should not modify the document given to Invert', () =>
		{
			let before = { a: 1, n: { x: 1 }, d: WHEN };
			let before_text = jsongin.Format( before );

			jsongin.Invert( before, { $set: { a: 9 }, $unset: { 'n.x': '' } } );

			assert.strictEqual( jsongin.Format( before ), before_text );
			assert.ok( before.d instanceof Date );
		} );

		it( 'should not alias the documents it was given', () =>
		{
			let after = { n: { x: 1 } };
			let patch = jsongin.Diff( {}, after );
			patch.$set.n.x = 99;
			assert.strictEqual( after.n.x, 1 );
		} );

	} );


} );
