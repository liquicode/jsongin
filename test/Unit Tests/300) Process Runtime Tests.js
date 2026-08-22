'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );

/*
	The process runtime.

	***These are unit tests and not parity tests, because MongoDB has no process language.***
	There is no server to compare a run against and no parity claim to be made. What an
	expression computes and what a query matches are still MongoDB's, and are still measured in
	the parity suites; only the stepping, the branching, the suspension and the run value
	itself are jsongin's, and this file is where they are held to account.

	The six invariants of the design - storage is transparent, stepping is deterministic,
	Execute equals repeated Step, runs are independent, Step is total, the input is never
	modified - are checked separately and much more broadly by build/process-check.js, which
	drives twelve processes and applies all six at every step of each. A handful of them are
	restated here as ordinary tests so that a reader of this file can see what they say.

	See src/jsongin/Process.js and src/Operators/Step/.
*/

const STORAGE = { TypedValues: true };


//---------------------------------------------------------------------
// The worked example from the guide, used by enough tests to be worth naming once.
function checkout_process()
{
	return {
		Name: 'Checkout',
		Steps: [
			{ $do: { total: { $add: [ '$sub', '$tax' ] } } },
			{
				$when: {
					Check: { total: { $gt: 100 } },
					Then: [ { $do: { discount: { $multiply: [ '$total', 0.1 ] } } } ],
					Else: [ { $do: { discount: 0 } } ],
				},
			},
			{ $call: { Name: 'ChargeCard', With: { amount: { $subtract: [ '$total', '$discount' ] } }, Into: 'receipt' } },
			{ $return: '$receipt' },
		],
	};
}


