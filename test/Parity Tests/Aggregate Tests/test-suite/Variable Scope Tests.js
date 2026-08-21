'use strict';

const assert = require( 'assert' );

/*
	The expression variable scope: what MongoDB refuses.

	The behavior of the system variables and of the four binding operators is in
	`Variable Scope Gap Tests.js` until that suite graduates. This file holds the other half -
	the expressions MongoDB will not evaluate at all - and it is a separate file for one
	reason: ***a refusal test cannot live in a gap suite.*** An engine which has not built an
	operator refuses everything written with it, so the test would pass before a line of code
	was written and `parity-report` would read the operator as implemented. See the note at the
	foot of `Redact Gap Tests.js`, where exactly that happened.

	These tests assert only that the expression was refused, never the wording of the message.
	Two engines can agree that something is invalid while describing it differently.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Variable Scope Tests', () =>
	{

		let documents = [
			{ _id: 1, a: 3, list: [ 1, 2, 3, 4 ], sub: { a: 9 } },
		];


		//---------------------------------------------------------------------
		// Answers whether the engine refused to evaluate the expression.
		async function refused( Expression )
		{
			await Driver.SetData( documents );
			try
			{
				await Driver.Aggregate( [ { $project: { r: Expression } } ] );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		// Answers the evaluated value, for the cases which are accepted rather than refused.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		describe( 'Variable Names Which Do Not Resolve', () =>
		{

			it( 'should refuse a variable which is not bound', async () =>
			{
				assert.ok( await refused( '$$nope' ), '$$nope' );
				assert.ok( await refused( { $add: [ '$$nope', 1 ] } ), 'inside an operand' );
			} );

			it( 'should refuse a system variable written in the wrong case', async () =>
			{
				// A lowercase name is a user variable name, and no user bound these.
				assert.ok( await refused( '$$now' ), '$$now' );
				assert.ok( await refused( '$$root' ), '$$root' );
				assert.ok( await refused( '$$current' ), '$$current' );
				assert.ok( await refused( '$$remove' ), '$$remove' );
			} );

			it( 'should refuse $$this and $$value outside the operator which binds them', async () =>
			{
				assert.ok( await refused( '$$this' ), '$$this' );
				assert.ok( await refused( '$$value' ), '$$value' );
			} );

			it( 'should refuse $$this inside a $map which renamed the element', async () =>
			{
				// ***`as` renames the binding rather than adding one.*** The element is $$p
				// here and $$this is not bound at all.
				assert.ok( await refused(
					{ $map: { input: '$list', as: 'p', in: '$$this' } } ), '$map' );
				assert.ok( await refused(
					{ $filter: { input: '$list', as: 'p', cond: '$$this' } } ), '$filter' );
			} );

			it( 'should refuse a bound variable after the operator which bound it has finished', async () =>
			{
				assert.ok( await refused(
					{ $add: [ { $map: { input: '$list', in: '$$this' } }, '$$this' ] } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Variable Names Which Are Not Valid', () =>
		{

			it( 'should refuse a $let name which does not begin with a lowercase letter', async () =>
			{
				assert.ok( await refused( { $let: { vars: { X: 1 }, in: '$$X' } } ), 'uppercase' );
				assert.ok( await refused( { $let: { vars: { '1x': 1 }, in: '$$1x' } } ), 'a digit' );
				assert.ok( await refused( { $let: { vars: { '_x': 1 }, in: '$$_x' } } ), 'an underscore' );
			} );

			it( 'should refuse an as name which is not a valid variable name', async () =>
			{
				assert.ok( await refused( { $map: { input: '$list', as: 'P', in: '$$P' } } ), 'uppercase' );
				assert.ok( await refused( { $map: { input: '$list', as: '', in: '$$this' } } ), 'empty' );
				assert.ok( await refused( { $map: { input: '$list', as: '$$p', in: '$$p' } } ), 'written with the sigil' );
			} );

			it( 'should refuse a name whose later characters are not letters or digits', async () =>
			{
				assert.ok( await refused( { $let: { vars: { 'a-b': 1 }, in: 1 } } ), 'a hyphen' );
				assert.ok( await refused( { $let: { vars: { 'a b': 1 }, in: 1 } } ), 'a space' );
				assert.ok( await refused( { $let: { vars: { 'a$b': 1 }, in: 1 } } ), 'a dollar' );
				assert.ok( await refused( { $map: { input: '$list', as: 'a-b', in: 1 } } ), 'an as' );
			} );

			it( 'should accept an underscore anywhere but first', async () =>
			{
				// ***The first character and the rest follow different rules.*** An underscore
				// is refused as the first character and accepted after it, so the name rule
				// cannot be written as one character class applied to the whole name.
				assert.strictEqual( await evaluated( { $let: { vars: { 'a_b': 7 }, in: '$$a_b' } } ), 7 );
			} );

			it( 'should refuse an as which is not a string at all', async () =>
			{
				assert.ok( await refused( { $map: { input: '$list', as: 5, in: 1 } } ), 'a number' );
				assert.ok( await refused( { $map: { input: '$list', as: [ 'p' ], in: 1 } } ), 'an array' );
			} );

			it( 'should accept a name whose later characters are uppercase or digits', async () =>
			{
				assert.strictEqual( await evaluated( { $let: { vars: { myVar2: 7 }, in: '$$myVar2' } } ), 7 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Arguments the Binding Operators Refuse', () =>
		{

			it( 'should refuse a $let which is missing vars or in', async () =>
			{
				assert.ok( await refused( { $let: { vars: { x: 1 } } } ), 'no in' );
				assert.ok( await refused( { $let: { in: 1 } } ), 'no vars' );
				assert.ok( await refused( { $let: {} } ), 'neither' );
			} );

			it( 'should refuse an argument the operator does not have', async () =>
			{
				assert.ok( await refused( { $let: { vars: { x: 1 }, in: 1, nope: 1 } } ), '$let' );
				assert.ok( await refused( { $map: { input: '$list', in: 1, nope: 1 } } ), '$map' );
				assert.ok( await refused( { $filter: { input: '$list', cond: true, nope: 1 } } ), '$filter' );
				assert.ok( await refused( { $reduce: { input: '$list', initialValue: 0, in: 1, nope: 1 } } ), '$reduce' );
			} );

			it( 'should refuse an argument document which is missing a required argument', async () =>
			{
				assert.ok( await refused( { $map: { input: '$list' } } ), '$map with no in' );
				assert.ok( await refused( { $map: { in: '$$this' } } ), '$map with no input' );
				assert.ok( await refused( { $filter: { input: '$list' } } ), '$filter with no cond' );
				assert.ok( await refused( { $filter: { cond: true } } ), '$filter with no input' );
				assert.ok( await refused( { $reduce: { input: '$list', in: '$$value' } } ), '$reduce with no initialValue' );
				assert.ok( await refused( { $reduce: { input: '$list', initialValue: 0 } } ), '$reduce with no in' );
				assert.ok( await refused( { $reduce: { initialValue: 0, in: '$$value' } } ), '$reduce with no input' );
			} );

			it( 'should refuse an argument which is not a document', async () =>
			{
				assert.ok( await refused( { $let: '$list' } ), '$let' );
				assert.ok( await refused( { $map: '$list' } ), '$map' );
				assert.ok( await refused( { $filter: '$list' } ), '$filter' );
				assert.ok( await refused( { $reduce: '$list' } ), '$reduce' );
			} );

			it( 'should refuse vars which is not a document', async () =>
			{
				assert.ok( await refused( { $let: { vars: '$list', in: 1 } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Inputs the Array Operators Refuse', () =>
		{

			it( 'should refuse an input which is neither an array nor nothing', async () =>
			{
				// A null and a missing input answer with a null - see the gap suite. Anything
				// else which is not an array is refused.
				assert.ok( await refused( { $map: { input: '$a', in: '$$this' } } ), '$map' );
				assert.ok( await refused( { $filter: { input: '$a', cond: true } } ), '$filter' );
				assert.ok( await refused( { $reduce: { input: '$a', initialValue: 0, in: '$$value' } } ), '$reduce' );
				assert.ok( await refused( { $map: { input: '$sub', in: '$$this' } } ), 'a document' );
			} );

			it( 'should refuse a $filter limit which is not a positive integer', async () =>
			{
				assert.ok( await refused( { $filter: { input: '$list', cond: true, limit: 0 } } ), 'zero' );
				assert.ok( await refused( { $filter: { input: '$list', cond: true, limit: -1 } } ), 'negative' );
				assert.ok( await refused( { $filter: { input: '$list', cond: true, limit: 1.5 } } ), 'fractional' );
				assert.ok( await refused( { $filter: { input: '$list', cond: true, limit: 'two' } } ), 'a string' );
			} );

			it( 'should evaluate the limit as an expression', async () =>
			{
				let expression = { $filter: { input: '$list', cond: true, limit: { $add: [ '$a', -1 ] } } };
				assert.deepStrictEqual( await evaluated( expression ), [ 1, 2 ] );
			} );

			it( 'should take a limit which evaluates to nothing as no limit', async () =>
			{
				// A missing limit and a null one answer alike, which is not a given: the two
				// part company in $getField, one operator family over.
				let expression = { $filter: { input: '$list', cond: true, limit: '$nope' } };
				assert.deepStrictEqual( await evaluated( expression ), [ 1, 2, 3, 4 ] );
			} );

			it( 'should take a $map result which is nothing as a null', async () =>
			{
				// The same rule an array literal follows: a position cannot be left out
				// without moving every element after it, so it is filled with a null.
				let expression = { $map: { input: '$list', in: '$nope' } };
				assert.deepStrictEqual( await evaluated( expression ), [ null, null, null, null ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Where a Bound Variable Is Visible', () =>
		{

			it( 'should evaluate the vars of a $let in the scope around it', async () =>
			{
				// ***The bindings of one $let do not see each other.*** They are all evaluated
				// in the enclosing scope and bound together, so a var cannot be written in
				// terms of the var beside it. Two nested $let are how that is said.
				assert.ok( await refused(
					{ $let: { vars: { x: 1, y: '$$x' }, in: '$$y' } } ), 'a sibling var' );
				let nested = {
					$let: {
						vars: { x: 1 },
						in: { $let: { vars: { y: '$$x' }, in: '$$y' } },
					}
				};
				assert.strictEqual( await evaluated( nested ), 1 );
			} );

			it( 'should refuse the $redact variables outside $redact', async () =>
			{
				assert.ok( await refused( '$$DESCEND' ), '$$DESCEND' );
				assert.ok( await refused( '$$PRUNE' ), '$$PRUNE' );
				assert.ok( await refused( '$$KEEP' ), '$$KEEP' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'What $redact Refuses', () =>
		{

			//---------------------------------------------------------------------
			// $redact is a stage, so it is refused as a stage rather than as an expression.
			async function redact_refused( Expression )
			{
				await Driver.SetData( documents );
				try
				{
					await Driver.Aggregate( [ { $redact: Expression } ] );
					return false;
				}
				catch ( error )
				{
					return true;
				}
			}

			it( 'should refuse an expression which does not answer with one of its three variables', async () =>
			{
				assert.ok( await redact_refused( 'DESCEND' ), 'the name without the sigil' );
				assert.ok( await redact_refused( 1 ), 'a number' );
				assert.ok( await redact_refused( true ), 'a boolean' );
				assert.ok( await redact_refused( '$$ROOT' ), 'another system variable' );
				assert.ok( await redact_refused(
					{ $cond: [ false, '$$DESCEND', 'nope' ] } ), 'the branch which is taken' );
			} );

			it( 'should not mind a branch it does not take', async () =>
			{
				// ***The answer is checked, not the expression.*** $cond evaluates one branch,
				// so a branch which would have been invalid is never produced and never
				// refused. This is why the check cannot be made before the stage runs.
				await Driver.SetData( documents );
				let result = await Driver.Aggregate( [
					{ $redact: { $cond: [ true, '$$DESCEND', 'nope' ] } } ] );
				assert.strictEqual( result.length, 1 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The $getField Shorthand', () =>
		{

			it( 'should refuse the object form with no input', async () =>
			{
				// ***Only the string shorthand defaults to $$CURRENT.*** The object form with
				// no `input` looks like it should mean the same thing, and does not.
				assert.ok( await refused( { $getField: { field: 'a' } } ) );
			} );

			it( 'should refuse a shorthand name which is a field path', async () =>
			{
				assert.ok( await refused( { $getField: '$a' } ) );
			} );

		} );

	} );

};
