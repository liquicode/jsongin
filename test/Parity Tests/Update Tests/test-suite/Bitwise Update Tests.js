'use strict';

const assert = require( 'assert' );

/*
	The bitwise update operator, $bit.

	This is a ***gap suite***: every test here passes under MongoDB and fails under jsongin by
	design. See `Update Gaps.js` and Standing Decision 6 in .plans/story.md.

	$bit is the last of the update operators MongoDB documents which jsongin has not built,
	apart from the five which need something the single-document model does not have.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Applies one update to one document and returns the result.
	async function applied( Document, Update )
	{
		await Driver.SetData( [ Document ] );
		let result = await Driver.Update( {}, Update );
		assert.ok( result, 'the update returned nothing' );
		assert.strictEqual( result.length, 1, 'the update did not report one document' );
		return result[ 0 ];
	}


	//---------------------------------------------------------------------
	// Answers whether the engine refused the update.
	async function refused( Document, Update )
	{
		try
		{
			await applied( Document, Update );
			return false;
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'Bitwise Update Tests', () =>
	{

		it( 'should apply and, or, and xor with $bit', async () =>
		{
			// 20 is binary 10100 and 12 is 1100.
			// and: 10100 & 01100 = 00100, which is 4.
			let result = await applied( { _id: 1, v: 20 }, { $bit: { v: { and: 12 } } } );
			assert.strictEqual( result.v, 4 );

			// or: 10100 | 01100 = 11100, which is 28.
			result = await applied( { _id: 1, v: 20 }, { $bit: { v: { or: 12 } } } );
			assert.strictEqual( result.v, 28 );

			// xor: 10100 ^ 01100 = 11000, which is 24.
			result = await applied( { _id: 1, v: 20 }, { $bit: { v: { xor: 12 } } } );
			assert.strictEqual( result.v, 24 );

			// The field may be reached by a dotted path.
			result = await applied( { _id: 1, a: { b: 20 } }, { $bit: { 'a.b': { and: 12 } } } );
			assert.strictEqual( result.a.b, 4 );

			// A negative operand is read as two's complement.
			result = await applied( { _id: 1, v: -20 }, { $bit: { v: { and: 12 } } } );
			assert.strictEqual( result.v, 12 );
		} );

		it( 'should create a missing field rather than refusing it', async () =>
		{
			// ***A field which is not there is not an error***, unlike a field holding
			// something which has no bits. It is created, and the operation is applied to a
			// zero, so `and` gives 0 and `or` gives the operand back.
			let result = await applied( { _id: 1 }, { $bit: { v: { and: 12 } } } );
			assert.strictEqual( result.v, 0 );

			result = await applied( { _id: 1 }, { $bit: { v: { or: 12 } } } );
			assert.strictEqual( result.v, 12 );

			result = await applied( { _id: 1 }, { $bit: { v: { xor: 12 } } } );
			assert.strictEqual( result.v, 12 );

			// And it is created along a dotted path the same way.
			result = await applied( { _id: 1 }, { $bit: { 'a.b': { or: 12 } } } );
			assert.strictEqual( result.a.b, 12 );
		} );

		it( 'should refuse what $bit cannot apply', async () =>
		{
			// ***The field must already hold an integer.*** There is nothing to operate on
			// otherwise, and MongoDB refuses rather than treating it as zero.
			assert.strictEqual( await refused( { _id: 1, v: 'abc' }, { $bit: { v: { and: 12 } } } ), true );
			assert.strictEqual( await refused( { _id: 1, v: 3.5 }, { $bit: { v: { and: 12 } } } ), true );

			// The operand must be an integer too, and must name one of the three operations.
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { v: { and: 1.5 } } } ), true );
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { v: { and: 'x' } } } ), true );
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { v: { nand: 12 } } } ), true );
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { v: 12 } } ), true );
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { v: {} } } ), true );

			// A path which cannot be created is refused too: there is no room for a field
			// named x inside the number 20.
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { 'v.x': { or: 1 } } } ), true );

			// And a path which names no field at all.
			assert.strictEqual( await refused( { _id: 1, v: 20 }, { $bit: { '': { or: 1 } } } ), true );
		} );

	} );

};
