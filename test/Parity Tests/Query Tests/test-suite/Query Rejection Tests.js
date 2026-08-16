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

	} );

};
