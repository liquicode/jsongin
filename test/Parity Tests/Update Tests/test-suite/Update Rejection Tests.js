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
	// Answers whether the engine refused the update ***out loud***, by raising an error.
	//
	// This is deliberately stricter than refused() above. An unchanged document says the update
	// did not happen, but it says it in a way the caller cannot distinguish from a legitimate
	// no-op, so a refusal only reaches the caller when it is raised. MongoDB raises one for
	// every case measured with this.
	async function threw( Document, Update )
	{
		await Driver.SetData( [ Document ] );
		try
		{
			await Driver.Update( {}, Update );
		}
		catch ( error )
		{
			return true;
		}
		return false;
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

		it( 'should refuse an update document which is not made of operators', async () =>
		{
			// Replacing a document is a different call, and this one refuses.
			assert.ok( await refused( { a: 1 }, { a: 2 } ) );
		} );

		it( 'should refuse an operator value of the wrong type', async () =>
		{
			assert.ok( await refused( { a: 1 }, { $set: 1 } ) );
			assert.ok( await refused( { a: 1 }, { $inc: 1 } ) );
			assert.ok( await refused( { a: 1 }, { $push: 1 } ) );
		} );

		it( 'should refuse two operators which write to a path and one below it', async () =>
		{
			assert.ok( await refused( { a: {} }, { $set: { a: 2 }, $inc: { 'a.b': 1 } } ) );
		} );

		it( 'should refuse a path which reaches into an array by field name', async () =>
		{
			// MongoDB requires the all positional operator, 'a.$[].x', to write through an
			// array. jsongin has the same rule by default; the PathExtensions setting relaxes
			// it, and the parity run uses the unconfigured engine.
			assert.ok( await refused( { a: [ { x: 1 } ] }, { $set: { 'a.x': 9 } } ) );
			assert.ok( await refused( { a: [ { x: 1 } ] }, { $inc: { 'a.x': 1 } } ) );
		} );

		it( 'should refuse a malformed $currentDate specification', async () =>
		{
			// It takes true or { $type: ... }, never a bare string.
			assert.ok( await refused( { d: 0 }, { $currentDate: { d: 'date' } } ) );
			assert.ok( await refused( { d: 0 }, { $currentDate: { d: 1 } } ) );
		} );

		it( 'should refuse a malformed $push modifier', async () =>
		{
			// Every one of these carries a $each, so it is read as a modifier document and
			// every one of them is invalid.
			assert.ok( await refused( { a: [ 1 ] }, { $push: { a: { $each: 5 } } } ) );
			assert.ok( await refused( { a: [ 1 ] }, { $push: { a: { $each: [ 2 ], $bogus: 1 } } } ) );
			assert.ok( await refused( { a: [ 1 ] }, { $push: { a: { $each: [ 2 ], $position: 'x' } } } ) );
			assert.ok( await refused( { a: [ 1 ] }, { $push: { a: { $each: [ 2 ], $slice: 'x' } } } ) );
			assert.ok( await refused( { a: [ 1 ] }, { $push: { a: { $each: [ 2 ], $sort: 'x' } } } ) );
		} );

		it( 'should refuse a $pop which is neither 1 nor -1', async () =>
		{
			assert.ok( await refused( { a: [ 1, 2 ] }, { $pop: { a: 2 } } ) );
		} );

		it( 'should refuse a path which runs below a scalar', async () =>
		{
			assert.ok( await refused( { a: 1 }, { $set: { 'a.b': 2 } } ) );
		} );

		it( 'should still apply two operators which touch different paths', async () =>
		{
			// The counterpart to the conflict tests: a well formed update is applied, so a
			// failure here would mean the conflict check is too broad.
			await Driver.SetData( [ { a: 1, b: 1 } ] );
			await Driver.Update( {}, { $set: { a: 2 }, $inc: { b: 1 } } );

			let found = await Driver.Find( {} );
			assert.strictEqual( found[ 0 ].a, 2 );
			assert.strictEqual( found[ 0 ].b, 2 );
		} );


		/*
			***The tests below are expected to fail under jsongin.***

			They are not broken, and they are not waiting on a bug. Each one records a place
			where jsongin has deliberately settled somewhere other than MongoDB, written down
			so that the parity report keeps asking about it. A deviation nothing measures is a
			deviation nobody revisits.

			Each passes against MongoDB, so the baseline run stays green and the failures under
			the jsongin run are the whole of the difference.
		*/

		describe( 'Known Deviations', () =>
		{

			it( 'should refuse a negative array index in an update', async () =>
			{
				// jsongin writes the last element. Reverse indexing is a documented jsongin
				// path extension, shared with GetValue and DeleteValue, and MongoDB has no
				// such thing on the write side: it refuses a negative index outright.
				// Closing this means deciding the extension does not apply to writes, which is
				// a decision about the extension rather than a defect in the update operators.
				assert.ok( await refused( { a: [ 1, 2, 3 ] }, { $set: { 'a.-1': 9 } } ) );
			} );

			it( 'should raise an error when an operator cannot apply itself', async () =>
			{
				// jsongin reports these to the OpLog and leaves the field alone, which the
				// refused() helper above accepts and this one does not.
				//
				// The line jsongin currently draws is between the update document and the
				// update operation: a malformed document throws, while an operator meeting a
				// document it does not suit declines quietly. MongoDB raises an error for
				// both. Until that line moves, a caller cannot tell a declined $inc from an
				// $inc which had nothing to do.
				assert.ok( await threw( { a: 'str' }, { $inc: { a: 1 } } ) );
				assert.ok( await threw( { a: true }, { $inc: { a: 1 } } ) );
				assert.ok( await threw( { a: 1 }, { $inc: { a: '5' } } ) );
				assert.ok( await threw( { a: 'str' }, { $mul: { a: 2 } } ) );
			} );

			it( 'should raise an error when an array operator meets a field which is not an array', async () =>
			{
				assert.ok( await threw( { a: 5 }, { $push: { a: 1 } } ) );
				assert.ok( await threw( { a: 5 }, { $addToSet: { a: 1 } } ) );
				assert.ok( await threw( { a: 5 }, { $pop: { a: 1 } } ) );
				assert.ok( await threw( { a: 5 }, { $pullAll: { a: [ 1 ] } } ) );
			} );

		} );

	} );

};
