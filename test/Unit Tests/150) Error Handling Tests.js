'use strict';

const assert = require( 'assert' );
const NewJsongin = require( '../../src/jsongin' ).NewJsongin;
const jsongin = require( '../../src/jsongin' );

/*
	Covers the error and validation paths, which the rest of the suite never reaches.

	These paths are where defects hide. A message which is only built when something has
	already gone wrong is never executed by a test which asserts on success, so the code in it
	is not really code until something runs it. Three real bugs were found exactly here:
	six update operators called an undefined `Engine` variable, `$addToSet` also interpolated
	an undeclared `value`, and `Distinct` reported its failures under the name `Sort`.

	Two sweeps:
		1. Every engine function which throws reports itself to the OpError log first.
		2. Every operator rejects a malformed argument with the documented message.
*/


describe( '150) Error Handling Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'OpError Reporting', () =>
	{

		/*
			Each of these functions catches, reports to OpError, and rethrows. The assertion
			which matters is that the report is attributed to the right function: a copy-pasted
			catch block that names the wrong one is invisible without this.
		*/

		/*
			Parse is deliberately absent from this list. It is a forgiving parser which never
			throws: a string it cannot read comes back unchanged and the reason goes to OpLog,
			not OpError. Its reporting is covered by the Parse tests instead.
		*/

		let cases = [
			{ Name: 'Diff', Call: function ( E ) { E.Diff( 'x', {} ); } },
			{ Name: 'Invert', Call: function ( E ) { E.Invert( 'x', {} ); } },
			{ Name: 'Aggregate', Call: function ( E ) { E.Aggregate( {}, [] ); } },
			{ Name: 'Filter', Call: function ( E ) { E.Filter( {}, {} ); } },
			{ Name: 'Sort', Call: function ( E ) { E.Sort( {}, {} ); } },
			{ Name: 'Distinct', Call: function ( E ) { E.Distinct( {}, {} ); } },
			{ Name: 'Evaluate', Call: function ( E ) { E.Evaluate( {}, '$$nope' ); } },
			{ Name: 'Flatten', Call: function ( E ) { E.Flatten( 'x' ); } },
			{ Name: 'Expand', Call: function ( E ) { E.Expand( 'x' ); } },
			{ Name: 'GetValue', Call: function ( E ) { E.GetValue( {}, {} ); } },
			{ Name: 'SetValue', Call: function ( E ) { E.SetValue( 'x', 'a', 1 ); } },
			{ Name: 'DeleteValue', Call: function ( E ) { E.DeleteValue( 'x', 'a' ); } },
			{ Name: 'SplitPath', Call: function ( E ) { E.SplitPath( {} ); } },
			{ Name: 'JoinPaths', Call: function ( E ) { E.JoinPaths( {} ); } },
		];

		for ( let index = 0; index < cases.length; index++ )
		{
			let test_case = cases[ index ];

			it( `should report a ${test_case.Name} failure to the OpError log, and rethrow`, () =>
			{
				let errors = [];
				let engine = NewJsongin( { OpError: function ( Message ) { errors.push( Message ); } } );

				assert.throws( function () { test_case.Call( engine ); } );

				assert.ok( errors.length > 0, `${test_case.Name} reported nothing.` );
				assert.ok( errors[ 0 ].startsWith( `${test_case.Name}: ` ),
					`${test_case.Name} reported [${errors[ 0 ]}].` );
			} );
		}

		it( 'should stay silent when no OpError is configured', () =>
		{
			// The engine used by every other test file has no OpError. The functions must
			// still throw, and must not fail while trying to report.
			assert.throws( function () { jsongin.Diff( 'x', {} ); }, /must be an object/ );
			assert.throws( function () { jsongin.Flatten( 'x' ); }, /must be an object or array/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Declared Type Checking', () =>
	{

		/*
			Every operator declares the ShortTypes it takes, and the engine checks a value
			against that declaration before dispatching to the operator.

			These declarations went unread for a long time and drifted out of true while nothing
			was looking: $all declared 'o' while its code required 'a', $ne declared a narrower
			set than the $eq it negates, and the arithmetic operators declared 'a' while
			accepting a single operand without the enclosing array. A declaration which is
			narrower than the code turns working input into a rejection, so these guard it.
		*/

		it( 'should declare types which every operator actually accepts', () =>
		{
			// The cases which were wrong, kept as the record of what correct looks like.
			assert.strictEqual( jsongin.QueryOperators.$all.ValueTypes, 'a' );
			assert.strictEqual( jsongin.QueryOperators.$ne.ValueTypes, jsongin.QueryOperators.$eq.ValueTypes );
			assert.strictEqual( jsongin.QueryOperators.$nex.ValueTypes, jsongin.QueryOperators.$eqx.ValueTypes );
			assert.ok( jsongin.ExpressionOperators.$add.ArgTypes.includes( 's' ) );
			assert.ok( jsongin.ExpressionOperators.$and.ArgTypes.includes( 'b' ) );
		} );

		it( 'should give every operator a declaration to check against', () =>
		{
			let registries = [
				[ 'QueryOperators', 'ValueTypes' ],
				[ 'UpdateOperators', 'ValueTypes' ],
				[ 'ExpressionOperators', 'ArgTypes' ],
				[ 'StageOperators', 'ArgTypes' ],
				[ 'AccumulatorOperators', 'ArgTypes' ],
			];
			for ( let index = 0; index < registries.length; index++ )
			{
				let registry = registries[ index ][ 0 ];
				let member = registries[ index ][ 1 ];
				let names = Object.keys( jsongin[ registry ] );
				for ( let name_index = 0; name_index < names.length; name_index++ )
				{
					let name = names[ name_index ];
					assert.strictEqual( jsongin.ShortType( jsongin[ registry ][ name ][ member ] ), 's',
						`${registry}.${name} has no ${member}.` );
				}
			}
		} );

		it( 'should reject a query value the operator does not take', () =>
		{
			// A malformed query throws rather than reporting that nothing matched, which is a
			// legitimate answer and would hide the mistake. MongoDB refuses it too.
			let messages = [];
			let engine = NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );

			assert.throws(
				function () { engine.Query( { a: [ 1, 2 ] }, { a: { $size: 'two' } } ); },
				/does not take a value of type/ );
			assert.ok( messages.some( function ( m ) { return m.includes( 'does not take a value of type' ); } ),
				`nothing reported the rejection: ${JSON.stringify( messages )}` );
		} );

		it( 'should refuse an update operator whose value it does not take', () =>
		{
			// This used to be skipped, which returned the document unchanged and left the
			// caller unable to tell that anything had gone wrong.
			let messages = [];
			let engine = NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );

			assert.throws(
				function () { engine.Update( { a: 1 }, { $set: 'abc' } ); },
				/does not take a value of type/ );
			assert.ok( messages.some( function ( m ) { return m.includes( 'does not take a value of type' ); } ) );
		} );

		it( 'should throw for a stage argument it does not take', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $limit: 'abc' } ] ); },
				/does not take an argument of type/ );
		} );

		it( 'should throw for an expression argument it does not take', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: 5 } ); },
				/does not take an argument of type/ );
		} );

		it( 'should throw for an accumulator argument it does not take', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: { _id: null, n: { $count: 'x' } } } ] ); },
				/does not take an argument of type/ );
		} );

		it( 'should let a declared type through', () =>
		{
			// The forms which the corrected declarations have to keep working.
			assert.strictEqual( jsongin.Query( { t: [ 'a', 'b' ] }, { t: { $all: [ 'a' ] } } ), true );
			assert.strictEqual( jsongin.Query( { a: 'x' }, { a: { $ne: /y/ } } ), true );
			assert.strictEqual( jsongin.Evaluate( { a: 5 }, { $add: '$a' } ), 5 );
			assert.strictEqual( jsongin.Evaluate( { a: 5 }, { $multiply: '$a' } ), 5 );
			assert.strictEqual( jsongin.Evaluate( {}, { $and: true } ), true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Expression Operator Argument Validation', () =>
	{

		let two_argument_operators = [ '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$cmp' ];

		for ( let index = 0; index < two_argument_operators.length; index++ )
		{
			let name = two_argument_operators[ index ];

			it( `should reject a non-array argument to ${name}`, () =>
			{
				// Evaluate() checks the argument against the operator's declared ArgTypes
				// before it dispatches, so that is what a caller sees.
				assert.throws( function () { jsongin.Evaluate( {}, { [ name ]: 'abc' } ); },
					/does not take an argument of type/ );
				// The operator keeps its own check for a direct call, which now has to supply
				// a scope the way the dispatcher would have.
				assert.throws( function () { jsongin.ExpressionOperators[ name ].Evaluate( {}, 'abc', jsongin.Scope.NewDocument( {} ) ); },
					/requires an array of two arguments/ );
			} );

			it( `should reject the wrong argument count to ${name}`, () =>
			{
				assert.throws( function () { jsongin.Evaluate( {}, { [ name ]: [ 1 ] } ); },
					/requires exactly two arguments/ );
				assert.throws( function () { jsongin.Evaluate( {}, { [ name ]: [ 1, 2, 3 ] } ); },
					/requires exactly two arguments/ );
			} );
		}

		it( 'should reject a malformed $cond', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $cond: { then: 1, else: 2 } } ); }, /requires an \[if\] field/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $cond: { if: true, else: 2 } } ); }, /requires a \[then\] field/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $cond: { if: true, then: 1 } } ); }, /requires an \[else\] field/ );
		} );

		it( 'should reject a malformed $switch', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: 'abc' } ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.ExpressionOperators.$switch.Evaluate( {}, 'abc' ); }, /\$switch: requires an object/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: { branches: [ 'abc' ] } } ); }, /each branch must be/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: { branches: [ { then: 1 } ] } } ); }, /each branch requires/ );
			assert.throws( function () { jsongin.Evaluate( {}, { $switch: { branches: [ { case: true } ] } } ); }, /each branch requires/ );
		} );

		it( 'should reject a malformed $ifNull', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $ifNull: 'abc' } ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.ExpressionOperators.$ifNull.Evaluate( {}, 'abc' ); }, /\$ifNull: requires an array/ );
		} );

		it( 'should reject two date operands to $add', () =>
		{
			assert.throws( function () { jsongin.Evaluate( {}, { $add: [ new Date( 0 ), new Date( 1 ) ] } ); },
				/only one date operand is allowed/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Update Operator Argument Validation', () =>
	{

		let operators = Object.keys( jsongin.UpdateOperators );

		it( 'should cover every registered update operator', () =>
		{
			assert.strictEqual( operators.length, 14 );
		} );

		for ( let index = 0; index < operators.length; index++ )
		{
			let name = operators[ index ];

			it( `should reject a non-object UpdateFields for ${name}`, () =>
			{
				assert.throws( function () { jsongin.UpdateOperators[ name ].Update( {}, 'abc' ); },
					/The UpdateFields parameter must be an object/ );
				assert.throws( function () { jsongin.UpdateOperators[ name ].Update( {}, [ 1 ] ); },
					/The UpdateFields parameter must be an object/ );
			} );
		}

	} );


	//---------------------------------------------------------------------
	describe( 'Operator OpError Reporting', () =>
	{

		/*
			Every operator catches, reports to OpError, and rethrows. The report is built from
			a template, and a template is not executed until something makes the operator fail
			with an OpError configured. That is the exact combination which hid the undefined
			`Engine` reference in six update operators, and the undefined `value` in $addToSet.

			Rather than hand-maintaining a fixture per operator, each is handed input it cannot
			accept. Operators which reject it must name themselves in the report. Operators
			which tolerate it are skipped, and the counts below stop the sweep from quietly
			degrading into testing nothing.
		*/

		function reporting_engine( Errors )
		{
			return NewJsongin( { OpError: function ( Message ) { Errors.push( Message ); } } );
		}

		// Returns the number of operators which threw and reported themselves correctly.
		//
		// Invoke may be a single function or a list of them. An operator which tolerates the
		// first input is offered the next, and counts as reporting if any of them makes it
		// fail. ***One input is not enough to reach every operator***: $type, $isNumber,
		// $toBool, and $toString all accept a string quite happily, and were being skipped
		// here with their report line never executed.
		function sweep( Registry, Prefix, Invoke )
		{
			let attempts = Array.isArray( Invoke ) ? Invoke : [ Invoke ];
			let names = Object.keys( jsongin[ Registry ] );
			let reported = 0;
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				for ( let attempt = 0; attempt < attempts.length; attempt++ )
				{
					let errors = [];
					let engine = reporting_engine( errors );
					let threw = false;
					try
					{
						attempts[ attempt ]( engine, name );
					}
					catch ( error )
					{
						threw = true;
						assert.ok( errors.length > 0, `${name} threw without reporting.` );
						assert.ok( errors[ 0 ].startsWith( `${Prefix}${name}: ` ),
							`${name} reported [${errors[ 0 ]}].` );
						reported++;
					}
					if ( threw ) { break; }
				}
			}
			return reported;
		}

		it( 'should report from every expression operator which rejects its argument', () =>
		{
			// Called directly rather than through Evaluate(), which would reject the argument
			// on the operator's behalf and report under its own name instead.
			//
			// The second input reaches the operators which accept a string: two operands is
			// the wrong number for any of them.
			let reported = sweep( 'ExpressionOperators', 'Expression.', [
				function ( Engine, Name ) { Engine.ExpressionOperators[ Name ].Evaluate( {}, 'abc' ); },
				function ( Engine, Name ) { Engine.ExpressionOperators[ Name ].Evaluate( {}, [ 'abc', 'abc' ] ); },
			] );
			assert.ok( reported >= 18, `only ${reported} expression operators reported.` );
		} );

		it( 'should report from every update operator which rejects its argument', () =>
		{
			let reported = sweep( 'UpdateOperators', 'Update.',
				function ( Engine, Name ) { Engine.UpdateOperators[ Name ].Update( {}, 'abc' ); } );
			assert.strictEqual( reported, 14 );
		} );

		it( 'should report from every accumulator which rejects its argument', () =>
		{
			let reported = sweep( 'AccumulatorOperators', 'Accumulator.',
				function ( Engine, Name ) { Engine.AccumulatorOperators[ Name ].Accumulate( 'abc', '$n', Engine.Scope.NewPipeline() ); } );
			assert.strictEqual( reported, 20 );
		} );

		it( 'should report from every stage which rejects its argument', () =>
		{
			let reported = sweep( 'StageOperators', 'Stage.',
				function ( Engine, Name )
				{
					// A number is a valid argument to $limit and $skip, and a string is a
					// valid argument to $unwind, so no single bad value suits every stage.
					let bad = 3;
					if ( ( Name === '$limit' ) || ( Name === '$skip' ) ) { bad = 'abc'; }

					// ***The stream has a document in it***, which matters for $replaceWith:
					// it takes any expression and only the result has to be a document, so
					// with an empty stream there is nothing for it to object to and it would
					// be the one stage in the sweep which never reported. Verified against
					// MongoDB, which does not complain either - see the parity suite.
					Engine.StageOperators[ Name ].Stage( [ { n: 1 } ], bad );
				} );
			assert.strictEqual( reported, 21 );
		} );

		it( 'should report from the query operators which reject their argument', () =>
		{
			let reported = sweep( 'QueryOperators', 'Query.',
				function ( Engine, Name ) { Engine.QueryOperators[ Name ].Query( { a: 1 }, 'abc', 'a' ); } );
			// Most query operators tolerate anything and simply return false, which is their
			// documented behavior. This asserts only that the ones which do throw report well.
			assert.ok( reported >= 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Aggregation Argument Validation', () =>
	{

		// A valid argument for each accumulator, so that the test below is answered by the
		// Documents check and not by argument validation happening to run first. The N and
		// ranked accumulators take an argument document rather than a bare expression, and
		// giving them a bare one would make them throw for the wrong reason - which would
		// leave a non-array group untested for exactly the operators added last.
		function valid_args( Name )
		{
			if ( Name === '$count' ) { return {}; }
			if ( [ '$firstN', '$lastN', '$minN', '$maxN' ].includes( Name ) ) { return { input: '$n', n: 1 }; }
			if ( [ '$top', '$bottom' ].includes( Name ) ) { return { sortBy: { n: 1 }, output: '$n' }; }
			if ( [ '$topN', '$bottomN' ].includes( Name ) ) { return { n: 1, sortBy: { n: 1 }, output: '$n' }; }
			return '$n';
		}

		it( 'should reject a non-array Documents to every accumulator', () =>
		{
			let names = Object.keys( jsongin.AccumulatorOperators );
			assert.strictEqual( names.length, 20 );
			for ( let index = 0; index < names.length; index++ )
			{
				assert.throws(
					function () { jsongin.AccumulatorOperators[ names[ index ] ].Accumulate( 'abc', valid_args( names[ index ] ), jsongin.Scope.NewPipeline() ); },
					/Documents must be an array/,
					`${names[ index ]} accepted a non-array.` );
			}
		} );

		it( 'should reject a document in the pipeline which is not an object', () =>
		{
			// Every stage emits documents, so this can only come from the caller's own input.
			// The index is named so that the one bad document can be found in a long list.
			assert.throws(
				function () { jsongin.Aggregate( [ 5 ], [ { $project: { a: 1 } } ] ); },
				/Unable to project the document at index \[0\]/ );
			assert.throws(
				function () { jsongin.Aggregate( [ { a: 1 }, 7 ], [ { $project: { a: 1 } } ] ); },
				/Unable to project the document at index \[1\]/ );
		} );

		it( 'should reject a malformed argument to every stage', () =>
		{
			// Each stage rejects a string where its own argument type is required. $unwind,
			// $count and $unset are the exceptions: a string is one of $unwind's two valid
			// forms, is the only form $count takes, and is a single field path to $unset, so
			// all three are given a number instead.
			//
			// ***The stream has a document in it***, because $replaceWith takes any expression
			// and only the result has to be a document. Over an empty stream it has nothing to
			// object to, and MongoDB does not object either - which makes this a statement
			// about when a stage validates, not about whether it does. See the parity suite.
			let names = Object.keys( jsongin.StageOperators );
			assert.strictEqual( names.length, 21 );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let bad = [ '$unwind', '$count', '$unset' ].includes( name ) ? 3 : 'abc';
				assert.throws(
					function () { jsongin.StageOperators[ name ].Stage( [ { n: 1 } ], bad ); },
					`${name} accepted a malformed argument.` );
			}
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Operators Called Directly', () =>
	{

		/*
			`Query()` checks a value against the operator's declared ValueTypes before
			dispatching, so an operator reached through a query never sees a value of the wrong
			type. An operator called ***directly*** has no such dispatcher in front of it, and
			validates its own value instead — the convention `Query.js` records as "an operator
			is still free to validate its own value, and does when it is called directly rather
			than through here".

			These are statements about the jsongin API, not about MongoDB, which is why they are
			unit tests: there is no way to ask a MongoDB server what a single operator does with
			a value the query language would have rejected before it got there.

			A direct call answers false rather than throwing. The refusal belongs to the query
			language, and one operator asked about one value has no query to refuse.
		*/

		it( 'should answer false for a $type value which is not a number, string or array', () =>
		{
			assert.strictEqual( jsongin.QueryOperators.$type.Query( { a: 1 }, true, 'a' ), false );
			assert.strictEqual( jsongin.QueryOperators.$type.Query( { a: 1 }, null, 'a' ), false );
			assert.strictEqual( jsongin.QueryOperators.$type.Query( { a: 1 }, { x: 1 }, 'a' ), false );
		} );

		it( 'should answer false for a $regex value which is not a string or regexp', () =>
		{
			assert.strictEqual( jsongin.QueryOperators.$regex.Query( { a: 'x' }, 5, 'a' ), false );
			assert.strictEqual( jsongin.QueryOperators.$regex.Query( { a: 'x' }, null, 'a' ), false );
			assert.strictEqual( jsongin.QueryOperators.$regex.Query( { a: 'x' }, [ 'x' ], 'a' ), false );
		} );

		it( 'should run a query handed directly to $ImplicitEq', () =>
		{
			// The dispatcher routes a query away from $ImplicitEq, so this branch is for
			// callers which reach the operator themselves. An object holding an operator is a
			// query to evaluate against the field, not a value to compare it against.
			assert.strictEqual( jsongin.QueryOperators.$ImplicitEq.Query( { a: 9 }, { $gt: 5 }, 'a' ), true );
			assert.strictEqual( jsongin.QueryOperators.$ImplicitEq.Query( { a: 1 }, { $gt: 5 }, 'a' ), false );

			// A document which holds no operator is still an ordinary value to compare.
			assert.strictEqual( jsongin.QueryOperators.$ImplicitEq.Query( { a: { x: 1 } }, { x: 1 }, 'a' ), true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Query Parameters', () =>
	{

		/*
			Statements about the jsongin API rather than about MongoDB, which is why they are
			here rather than in the Parity Tests. A driver never gets to ask MongoDB what a
			non-object criteria means, because the parameter never reaches the server.

			The split is the one `Query()` documents: a malformed ***criteria*** throws, because
			the caller could not have meant it, while a ***document*** which is not an object
			returns false, because that is a statement about the data and "no match" is a
			truthful answer for it.
		*/

		it( 'should return false when the document is not an object', () =>
		{
			assert.strictEqual( jsongin.Query( 5, { a: 1 } ), false );
			assert.strictEqual( jsongin.Query( 'text', { a: 1 } ), false );
			assert.strictEqual( jsongin.Query( null, { a: 1 } ), false );
			assert.strictEqual( jsongin.Query( [ { a: 1 } ], { a: 1 } ), false );
		} );

		it( 'should refuse a criteria which is not an object', () =>
		{
			assert.throws( function () { jsongin.Query( { a: 1 }, 5 ); }, /The Criteria parameter must be an object/ );
			assert.throws( function () { jsongin.Query( { a: 1 }, 'text' ); }, /The Criteria parameter must be an object/ );
			assert.throws( function () { jsongin.Query( { a: 1 }, null ); }, /The Criteria parameter must be an object/ );
		} );

		it( 'should refuse an implicit $eq against undefined', () =>
		{
			// undefined is not a value to compare against, and the mistake it usually is — a
			// missing variable — should not quietly become "no match". $exists is the operator
			// for asking whether a field is there.
			assert.throws(
				function () { jsongin.Query( { a: 1 }, { a: undefined } ); },
				/The implicit \$eq operator cannot be set to undefined/ );
		} );

	} );


} );
