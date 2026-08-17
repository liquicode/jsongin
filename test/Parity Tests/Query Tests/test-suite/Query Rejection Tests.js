'use strict';

const assert = require( 'assert' );

/*
	The queries MongoDB refuses to run.

	A query which cannot mean anything should say so rather than quietly selecting some set of
	documents. Answering a malformed query is worse than refusing it, because the caller gets
	a result they have no reason to distrust.

	These tests assert only that the query is refused, never the wording of the message.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Answers whether the engine refused the query.
	async function refused( Documents, Criteria )
	{
		await Driver.SetData( Documents );
		try
		{
			await Driver.Find( Criteria );
			return false;
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'Query Rejection Tests', () =>
	{

		it( 'should refuse $not at the top level of a query', async () =>
		{
			// $not negates an operator expression within a field. The top level operators are
			// $and, $or, $nor, and $expr, and negating a whole query is spelled $nor.
			assert.ok( await refused( [ { a: 1 } ], { $not: { a: 2 } } ) );
		} );

		it( 'should accept $nor at the top level', async () =>
		{
			// The counterpart to the test above: this is the spelling which is allowed, so a
			// failure here would mean the rejection above is too broad.
			await Driver.SetData( [ { a: 1 } ] );
			let found = await Driver.Find( { $nor: [ { a: 2 } ] } );
			assert.strictEqual( found.length, 1 );
		} );

		it( 'should refuse a comparison operator at the top level', async () =>
		{
			assert.ok( await refused( [ { a: 1 } ], { $eq: 1 } ) );
			assert.ok( await refused( [ { a: 1 } ], { $gt: 1 } ) );
		} );

		it( 'should refuse an operator it does not know', async () =>
		{
			// A misspelled operator used to be read as a field name, which tested a field that
			// is never there and reported that nothing matched. A typo was indistinguishable
			// from an empty result.
			assert.ok( await refused( [ { a: 1 } ], { $bogus: 1 } ) );
			assert.ok( await refused( [ { a: 1 } ], { a: { $bogus: 1 } } ) );
			assert.ok( await refused( [ { a: 1 } ], { a: { $exists: true, $bogus: 1 } } ) );
		} );

		it( 'should refuse an operator value of the wrong type', async () =>
		{
			assert.ok( await refused( [ { a: [ 1, 2 ] } ], { a: { $size: 'x' } } ) );
			assert.ok( await refused( [ { a: [ 1, 2 ] } ], { a: { $all: 1 } } ) );
			assert.ok( await refused( [ { a: [ 1, 2 ] } ], { a: { $in: 1 } } ) );
			assert.ok( await refused( [ { a: [ 1, 2 ] } ], { a: { $elemMatch: 1 } } ) );
			assert.ok( await refused( [ { a: 1 } ], { a: { $not: 1 } } ) );
			assert.ok( await refused( [ { a: 1 } ], { $and: 1 } ) );
		} );

		it( 'should refuse a logical operator with no conditions', async () =>
		{
			// An empty list asks nothing. It used to answer that everything matched for $and
			// and that nothing matched for $or.
			assert.ok( await refused( [ { a: 1 } ], { $and: [] } ) );
			assert.ok( await refused( [ { a: 1 } ], { $or: [] } ) );
		} );

		it( 'should refuse a malformed $options', async () =>
		{
			assert.ok( await refused( [ { a: 'x' } ], { $options: 'i' } ) );
			assert.ok( await refused( [ { a: 'x' } ], { a: { $regex: 'x', $options: 1 } } ) );
			assert.ok( await refused( [ { a: 'x' } ], { a: { $regex: /x/i, $options: 'i' } } ) );
		} );

		it( 'should refuse a query operator nested inside $in', async () =>
		{
			// $in takes values to compare against, not queries to run. Without a refusal
			// { $in: [ { $gt: 5 } ] } quietly behaves as $gt against some engines and as
			// "matches nothing" against others, and the caller cannot tell which.
			let documents = [ { a: 9 } ];
			assert.ok( await refused( documents, { a: { $in: [ { $gt: 5 } ] } } ) );
			assert.ok( await refused( documents, { a: { $in: [ 9, { $gt: 5 } ] } } ) );
			assert.ok( await refused( documents, { a: { $nin: [ { $gt: 5 } ] } } ) );
		} );

		it( 'should accept a document which merely looks like a query inside $in', async () =>
		{
			// The counterpart: a document is an ordinary value to compare against, and only a
			// registered operator makes it a query.
			await Driver.SetData( [ { a: { x: 1 } } ] );
			assert.strictEqual( ( await Driver.Find( { a: { $in: [ { x: 1 } ] } } ) ).length, 1 );
		} );

		it( 'should refuse a malformed logical operator inside $elemMatch', async () =>
		{
			// The criteria inside $elemMatch is a criteria in its own right, so it is held to
			// the same rules. A logical operator takes an array of criteria there too.
			let documents = [ { v: [ { x: 1 } ] } ];
			assert.ok( await refused( documents, { v: { $elemMatch: { $or: 5 } } } ) );
			assert.ok( await refused( documents, { v: { $elemMatch: { $and: 'x' } } } ) );
			assert.ok( await refused( documents, { v: { $elemMatch: { $or: [ 5 ] } } } ) );
			assert.ok( await refused( documents, { v: { $elemMatch: { $or: [] } } } ) );
		} );

		it( 'should refuse a field level operator at the top of an $elemMatch logical branch', async () =>
		{
			// A branch of a logical operator is a criteria, and a bare { $gt: 1 } cannot stand
			// at the top of one — even though it is a perfectly good $elemMatch criteria on its
			// own, which the counterpart below asserts.
			let documents = [ { v: [ 1, 2 ] } ];
			assert.ok( await refused( documents, { v: { $elemMatch: { $or: [ { $gt: 1 } ] } } } ) );
			assert.ok( await refused( documents, { v: { $elemMatch: { $and: [ { $gt: 1 } ] } } } ) );
		} );

		it( 'should refuse a $not inside $elemMatch which is neither a document nor a regexp', async () =>
		{
			let documents = [ { v: [ 1, 2 ] } ];
			assert.ok( await refused( documents, { v: { $elemMatch: { $not: 5 } } } ) );
			assert.ok( await refused( documents, { v: { $elemMatch: { $not: 'x' } } } ) );
		} );

		it( 'should refuse a malformed $elemMatch with no element to examine', async () =>
		{
			// A malformed criteria is refused because it is malformed, not because some element
			// failed it, so the data it would have been applied to is beside the point. An
			// empty array, a field which is not an array, and a field which is not there all
			// refuse it just the same.
			assert.ok( await refused( [ { v: [] } ], { v: { $elemMatch: { $or: 5 } } } ) );
			assert.ok( await refused( [ { v: 7 } ], { v: { $elemMatch: { $or: 5 } } } ) );
			assert.ok( await refused( [ { w: 1 } ], { v: { $elemMatch: { $or: 5 } } } ) );
			assert.ok( await refused( [ { v: [] } ], { v: { $elemMatch: { $or: [ { $gt: 1 } ] } } } ) );
			assert.ok( await refused( [ { v: [] } ], { v: { $elemMatch: { $not: 5 } } } ) );
		} );

		it( 'should still answer an $elemMatch which is merely unsatisfied', async () =>
		{
			// The counterpart to the three rejections above: these are well formed and simply
			// do not match.
			await Driver.SetData( [ { v: [ 1, 2 ] } ] );
			assert.strictEqual( ( await Driver.Find( { v: { $elemMatch: { $gt: 1 } } } ) ).length, 1 );
			assert.strictEqual( ( await Driver.Find( { v: { $elemMatch: { $gt: 9 } } } ) ).length, 0 );
			assert.strictEqual( ( await Driver.Find( { v: { $elemMatch: { $not: { $gt: 1 } } } } ) ).length, 1 );
		} );

		it( 'should still answer a query which is merely unsatisfied', async () =>
		{
			// The counterpart to every rejection above. A query which is well formed and
			// simply matches nothing is an answer, not a refusal.
			await Driver.SetData( [ { a: 1 } ] );
			assert.strictEqual( ( await Driver.Find( { a: 99 } ) ).length, 0 );
			assert.strictEqual( ( await Driver.Find( { a: { $gt: 99 } } ) ).length, 0 );
			assert.strictEqual( ( await Driver.Find( { a: { $gt: null } } ) ).length, 0 );
		} );

	} );

};
