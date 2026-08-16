'use strict';

const assert = require( 'assert' );

/*
	The update documents MongoDB refuses to apply.

	Rejecting bad input is behavior, not an implementation detail. An engine which quietly does
	something else with an update it cannot apply gives a caller a wrong document and no way to
	find out, so these belong beside the tests for the updates which do work.

	These tests assert only that the operation is refused, never the wording of the message.
	Two engines can agree that something is invalid while describing it differently.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Answers whether the engine refused the update.
	//
	// A refusal can be either a thrown error or a document left unchanged: both tell the
	// caller the update did not happen. What must not happen is the engine applying some other
	// update of its own devising, which is what this returns false for.
	async function refused( Document, Update )
	{
		await Driver.SetData( [ Document ] );

		let before = JSON.stringify( Document );
		try
		{
			await Driver.Update( {}, Update );
		}
		catch ( error )
		{
			return true;
		}

		let found = await Driver.Find( {} );
		let after = found[ 0 ];
		delete after._id;
		return ( JSON.stringify( after ) === before );
	}


	//---------------------------------------------------------------------
	describe( 'Update Rejection Tests', () =>
	{

		it( 'should refuse an unknown update operator', async () =>
		{
			assert.ok( await refused( { a: 1 }, { $bogus: { a: 2 } } ) );
		} );

		it( 'should refuse two operators which touch the same path', async () =>
		{
			assert.ok( await refused( { a: 1 }, { $set: { a: 2 }, $inc: { a: 1 } } ) );
		} );

		it( 'should refuse $inc against a field which is not numeric', async () =>
		{
			assert.ok( await refused( { a: 'str' }, { $inc: { a: 1 } } ) );
			assert.ok( await refused( { a: true }, { $inc: { a: 1 } } ) );
		} );

		it( 'should refuse $inc with an operand which is not numeric', async () =>
		{
			assert.ok( await refused( { a: 1 }, { $inc: { a: '5' } } ) );
		} );

		it( 'should refuse $mul against a field which is not numeric', async () =>
		{
			assert.ok( await refused( { a: 'str' }, { $mul: { a: 2 } } ) );
		} );

	} );

};
