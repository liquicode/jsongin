'use strict';

const assert = require( 'assert' );

/*
	$redact, the stage which asks an expression what to do with each level of a document.

	***This is not a filter.*** $match decides about whole documents; $redact walks into one and
	asks again about every sub-document it finds, so a document can come through with a part of
	it removed. The expression answers with $$DESCEND, $$PRUNE, or $$KEEP, and those three
	variables are bound within this stage and nowhere else.

	***This was a gap suite until 2026-08-21***, blocked by the same missing parameter as the
	rest of Bucket C: `Evaluate()` refused every name beginning with `$$`, so the three answers
	could not be expressed. It keeps its own file because a stage is exercised differently than
	an expression. The rest of the family is in `Variable Scope Tests.js`.

	***A refusal test could not live here while this was a gap suite.*** "$redact refuses a
	malformed expression" passed under jsongin then, for the wrong reason: the stage was not
	registered at all, so every $redact was refused. `parity-report` spotted it and said so -
	it reports a gap test the engine already satisfies as IMPLEMENTED, and that one would have
	been graduated on the strength of an accident. The refusals are below now that a refusal
	means the engine agreed with the server.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Redact Tests', () =>
	{

		let documents = [
			{ _id: 1, level: 1, name: 'open', inner: { level: 1, secret: 'visible' } },
			{ _id: 2, level: 5, name: 'closed', inner: { level: 5, secret: 'hidden' } },
		];

		//---------------------------------------------------------------------
		async function piped( Pipeline )
		{
			await Driver.SetData( documents );
			return await Driver.Aggregate( Pipeline );
		}

		//---------------------------------------------------------------------
		it( 'should drop a document whose top level is pruned', async () =>
		{
			let result = await piped( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.strictEqual( result.length, 1 );
			assert.strictEqual( result[ 0 ]._id, 1 );
		} );

		it( 'should prune a sub-document while keeping the document around it', async () =>
		{
			// ***$$DESCEND is what makes this different from $match***: the expression is
			// asked again at each level, so an inner document can be removed on its own.
			await Driver.SetData( [
				{ _id: 1, level: 1, inner: { level: 9, secret: 'hidden' } },
			] );
			let result = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.strictEqual( result.length, 1 );
			assert.strictEqual( 'inner' in result[ 0 ], false );
		} );

		it( 'should keep a whole sub-tree without examining it with $$KEEP', async () =>
		{
			await Driver.SetData( [
				{ _id: 1, level: 1, inner: { level: 9, secret: 'kept' } },
			] );
			let result = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$KEEP', '$$PRUNE' ] }
			} ] );
			assert.deepStrictEqual( result[ 0 ].inner, { level: 9, secret: 'kept' } );
		} );

		it( 'should descend into the documents inside an array', async () =>
		{
			// ***An array of documents is descended into element by element***, and an element
			// which is pruned is removed from the array rather than left as a null. This is the
			// reason $redact is not simply a recursive walk of the fields of a document.
			await Driver.SetData( [
				{ _id: 1, level: 1, items: [ { level: 1, tag: 'shown' }, { level: 9, tag: 'gone' } ] },
			] );
			let result = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.deepStrictEqual( result[ 0 ].items, [ { level: 1, tag: 'shown' } ] );
		} );

		it( 'should leave the values which are not documents alone while descending', async () =>
		{
			// $$DESCEND asks again about the documents below this level and about nothing else.
			await Driver.SetData( [
				{ _id: 1, level: 1, numbers: [ 1, 2, 3 ], name: 'kept', nothing: null },
			] );
			let result = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.deepStrictEqual( result[ 0 ],
				{ _id: 1, level: 1, numbers: [ 1, 2, 3 ], name: 'kept', nothing: null } );
		} );

		it( 'should read a field path as the level being asked about', async () =>
		{
			// ***'$level' is the level of the sub-document under examination***, not the root's.
			// The root has no `level` at all here, and a missing value compares below 3, so the
			// root descends and each inner document answers for itself.
			await Driver.SetData( [
				{ _id: 1, a: { level: 1, tag: 'shown' }, b: { level: 9, tag: 'gone' } },
			] );
			let result = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.deepStrictEqual( result[ 0 ], { _id: 1, a: { level: 1, tag: 'shown' } } );
		} );

		it( 'should give the level being asked about as $$CURRENT, and the root as $$ROOT', async () =>
		{
			await Driver.SetData( [
				{ _id: 1, level: 1, inner: { level: 9 } },
			] );
			// $$CURRENT.level is 9 at the inner level, so the inner document is pruned.
			let current = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$$CURRENT.level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.strictEqual( 'inner' in current[ 0 ], false );
			// $$ROOT.level is 1 at every level, so nothing is pruned.
			let root = await Driver.Aggregate( [ {
				$redact: { $cond: [ { $lte: [ '$$ROOT.level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
			} ] );
			assert.deepStrictEqual( root[ 0 ].inner, { level: 9 } );
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
				assert.strictEqual( result.length, documents.length );
			} );

		} );


		//---------------------------------------------------------------------
		it( 'should refuse its three variables outside the stage', async () =>
		{
			// They are bound in the frame this stage makes and in no other, so outside it they
			// are names nobody bound rather than values which happen to mean nothing.
			await Driver.SetData( documents );
			let names = [ '$$DESCEND', '$$PRUNE', '$$KEEP' ];
			for ( let index = 0; index < names.length; index++ )
			{
				let refused = false;
				try { await Driver.Aggregate( [ { $project: { r: names[ index ] } } ] ); }
				catch ( error ) { refused = true; }
				assert.ok( refused, `${names[ index ]} was not refused outside $redact.` );
			}
		} );

	} );

};
