'use strict';

const assert = require( 'assert' );

/*
	$redact, which jsongin has not built.

	***This is a gap suite***, so every test here passes under MongoDB and fails under jsongin
	by design. It is loaded by `Aggregate Gaps.js` and not by the parity inventory. See
	Standing Decision 6 in .plans/story.md: a gap nothing measures is a gap nobody revisits.

	***$redact needs expression system variables, and that is the whole of what blocks it.***
	The stage walks a document level by level and asks an expression what to do with each one,
	and the expression answers by evaluating to `$$DESCEND`, `$$PRUNE`, or `$$KEEP`. jsongin's
	`Evaluate()` has no system variables at all - it refuses any name beginning with `$$` - so
	the answers cannot be expressed.

	That makes this a ***Bucket C*** item rather than a hard boundary: the same change which
	brings `$let`, `$map`, `$filter`, and `$reduce` brings `$$ROOT`, `$$CURRENT`, and the rest,
	and this stage becomes buildable at the same time. See .reviews/2026-08-19/review.md.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Redact Gap Tests', () =>
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

		// ***A refusal test does not belong here.*** "$redact refuses a malformed expression"
		// passes under jsongin today, for the wrong reason: the stage is not registered at
		// all, so every $redact is refused. `parity-report` spotted it and said so - it reports
		// a gap test the engine already satisfies as IMPLEMENTED, and this one would have been
		// graduated on the strength of an accident. A gap suite states what MongoDB ***does***.

	} );

};
