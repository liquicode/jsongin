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
			{ Name: 'Evaluate', Call: function ( E ) { E.Evaluate( {}, '$$ROOT' ); } },
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
			let messages = [];
			let engine = NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );

			assert.strictEqual( engine.Query( { a: [ 1, 2 ] }, { a: { $size: 'two' } } ), false );
			assert.ok( messages.some( function ( m ) { return m.includes( 'does not take a value of type' ); } ),
				`nothing reported the rejection: ${JSON.stringify( messages )}` );
		} );

		it( 'should skip an update operator whose value it does not take', () =>
		{
			let messages = [];
			let engine = NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );

			let updated = engine.Update( { a: 1 }, { $set: 'abc' } );
			assert.deepStrictEqual( updated, { a: 1 } );
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
				// The operator keeps its own check for a direct call.
				assert.throws( function () { jsongin.ExpressionOperators[ name ].Evaluate( {}, 'abc' ); },
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
			assert.strictEqual( operators.length, 12 );
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
		function sweep( Registry, Prefix, Invoke )
		{
			let names = Object.keys( jsongin[ Registry ] );
			let reported = 0;
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let errors = [];
				let engine = reporting_engine( errors );
				try
				{
					Invoke( engine, name );
				}
				catch ( error )
				{
					assert.ok( errors.length > 0, `${name} threw without reporting.` );
					assert.ok( errors[ 0 ].startsWith( `${Prefix}${name}: ` ),
						`${name} reported [${errors[ 0 ]}].` );
					reported++;
				}
			}
			return reported;
		}

		it( 'should report from every expression operator which rejects its argument', () =>
		{
			// Called directly rather than through Evaluate(), which would reject the argument
			// on the operator's behalf and report under its own name instead.
			let reported = sweep( 'ExpressionOperators', 'Expression.',
				function ( Engine, Name ) { Engine.ExpressionOperators[ Name ].Evaluate( {}, 'abc' ); } );
			assert.ok( reported >= 14, `only ${reported} expression operators reported.` );
		} );

		it( 'should report from every update operator which rejects its argument', () =>
		{
			let reported = sweep( 'UpdateOperators', 'Update.',
				function ( Engine, Name ) { Engine.UpdateOperators[ Name ].Update( {}, 'abc' ); } );
			assert.strictEqual( reported, 12 );
		} );

		it( 'should report from every accumulator which rejects its argument', () =>
		{
			let reported = sweep( 'AccumulatorOperators', 'Accumulator.',
				function ( Engine, Name ) { Engine.AccumulatorOperators[ Name ].Accumulate( 'abc', '$n' ); } );
			assert.strictEqual( reported, 8 );
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
					Engine.StageOperators[ Name ].Stage( [], bad );
				} );
			assert.strictEqual( reported, 9 );
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

		it( 'should reject a non-array Documents to every accumulator', () =>
		{
			let names = Object.keys( jsongin.AccumulatorOperators );
			assert.strictEqual( names.length, 8 );
			for ( let index = 0; index < names.length; index++ )
			{
				let args = ( names[ index ] === '$count' ) ? {} : '$n';
				assert.throws(
					function () { jsongin.AccumulatorOperators[ names[ index ] ].Accumulate( 'abc', args ); },
					/Documents must be an array/,
					`${names[ index ]} accepted a non-array.` );
			}
		} );

		it( 'should reject a malformed argument to every stage', () =>
		{
			// Each stage rejects a string where its own argument type is required. $unwind is
			// the exception: a string is one of its two valid forms, so it is given a number.
			let names = Object.keys( jsongin.StageOperators );
			assert.strictEqual( names.length, 9 );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let bad = ( name === '$unwind' ) ? 3 : 'abc';
				if ( ( name === '$limit' ) || ( name === '$skip' ) ) { bad = 'abc'; }
				assert.throws(
					function () { jsongin.StageOperators[ name ].Stage( [], bad ); },
					`${name} accepted a malformed argument.` );
			}
		} );

	} );


} );
