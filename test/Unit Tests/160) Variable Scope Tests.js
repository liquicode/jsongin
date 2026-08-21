'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );

/*
	The variable scope component.

	***These are unit tests and not parity tests, because MongoDB has no opinion here.*** A
	scope is a jsongin value with a jsongin API; what the server has an opinion about is what
	`$$ROOT` and `$$this` evaluate to, and that is measured in the Aggregate parity suites.
	This file covers the container those answers are kept in.

	See src/jsongin/Scope.js.
*/


describe( '160) Variable Scope Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Building a Frame', () =>
	{

		it( 'should build an empty frame with no parent', () =>
		{
			let scope = jsongin.Scope.New();
			assert.deepStrictEqual( scope.Variables, {} );
			assert.strictEqual( scope.Parent, null );
		} );

		it( 'should take null as no parent', () =>
		{
			let scope = jsongin.Scope.New( { x: 1 }, null );
			assert.strictEqual( scope.Parent, null );
		} );

		it( 'should refuse variables which are not a document', () =>
		{
			assert.throws( function () { jsongin.Scope.New( 'x' ); } );
			assert.throws( function () { jsongin.Scope.New( [ 1 ] ); } );
			assert.throws( function () { jsongin.Scope.New( 42 ); } );
		} );

		it( 'should refuse a parent which is not a scope or null', () =>
		{
			assert.throws( function () { jsongin.Scope.New( {}, 'nope' ); } );
			assert.throws( function () { jsongin.Scope.New( {}, 42 ); } );
		} );

		it( 'should copy the bindings rather than hold them', () =>
		{
			// ***A frame does not change after it is made.*** Something else may be holding
			// it - a closure, a saved scope - and reaching back through the object which was
			// used to build it must not reach that.
			let variables = { x: 1 };
			let scope = jsongin.Scope.New( variables );
			variables.x = 999;
			variables.y = 2;
			assert.strictEqual( scope.Lookup( 'x' ).Value, 1 );
			assert.strictEqual( scope.Lookup( 'y' ).Found, false );
		} );

		it( 'should keep a binding whose value is nothing', () =>
		{
			// $$REMOVE depends on this: the name is bound, and what it is bound to is
			// undefined. A copy which dropped such keys would make it an unbound name.
			let scope = jsongin.Scope.New( { gone: undefined } );
			let found = scope.Lookup( 'gone' );
			assert.strictEqual( found.Found, true );
			assert.strictEqual( found.Value, undefined );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Resolving a Name', () =>
	{

		it( 'should resolve a name bound in this frame', () =>
		{
			let scope = jsongin.Scope.New( { x: 1 } );
			assert.deepStrictEqual( scope.Lookup( 'x' ), { Found: true, Value: 1 } );
		} );

		it( 'should report an unbound name as not found', () =>
		{
			let scope = jsongin.Scope.New( { x: 1 } );
			assert.deepStrictEqual( scope.Lookup( 'nope' ), { Found: false } );
		} );

		it( 'should distinguish a name bound to nothing from an unbound name', () =>
		{
			// The whole reason Lookup answers with Found rather than with a value.
			let scope = jsongin.Scope.New( { gone: undefined } );
			assert.strictEqual( scope.Lookup( 'gone' ).Found, true );
			assert.strictEqual( scope.Lookup( 'never' ).Found, false );
		} );

		it( 'should not resolve a name inherited from Object.prototype', () =>
		{
			let scope = jsongin.Scope.New( { x: 1 } );
			assert.strictEqual( scope.Lookup( 'toString' ).Found, false );
			assert.strictEqual( scope.Lookup( 'constructor' ).Found, false );
			// Bound explicitly, it resolves like any other name.
			let bound = jsongin.Scope.New( { toString: 'mine' } );
			assert.strictEqual( bound.Lookup( 'toString' ).Value, 'mine' );
		} );

		it( 'should resolve a name bound in an outer frame', () =>
		{
			let outer = jsongin.Scope.New( { x: 1 } );
			let inner = outer.Child( { y: 2 } );
			assert.strictEqual( inner.Lookup( 'x' ).Value, 1 );
			assert.strictEqual( inner.Lookup( 'y' ).Value, 2 );
		} );

		it( 'should resolve the innermost binding of a shadowed name', () =>
		{
			let outer = jsongin.Scope.New( { x: 1 } );
			let inner = outer.Child( { x: 10 } );
			assert.strictEqual( inner.Lookup( 'x' ).Value, 10 );
		} );

		it( 'should leave the outer frame alone when an inner one shadows it', () =>
		{
			// Shadowing is not assignment. The outer frame is still holding what it held,
			// which is what makes a binding operator safe to nest.
			let outer = jsongin.Scope.New( { x: 1 } );
			outer.Child( { x: 10 } );
			assert.strictEqual( outer.Lookup( 'x' ).Value, 1 );
		} );

		it( 'should walk more than one frame to find a name', () =>
		{
			let scope = jsongin.Scope.New( { x: 1 } ).Child( { y: 2 } ).Child( { z: 3 } );
			assert.strictEqual( scope.Lookup( 'x' ).Value, 1 );
			assert.strictEqual( scope.Lookup( 'y' ).Value, 2 );
			assert.strictEqual( scope.Lookup( 'z' ).Value, 3 );
			assert.strictEqual( scope.Lookup( 'w' ).Found, false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The Signature Contract', () =>
	{

		/*
			***Every operator has to carry the scope, including the ones which never look at
			it.*** A leaf operator sits between the dispatcher and the helper which evaluates
			its operands, so an operator that drops the scope loses every variable underneath
			itself - and nothing goes wrong until somebody writes a '$$name' inside that one
			operator, which may be a long time later and reads as the wrong operator's bug.

			There are ~175 places to remember. Remembering is not a plan, so this walks the
			registries and says which ones forgot. build/scope-check.js does the same over the
			source, and catches a file which is not registered yet.

			***A default parameter value would break this***, because `Function.length` stops
			counting at the first one. The convention is that only the public entry points
			treat an absent scope as "make a root one", and they test for it in the body.
		*/

		function names_missing_the_scope( Registry, Member )
		{
			let missing = [];
			let names = Object.keys( Registry );
			for ( let index = 0; index < names.length; index++ )
			{
				let operator = Registry[ names[ index ] ];
				if ( typeof operator[ Member ] !== 'function' ) { continue; }
				if ( operator[ Member ].length === 3 ) { continue; }
				missing.push( `${names[ index ]} (${operator[ Member ].length})` );
			}
			return missing;
		}

		it( 'should take a scope on every expression operator', () =>
		{
			let missing = names_missing_the_scope( jsongin.ExpressionOperators, 'Evaluate' );
			assert.deepStrictEqual( missing, [], `${missing.length} expression operators do not take a scope: ${missing.join( ', ' )}` );
		} );

		it( 'should take a scope on every stage operator', () =>
		{
			let missing = names_missing_the_scope( jsongin.StageOperators, 'Stage' );
			assert.deepStrictEqual( missing, [], `${missing.length} stages do not take a scope: ${missing.join( ', ' )}` );
		} );

		it( 'should take a scope on every accumulator', () =>
		{
			let missing = names_missing_the_scope( jsongin.AccumulatorOperators, 'Accumulate' );
			assert.deepStrictEqual( missing, [], `${missing.length} accumulators do not take a scope: ${missing.join( ', ' )}` );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The System Frames', () =>
	{

		it( 'should bind NOW and REMOVE on a pipeline frame', () =>
		{
			let scope = jsongin.Scope.NewPipeline();
			assert.strictEqual( scope.Lookup( 'NOW' ).Value instanceof Date, true );
			assert.strictEqual( scope.Lookup( 'REMOVE' ).Found, true );
			assert.strictEqual( scope.Lookup( 'REMOVE' ).Value, undefined );
		} );

		it( 'should take the instant it is given', () =>
		{
			let now = new Date( '2020-01-02T03:04:05.678Z' );
			let scope = jsongin.Scope.NewPipeline( now );
			assert.strictEqual( scope.Lookup( 'NOW' ).Value.getTime(), now.getTime() );
		} );

		it( 'should read the clock when it is given anything else', () =>
		{
			let scope = jsongin.Scope.NewPipeline( 'not a date' );
			assert.strictEqual( scope.Lookup( 'NOW' ).Value instanceof Date, true );
		} );

		it( 'should bind ROOT and CURRENT on a document frame', () =>
		{
			let document = { _id: 1, a: 3 };
			let scope = jsongin.Scope.NewDocument( document );
			assert.deepStrictEqual( scope.Lookup( 'ROOT' ).Value, document );
			assert.deepStrictEqual( scope.Lookup( 'CURRENT' ).Value, document );
		} );

		it( 'should share one instant across every document of a pipeline', () =>
		{
			// ***This is the reason the two frames are separate.*** MongoDB gives every
			// document of one pipeline the same $$NOW, so the instant belongs to the run and
			// the document does not get to make its own.
			let pipeline = jsongin.Scope.NewPipeline();
			let first = jsongin.Scope.NewDocument( { _id: 1 }, pipeline );
			let second = jsongin.Scope.NewDocument( { _id: 2 }, pipeline );
			assert.strictEqual(
				first.Lookup( 'NOW' ).Value.getTime(),
				second.Lookup( 'NOW' ).Value.getTime() );
		} );

		it( 'should make its own pipeline frame when it is given none', () =>
		{
			// A bare Evaluate( Document, Expression ) names no scope, and its system
			// variables still have to work.
			let scope = jsongin.Scope.NewDocument( { _id: 1 } );
			assert.strictEqual( scope.Lookup( 'NOW' ).Value instanceof Date, true );
			assert.strictEqual( scope.Lookup( 'REMOVE' ).Found, true );
			assert.strictEqual( scope.Lookup( 'ROOT' ).Value._id, 1 );
		} );

		it( 'should let a binding frame shadow a system name', () =>
		{
			let scope = jsongin.Scope.NewDocument( { _id: 1 } ).Child( { CURRENT: { _id: 2 } } );
			assert.strictEqual( scope.Lookup( 'CURRENT' ).Value._id, 2 );
			assert.strictEqual( scope.Lookup( 'ROOT' ).Value._id, 1 );
		} );

	} );


} );
