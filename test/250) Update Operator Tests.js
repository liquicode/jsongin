'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )
	.NewJsongin( {
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
					let engine = require( '../src/jsongin' ).NewJsongin( {
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

		const NewJsongin = require( '../src/jsongin' ).NewJsongin;

		let cases = [
			{ Operator: '$set', Document: { a: 1 }, Args: { a: 2 } },
			{ Operator: '$unset', Document: { a: 1 }, Args: { a: 0 } },
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
				PathExtensions: false,
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
				let result = operator.Update( test_case.Document, test_case.Args );
				assert.strictEqual( result, false );

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

