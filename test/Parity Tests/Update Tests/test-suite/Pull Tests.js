'use strict';

const assert = require( 'assert' );

/*
	$pull, which removes array elements matching a condition.

	***The condition is a query, not a value***, and that is the whole of what makes this
	operator different from $pullAll beside it. $pullAll removes elements equal to the ones
	listed; $pull removes every element a query selects, so it reaches operators, ranges, and
	the fields of an embedded document.

	***What a bare document means is the question worth asking first.*** Given an array of
	embedded documents, is `{ $pull: { a: { b: 1 } } }` a request to remove elements equal to
	`{ b: 1 }`, or elements whose `b` is 1? The two differ for every element which has a `b` of
	1 and other fields besides, and only one of them is MongoDB.

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
	async function refused( Document, Update )
	{
		try
		{
			let result = await applied( Document, Update );
			// An update counts as refused if it threw or left the document unchanged, which is
			// the rule the rejection suites use: both tell a caller it did not happen.
			return ( JSON.stringify( result ) === JSON.stringify( Object.assign( { _id: result._id }, Document ) ) );
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'Pull Tests', () =>
	{

		it( 'should remove every element equal to a scalar', async () =>
		{
			let document = await applied( { a: [ 1, 3, 5, 3 ] }, { $pull: { a: 3 } } );
			assert.deepStrictEqual( document.a, [ 1, 5 ] );
		} );

		it( 'should remove every element a query condition selects', async () =>
		{
			let document = await applied( { a: [ 1, 3, 5, 7 ] }, { $pull: { a: { $gt: 3 } } } );
			assert.deepStrictEqual( document.a, [ 1, 3 ] );
		} );

		it( 'should take a condition of several operators', async () =>
		{
			let document = await applied( { a: [ 1, 3, 5, 7 ] }, { $pull: { a: { $gte: 3, $lt: 7 } } } );
			assert.deepStrictEqual( document.a, [ 1, 7 ] );
		} );

		it( 'should take $in as a condition', async () =>
		{
			let document = await applied( { a: [ 1, 2, 3 ] }, { $pull: { a: { $in: [ 1, 3 ] } } } );
			assert.deepStrictEqual( document.a, [ 2 ] );
		} );

		it( 'should read a bare document as a condition on the fields of each element', async () =>
		{
			// ***A query, not an equality test.*** The element has a c as well as a b, and it
			// still goes, because the condition only asks about b.
			let document = await applied(
				{ a: [ { b: 1, c: 2 }, { b: 2 }, { b: 1 } ] },
				{ $pull: { a: { b: 1 } } } );
			assert.deepStrictEqual( document.a, [ { b: 2 } ] );
		} );

		it( 'should match an embedded document on several fields at once', async () =>
		{
			let document = await applied(
				{ a: [ { b: 1, c: 2 }, { b: 1, c: 3 } ] },
				{ $pull: { a: { b: 1, c: 2 } } } );
			assert.deepStrictEqual( document.a, [ { b: 1, c: 3 } ] );
		} );

		it( 'should remove an element equal to a whole array', async () =>
		{
			let document = await applied( { a: [ [ 1, 2 ], [ 3 ] ] }, { $pull: { a: [ 1, 2 ] } } );
			assert.deepStrictEqual( document.a, [ [ 3 ] ] );
		} );

		it( 'should leave an empty array when everything matches', async () =>
		{
			let document = await applied( { a: [ 1, 1 ] }, { $pull: { a: 1 } } );
			assert.deepStrictEqual( document.a, [] );
		} );

		it( 'should leave the array alone when nothing matches', async () =>
		{
			let document = await applied( { a: [ 1, 2 ] }, { $pull: { a: 9 } } );
			assert.deepStrictEqual( document.a, [ 1, 2 ] );
		} );

		it( 'should leave a document which does not have the field alone', async () =>
		{
			let document = await applied( { b: 1 }, { $pull: { a: 1 } } );
			assert.strictEqual( 'a' in document, false );
		} );

		it( 'should pull from a nested array by path', async () =>
		{
			let document = await applied( { o: { a: [ 1, 2, 3 ] } }, { $pull: { 'o.a': 2 } } );
			assert.deepStrictEqual( document.o.a, [ 1, 3 ] );
		} );

		it( 'should pull several fields in one update', async () =>
		{
			let document = await applied( { a: [ 1, 2 ], b: [ 3, 4 ] }, { $pull: { a: 1, b: 4 } } );
			assert.deepStrictEqual( document.a, [ 2 ] );
			assert.deepStrictEqual( document.b, [ 3 ] );
		} );

		it( 'should refuse a field which is not an array', async () =>
		{
			assert.strictEqual( await refused( { a: 5 }, { $pull: { a: 1 } } ), true );
			assert.strictEqual( await refused( { a: 'text' }, { $pull: { a: 1 } } ), true );
		} );

		it( 'should take $elemMatch as a condition on an array of arrays', async () =>
		{
			let document = await applied(
				{ a: [ [ 1, 2 ], [ 5, 6 ] ] },
				{ $pull: { a: { $elemMatch: { $gt: 4 } } } } );
			assert.deepStrictEqual( document.a, [ [ 1, 2 ] ] );
		} );

		it( 'should not reach inside a nested array to match a scalar', async () =>
			{
				// ***The condition applies to the element, not through it.*** A query for
				// { a: 1 } would match a document whose a is [ 1, 2 ], so if $pull simply ran
				// the condition as an ordinary query the [ 1, 2 ] here would go too. It does
				// not: only the element which ***is*** 1 is removed.
				let document = await applied( { a: [ [ 1, 2 ], [ 3 ], 1 ] }, { $pull: { a: 1 } } );
				assert.deepStrictEqual( document.a, [ [ 1, 2 ], [ 3 ] ] );
			} );

		it( 'should not match a scalar element against a field condition', async () =>
		{
			// A condition on fields can only select something which has fields, so the
			// scalars are left where they are rather than being treated as non-matches of a
			// different kind.
			let document = await applied( { a: [ 1, { b: 1 }, 'x' ] }, { $pull: { a: { b: 1 } } } );
			assert.deepStrictEqual( document.a, [ 1, 'x' ] );
		} );

		it( 'should read a condition which names nothing as a field condition', async () =>
		{
			// ***An empty document is a condition on fields, not a match for everything.*** It
			// asks nothing of an element and so selects every element which ***has*** fields,
			// leaving the scalars where they are. Reading it the other way - as an operator
			// condition, since vacuously every one of its keys is an operator - would empty
			// the array.
			let document = await applied( { a: [ 1, { b: 2 }, 'x' ] }, { $pull: { a: {} } } );
			assert.deepStrictEqual( document.a, [ 1, 'x' ] );
		} );

		it( 'should remove a null element when the condition is null', async () =>
		{
			let document = await applied( { a: [ 1, null, 2 ] }, { $pull: { a: null } } );
			assert.deepStrictEqual( document.a, [ 1, 2 ] );
		} );

	} );

};
