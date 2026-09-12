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
	// Applies the update and answers the one document it produced, without its _id, for the
	// counterpart tests: the updates which look like the refusals and are not.
	async function applied( Document, Update )
	{
		await Driver.SetData( [ Document ] );
		let result = await Driver.Update( {}, Update );
		assert.ok( result, 'the update returned nothing' );
		assert.strictEqual( result.length, 1, 'the update did not report one document' );
		let document = Object.assign( {}, result[ 0 ] );
		delete document._id;
		return document;
	}


	//---------------------------------------------------------------------
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

		it( 'should refuse a $rename whose target is not a string', async () =>
		{
			// Checked before the document is looked at, so a source which is not there does
			// not excuse it.
			assert.ok( await refused( { a: 1 }, { $rename: { a: 5 } } ) );
			assert.ok( await refused( { x: 1 }, { $rename: { a: 5 } } ) );
		} );

		it( 'should refuse a $rename whose source and target are on the same path', async () =>
		{
			// The same field, or one inside the other: there is no order of removing and
			// writing which leaves something sensible behind. jsongin used to leave the
			// first alone and nest the second inside itself.
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'a' } } ) );
			assert.ok( await refused( { a: { b: 1 } }, { $rename: { 'a.b': 'a.b' } } ) );
			assert.ok( await refused( { a: { b: 1 } }, { $rename: { a: 'a.b' } } ) );
			assert.ok( await refused( { a: { b: 1 } }, { $rename: { 'a.b': 'a' } } ) );
			assert.ok( await refused( { x: 1 }, { $rename: { a: 'a' } } ) );
			assert.ok( await refused( { x: 1 }, { $rename: { a: 'a.b' } } ) );
		} );

		it( 'should refuse a $rename whose source is an array element', async () =>
		{
			// A rename moves a field of a document. An array element is not one, whether the
			// element itself or a field of it is named. jsongin used to leave a null behind
			// where the element had been.
			assert.ok( await refused( { a: [ 1 ] }, { $rename: { 'a.0': 'c' } } ) );
			assert.ok( await refused( { a: [ { b: 1 } ] }, { $rename: { 'a.0': 'c' } } ) );
			assert.ok( await refused( { a: [ { b: 1 } ] }, { $rename: { 'a.0.b': 'c' } } ) );
			assert.ok( await refused( { a: [ [ 1 ] ] }, { $rename: { 'a.0.0': 'c' } } ) );
			assert.ok( await refused( { a: { b: [ { c: 1 } ] } }, { $rename: { 'a.b.0.c': 'd' } } ) );
		} );

		it( 'should refuse a $rename whose target is an array element', async () =>
		{
			assert.ok( await refused( { a: 1, b: [ 1 ] }, { $rename: { a: 'b.0' } } ) );
			assert.ok( await refused( { a: 1, b: [ 1 ] }, { $rename: { a: 'b.x' } } ) );
			assert.ok( await refused( { a: 1, b: { c: [ 1 ] } }, { $rename: { a: 'b.c.0' } } ) );
			assert.ok( await refused( { a: { b: 1 }, c: [] }, { $rename: { 'a.b': 'c.d.e' } } ) );
		} );

		it( 'should refuse a $rename which conflicts with another operator at its target', async () =>
		{
			// A rename writes its target as surely as $set writes its field, so the target
			// takes part in the conflict check like any other written path. It used to be
			// invisible there, because the check claimed only the keys of each operator and
			// the target is a value.
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $set: { b: 2 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $inc: { b: 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $unset: { b: 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $set: { 'b.c': 2 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $unset: { 'b.c': 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $push: { b: 1 } } ) );
			// And the source, which it removes.
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $set: { a: 2 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b' }, $unset: { a: 1 } } ) );
			// Whether or not the source is there.
			assert.ok( await refused( { x: 1 }, { $rename: { a: 'b' }, $set: { b: 1 } } ) );
		} );

		it( 'should refuse two $renames which write the same target', async () =>
		{
			assert.ok( await refused( { a: 1, b: 2 }, { $rename: { a: 'c', b: 'c' } } ) );
			assert.ok( await refused( { a: 1, b: 1 }, { $rename: { a: 'x', b: 'x.y' } } ) );
			assert.ok( await refused( { a: 1, c: 1 }, { $rename: { a: 'b', c: 'b.d' } } ) );
			// A chain is a conflict too: b is written by one rename and removed by the other.
			assert.ok( await refused( { a: 1, b: 1 }, { $rename: { a: 'b', b: 'c' } } ) );
			assert.ok( await refused( { x: 1 }, { $rename: { a: 'b', b: 'c' } } ) );
		} );

		it( 'should still apply a $rename which merely has nothing to do', async () =>
		{
			// The counterparts. A source which is not there is a no-op, including one whose
			// path would name an array element if the array were there; a numeric element
			// against a document is a field name; and a rename into a nested target which is
			// not there creates documents on the way, never arrays.
			let document;
			document = await applied( { x: 1 }, { $rename: { 'a.0': 'c' } } );
			assert.deepStrictEqual( document, { x: 1 } );
			document = await applied( { a: { '0': 1 } }, { $rename: { 'a.0': 'c' } } );
			assert.deepStrictEqual( document, { a: {}, c: 1 } );
			document = await applied( { a: 1 }, { $rename: { a: 'b.0' } } );
			assert.deepStrictEqual( document, { b: { '0': 1 } } );
			document = await applied( { a: { c: 1 } }, { $rename: { 'a.c': 'a.d' }, $set: { 'a.e': 1 } } );
			assert.deepStrictEqual( document, { a: { d: 1, e: 1 } } );
			document = await applied( { a: [ 1 ] }, { $rename: { a: 'b' } } );
			assert.deepStrictEqual( document, { b: [ 1 ] } );
		} );

		it( 'should refuse an update path with an empty field name', async () =>
		{
			// 'a.' names a field called '' inside a, which a query may read but an update may
			// not write. Every operator is held to it, and so is a $rename target. jsongin
			// used to create the field.
			assert.ok( await refused( {}, { $set: { 'a.': 1 } } ) );
			assert.ok( await refused( {}, { $set: { '.a': 1 } } ) );
			assert.ok( await refused( {}, { $set: { 'a..b': 1 } } ) );
			assert.ok( await refused( {}, { $set: { 'a.b.': 1 } } ) );
			assert.ok( await refused( {}, { $push: { 'a.': 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $unset: { 'a.': 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $unset: { '.a': 1 } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b.' } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: 'b..c' } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { 'a.': 'b' } } ) );
			assert.ok( await refused( { a: 1 }, { $set: { '': 1 } } ) );
		} );

		it( 'should refuse writing a top level field whose name begins with a dollar sign', async () =>
		{
			// An operator which can create a field refuses to create one which would read as
			// an operator. jsongin used to write it.
			assert.ok( await refused( {}, { $set: { '$x': 1 } } ) );
			assert.ok( await refused( { $x: 1 }, { $set: { '$x': 2 } } ) );
			assert.ok( await refused( {}, { $inc: { '$x': 1 } } ) );
			assert.ok( await refused( { $x: 1 }, { $mul: { '$x': 2 } } ) );
			assert.ok( await refused( { $x: 1 }, { $min: { '$x': 0 } } ) );
			assert.ok( await refused( { $x: 1 }, { $max: { '$x': 2 } } ) );
			assert.ok( await refused( { $x: [ 1 ] }, { $push: { '$x': 2 } } ) );
			assert.ok( await refused( { $x: [ 1 ] }, { $addToSet: { '$x': 2 } } ) );
			assert.ok( await refused( { $x: 1 }, { $currentDate: { '$x': true } } ) );
			assert.ok( await refused( { a: 1 }, { $rename: { a: '$b' } } ) );
			assert.ok( await refused( { $x: 1 }, { $rename: { '$x': '$y' } } ) );
		} );

		it( 'should still reach a dollar prefixed field which is nested, removed, or a $rename source', async () =>
		{
			// The counterparts, each one measured: below another field the name is allowed,
			// and an operator which only removes or moves what is there is not creating one.
			let document;
			document = await applied( {}, { $set: { 'a.$x': 1 } } );
			assert.deepStrictEqual( document, { a: { $x: 1 } } );
			document = await applied( { a: { $x: 1 } }, { $inc: { 'a.$x': 1 } } );
			assert.deepStrictEqual( document, { a: { $x: 2 } } );
			document = await applied( { a: 1 }, { $rename: { a: 'b.$c' } } );
			assert.deepStrictEqual( document, { b: { $c: 1 } } );
			document = await applied( { $x: 1 }, { $unset: { '$x': 1 } } );
			assert.deepStrictEqual( document, {} );
			document = await applied( { $x: [ 1 ] }, { $pop: { '$x': 1 } } );
			assert.deepStrictEqual( document, { $x: [] } );
			document = await applied( { $x: [ 1 ] }, { $pull: { '$x': 1 } } );
			assert.deepStrictEqual( document, { $x: [] } );
			document = await applied( { $x: [ 1, 2 ] }, { $pullAll: { '$x': [ 1 ] } } );
			assert.deepStrictEqual( document, { $x: [ 2 ] } );
			document = await applied( { $x: 1 }, { $rename: { '$x': 'y' } } );
			assert.deepStrictEqual( document, { y: 1 } );
		} );

		it( 'should apply an operator with no fields as a no-op', async () =>
		{
			// The spelling of "change nothing" the two engines share. An update document
			// with no operator at all is a different thing: MongoDB refuses it and jsongin
			// applies it, on purpose, and Update Gaps.js records the difference.
			let document = await applied( { a: 1 }, { $set: {} } );
			assert.deepStrictEqual( document, { a: 1 } );
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
