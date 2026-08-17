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
	// Answers whether the engine refused the update, by raising an error.
	//
	// This used to accept an unchanged document as a refusal too, because an operator which
	// could not apply itself reported through the OpLog and left the field alone. That is no
	// longer a state the engine can be in: an operator still reports rather than throwing, but
	// Update() raises the refusal, so every refusal reaches the caller.
	//
	// The looser helper is gone with it. An unchanged document is indistinguishable from a
	// legitimate no-op, so accepting one as a refusal meant the suite could not tell a declined
	// $inc from an $inc which had nothing to do. MongoDB raises an error for every case here.
	async function refused( Document, Update )
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
			// array. jsongin has the same rule, and no longer has a setting which relaxes it.
			assert.ok( await refused( { a: [ { x: 1 } ] }, { $set: { 'a.x': 9 } } ) );
			assert.ok( await refused( { a: [ { x: 1 } ] }, { $inc: { 'a.x': 1 } } ) );
		} );

		it( 'should refuse a negative array index in an update', async () =>
		{
			// A negative index is not an index. MongoDB reads '-1' as a field name, and a
			// field cannot be created on an array, so it refuses with "Cannot create field
			// '-1' in element {a: [ 1, 2, 3 ]}".
			//
			// This was a Known Deviation: reverse indexing was a jsongin path extension which
			// wrote the last element. The extension has been removed from the engine entirely,
			// on the read side as well as the write side, so the two agree here now.
			assert.ok( await refused( { a: [ 1, 2, 3 ] }, { $set: { 'a.-1': 9 } } ) );
			assert.ok( await refused( { a: [ 1, 2, 3 ] }, { $inc: { 'a.-1': 1 } } ) );
		} );

		it( 'should refuse an array operator against a field which is not an array', async () =>
		{
			// This was a Known Deviation too. An operator which could not apply itself used to
			// report through the OpLog and leave the field alone, which a caller could not tell
			// from a no-op. Update() now raises the refusal.
			assert.ok( await refused( { a: 5 }, { $push: { a: 1 } } ) );
			assert.ok( await refused( { a: 5 }, { $addToSet: { a: 1 } } ) );
			assert.ok( await refused( { a: 5 }, { $pop: { a: 1 } } ) );
			assert.ok( await refused( { a: 5 }, { $pullAll: { a: [ 1 ] } } ) );
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

		it( 'should refuse two operators where one path lies below the other', async () =>
		{
			// Not just the identical path: applying both would make the result depend on the
			// order the operators happened to run in, which is just as true when one path is
			// inside the other. Both directions, since neither operator is privileged.
			assert.ok( await refused( { a: { b: 1 } }, { $set: { a: 1 }, $inc: { 'a.b': 1 } } ) );
			assert.ok( await refused( { a: { b: 1 } }, { $set: { 'a.b': 1 }, $inc: { a: 1 } } ) );
			assert.ok( await refused( { a: { b: { c: 1 } } }, { $set: { a: 1 }, $unset: { 'a.b.c': '' } } ) );
		} );

		it( 'should not mistake a shared prefix for a conflict', async () =>
		{
			// The counterpart. 'ab' is not below 'a', even though it starts with the same
			// letter — the boundary is the dot.
			await Driver.SetData( [ { a: 1, ab: 1 } ] );
			await Driver.Update( {}, { $set: { a: 2 }, $inc: { ab: 1 } } );

			let found = await Driver.Find( {} );
			assert.strictEqual( found[ 0 ].a, 2 );
			assert.strictEqual( found[ 0 ].ab, 2 );
		} );

		it( 'should refuse a $pullAll whose values are not an array', async () =>
		{
			assert.ok( await refused( { a: [ 1, 2 ] }, { $pullAll: { a: 5 } } ) );
			assert.ok( await refused( { a: [ 1, 2 ] }, { $pullAll: { a: 'x' } } ) );
		} );

		it( 'should refuse a $rename onto an empty field name', async () =>
		{
			// There is no field named by the empty string, so there is nowhere for the value
			// to go. The field is left where it is rather than being lost.
			assert.ok( await refused( { a: 1 }, { $rename: { a: '' } } ) );
		} );

		it( 'should refuse an operator whose value is not a document of fields', async () =>
		{
			// Every update operator takes { field: value } pairs. A bare value names no field.
			assert.ok( await refused( { a: 1 }, { $set: 5 } ) );
			assert.ok( await refused( { a: 1 }, { $unset: 'a' } ) );
			assert.ok( await refused( { a: 1 }, { $inc: [ 1 ] } ) );
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

		it( 'should not refuse an operator which simply has nothing to do', async () =>
		{
			// The counterpart to the refusals above. A field which is not there is nothing to
			// pop from or pull from, and MongoDB reports a successful update with
			// modifiedCount 0 rather than an error. These share a shape with the refusals —
			// the operator does not write — so they are the cases most at risk of being
			// swept up by the refusal, and they were: both raised once Update() began
			// raising, until the operators told the two apart.
			await Driver.SetData( [ { a: 1 } ] );
			await Driver.Update( {}, { $pop: { missing: 1 } } );
			await Driver.Update( {}, { $pullAll: { missing: [ 1 ] } } );

			let found = await Driver.Find( {} );
			assert.strictEqual( found[ 0 ].a, 1 );
		} );

	} );

};
