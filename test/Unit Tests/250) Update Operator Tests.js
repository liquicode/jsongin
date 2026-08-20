'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
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

			/*
				Update() clones the document, but the values come from the update document.
				Storing one as-is left the result sharing structure with the caller's $set.
			*/

			it( 'should not alias the update document', () =>
			{
				let updates = { $set: { obj: { n: 1 } } };
				let updated = jsongin.Update( {}, updates );
				updated.obj.n = 999;
				assert.strictEqual( updates.$set.obj.n, 1 );
			} );

			it( 'should apply the same update document twice independently', () =>
			{
				let updates = { $set: { obj: { n: 1 } } };
				let first = jsongin.Update( {}, updates );
				let second = jsongin.Update( {}, updates );
				first.obj.n = 999;
				assert.strictEqual( second.obj.n, 1 );
			} );

			it( 'should store a date as a date', () =>
			{
				let updated = jsongin.Update( {}, { $set: { when: new Date( 1000 ) } } );
				assert.ok( updated.when instanceof Date );
				assert.strictEqual( updated.when.getTime(), 1000 );
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

			/*
				Deciding whether a path addresses an array element is a jsongin path question,
				not a MongoDB one, so it is pinned here rather than in the parity suite.
				The array element case is the one which writes a null instead of removing a key,
				and everything below is a path which only looks like it.
			*/

			it( 'should null an array element rather than leaving a hole', () =>
			{
				// The array keeps its length and the elements after the removed one keep their
				// positions. Verified against MongoDB 6.0.1.
				let document = { a: [ 1, 2, 3 ] };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.1': '' } ) );
				assert.deepStrictEqual( document.a, [ 1, null, 3 ] );
			} );

			it( 'should leave an array alone for a negative index', () =>
			{
				// A negative index is not an index. MongoDB reads '-1' as a field name, which
				// an array does not have, so $unset of 'a.-1' changes nothing and still
				// reports a successful update. Verified against MongoDB 6.0.1.
				let document = { a: [ 1, 2, 3 ] };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.-1': '' } ) );
				assert.deepStrictEqual( document.a, [ 1, 2, 3 ] );
			} );

			it( 'should null an element of an array reached through an index', () =>
			{
				let document = { a: [ [ 1, 2 ], [ 3, 4 ] ] };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.1.0': '' } ) );
				assert.deepStrictEqual( document.a, [ [ 1, 2 ], [ null, 4 ] ] );
			} );

			it( 'should remove a numeric key from an object rather than nulling it', () =>
			{
				// A document field may legitimately be named '1'. Only an array element becomes
				// a null, so the parent has to be an array and not merely the key numeric.
				let document = { a: { 1: 'x', 2: 'y' } };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.1': '' } ) );
				assert.deepStrictEqual( document.a, { 2: 'y' } );
			} );

			it( 'should leave an array alone for an index which is out of range', () =>
			{
				let document = { a: [ 1, 2, 3 ] };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.9': '', 'a.-9': '' } ) );
				assert.deepStrictEqual( document.a, [ 1, 2, 3 ] );
			} );

			it( 'should leave the document alone for a path which runs below a scalar', () =>
			{
				let document = { a: 5 };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.0': '' } ) );
				assert.deepStrictEqual( document, { a: 5 } );
			} );

			it( 'should not reach into an array by field name to find an element', () =>
			{
				// 'a.x.0' crosses the array by the field name x, which DeleteValue refuses by
				// default. The element case must refuse it too rather than writing into the
				// array GetValue would have gathered.
				let document = { a: [ { x: [ 1, 2 ] } ] };
				jsongin.UpdateOperators.$unset.Update( document, { 'a.x.0': '' } );
				assert.deepStrictEqual( document, { a: [ { x: [ 1, 2 ] } ] } );
			} );


			it( 'should leave an array alone for a negative index part way along the path', () =>
			{
				// The rule holds wherever the negative index appears, not only at the end.
				let document = { a: [ [ 1, 2 ], [ 3, 4 ] ] };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { 'a.-1.0': '' } ) );
				assert.deepStrictEqual( document.a, [ [ 1, 2 ], [ 3, 4 ] ] );
			} );

			it( 'should leave the document alone for an empty path', () =>
			{
				let document = { a: 1 };
				assert.ok( jsongin.UpdateOperators.$unset.Update( document, { '': '' } ) );
				assert.deepStrictEqual( document, { a: 1 } );
			} );


		} );


		describe( '$bit Tests', () =>
		{

			// Called directly rather than through Update(), which refuses an empty path
			// before any operator sees it. What is asserted here is the operator's own
			// contract: it reports a write it could not make by returning false, and
			// Update() is what turns that into a refusal.
			it( 'should report a write it could not make', () =>
			{
				let document = { a: 1 };
				assert.strictEqual( jsongin.UpdateOperators.$bit.Update( document, { '': { or: 1 } } ), false );
				assert.deepStrictEqual( document, { a: 1 } );
			} );

		} );


		describe( '$rename Tests', () =>
		{

			it( 'should leave a source field which is not there alone', () =>
			{
				// The target field is not created, and the update is a successful no-op rather
				// than a failure. Verified against MongoDB 6.0.1.
				let messages = [];
				let engine = require( '../../src/jsongin' ).NewJsongin( {
					OpLog: function ( Message ) { messages.push( Message ); },
				} );

				let document = { b: 1 };
				assert.ok( engine.UpdateOperators.$rename.Update( document, { a: 'c' } ) );
				assert.deepStrictEqual( document, { b: 1 } );
				assert.ok( messages.length > 0 );
				assert.ok( messages[ messages.length - 1 ].startsWith( 'Update.$rename: ' ) );
			} );

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


		describe( '$inc and $mul Refusal Tests', () =>
		{

			/*
				That these updates are refused at all is a MongoDB behavior, and it is asserted
				in the parity suite. How jsongin reports the refusal is a jsongin behavior, and
				it is asserted here: the document is returned untouched and the reason is
				written to the OpLog.
			*/

			const NewJsongin = require( '../../src/jsongin' ).NewJsongin;

			function logging_engine( Messages )
			{
				return NewJsongin( {
					OpLog: function ( Message ) { Messages.push( Message ); },
				} );
			}

			function assert_refused( Operator, Document, UpdateFields )
			{
				let messages = [];
				let engine = logging_engine( messages );
				let before = JSON.stringify( Document );

				let result = engine.UpdateOperators[ Operator ].Update( Document, UpdateFields );

				assert.strictEqual( result, false );
				assert.strictEqual( JSON.stringify( Document ), before );
				assert.ok( messages.length > 0, `${Operator} logged nothing.` );
				assert.ok( messages[ messages.length - 1 ].startsWith( `Update.${Operator}: ` ),
					`${Operator} logged [${messages[ messages.length - 1 ]}].` );
			}

			it( 'should refuse a field which is not numeric', () =>
			{
				assert_refused( '$inc', { n: 'abc' }, { n: 1 } );
				assert_refused( '$inc', { n: true }, { n: 1 } );
				assert_refused( '$inc', { n: null }, { n: 1 } );
				assert_refused( '$mul', { n: 'abc' }, { n: 2 } );
			} );

			it( 'should refuse an operand which is not numeric', () =>
			{
				// AsNumber would convert the string, which is the right contract for AsNumber
				// and the wrong one here.
				assert_refused( '$inc', { n: 1 }, { n: '5' } );
				assert_refused( '$inc', { n: 1 }, { n: true } );
				assert_refused( '$mul', { n: 1 }, { n: '5' } );
			} );

			it( 'should refuse the whole update when one field of several is bad', () =>
			{
				// The document is checked before it is written, so a good field named ahead of
				// a bad one is not applied and then abandoned.
				assert_refused( '$inc', { a: 1, b: 'abc' }, { a: 1, b: 1 } );
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

			// Every case below was measured against MongoDB 6.0.1. $min and $max are not
			// numeric operators: they compare by the BSON ordering, which is what
			// CompareValues implements.

			it( 'should set a field which is not there', () =>
			{
				assert.deepStrictEqual( jsongin.Update( {}, { $min: { n: 5 } } ), { n: 5 } );
				assert.deepStrictEqual( jsongin.Update( { a: {} }, { $min: { 'a.b': 7 } } ), { a: { b: 7 } } );
			} );

			it( 'should compare strings', () =>
			{
				assert.deepStrictEqual( jsongin.Update( { s: 'xyz' }, { $min: { s: 'abc' } } ), { s: 'abc' } );
				assert.deepStrictEqual( jsongin.Update( { s: 'abc' }, { $min: { s: 'xyz' } } ), { s: 'abc' } );
			} );

			it( 'should compare dates', () =>
			{
				let result = jsongin.Update( { d: new Date( 100000 ) }, { $min: { d: new Date( 0 ) } } );
				assert.strictEqual( result.d.getTime(), 0 );
			} );

			it( 'should compare booleans', () =>
			{
				assert.deepStrictEqual( jsongin.Update( { b: true }, { $min: { b: false } } ), { b: false } );
			} );

			it( 'should treat null as lower than any number', () =>
			{
				// null sorts below numbers in the BSON ordering, so it wins a $min.
				assert.deepStrictEqual( jsongin.Update( { n: 5 }, { $min: { n: null } } ), { n: null } );
				assert.deepStrictEqual( jsongin.Update( { n: null }, { $min: { n: 5 } } ), { n: null } );
			} );

			it( 'should compare across types by the BSON ordering', () =>
			{
				// A number sorts below a string, so the number is the minimum.
				assert.deepStrictEqual( jsongin.Update( { n: 5 }, { $min: { n: 'abc' } } ), { n: 5 } );
				// A number sorts below an array and below an object.
				assert.deepStrictEqual( jsongin.Update( { a: [ 3, 1 ] }, { $min: { a: 0 } } ), { a: 0 } );
				assert.deepStrictEqual( jsongin.Update( { o: { z: 1 } }, { $min: { o: 0 } } ), { o: 0 } );
			} );

			it( 'should reject a path which reaches into an array', () =>
			{
				// MongoDB rejects this whether or not the value would have changed.
				assert.throws( function () { jsongin.Update( { a: [ { x: 1 }, { x: 2 } ] }, { $min: { 'a.x': 0 } } ); }, /Cannot create field/ );
				assert.throws( function () { jsongin.Update( { a: [ { x: 1 }, { x: 2 } ] }, { $min: { 'a.x': 9 } } ); }, /Cannot create field/ );
			} );

			it( 'should not alias the update specification', () =>
			{
				let specification = { $min: { o: { n: 1 } } };
				let result = jsongin.Update( {}, specification );
				result.o.n = 999;
				assert.strictEqual( specification.$min.o.n, 1 );
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

			// The mirror of the $min cases above, measured against MongoDB 6.0.1.

			it( 'should set a field which is not there', () =>
			{
				assert.deepStrictEqual( jsongin.Update( {}, { $max: { n: 5 } } ), { n: 5 } );
			} );

			it( 'should compare strings', () =>
			{
				assert.deepStrictEqual( jsongin.Update( { s: 'abc' }, { $max: { s: 'xyz' } } ), { s: 'xyz' } );
				assert.deepStrictEqual( jsongin.Update( { s: 'xyz' }, { $max: { s: 'abc' } } ), { s: 'xyz' } );
			} );

			it( 'should compare dates', () =>
			{
				let result = jsongin.Update( { d: new Date( 0 ) }, { $max: { d: new Date( 100000 ) } } );
				assert.strictEqual( result.d.getTime(), 100000 );
			} );

			it( 'should treat null as lower than any number', () =>
			{
				assert.deepStrictEqual( jsongin.Update( { n: null }, { $max: { n: 5 } } ), { n: 5 } );
			} );

			it( 'should compare across types by the BSON ordering', () =>
			{
				// A string sorts above a number, so the string is the maximum.
				assert.deepStrictEqual( jsongin.Update( { n: 5 }, { $max: { n: 'abc' } } ), { n: 'abc' } );
				// An array sorts above a number, so the array stays.
				assert.deepStrictEqual( jsongin.Update( { a: [ 3, 1 ] }, { $max: { a: 0 } } ), { a: [ 3, 1 ] } );
			} );

			it( 'should reject a path which reaches into an array', () =>
			{
				assert.throws( function () { jsongin.Update( { a: [ { x: 1 }, { x: 2 } ] }, { $max: { 'a.x': 9 } } ); }, /Cannot create field/ );
				assert.throws( function () { jsongin.Update( { a: [ { x: 1 }, { x: 2 } ] }, { $max: { 'a.x': 0 } } ); }, /Cannot create field/ );
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

				// true and { $type: 'date' } store a Date. { $type: 'timestamp' } stores a
				// number, because jsongin has no BSON Timestamp type.
				assert.ok( document.a instanceof Date );
				assert.strictEqual( typeof document.b, 'number' );
				assert.ok( document.c instanceof Date );

				// Every field named in one operation receives the same moment in time.
				assert.strictEqual( document.a.getTime(), document.b );
				assert.strictEqual( document.c.getTime(), document.b );
			} );

			it( 'should set the current date for nested values', () =>
			{
				let document = { nest: { a: 1, b: 2, c: 3 } };
				let result = jsongin.UpdateOperators.$currentDate.Update( document, { 'nest.a': true, 'nest.b': { $type: 'timestamp' }, 'nest.c': { $type: 'date' } } );
				assert.ok( result );

				assert.ok( document.nest.a instanceof Date );
				assert.strictEqual( typeof document.nest.b, 'number' );
				assert.ok( document.nest.c instanceof Date );

				assert.strictEqual( document.nest.a.getTime(), document.nest.b );
				assert.strictEqual( document.nest.c.getTime(), document.nest.b );
			} );

			it( 'should give each field its own Date rather than a shared one', () =>
			{
				let document = {};
				jsongin.UpdateOperators.$currentDate.Update( document, { a: true, c: { $type: 'date' } } );

				assert.notStrictEqual( document.a, document.c );
				document.a.setFullYear( 1999 );
				assert.notStrictEqual( document.c.getFullYear(), 1999 );
			} );

			it( 'should store a value which answers to a date query', () =>
			{
				let document = jsongin.Update( {}, { $currentDate: { when: { $type: 'date' } } } );
				assert.strictEqual( jsongin.Query( document, { when: { $type: 'date' } } ), true );
				assert.ok( document.when instanceof Date );
			} );

			/*
				An invalid date specification used to fall through without writing the field,
				without logging, and while still reporting success.
			*/

			it( 'should report an invalid date specification and fail', () =>
			{
				let cases = [ {}, { $type: 5 }, { $type: 'nonsense' }, { type: 'date' }, false, 0, 'timestamp', null ];
				for ( let index = 0; index < cases.length; index++ )
				{
					let messages = [];
					let engine = require( '../../src/jsongin' ).NewJsongin( {
						OpLog: function ( Message ) { messages.push( Message ); },
					} );

					let document = { d: 'untouched' };
					let result = engine.UpdateOperators.$currentDate.Update( document, { d: cases[ index ] } );

					assert.strictEqual( result, false,
						`$currentDate reported success for [${JSON.stringify( cases[ index ] )}].` );
					assert.strictEqual( document.d, 'untouched',
						`$currentDate wrote the field for [${JSON.stringify( cases[ index ] )}].` );
					assert.strictEqual( messages.length, 1,
						`$currentDate logged nothing for [${JSON.stringify( cases[ index ] )}].` );
					assert.ok( messages[ 0 ].startsWith( 'Update.$currentDate: ' ) );
				}
			} );

			it( 'should apply the valid fields even when another one is invalid', () =>
			{
				let document = {};
				let result = jsongin.UpdateOperators.$currentDate.Update( document, { good: true, bad: {} } );
				assert.strictEqual( result, false );
				assert.ok( document.good instanceof Date );
				assert.strictEqual( typeof document.bad, 'undefined' );
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

			it( 'should compare values by content rather than by reference', () =>
			{
				// Array.includes() compares objects, arrays, and dates by reference, so these
				// were appended again on every call no matter what they contained.
				let document = { a: [ { id: 1 } ] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: { id: 1 } } );
				assert.deepStrictEqual( document, { a: [ { id: 1 } ] } );

				document = { a: [ [ 1, 2 ] ] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: [ 1, 2 ] } );
				assert.deepStrictEqual( document, { a: [ [ 1, 2 ] ] } );

				document = { a: [ new Date( 0 ) ] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: new Date( 0 ) } );
				assert.strictEqual( document.a.length, 1 );
			} );

			it( 'should still add a value which differs in content', () =>
			{
				let document = { a: [ { id: 1 } ] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: { id: 2 } } );
				assert.deepStrictEqual( document, { a: [ { id: 1 }, { id: 2 } ] } );
			} );

			it( 'should compare strictly, without type coercion', () =>
			{
				let document = { a: [ 1, 0 ] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: '1' } );
				jsongin.UpdateOperators.$addToSet.Update( document, { a: false } );
				assert.deepStrictEqual( document, { a: [ 1, 0, '1', false ] } );
			} );

			it( 'should be idempotent', () =>
			{
				let document = { a: [ { id: 1 } ] };
				for ( let index = 0; index < 3; index++ )
				{
					jsongin.UpdateOperators.$addToSet.Update( document, { a: { id: 1 } } );
				}
				assert.deepStrictEqual( document, { a: [ { id: 1 } ] } );
			} );

			it( 'should store a copy rather than the value it was given', () =>
			{
				let value = { id: 1 };
				let document = { a: [] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: value } );
				assert.notStrictEqual( document.a[ 0 ], value );
				assert.deepStrictEqual( document.a[ 0 ], value );

				// A date must survive as a date.
				document = { a: [] };
				jsongin.UpdateOperators.$addToSet.Update( document, { a: new Date( 0 ) } );
				assert.ok( document.a[ 0 ] instanceof Date );
			} );

			/*
				$each was not implemented, and was not rejected either: the modifier document
				was added to the set as a literal value.
			*/

			function added( Array_, Specification )
			{
				return jsongin.Update( { a: Array_ }, { $addToSet: { a: Specification } } ).a;
			}

			it( 'should add every new element of $each', () =>
			{
				assert.deepStrictEqual( added( [ 1, 2 ], { $each: [ 2, 3, 4 ] } ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( added( [ 1 ], { $each: [] } ), [ 1 ] );
			} );

			it( 'should not add a value repeated within one $each', () =>
			{
				assert.deepStrictEqual( added( [], { $each: [ 1, 1, 2 ] } ), [ 1, 2 ] );
			} );

			it( 'should test the elements of $each by content', () =>
			{
				assert.deepStrictEqual( added( [ { n: 1 } ], { $each: [ { n: 1 }, { n: 2 } ] } ),
					[ { n: 1 }, { n: 2 } ] );
			} );

			it( 'should treat an object with no $each as a single value', () =>
			{
				assert.deepStrictEqual( added( [], { n: 1, x: 2 } ), [ { n: 1, x: 2 } ] );
			} );

			it( 'should reject a $each which is not an array', () =>
			{
				let messages = [];
				let engine = jsongin.NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );
				let document = { a: [ 1 ] };

				let result = engine.UpdateOperators.$addToSet.Update( document, { a: { $each: 5 } } );

				assert.strictEqual( result, false );
				assert.deepStrictEqual( document.a, [ 1 ] );
				assert.ok( messages.length > 0 );
			} );

			it( 'should not alias the update document through $each', () =>
			{
				let updates = { $addToSet: { a: { $each: [ { n: 1 } ] } } };
				let updated = jsongin.Update( { a: [] }, updates );
				updated.a[ 0 ].n = 999;
				assert.strictEqual( updates.$addToSet.a.$each[ 0 ].n, 1 );
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

			// The pushed element used to be the very object written in the update document.
			it( 'should not alias the update document', () =>
			{
				let updates = { $push: { list: { n: 1 } } };
				let updated = jsongin.Update( { list: [] }, updates );
				updated.list[ 0 ].n = 999;
				assert.strictEqual( updates.$push.list.n, 1 );
			} );

			it( 'should push a date as a date', () =>
			{
				let updated = jsongin.Update( { list: [] }, { $push: { list: new Date( 1000 ) } } );
				assert.ok( updated.list[ 0 ] instanceof Date );
				assert.strictEqual( updated.list[ 0 ].getTime(), 1000 );
			} );

			/*
				The modifiers were not implemented, and were not rejected either: a modifier
				document was stored as a literal array element, so { $each: [ 3, 4 ] } appended
				the object { $each: [ 3, 4 ] } rather than 3 and 4.
			*/

			function pushed( Array_, Specification )
			{
				return jsongin.Update( { a: Array_ }, { $push: { a: Specification } } ).a;
			}

			it( 'should treat an object with no $each as a single value', () =>
			{
				assert.deepStrictEqual( pushed( [], { n: 1, x: 2 } ), [ { n: 1, x: 2 } ] );
			} );

			it( 'should push every element of $each', () =>
			{
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 3, 4 ] } ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( pushed( [ 1 ], { $each: [] } ), [ 1 ] );
				assert.deepStrictEqual( pushed( [], { $each: [ { n: 1 } ] } ), [ { n: 1 } ] );
			} );

			it( 'should insert at $position', () =>
			{
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 9 ], $position: 0 } ), [ 9, 1, 2 ] );
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 9 ], $position: 1 } ), [ 1, 9, 2 ] );
				// A negative position counts back from the end.
				assert.deepStrictEqual( pushed( [ 1, 2, 3 ], { $each: [ 9 ], $position: -1 } ), [ 1, 2, 9, 3 ] );
				// A position outside the array is clamped to it.
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 9 ], $position: 99 } ), [ 1, 2, 9 ] );
				assert.deepStrictEqual( pushed( [ 1 ], { $each: [ 9 ], $position: -99 } ), [ 9, 1 ] );
			} );

			it( 'should sort with $sort', () =>
			{
				assert.deepStrictEqual( pushed( [ 3, 1 ], { $each: [ 2 ], $sort: 1 } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( pushed( [ 3, 1 ], { $each: [ 2 ], $sort: -1 } ), [ 3, 2, 1 ] );
				assert.deepStrictEqual(
					pushed( [ { n: 3 }, { n: 1 } ], { $each: [ { n: 2 } ], $sort: { n: 1 } } ),
					[ { n: 1 }, { n: 2 }, { n: 3 } ] );
			} );

			it( 'should trim with $slice', () =>
			{
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 3, 4 ], $slice: 2 } ), [ 1, 2 ] );
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 3, 4 ], $slice: -2 } ), [ 3, 4 ] );
				assert.deepStrictEqual( pushed( [ 1, 2 ], { $each: [ 3 ], $slice: 0 } ), [] );
				assert.deepStrictEqual( pushed( [ 1 ], { $each: [ 2 ], $slice: 99 } ), [ 1, 2 ] );
			} );

			it( 'should apply $sort before $slice', () =>
			{
				assert.deepStrictEqual( pushed( [ 5, 1 ], { $each: [ 3 ], $sort: 1, $slice: 2 } ), [ 1, 3 ] );
				assert.deepStrictEqual( pushed( [ 5, 1 ], { $each: [ 3 ], $sort: 1, $slice: -2 } ), [ 3, 5 ] );
			} );

			it( 'should store a modifier written without $each as a value', () =>
			{
				// $each is what makes a document a modifier document. Without one there is no
				// modifier to read, so the object is a plain value to append — even when it
				// carries $slice, $sort, or $position. Verified against MongoDB 6.0.1.
				// These used to be refused, which was safer and was not what MongoDB does.
				assert.deepStrictEqual( pushed( [ 1 ], { $slice: 2 } ), [ 1, { $slice: 2 } ] );
				assert.deepStrictEqual( pushed( [ 1 ], { $sort: 1 } ), [ 1, { $sort: 1 } ] );
				assert.deepStrictEqual( pushed( [ 1 ], { $position: 0 } ), [ 1, { $position: 0 } ] );
			} );

			it( 'should reject a malformed modifier rather than storing it', () =>
			{
				// Every one of these carries a $each, so it is a modifier document, and every
				// one of them is malformed.
				let cases = [
					{ $each: 5 },
					{ $each: [ 2 ], $bogus: 1 },
					{ $each: [ 2 ], $position: 'x' },
					{ $each: [ 2 ], $slice: 'x' },
					{ $each: [ 2 ], $sort: 'x' },
					{ $each: [ 2 ], $sort: 2 },
				];
				for ( let index = 0; index < cases.length; index++ )
				{
					let messages = [];
					let engine = jsongin.NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );
					let document = { a: [ 1 ] };

					let result = engine.UpdateOperators.$push.Update( document, { a: cases[ index ] } );

					let label = JSON.stringify( cases[ index ] );
					assert.strictEqual( result, false, `$push reported success for ${label}.` );
					assert.deepStrictEqual( document.a, [ 1 ], `$push changed the array for ${label}.` );
					assert.ok( messages.length > 0, `$push logged nothing for ${label}.` );
				}
			} );

			it( 'should not alias the update document through $each', () =>
			{
				let updates = { $push: { a: { $each: [ { n: 1 } ] } } };
				let updated = jsongin.Update( { a: [] }, updates );
				updated.a[ 0 ].n = 999;
				assert.strictEqual( updates.$push.a.$each[ 0 ].n, 1 );
			} );

			it( 'should keep a date pushed through $each', () =>
			{
				let updated = jsongin.Update( { a: [] }, { $push: { a: { $each: [ new Date( 1000 ) ] } } } );
				assert.ok( updated.a[ 0 ] instanceof Date );
			} );

			it( 'should append a document without $each as a value, not read it as a modifier', () =>
			{
				// $each is what makes a document a modifier document. An object without one is a
				// plain value to append, even when it carries $position, $sort, or $slice.
				let updated = jsongin.Update( { a: [ 1 ] }, { $push: { a: { $position: 0 } } } );
				assert.strictEqual( updated.a.length, 2 );
				assert.deepEqual( updated.a[ 1 ], { $position: 0 } );
			} );

			it( 'should reject an unrecognized $ field within a modifier document', () =>
			{
				assert.throws( function () { jsongin.Update( { a: [ 1 ] }, { $push: { a: { $each: [ 3 ], $bogus: 1 } } } ); } );
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

			/*
				Array.includes() compares objects, arrays, and dates by reference, so a value
				written in the update document never matched one already in the array. Only
				primitives could be pulled.
			*/

			it( 'should pull an object by its content', () =>
			{
				let document = { a: [ { n: 1 }, { n: 2 } ] };
				let result = jsongin.UpdateOperators.$pullAll.Update( document, { a: [ { n: 1 } ] } );
				assert.ok( result );
				assert.strictEqual( document.a.length, 1 );
				assert.strictEqual( document.a[ 0 ].n, 2 );
			} );

			it( 'should pull an array by its content', () =>
			{
				let document = { a: [ [ 1, 2 ], [ 3 ] ] };
				jsongin.UpdateOperators.$pullAll.Update( document, { a: [ [ 1, 2 ] ] } );
				assert.strictEqual( document.a.length, 1 );
				assert.ok( jsongin.StrictEquals( document.a[ 0 ], [ 3 ] ) );
			} );

			it( 'should pull a date by its value', () =>
			{
				let document = { a: [ new Date( 1000 ), new Date( 2000 ) ] };
				jsongin.UpdateOperators.$pullAll.Update( document, { a: [ new Date( 1000 ) ] } );
				assert.strictEqual( document.a.length, 1 );
				assert.strictEqual( document.a[ 0 ].getTime(), 2000 );
			} );

			it( 'should pull every instance of a value', () =>
			{
				let document = { a: [ 1, 2, 1, 3, 1 ] };
				jsongin.UpdateOperators.$pullAll.Update( document, { a: [ 1 ] } );
				assert.ok( jsongin.StrictEquals( document.a, [ 2, 3 ] ) );
			} );

			it( 'should not pull a value which only looks alike', () =>
			{
				// A number and its text are different values, as they are everywhere else.
				let document = { a: [ 1, '1' ] };
				jsongin.UpdateOperators.$pullAll.Update( document, { a: [ 1 ] } );
				assert.ok( jsongin.StrictEquals( document.a, [ '1' ] ) );
			} );

			it( 'should leave the array alone when nothing matches', () =>
			{
				let document = { a: [ { n: 1 } ] };
				let result = jsongin.UpdateOperators.$pullAll.Update( document, { a: [ { n: 9 } ] } );
				assert.ok( result );
				assert.strictEqual( document.a.length, 1 );
			} );

			it( 'should work through the Update function', () =>
			{
				let updated = jsongin.Update( { a: [ { n: 1 }, { n: 2 } ] }, { $pullAll: { a: [ { n: 2 } ] } } );
				assert.strictEqual( updated.a.length, 1 );
				assert.strictEqual( updated.a[ 0 ].n, 1 );
			} );


		} );


	} );


	//---------------------------------------------------------------------
	describe( 'OpLog Failure Paths', () =>
	{

		/*
			Every update operator writes to the OpLog when it cannot store the value it
			computed. That path needs two things at once to run, a failed store and a
			configured OpLog, so nothing exercised it and two defects lived there unseen:
			each operator called an undefined `Engine` variable, and $addToSet also logged an
			undefined `value`. Both threw a ReferenceError instead of logging.

			The store is forced to fail here by replacing the engine's SetValue, which the
			operators resolve through the engine when they call it rather than capturing.
		*/

		const NewJsongin = require( '../../src/jsongin' ).NewJsongin;

		let cases = [
			{ Operator: '$set', Document: { a: 1 }, Args: { a: 2 } },
			// $unset still logs, but a field which cannot be removed because it is not
			// there is a successful no-op rather than a failure, which is what MongoDB
			// reports. Every other operator here fails when it cannot store its value.
			{ Operator: '$unset', Document: { a: 1 }, Args: { a: 0 }, Result: true },
			{ Operator: '$rename', Document: { a: 1 }, Args: { a: 'b' } },
			{ Operator: '$inc', Document: { n: 1 }, Args: { n: 1 } },
			{ Operator: '$min', Document: { n: 5 }, Args: { n: 0 } },
			{ Operator: '$max', Document: { n: 5 }, Args: { n: 9 } },
			{ Operator: '$mul', Document: { n: 5 }, Args: { n: 2 } },
			{ Operator: '$currentDate', Document: { d: 0 }, Args: { d: true } },
			{ Operator: '$addToSet', Document: { t: [ 1 ] }, Args: { t: 2 } },
			{ Operator: '$pop', Document: { t: [ 1, 2 ] }, Args: { t: 1 } },
			{ Operator: '$pullAll', Document: { t: [ 1, 2 ] }, Args: { t: [ 1 ] } },
			{ Operator: '$push', Document: { t: [ 1 ] }, Args: { t: 2 } },
		];

		function failing_engine( Messages )
		{
			let engine = NewJsongin( {
					OpLog: function ( Message ) { Messages.push( Message ); },
			} );
			// Every way an operator has of storing a value now fails.
			engine.SetValue = function () { return false; };
			engine.DeleteValue = function () { return false; };
			return engine;
		}

		for ( let index = 0; index < cases.length; index++ )
		{
			let test_case = cases[ index ];

			it( `should log rather than throw when ${test_case.Operator} cannot store its value`, () =>
			{
				let messages = [];
				let engine = failing_engine( messages );
				let operator = engine.UpdateOperators[ test_case.Operator ];

				// The operator reports the failure, it does not raise it.
				let expected_result = false;
				if ( typeof test_case.Result !== 'undefined' ) { expected_result = test_case.Result; }
				let result = operator.Update( test_case.Document, test_case.Args );
				assert.strictEqual( result, expected_result );

				// The failure reached the OpLog, in the module's message format.
				assert.ok( messages.length > 0, `${test_case.Operator} logged nothing.` );
				let logged = messages[ messages.length - 1 ];
				assert.ok( logged.startsWith( `Update.${test_case.Operator}: ` ),
					`${test_case.Operator} logged [${logged}].` );

				// A template which interpolated an undefined variable would have thrown
				// before reaching this point, so the message is proof the names resolve.
				assert.ok( logged.length > `Update.${test_case.Operator}: `.length );
			} );
		}

	} );


} );

