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

	//---------------------------------------------------------------------
	/*
		***A query has no variables of its own, and a caller may lend it some.***

		`Query( Document, Criteria, Path, Scope )` hands the scope to the operators which
		declare `TakesScope` - the expression operators, which make it the parent of the frame
		they build, and the logical operators, which carry criteria back into `Query()`. It is
		what lets `Join()` bind `$$Left` so that a criteria can compare two documents.

		***The fourth parameter is already something else to four operators*** - `$all`,
		`$eqx`, `$nex` and `$ImplicitEq` read it as `ExpandArrays` - which is why the scope
		goes only to an operator which asked for it, and why that is asserted here.
	*/
	describe( 'A Scope Lent to a Query', () =>
	{

		let left = { Dome: 'A', Minimum: 2 };

		// ***A frame lent to a query descends from a pipeline frame***, which is where '$$NOW'
		// and '$$REMOVE' are bound. A bare frame made with Scope.New() defines neither, and a
		// query lent one refuses '$$NOW' rather than answering without it - asserted below.
		function lent()
		{
			return jsongin.Scope.NewPipeline().Child( { Left: left } );
		}

		it( 'should resolve a lent name inside $expr', () =>
		{
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { DomeId: 'B' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', { Scope: lent() } ), false );
		} );

		it( 'should keep $$ROOT and $$NOW naming the document in hand', () =>
		{
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$$ROOT.DomeId', 'A' ] } }, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, { $expr: { $gt: [ '$$NOW', new Date( 0 ) ] } }, '', { Scope: lent() } ), true );
		} );

		it( 'should carry the scope through the logical operators', () =>
		{
			let criteria = {
				$and: [
					{ $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } },
					{ $expr: { $gt: [ '$Nights', '$$Left.Minimum' ] } },
				],
			};
			assert.strictEqual( jsongin.Query( { DomeId: 'A', Nights: 3 }, criteria, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { DomeId: 'A', Nights: 1 }, criteria, '', { Scope: lent() } ), false );

			let either = { $or: [ { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, { Spare: true } ] };
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, either, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { DomeId: 'B', Spare: true }, either, '', { Scope: lent() } ), true );

			let neither = { $nor: [ { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } } ] };
			assert.strictEqual( jsongin.Query( { DomeId: 'B' }, neither, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, neither, '', { Scope: lent() } ), false );

			let negated = { Nights: { $not: { $exprx: { $eq: [ '$$Left.Dome', 'B' ] } } } };
			assert.strictEqual( jsongin.Query( { Nights: { Dome: 'A' } }, negated, '', { Scope: lent() } ), true );
		} );

		it( 'should reach $exprx below a field, against the sub-document', () =>
		{
			let criteria = { Site: { $exprx: { $eq: [ '$DomeId', '$$Left.Dome' ] } } };
			assert.strictEqual( jsongin.Query( { Site: { DomeId: 'A' } }, criteria, '', { Scope: lent() } ), true );
			assert.strictEqual( jsongin.Query( { Site: { DomeId: 'B' } }, criteria, '', { Scope: lent() } ), false );
			// And against each element of an array at that field.
			assert.strictEqual( jsongin.Query( { Site: [ { DomeId: 'B' }, { DomeId: 'A' } ] }, criteria, '', { Scope: lent() } ), true );
		} );

		// ***What a lent frame does not bring with it.*** The system names belong to a pipeline
		// frame; lending a bare one puts the document's frame on a chain which has none, and
		// '$$NOW' is then undefined rather than silently absent. Measured 2026-09-20.
		it( 'should refuse $$NOW when the lent frame has no pipeline frame under it', () =>
		{
			let bare = jsongin.Scope.New( { Left: left } );
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', { Scope: bare } ), true );
			assert.throws(
				function () { jsongin.Query( { DomeId: 'A' }, { $expr: { $gt: [ '$$NOW', new Date( 0 ) ] } }, '', { Scope: bare } ); },
				/\$\$NOW/ );
		} );

		it( 'should leave a query which was lent nothing exactly as it was', () =>
		{
			assert.strictEqual( jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', 'A' ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: 1 } ), true );
			// A name nobody lent is still undefined, rather than quietly missing.
			assert.throws(
				function () { jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } } ); },
				/\$\$Left/ );
		} );

		// ***A scope handed over bare is refused rather than ignored.*** It was the fourth
		// argument itself until the options object arrived, so passing one is the mistake this
		// shape invites - and an options object holding no scope looks exactly like one which
		// never meant to, so the query would run without the variables it was lent.
		it( 'should refuse a scope passed where the options go', () =>
		{
			assert.throws(
				function () { jsongin.Query( { DomeId: 'A' }, { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }, '', lent() ); },
				/a scope was passed on its own/ );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***The options a query carries travel unchanged.*** `{ ExpandArrays, Scope }` is the
		fourth argument of `Query()` and of every operator, and it is passed on as it is - to
		another operator, and to any criteria handed back to `Query()`. A setting made at the
		top holds for the whole criteria rather than evaporating one call down.

		***`$elemMatch` is the only thing which narrows it***, to `ExpandArrays: false` for the
		operators it applies to an element, because there an element which is itself an array
		is a value and not a container. It narrows and never widens.

		See src/QueryOptions.js.
	*/
	describe( 'The Options a Query Carries', () =>
	{

		it( 'should read a boolean fourth argument as ExpandArrays, as it always did', () =>
		{
			// Twenty-three operators were published taking the flag itself, and somebody's
			// operator is written against that signature.
			assert.strictEqual( jsongin.QueryOperators.$eq.Query( { Domes: [ 'A', 'B' ] }, 'A', 'Domes' ), true );
			assert.strictEqual( jsongin.QueryOperators.$eq.Query( { Domes: [ 'A', 'B' ] }, 'A', 'Domes', false ), false );
			assert.strictEqual( jsongin.QueryOperators.$eq.Query( { Domes: [ 'A', 'B' ] }, 'A', 'Domes', true ), true );
			assert.strictEqual( jsongin.Query( { Domes: [ 'A', 'B' ] }, { Domes: 'A' }, '', false ), false );
		} );

		it( 'should carry ExpandArrays through a whole criteria', () =>
		{
			let document = { Domes: [ 'A', 'B' ], Site: { Tags: [ 'open' ] } };
			// Ordinary semantics: an array offers its elements, at every level.
			assert.strictEqual( jsongin.Query( document, { Domes: 'A' } ), true );
			assert.strictEqual( jsongin.Query( document, { 'Site.Tags': 'open' } ), true );
			assert.strictEqual( jsongin.Query( document, { $and: [ { Domes: 'A' }, { 'Site.Tags': 'open' } ] } ), true );

			// Turned off by the caller, it stays off - through a logical operator, through a
			// nested criteria, and through an operator which hands off to another.
			let strict = { ExpandArrays: false };
			assert.strictEqual( jsongin.Query( document, { Domes: 'A' }, '', strict ), false );
			assert.strictEqual( jsongin.Query( document, { 'Site.Tags': 'open' }, '', strict ), false );
			assert.strictEqual( jsongin.Query( document, { $and: [ { Domes: 'A' } ] }, '', strict ), false );
			assert.strictEqual( jsongin.Query( document, { $or: [ { Domes: 'A' }, { Domes: [ 'A', 'B' ] } ] }, '', strict ), true );
			assert.strictEqual( jsongin.Query( document, { Domes: { $in: [ 'A' ] } }, '', strict ), false );
			assert.strictEqual( jsongin.Query( document, { Domes: { $ne: 'A' } }, '', strict ), true );

			// The whole array is still the value it lands on, so a criteria which names it matches.
			assert.strictEqual( jsongin.Query( document, { Domes: [ 'A', 'B' ] }, '', strict ), true );
		} );

		it( 'should carry a lent scope and the array rule together', () =>
		{
			let scope = jsongin.Scope.NewPipeline().Child( { Wanted: 'A' } );
			let document = { Domes: [ 'A', 'B' ] };
			let criteria = { $and: [ { Domes: 'A' }, { $expr: { $eq: [ '$$Wanted', 'A' ] } } ] };
			assert.strictEqual( jsongin.Query( document, criteria, '', { Scope: scope } ), true );
			assert.strictEqual( jsongin.Query( document, criteria, '', { Scope: scope, ExpandArrays: false } ), false );
		} );

		// ***The narrowing $elemMatch does is MongoDB's own rule***, verified there against
		// 6.0.1: an element which is itself an array is a value, not a second array to look
		// inside. It must hold whatever the caller asked for, and it must not leak past the
		// element - ordinary semantics resume below it.
		it( 'should let $elemMatch narrow the array rule for an element', () =>
		{
			assert.strictEqual( jsongin.Query( { a: [ [ { x: 1 } ] ] }, { a: { $elemMatch: { x: 1 } } } ), false );
			assert.strictEqual( jsongin.Query( { a: [ { x: 1 } ] }, { a: { $elemMatch: { x: 1 } } } ), true );
			// Below the element, an array offers its elements again.
			assert.strictEqual( jsongin.Query( { a: [ { Tags: [ 'red' ] } ] }, { a: { $elemMatch: { Tags: 'red' } } } ), true );
			// And with the caller turning expansion off, the narrowing still holds.
			assert.strictEqual( jsongin.Query( { a: [ [ { x: 1 } ] ] }, { a: { $elemMatch: { x: 1 } } }, '', { ExpandArrays: false } ), false );
		} );

		it( 'should refuse options it cannot read', () =>
		{
			assert.throws( function () { jsongin.Query( { a: 1 }, { a: 1 }, '', 'nope' ); }, /Options must be an object/ );
			assert.throws( function () { jsongin.Query( { a: 1 }, { a: 1 }, '', { ExpandArrays: 'yes' } ); }, /ExpandArrays must be a boolean/ );
			assert.throws( function () { jsongin.Query( { a: 1 }, { a: 1 }, '', { Scope: 'mine' } ); }, /Scope must be a scope/ );
		} );

		// The contract a plugin author reads, and the one the dispatcher relies on: whatever a
		// query operator takes after Path is called Options.
		//
		// ***Read from the signature text rather than from Function.length***, which stops
		// counting at the first default parameter and so answers 2 for every operator here -
		// it cannot tell a fourth parameter from a missing one, which is how the old name
		// survived in four operators while this test passed.
		it( 'should name the fourth parameter of every query operator Options', () =>
		{
			let names = Object.keys( jsongin.QueryOperators );
			let wrong = [];
			for ( let index = 0; index < names.length; index++ )
			{
				let operator = jsongin.QueryOperators[ names[ index ] ];
				if ( typeof operator.Query !== 'function' ) { continue; }
				let signature = /\(([^)]*)\)/.exec( operator.Query.toString() )[ 1 ];
				let parameters = signature.split( ',' ).map( function ( Each ) { return Each.trim().split( '=' )[ 0 ].trim(); } );
				if ( parameters.length < 4 ) { continue; }
				if ( parameters.length > 4 ) { wrong.push( names[ index ] + ' takes ' + parameters.length ); continue; }
				if ( parameters[ 3 ] !== 'Options' ) { wrong.push( names[ index ] + ' calls it ' + parameters[ 3 ] ); }
			}
			assert.deepStrictEqual( wrong, [] );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***A nested pipeline runs in the frame around it.*** `Aggregate()` accepts a caller's
		frame and names `$facet` as the reason, and `$facet` did not pass one.

		Measured 2026-09-20 against the branch which built its own: a lent variable threw
		"Expression variable [$$Dome] is not defined" inside a branch, and the branch read the
		clock again, answering an instant 9 ms past the one the run began with.
	*/
	describe( 'A Frame Through $facet', () =>
	{

		it( 'should give a branch the run instant, not one of its own', () =>
		{
			let answer = jsongin.Aggregate( [ { a: 1 } ], [
				{ $addFields: { Outer: '$$NOW' } },
				{ $facet: { one: [ { $addFields: { Inner: '$$NOW' } } ], two: [ { $addFields: { Inner: '$$NOW' } } ] } },
			] );
			let one = answer[ 0 ].one[ 0 ];
			let two = answer[ 0 ].two[ 0 ];
			assert.strictEqual( one.Inner.getTime(), one.Outer.getTime() );
			assert.strictEqual( two.Inner.getTime(), one.Inner.getTime() );
		} );

		it( 'should give a branch the variables the caller bound', () =>
		{
			let scope = jsongin.Scope.NewPipeline().Child( { Dome: 'A' } );
			let answer = jsongin.Aggregate( [ { a: 1 } ], [
				{ $facet: { one: [ { $addFields: { D: '$$Dome' } } ] } },
			], scope );
			assert.deepStrictEqual( answer[ 0 ].one[ 0 ], { a: 1, D: 'A' } );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Scope Storage', () =>
	{

		/*
			A scope is meant to be storable data - that is the standing decision behind making
			it a value the caller owns rather than a stack the engine holds. Through JSON it was
			not storable at all: the methods went missing, $$NOW came back a string, and
			$$REMOVE disappeared entirely, because JSON.stringify drops a key whose value is
			undefined.

			ToJSON gives the frames a wire shape and FromJSON puts the methods back. The text in
			between is Format and Parse with TypedValues, which is what carries a Date and an
			undefined binding across.

			See .plans/2026-08-22/process-language-spec.md, finding S4.
		*/

		const STORAGE = { TypedValues: true };

		function round_trip( Scope )
		{
			let text = jsongin.Format( jsongin.Scope.ToJSON( Scope ), STORAGE );
			return jsongin.Scope.FromJSON( jsongin.Parse( text, STORAGE ) );
		}

		function sample_scope()
		{
			let scope = jsongin.Scope.NewPipeline( new Date( '2026-08-22T04:00:00.000Z' ) );
			scope = scope.ForDocument( { _id: 1, price: 10 } );
			return scope.Child( { discount: 0.5, nothing: undefined } );
		}


		it( 'should answer every name the same way after a round trip', () =>
		{
			let before = sample_scope();
			let after = round_trip( before );

			let names = [ 'discount', 'ROOT', 'CURRENT', 'NOW', 'REMOVE', 'nothing' ];
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				assert.deepStrictEqual( after.Lookup( name ), before.Lookup( name ),
					`the name [${name}] did not survive storage.` );
			}
		} );

		it( 'should keep a variable bound to nothing apart from an unbound one', () =>
		{
			// This is the distinction the whole exercise is for. A resumed process which read
			// $$REMOVE as unbound would throw on an expression that worked before it suspended.
			let after = round_trip( sample_scope() );

			assert.deepStrictEqual( after.Lookup( 'REMOVE' ), { Found: true, Value: undefined } );
			assert.deepStrictEqual( after.Lookup( 'nothing' ), { Found: true, Value: undefined } );
			assert.deepStrictEqual( after.Lookup( 'nobodyBoundThis' ), { Found: false } );
		} );

		it( 'should bring $$NOW back as a date and not as a string', () =>
		{
			let after = round_trip( sample_scope() );
			let now = after.Lookup( 'NOW' ).Value;

			assert.strictEqual( jsongin.ShortType( now ), 'd' );
			assert.strictEqual( now.getTime(), new Date( '2026-08-22T04:00:00.000Z' ).getTime() );
		} );

		it( 'should keep the frames chained rather than flattened', () =>
		{
			// The chain is what a closure captures and what a reader walks to see where a name
			// came from. Flattening would answer every lookup correctly and lose that.
			let before = sample_scope().Child( { discount: 0.9 } );
			let after = round_trip( before );

			assert.strictEqual( after.Lookup( 'discount' ).Value, 0.9 );
			assert.strictEqual( after.Parent.Lookup( 'discount' ).Value, 0.5 );
			assert.strictEqual( after.Parent.Parent.Lookup( 'discount' ).Found, false );
		} );

		it( 'should restore the methods, which are the engine\'s and are never stored', () =>
		{
			let after = round_trip( sample_scope() );

			assert.strictEqual( typeof after.Lookup, 'function' );
			assert.strictEqual( typeof after.Child, 'function' );
			assert.strictEqual( typeof after.ForDocument, 'function' );
			assert.strictEqual( typeof after.Parent.Lookup, 'function' );

			// The wire shape carries no methods at all.
			let stored = jsongin.Scope.ToJSON( sample_scope() );
			assert.deepStrictEqual( Object.keys( stored ), [ 'Variables', 'Parent' ] );
		} );

		it( 'should evaluate an expression to the same answer after a round trip', () =>
		{
			// The proof that matters: the scope is not merely shaped the same, it works.
			let document = { price: 10 };
			let expression = { $multiply: [ '$price', '$$discount' ] };

			let before = sample_scope();
			let after = round_trip( before );

			assert.strictEqual( jsongin.Evaluate( document, expression, after ),
				jsongin.Evaluate( document, expression, before ) );
			assert.strictEqual( jsongin.Evaluate( document, { $year: '$$NOW' }, after ), 2026 );
		} );

		it( 'should take a scope which has no parent', () =>
		{
			let before = jsongin.Scope.New( { only: 1 }, null );
			let after = round_trip( before );

			assert.strictEqual( after.Lookup( 'only' ).Value, 1 );
			assert.strictEqual( after.Parent, null );
		} );

	} );


} );
