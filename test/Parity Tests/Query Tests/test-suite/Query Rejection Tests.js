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
