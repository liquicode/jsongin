'use strict';

const assert = require( 'assert' );

/*
	Expression variable scope: the system variables, and the four operators which bind one.

	***This is a gap suite***, so every test here passes under MongoDB and fails under jsongin
	by design. It is loaded by `Aggregate Gaps.js` and not by the parity inventory. See
	Standing Decision 6 in .plans/story.md: a gap nothing measures is a gap nobody revisits.

	***Everything here is blocked by one missing parameter.*** `Evaluate( Document, Expression )`
	takes two values and has nowhere to carry a variable binding, so it refuses every name
	beginning with `$$` outright. That single refusal is what stands between jsongin and:

		the system variables    $$ROOT, $$CURRENT, $$NOW, $$REMOVE
		the bound variables     $$this, $$value, and any name a caller chooses
		the binding operators   $let, $map, $filter, $reduce
		the shorthand forms     { $getField: 'name' }, which reads from $$CURRENT
		the stage               $redact, which answers with $$DESCEND / $$PRUNE / $$KEEP

	`$redact` has its own file - see `Redact Gap Tests.js` - because it is a stage rather than
	an expression. Everything else in the cluster is here. This is Bucket C of
	.reviews/2026-08-19/review.md, and it is the one item in that review which is bigger than
	"write an operator".

	***There are no refusal tests in this file, and that is deliberate.*** jsongin refuses
	every one of these expressions today, for the single wrong reason that `$$` is refused and
	the four operators are not registered. A test asserting a refusal would therefore pass, and
	`parity-report` would read it as an operator which already exists. The same trap caught a
	`$redact` test - see the note at the end of `Redact Gap Tests.js`. A gap suite states what
	MongoDB ***does***. The refusal questions are listed at the foot of this file and get
	settled against the server when the family graduates.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Variable Scope Gap Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				a: 3,
				list: [ 1, 2, 3, 4 ],
				people: [ { name: 'ann', age: 30 }, { name: 'bob', age: 20 } ],
				nests: [ [ 1, 2 ], [ 3 ] ],
				truthy: [ 0, 1, null, '', 'x', false, true ],
				empty_list: [],
				empty: null,
				sub: { a: 9, b: 2 },
			},
		];


		//---------------------------------------------------------------------
		// Evaluates an expression as a computed field of a $project stage, and returns the
		// projected document rather than the value.
		//
		// The document is what is returned because an expression which produces ***no value***
		// leaves the field out entirely, and that is a distinct answer from producing a null.
		// $$REMOVE exists precisely to produce it.
		async function projected( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ];
		}


		//---------------------------------------------------------------------
		async function evaluated( Expression )
		{
			let document = await projected( Expression );
			return document.r;
		}


		//---------------------------------------------------------------------
		async function piped( Documents, Pipeline )
		{
			await Driver.SetData( Documents );
			return await Driver.Aggregate( Pipeline );
		}


		//---------------------------------------------------------------------
		describe( 'System Variables', () =>
		{

			it( 'should give the whole document as $$ROOT', async () =>
			{
				let result = await piped(
					[ { _id: 1, a: 3, sub: { b: 4 } } ],
					[ { $project: { _id: 0, r: '$$ROOT' } } ] );
				assert.deepStrictEqual( result[ 0 ].r, { _id: 1, a: 3, sub: { b: 4 } } );
			} );

			it( 'should give the stage input as $$ROOT and not the stored document', async () =>
			{
				// ***$$ROOT is the root of the document the stage is looking at***, which is
				// not the same thing as the document the collection holds once an earlier
				// stage has reshaped it.
				let result = await piped(
					[ { _id: 1, a: 3, b: 4 } ],
					[
						{ $project: { _id: 0, a: 1 } },
						{ $project: { r: '$$ROOT' } },
					] );
				assert.deepStrictEqual( result[ 0 ].r, { a: 3 } );
			} );

			it( 'should give the same document as $$CURRENT', async () =>
			{
				let result = await piped(
					[ { _id: 1, a: 3 } ],
					[ { $project: { _id: 0, r: '$$CURRENT' } } ] );
				assert.deepStrictEqual( result[ 0 ].r, { _id: 1, a: 3 } );
			} );

			it( 'should walk a path into a system variable', async () =>
			{
				assert.strictEqual( await evaluated( '$$ROOT.sub.a' ), 9 );
				assert.strictEqual( await evaluated( '$$CURRENT.sub.a' ), 9 );
				// A plain '$a' is the shorthand for '$$CURRENT.a', and answers the same.
				assert.strictEqual( await evaluated( '$$CURRENT.a' ), 3 );
			} );

			it( 'should give a path which the variable does not have no value at all', async () =>
			{
				assert.deepStrictEqual( await projected( '$$ROOT.nope' ), {} );
			} );

			it( 'should give the current time as $$NOW', async () =>
			{
				let result = await piped(
					[ { _id: 1 } ],
					[ { $project: { _id: 0, r: '$$NOW' } } ] );
				assert.strictEqual( result[ 0 ].r instanceof Date, true );
			} );

			it( 'should give every document in one pipeline the same $$NOW', async () =>
			{
				let result = await piped(
					[ { _id: 1 }, { _id: 2 } ],
					[ { $project: { _id: 1, r: '$$NOW' } } ] );
				assert.strictEqual( result[ 0 ].r.getTime(), result[ 1 ].r.getTime() );
			} );

			it( 'should give every stage in one pipeline the same $$NOW', async () =>
			{
				let result = await piped(
					[ { _id: 1 } ],
					[
						{ $addFields: { first: '$$NOW' } },
						{ $addFields: { second: '$$NOW' } },
						{ $project: { _id: 0, r: { $eq: [ '$first', '$second' ] } } },
					] );
				assert.strictEqual( result[ 0 ].r, true );
			} );

			it( 'should leave a field out of a projection with $$REMOVE', async () =>
			{
				let result = await piped(
					[ { _id: 1, a: 3, b: 4 } ],
					[ { $project: { a: 1, b: '$$REMOVE' } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, a: 3 } );
			} );

			it( 'should remove a field conditionally with $$REMOVE', async () =>
			{
				// ***This is what $$REMOVE is for***: the same projection keeps the field on
				// one document and drops it from another, which no inclusion spec can say.
				let result = await piped(
					[ { _id: 1, a: 3 }, { _id: 2, a: 9 } ],
					[ { $project: { a: { $cond: [ { $gt: [ '$a', 5 ] }, '$a', '$$REMOVE' ] } } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1 } );
				assert.deepStrictEqual( result[ 1 ], { _id: 2, a: 9 } );
			} );

			it( 'should remove an existing field from $addFields with $$REMOVE', async () =>
			{
				let result = await piped(
					[ { _id: 1, a: 3, b: 4 } ],
					[ { $addFields: { b: '$$REMOVE' } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, a: 3 } );
			} );

			it( 'should give a null for a $$REMOVE in an array position', async () =>
			{
				// ***$$REMOVE only removes where something can be absent.*** A document can
				// leave a field out; an array cannot leave a position out without moving
				// every element after it, so the position is filled with a null instead. A
				// missing field path in the same position answers the same way, which says
				// this is the array literal's rule rather than anything $$REMOVE decides.
				assert.deepStrictEqual( await evaluated( [ 1, '$$REMOVE', 3 ] ), [ 1, null, 3 ] );
				assert.deepStrictEqual( await evaluated( [ 1, '$nope', 3 ] ), [ 1, null, 3 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Binding Variables with $let', () =>
		{

			it( 'should bind a variable and use it in the in expression', async () =>
			{
				let expression = { $let: { vars: { x: 5 }, in: { $add: [ '$$x', '$a' ] } } };
				assert.strictEqual( await evaluated( expression ), 8 );
			} );

			it( 'should evaluate a variable value as an expression', async () =>
			{
				let expression = { $let: { vars: { doubled: { $multiply: [ '$a', 2 ] } }, in: '$$doubled' } };
				assert.strictEqual( await evaluated( expression ), 6 );
			} );

			it( 'should walk a path into a bound variable', async () =>
			{
				let expression = { $let: { vars: { s: '$sub' }, in: '$$s.a' } };
				assert.strictEqual( await evaluated( expression ), 9 );
			} );

			it( 'should still read the document from inside the in expression', async () =>
			{
				// ***Binding a variable does not rebind the document.*** A field path inside
				// `in` still resolves against $$CURRENT, which $let leaves alone.
				let expression = { $let: { vars: { x: 1 }, in: { $add: [ '$$x', '$$ROOT.a' ] } } };
				assert.strictEqual( await evaluated( expression ), 4 );
			} );

			it( 'should see an outer variable from an inner $let', async () =>
			{
				let expression = {
					$let: {
						vars: { x: 1 },
						in: { $let: { vars: { y: '$$x' }, in: '$$y' } },
					}
				};
				assert.strictEqual( await evaluated( expression ), 1 );
			} );

			it( 'should shadow an outer variable and restore it afterwards', async () =>
			{
				// The inner binding of x wins inside the inner `in`, and the outer one is
				// still 1 in the operand beside it.
				let expression = {
					$let: {
						vars: { x: 1 },
						in: {
							$add: [
								{ $let: { vars: { x: 10 }, in: '$$x' } },
								'$$x',
							]
						},
					}
				};
				assert.strictEqual( await evaluated( expression ), 11 );
			} );

			it( 'should bind a variable to a missing value', async () =>
			{
				let expression = { $let: { vars: { m: '$nope' }, in: '$$m' } };
				assert.deepStrictEqual( await projected( expression ), {} );
				let guarded = { $let: { vars: { m: '$nope' }, in: { $ifNull: [ '$$m', 'gone' ] } } };
				assert.strictEqual( await evaluated( guarded ), 'gone' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Transforming an Array with $map', () =>
		{

			it( 'should map every element, which $$this names by default', async () =>
			{
				let expression = { $map: { input: '$list', in: { $multiply: [ '$$this', 2 ] } } };
				assert.deepStrictEqual( await evaluated( expression ), [ 2, 4, 6, 8 ] );
			} );

			it( 'should name the element with as', async () =>
			{
				let expression = { $map: { input: '$people', as: 'p', in: '$$p.name' } };
				assert.deepStrictEqual( await evaluated( expression ), [ 'ann', 'bob' ] );
			} );

			it( 'should still read the document from inside the in expression', async () =>
			{
				// A field path inside `in` reads the ***document***, not the element. This is
				// the single most common way to get $map wrong.
				let expression = { $map: { input: '$list', in: '$a' } };
				assert.deepStrictEqual( await evaluated( expression ), [ 3, 3, 3, 3 ] );
			} );

			it( 'should shadow $$this in a nested $map', async () =>
			{
				let expression = {
					$map: {
						input: '$nests',
						in: { $map: { input: '$$this', in: { $add: [ '$$this', 1 ] } } },
					}
				};
				assert.deepStrictEqual( await evaluated( expression ), [ [ 2, 3 ], [ 4 ] ] );
			} );

			it( 'should map an empty array to an empty array', async () =>
			{
				let expression = { $map: { input: '$empty_list', in: '$$this' } };
				assert.deepStrictEqual( await evaluated( expression ), [] );
			} );

			it( 'should answer a null input with a null', async () =>
			{
				let expression = { $map: { input: '$empty', in: '$$this' } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

			it( 'should answer a missing input with a null', async () =>
			{
				let expression = { $map: { input: '$nope', in: '$$this' } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Selecting from an Array with $filter', () =>
		{

			it( 'should keep the elements whose cond is true', async () =>
			{
				let expression = { $filter: { input: '$list', cond: { $gt: [ '$$this', 2 ] } } };
				assert.deepStrictEqual( await evaluated( expression ), [ 3, 4 ] );
			} );

			it( 'should name the element with as', async () =>
			{
				let expression = { $filter: { input: '$people', as: 'p', cond: { $lt: [ '$$p.age', 25 ] } } };
				assert.deepStrictEqual( await evaluated( expression ), [ { name: 'bob', age: 20 } ] );
			} );

			it( 'should stop at limit matches', async () =>
			{
				let expression = { $filter: { input: '$list', cond: { $gt: [ '$$this', 0 ] }, limit: 2 } };
				assert.deepStrictEqual( await evaluated( expression ), [ 1, 2 ] );
			} );

			it( 'should ignore a limit larger than the number of matches', async () =>
			{
				let expression = { $filter: { input: '$list', cond: { $gt: [ '$$this', 3 ] }, limit: 9 } };
				assert.deepStrictEqual( await evaluated( expression ), [ 4 ] );
			} );

			it( 'should take a null limit as no limit', async () =>
			{
				let expression = { $filter: { input: '$list', cond: { $gt: [ '$$this', 0 ] }, limit: null } };
				assert.deepStrictEqual( await evaluated( expression ), [ 1, 2, 3, 4 ] );
			} );

			it( 'should read a cond which is not a boolean for its truthiness', async () =>
			{
				// Only false, null, 0, and a missing value are false. An empty string is not.
				let expression = { $filter: { input: '$truthy', cond: '$$this' } };
				assert.deepStrictEqual( await evaluated( expression ), [ 1, '', 'x', true ] );
			} );

			it( 'should filter an empty array to an empty array', async () =>
			{
				let expression = { $filter: { input: '$empty_list', cond: true } };
				assert.deepStrictEqual( await evaluated( expression ), [] );
			} );

			it( 'should answer a null input with a null', async () =>
			{
				let expression = { $filter: { input: '$empty', cond: true } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

			it( 'should answer a missing input with a null', async () =>
			{
				let expression = { $filter: { input: '$nope', cond: true } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Folding an Array with $reduce', () =>
		{

			it( 'should carry the accumulated value in $$value', async () =>
			{
				let expression = {
					$reduce: {
						input: '$list',
						initialValue: 0,
						in: { $add: [ '$$value', '$$this' ] },
					}
				};
				assert.strictEqual( await evaluated( expression ), 10 );
			} );

			it( 'should build a value of any shape', async () =>
			{
				let expression = {
					$reduce: {
						input: '$list',
						initialValue: [],
						in: { $concatArrays: [ '$$value', [ { $multiply: [ '$$this', 10 ] } ] ] },
					}
				};
				assert.deepStrictEqual( await evaluated( expression ), [ 10, 20, 30, 40 ] );
			} );

			it( 'should answer an empty array with the initial value', async () =>
			{
				let expression = {
					$reduce: {
						input: '$empty_list',
						initialValue: 'untouched',
						in: { $concat: [ '$$value', '!' ] },
					}
				};
				assert.strictEqual( await evaluated( expression ), 'untouched' );
			} );

			it( 'should still read the document from inside the in expression', async () =>
			{
				let expression = {
					$reduce: {
						input: '$list',
						initialValue: 0,
						in: { $add: [ '$$value', '$a' ] },
					}
				};
				assert.strictEqual( await evaluated( expression ), 12 );
			} );

			it( 'should answer a null input with a null', async () =>
			{
				let expression = { $reduce: { input: '$empty', initialValue: 0, in: '$$value' } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

			it( 'should answer a missing input with a null', async () =>
			{
				let expression = { $reduce: { input: '$nope', initialValue: 0, in: '$$value' } };
				assert.strictEqual( await evaluated( expression ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The Forms Which Need $$CURRENT', () =>
		{

			it( 'should read a field of $$CURRENT with the $getField shorthand', async () =>
			{
				assert.strictEqual( await evaluated( { $getField: 'a' } ), 3 );
			} );

			// ***Only the string shorthand defaults to $$CURRENT.*** The object form with no
			// `input` looks like it should mean the same thing, and MongoDB 6.0.1 refuses it:
			//   $getField requires 'input' to be specified
			// So `{ $getField: 'a' }` and `{ $getField: { field: 'a' } }` are not two spellings
			// of one expression. The review read this family as "acts on $$CURRENT when input
			// is omitted"; the server says that is true of one form and not the other. The
			// refusal is in the list at the foot of this file, not here, because jsongin
			// refuses it today for its own unrelated reason.

			it( 'should read a dotted name as a name in the shorthand too', async () =>
			{
				let result = await piped(
					[ { _id: 1, 'a.b': 'literal', a: { b: 'nested' } } ],
					[ { $project: { _id: 0, r: { $getField: 'a.b' } } } ] );
				assert.strictEqual( result[ 0 ].r, 'literal' );
			} );

			it( 'should set a field on the whole document with $$ROOT as the input', async () =>
			{
				let result = await piped(
					[ { _id: 1, a: 3 } ],
					[ { $replaceWith: { $setField: { field: 'x.y', input: '$$ROOT', value: 7 } } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, a: 3, 'x.y': 7 } );
			} );

			it( 'should remove a field by setting it to $$REMOVE', async () =>
			{
				// ***This is how $setField unsets***, and it is the only way to say it in one
				// operator. $unsetField is the other way, and takes no value at all.
				let result = await piped(
					[ { _id: 1, a: 3, b: 4 } ],
					[ { $replaceWith: { $setField: { field: 'b', input: '$$ROOT', value: '$$REMOVE' } } } ] );
				assert.deepStrictEqual( result[ 0 ], { _id: 1, a: 3 } );
			} );

		} );


		//---------------------------------------------------------------------
		// ***The refusal questions, to be settled when the family graduates.*** Each of these
		// passes under jsongin today for the wrong reason - `$$` is refused wholesale and none
		// of the four operators is registered - so none of them can live in a gap suite. They
		// belong in the graduated file, where a refusal means the engine agreed with the
		// server rather than that it had not been built.
		//
		//   an unknown variable name, '$$nope'
		//   a system variable in the wrong case, '$$now' and '$$root'
		//   '$$this' and '$$value' outside the operator which binds them
		//   a $let variable name which does not begin with a lowercase letter
		//   a $let with vars but no in, or in but no vars
		//   $map, $filter, and $reduce over an input which is not an array
		//   $filter with a limit of zero or a negative one
		//   $reduce with no initialValue
		//   an `as` name which is not a valid variable name
		//   { $getField: { field: 'a' } } with no input, which MongoDB 6.0.1 refuses

	} );

};