describe( '300) Process Runtime Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Starting a Run', () =>
	{

		it( 'should begin ready, at the first step', () =>
		{
			let process_document = { Name: 'Simple', Steps: [ { $do: { a: 1 } } ] };
			let run = jsongin.ProcessStart( process_document, { b: 2 } );
			assert.strictEqual( run.Status, 'ready' );
			assert.deepStrictEqual( run.Cursor, [ 0 ] );
			assert.deepStrictEqual( run.State, { b: 2 } );
		} );

		it( 'should carry the name of the process it belongs to', () =>
		{
			let run = jsongin.ProcessStart( { Name: 'Simple', Steps: [] }, {} );
			assert.strictEqual( run.Process, 'Simple' );
		} );

		it( 'should stamp null for a process with no name', () =>
		{
			let run = jsongin.ProcessStart( { Steps: [] }, {} );
			assert.strictEqual( run.Process, null );
		} );

		it( 'should clone the input rather than work on it', () =>
		{
			let input = { a: 1 };
			let run = jsongin.ProcessStart( { Name: 'X', Steps: [] }, input );
			run.State.a = 999;
			assert.strictEqual( input.a, 1 );
		} );

		it( 'should take no input as an empty state', () =>
		{
			let run = jsongin.ProcessStart( { Name: 'X', Steps: [] } );
			assert.deepStrictEqual( run.State, {} );
		} );

		it( 'should carry a scope holding the instant the run began', () =>
		{
			let run = jsongin.ProcessStart( { Name: 'X', Steps: [] }, {} );
			assert.ok( run.Scope.Variables.NOW instanceof Date );
		} );

		it( 'should fail a process which is not a document with Steps', () =>
		{
			let run = jsongin.ProcessStart( 'nope', {} );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'BadProcess' );

			run = jsongin.ProcessStart( { Name: 'X' }, {} );
			assert.strictEqual( run.Error.Code, 'BadProcess' );
		} );

		it( 'should fail an input which is not a document', () =>
		{
			let run = jsongin.ProcessStart( { Name: 'X', Steps: [] }, 42 );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'BadRun' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The $do Step', () =>
	{

		it( 'should compute a field from the state', () =>
		{
			let process_document = { Name: 'Add', Steps: [ { $do: { total: { $add: [ '$a', '$b' ] } } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { a: 2, b: 3 } ) );
			assert.deepStrictEqual( run.State, { a: 2, b: 3, total: 5 } );
		} );

		it( 'should store a literal', () =>
		{
			let process_document = { Name: 'Set', Steps: [ { $do: { flag: true } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.State, { flag: true } );
		} );

		it( 'should remove a field whose expression produces nothing', () =>
		{
			let process_document = { Name: 'Drop', Steps: [ { $do: { a: '$$REMOVE' } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { a: 1, b: 2 } ) );
			assert.deepStrictEqual( run.State, { b: 2 } );
		} );

		it( 'should evaluate every field against the state as it was at the top of the step', () =>
		{
			// The aggregation stage rule: fields added by a stage are not visible to the other
			// expressions within the same stage.
			let process_document = { Name: 'Same', Steps: [ { $do: { x: 1, y: '$x' } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.State, { x: 1 } );
		} );

		it( 'should see the variables the run carries', () =>
		{
			let process_document = { Name: 'Now', Steps: [ { $do: { at: '$$NOW' } } ] };
			let start = jsongin.ProcessStart( process_document, {} );
			let run = jsongin.ProcessStep( process_document, start );
			assert.strictEqual( run.State.at.getTime(), start.Scope.Variables.NOW.getTime() );
		} );

		it( 'should advance to the next step', () =>
		{
			let process_document = { Name: 'Two', Steps: [ { $do: { a: 1 } }, { $do: { b: 2 } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.Cursor, [ 1 ] );
			assert.strictEqual( run.Status, 'ready' );
		} );

		it( 'should refuse an argument which is not a document', () =>
		{
			let process_document = { Name: 'Bad', Steps: [ { $do: 42 } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'StepFailed' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The $when Step', () =>
	{

		it( 'should enter the Then branch when the check matches', () =>
		{
			let process_document = {
				Name: 'Branch',
				Steps: [ { $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ], Else: [ { $do: { big: false } } ] } } ],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { n: 9 } ) );
			assert.strictEqual( run.State.big, true );
		} );

		it( 'should enter the Else branch when the check does not match', () =>
		{
			let process_document = {
				Name: 'Branch',
				Steps: [ { $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ], Else: [ { $do: { big: false } } ] } } ],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { n: 1 } ) );
			assert.strictEqual( run.State.big, false );
		} );

		it( 'should push the branch onto the cursor', () =>
		{
			let process_document = {
				Name: 'Branch',
				Steps: [ { $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ] } } ],
			};
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { n: 9 } ) );
			assert.deepStrictEqual( run.Cursor, [ 0, 'Then', 0 ] );
		} );

		it( 'should advance past the step when a false check has no Else', () =>
		{
			let process_document = {
				Name: 'NoElse',
				Steps: [
					{ $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ] } },
					{ $do: { seen: true } },
				],
			};
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { n: 1 } ) );
			assert.deepStrictEqual( run.Cursor, [ 1 ] );
		} );

		it( 'should advance past a branch which is present but empty', () =>
		{
			let process_document = {
				Name: 'Empty',
				Steps: [
					{ $when: { Check: { n: { $gt: 5 } }, Then: [] } },
					{ $do: { seen: true } },
				],
			};
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { n: 9 } ) );
			assert.deepStrictEqual( run.Cursor, [ 1 ] );
		} );

		it( 'should leave a branch and carry on with the step after it', () =>
		{
			let process_document = {
				Name: 'After',
				Steps: [
					{ $when: { Check: { n: { $gt: 5 } }, Then: [ { $do: { big: true } } ] } },
					{ $do: { seen: true } },
				],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { n: 9 } ) );
			assert.deepStrictEqual( run.State, { n: 9, big: true, seen: true } );
		} );

		it( 'should nest, and unwind two levels at once', () =>
		{
			let process_document = {
				Name: 'Nested',
				Steps: [
					{
						$when: {
							Check: { n: { $gt: 0 } },
							Then: [
								{ $do: { sign: 'positive' } },
								{ $when: { Check: { n: { $gt: 100 } }, Then: [ { $do: { size: 'large' } } ], Else: [ { $do: { size: 'small' } } ] } },
							],
						},
					},
					{ $do: { done: true } },
				],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { n: 7 } ) );
			assert.deepStrictEqual( run.State, { n: 7, sign: 'positive', size: 'small', done: true } );
		} );

		it( 'should take a query holding $expr', () =>
		{
			let process_document = {
				Name: 'Expr',
				Steps: [ { $when: { Check: { $expr: { $gt: [ '$a', '$b' ] } }, Then: [ { $do: { bigger: 'a' } } ], Else: [ { $do: { bigger: 'b' } } ] } } ],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 9, b: 2 } ) );
			assert.strictEqual( run.State.bigger, 'a' );
		} );

		it( 'should refuse a Check which is not a query document', () =>
		{
			let process_document = { Name: 'Bad', Steps: [ { $when: { Then: [] } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'StepFailed' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The $call Step', () =>
	{

		it( 'should suspend rather than call', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			assert.strictEqual( run.Status, 'waiting' );
			assert.strictEqual( run.Waiting.Name, 'ChargeCard' );
		} );

		it( 'should evaluate With against the state', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			assert.strictEqual( run.Waiting.With.amount, 97.2 );
		} );

		it( 'should carry Into when there is one, and leave it off when there is not', () =>
		{
			let with_into = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {}, Into: 'here' } } ] };
			let run = jsongin.ProcessExecute( with_into, jsongin.ProcessStart( with_into, {} ) );
			assert.strictEqual( run.Waiting.Into, 'here' );

			let without_into = { Name: 'B', Steps: [ { $call: { Name: 'X', With: {} } } ] };
			run = jsongin.ProcessExecute( without_into, jsongin.ProcessStart( without_into, {} ) );
			assert.strictEqual( typeof run.Waiting.Into, 'undefined' );
		} );

		it( 'should leave the cursor on the call until it is resumed', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } }, { $call: { Name: 'X', With: {} } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.Cursor, [ 1 ] );
		} );

		it( 'should take no With as an empty With', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X' } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.Waiting.With, {} );
		} );

		it( 'should refuse a call with no Name', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { With: {} } } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'StepFailed' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'The $return Step', () =>
	{

		it( 'should halt with the value it evaluates', () =>
		{
			let process_document = { Name: 'R', Steps: [ { $return: '$a' } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 42 } ) );
			assert.strictEqual( run.Status, 'done' );
			assert.strictEqual( run.Result, 42 );
		} );

		it( 'should evaluate an expression document', () =>
		{
			let process_document = { Name: 'R', Steps: [ { $return: { sum: { $add: [ '$a', '$b' ] } } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 1, b: 2 } ) );
			assert.deepStrictEqual( run.Result, { sum: 3 } );
		} );

		it( 'should stop the steps after it from running', () =>
		{
			let process_document = { Name: 'R', Steps: [ { $return: 'here' }, { $do: { never: true } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Result, 'here' );
			assert.deepStrictEqual( run.State, {} );
		} );

		it( 'should carry no Result at all when the expression produces nothing', () =>
		{
			// ***A storage rule, not a nicety.*** A field set to undefined does not survive
			// being written down, and a run which cannot be stored is not a run.
			let process_document = { Name: 'R', Steps: [ { $return: '$nope' } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Status, 'done' );
			assert.strictEqual( Object.keys( run ).includes( 'Result' ), false );
		} );

		it( 'should return the state for $$ROOT', () =>
		{
			let process_document = { Name: 'R', Steps: [ { $return: '$$ROOT' } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 1 } ) );
			assert.deepStrictEqual( run.Result, { a: 1 } );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Running Off the End', () =>
	{

		it( 'should return the state, the way { $return: $$ROOT } would', () =>
		{
			let process_document = { Name: 'End', Steps: [ { $do: { total: { $add: [ '$a', '$b' ] } } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 2, b: 3 } ) );
			assert.strictEqual( run.Status, 'done' );
			assert.deepStrictEqual( run.Result, { a: 2, b: 3, total: 5 } );
		} );

		it( 'should finish a process which has no steps at all', () =>
		{
			let process_document = { Name: 'Nothing', Steps: [] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 1 } ) );
			assert.strictEqual( run.Status, 'done' );
			assert.deepStrictEqual( run.Result, { a: 1 } );
		} );

		it( 'should empty the cursor when it is over', () =>
		{
			let process_document = { Name: 'End', Steps: [ { $do: { a: 1 } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.Cursor, [] );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Resuming', () =>
	{

		it( 'should write the result into the state and carry on', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			run = jsongin.ProcessResume( process_document, run, { confirmation: 'abc' } );
			assert.strictEqual( run.Status, 'ready' );
			assert.deepStrictEqual( run.State.receipt, { confirmation: 'abc' } );
			assert.deepStrictEqual( run.Cursor, [ 3 ] );
		} );

		it( 'should finish the process it was resumed into', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			run = jsongin.ProcessResume( process_document, run, { confirmation: 'abc' } );
			run = jsongin.ProcessExecute( process_document, run );
			assert.strictEqual( run.Status, 'done' );
			assert.deepStrictEqual( run.Result, { confirmation: 'abc' } );
		} );

		it( 'should drop the Waiting descriptor', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			run = jsongin.ProcessResume( process_document, run, {} );
			assert.strictEqual( Object.keys( run ).includes( 'Waiting' ), false );
		} );

		it( 'should discard the result of a call which named no Into', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {} } }, { $do: { after: true } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			run = jsongin.ProcessExecute( process_document, jsongin.ProcessResume( process_document, run, { ignored: true } ) );
			assert.deepStrictEqual( run.State, { after: true } );
		} );

		it( 'should remove the field when the result is nothing', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {}, Into: 'a' } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { a: 1 } ) );
			run = jsongin.ProcessResume( process_document, run );
			assert.deepStrictEqual( run.State, {} );
		} );

		it( 'should write into a dotted path', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {}, Into: 'a.b' } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			run = jsongin.ProcessResume( process_document, run, 7 );
			assert.deepStrictEqual( run.State, { a: { b: 7 } } );
		} );

		it( 'should refuse a run which is not waiting', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } } ] };
			let run = jsongin.ProcessResume( process_document, jsongin.ProcessStart( process_document, {} ), 1 );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'ResumeNotWaiting' );
		} );

		it( 'should fail the run when the host reports the call failed', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {} } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			run = jsongin.ProcessResume( process_document, run, undefined, new Error( 'the card was declined' ) );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'StepFailed' );
			assert.strictEqual( run.Error.Message, 'the card was declined' );
			assert.deepStrictEqual( run.Error.Cursor, [ 0 ] );
		} );

		it( 'should take a code and a message from the host', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $call: { Name: 'X', With: {} } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			run = jsongin.ProcessResume( process_document, run, undefined, { Code: 'CardDeclined', Message: 'insufficient funds' } );
			assert.strictEqual( run.Error.Code, 'CardDeclined' );
			assert.strictEqual( run.Error.Message, 'insufficient funds' );
		} );

		it( 'should not modify the run it was given', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			let before = jsongin.Format( run, STORAGE );
			jsongin.ProcessResume( process_document, run, { confirmation: 'abc' } );
			assert.strictEqual( jsongin.Format( run, STORAGE ), before );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Stepping and Executing', () =>
	{

		it( 'should make stepping a halted run a no-op', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $return: 1 } ] };
			let done = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			let again = jsongin.ProcessStep( process_document, done );
			assert.deepStrictEqual( again, done );
		} );

		it( 'should return a new value rather than the run it was given', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $return: 1 } ] };
			let done = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.notStrictEqual( jsongin.ProcessStep( process_document, done ), done );
		} );

		it( 'should agree with repeated stepping', () =>
		{
			let process_document = checkout_process();
			let start = jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } );

			let stepped = start;
			while ( stepped.Status === 'ready' ) { stepped = jsongin.ProcessStep( process_document, stepped ); }
			let executed = jsongin.ProcessExecute( process_document, start );

			assert.deepStrictEqual( stepped, executed );
		} );

		it( 'should fail a run which does not halt within the budget', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } }, { $do: { b: 2 } }, { $do: { c: 3 } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ), 2 );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'StepLimitExceeded' );
		} );

		it( 'should take a budget large enough to finish', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } }, { $do: { b: 2 } } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ), 50 );
			assert.strictEqual( run.Status, 'done' );
		} );

		it( 'should step the same run twice to the same answer', () =>
		{
			let process_document = checkout_process();
			let start = jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } );
			assert.deepStrictEqual(
				jsongin.ProcessStep( process_document, start ),
				jsongin.ProcessStep( process_document, start ) );
		} );

		it( 'should keep two runs of one process apart', () =>
		{
			let process_document = checkout_process();
			let left = jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } );
			let right = jsongin.ProcessStart( process_document, { sub: 10, tax: 1 } );

			// One takes the Then branch and the other the Else, so they reach the call in a
			// different number of steps. Alternating until neither is ready is the point
			// anyway: the two are interleaved through the same engine.
			while ( ( left.Status === 'ready' ) || ( right.Status === 'ready' ) )
			{
				if ( left.Status === 'ready' ) { left = jsongin.ProcessStep( process_document, left ); }
				if ( right.Status === 'ready' ) { right = jsongin.ProcessStep( process_document, right ); }
			}

			assert.strictEqual( left.Waiting.With.amount, 97.2 );
			assert.strictEqual( right.Waiting.With.amount, 11 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Failure', () =>
	{

		it( 'should never throw, whatever it is handed', () =>
		{
			assert.doesNotThrow( function () { jsongin.ProcessStep( null, null ); } );
			assert.doesNotThrow( function () { jsongin.ProcessStep( { Steps: [] }, 'nope' ); } );
			assert.doesNotThrow( function () { jsongin.ProcessExecute( 42, [] ); } );
			assert.doesNotThrow( function () { jsongin.ProcessResume( undefined, undefined ); } );
		} );

		it( 'should always return a run', () =>
		{
			let run = jsongin.ProcessStep( null, null );
			assert.strictEqual( run.Status, 'failed' );
			assert.ok( Array.isArray( run.Cursor ) );
		} );

		it( 'should refuse a run which belongs to another process', () =>
		{
			let mine = { Name: 'Mine', Steps: [ { $do: { a: 1 } } ] };
			let yours = { Name: 'Yours', Steps: [ { $do: { a: 1 } } ] };
			let run = jsongin.ProcessStep( yours, jsongin.ProcessStart( mine, {} ) );
			assert.strictEqual( run.Status, 'failed' );
			assert.strictEqual( run.Error.Code, 'BadRun' );
		} );

		it( 'should refuse a run whose Status is not a status', () =>
		{
			let process_document = { Name: 'A', Steps: [] };
			let run = jsongin.ProcessStart( process_document, {} );
			run.Status = 'sideways';
			assert.strictEqual( jsongin.ProcessStep( process_document, run ).Error.Code, 'BadRun' );
		} );

		it( 'should report a step operator which is not registered', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $nosuchthing: 1 } ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Error.Code, 'UnknownOperator' );
		} );

		it( 'should report a step which is not a document with one key', () =>
		{
			let process_document = { Name: 'A', Steps: [ 42 ] };
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Error.Code, 'BadProcess' );

			process_document = { Name: 'B', Steps: [ { $do: { a: 1 }, $return: 1 } ] };
			run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.strictEqual( run.Error.Code, 'BadProcess' );
		} );

		it( 'should report a cursor which addresses nothing', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } } ] };
			let run = jsongin.ProcessStart( process_document, {} );
			run.Cursor = [ 0, 'Nowhere', 0 ];
			assert.strictEqual( jsongin.ProcessStep( process_document, run ).Error.Code, 'NoSuchStep' );
		} );

		it( 'should name the cursor the failure happened at', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } }, { $nosuchthing: 1 } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.Error.Cursor, [ 1 ] );
		} );

		it( 'should keep the state a failed run had reached', () =>
		{
			let process_document = { Name: 'A', Steps: [ { $do: { a: 1 } }, { $nosuchthing: 1 } ] };
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			assert.deepStrictEqual( run.State, { a: 1 } );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Storage', () =>
	{

		it( 'should write a run down and read it back unchanged', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessStep( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			let restored = jsongin.Parse( jsongin.Format( run, STORAGE ), STORAGE );
			assert.deepStrictEqual( restored, run );
		} );

		it( 'should step a stored run to the same place as the run it came from', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } );
			let restored = jsongin.Parse( jsongin.Format( run, STORAGE ), STORAGE );
			assert.deepStrictEqual(
				jsongin.ProcessStep( process_document, restored ),
				jsongin.ProcessStep( process_document, run ) );
		} );

		it( 'should keep $$NOW across storage, so a resumed run agrees with itself', () =>
		{
			let process_document = {
				Name: 'Now',
				Steps: [
					{ $call: { Name: 'X', With: {} } },
					{ $do: { at: '$$NOW' } },
				],
			};
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, {} ) );
			let started_at = run.Scope.Variables.NOW.getTime();

			let restored = jsongin.Parse( jsongin.Format( run, STORAGE ), STORAGE );
			restored = jsongin.ProcessExecute( process_document, jsongin.ProcessResume( process_document, restored ) );

			assert.strictEqual( restored.State.at.getTime(), started_at );
		} );

		it( 'should carry a state holding the values plain JSON cannot', () =>
		{
			let process_document = { Name: 'Typed', Steps: [ { $do: { copied: '$at' } } ] };
			let run = jsongin.ProcessStep( process_document,
				jsongin.ProcessStart( process_document, { at: new Date( '2020-01-01T00:00:00.000Z' ), pattern: /ab+c/i } ) );

			let restored = jsongin.Parse( jsongin.Format( run, STORAGE ), STORAGE );
			assert.ok( restored.State.copied instanceof Date );
			assert.ok( restored.State.pattern instanceof RegExp );
			assert.strictEqual( restored.State.pattern.flags, 'i' );
		} );

		it( 'should write a waiting run down with what it is waiting for', () =>
		{
			let process_document = checkout_process();
			let run = jsongin.ProcessExecute( process_document, jsongin.ProcessStart( process_document, { sub: 100, tax: 8 } ) );
			let restored = jsongin.Parse( jsongin.Format( run, STORAGE ), STORAGE );
			assert.deepStrictEqual( restored.Waiting, run.Waiting );
		} );

	} );


} );
