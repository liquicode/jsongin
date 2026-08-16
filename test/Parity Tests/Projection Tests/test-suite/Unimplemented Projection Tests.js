'use strict';

const assert = require( 'assert' );

/*
	Projection operators MongoDB implements and jsongin does not.

	***These tests are expected to fail under jsongin.*** They are the feature gap written
	down where the parity report keeps reporting it, the same way
	Aggregate Tests/test-suite/Unimplemented Operator Tests.js records the missing expression
	operators. Each passes against MongoDB, so the baseline run stays green.

	jsongin currently throws for each of these, and throws the wrong thing: an unrecognized
	projection value falls through to Evaluate() and is reported as an unrecognized
	***expression*** operator, which sends the reader to the wrong table. That is finding D3
	of the 2026-08-15 review.

	Delete a test from here by implementing the operator it names.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	async function projected( Document, Projection )
	{
		await Driver.SetData( [ Document ] );
		let found = await Driver.Find( {}, Projection );
		assert.strictEqual( found.length, 1, 'the projection did not return one document' );
		let result = found[ 0 ];
		delete result._id;
		return result;
	}


	//---------------------------------------------------------------------
	describe( 'Unimplemented Projection Tests', () =>
	{

		let document = { _id: 7, n: 5, t: [ 1, 2, 3, 4 ], a: [ { x: 1 }, { x: 2 } ] };


		it( 'should take the first elements of an array with $slice', async () =>
		{
			let result = await projected( document, { _id: 0, n: 0, a: 0, t: { $slice: 2 } } );
			assert.deepStrictEqual( result, { t: [ 1, 2 ] } );
		} );

		it( 'should take the last elements of an array with a negative $slice', async () =>
		{
			let result = await projected( document, { _id: 0, n: 0, a: 0, t: { $slice: -1 } } );
			assert.deepStrictEqual( result, { t: [ 4 ] } );
		} );

		it( 'should take the first matching element with the projection $elemMatch', async () =>
		{
			let result = await projected( document, { _id: 0, a: { $elemMatch: { x: 2 } } } );
			assert.deepStrictEqual( result, { a: [ { x: 2 } ] } );
		} );

	} );

};
