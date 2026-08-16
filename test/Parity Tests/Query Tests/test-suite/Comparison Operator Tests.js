'use strict';

const assert = require( 'assert' );

/*
	The comparison query operators, as MongoDB implements them.

	Migrated from test/Unit Tests/200) Comparison Operator Tests.js, which asserted the same
	behavior against jsongin directly and so could never be checked against a server.

	What did not come across, and why:

	- $eqx and $nex are jsongin extensions. They stay in the unit tests.
	- Cases built on `undefined`, functions, and symbols. Those are Javascript values with no
	  BSON counterpart, so a document carrying one does not survive a round trip through a
	  server and the comparison would not mean anything.
	- Assertions about aliasing and about calling an operator directly. Those are statements
	  about the jsongin API rather than about MongoDB behavior.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Answers whether one document satisfies one criteria.
	async function matches( Document, Criteria )
	{
		await Driver.SetData( [ Document ] );
		let found = await Driver.Find( Criteria );
		return ( found.length === 1 );
	}


	//---------------------------------------------------------------------
	describe( 'Comparison Operator Tests', () =>
	{


		//---------------------------------------------------------------------
		describe( '$eq Tests', () =>
		{

			it( 'should equate values of the same primitive type', async () =>
			{
				assert.ok( await matches( { v: true }, { v: { $eq: true } } ) );
				assert.ok( await matches( { v: 3.14 }, { v: { $eq: 3.14 } } ) );
				assert.ok( await matches( { v: 'abc' }, { v: { $eq: 'abc' } } ) );
			} );

			it( 'should not equate values across primitive types', async () =>
			{
				assert.ok( !await matches( { v: true }, { v: { $eq: 1 } } ) );
				assert.ok( !await matches( { v: 1 }, { v: { $eq: '1' } } ) );
				assert.ok( !await matches( { v: 'true' }, { v: { $eq: true } } ) );
			} );

			it( 'should equate null values', async () =>
			{
				assert.ok( await matches( { v: null }, { v: { $eq: null } } ) );
			} );

			it( 'should match null against a field which is not there', async () =>
			{
				assert.ok( await matches( { other: 1 }, { v: { $eq: null } } ) );
				assert.ok( await matches( { other: 1 }, { v: null } ) );
			} );

			it( 'should equate object values', async () =>
			{
				assert.ok( await matches( { v: { a: 1, b: 2 } }, { v: { $eq: { a: 1, b: 2 } } } ) );
			} );

			it( 'should not equate object values with keys in a different order', async () =>
			{
				assert.ok( !await matches( { v: { a: 1, b: 2 } }, { v: { $eq: { b: 2, a: 1 } } } ) );
			} );

			it( 'should equate array values', async () =>
			{
				assert.ok( await matches( { v: [ 1, 2, 3 ] }, { v: { $eq: [ 1, 2, 3 ] } } ) );
			} );

			it( 'should not equate arrays with elements in a different order', async () =>
			{
				assert.ok( !await matches( { v: [ 1, 2, 3 ] }, { v: { $eq: [ 3, 2, 1 ] } } ) );
			} );

			it( 'should equate dates by their time value', async () =>
			{
				assert.ok( await matches( { v: new Date( 1000 ) }, { v: { $eq: new Date( 1000 ) } } ) );
				assert.ok( !await matches( { v: new Date( 1000 ) }, { v: { $eq: new Date( 2000 ) } } ) );
			} );

			it( 'should not equate a date with the string or number which represents it', async () =>
			{
				assert.ok( !await matches( { v: new Date( 0 ) }, { v: { $eq: '1970-01-01T00:00:00.000Z' } } ) );
				assert.ok( !await matches( { v: new Date( 0 ) }, { v: { $eq: 0 } } ) );
			} );

			it( 'should keep the same rule for a date inside an object', async () =>
			{
				// A comparison which serializes both sides before comparing them would render
				// the date as its ISO string and call these equal.
				assert.ok( await matches( { v: { d: new Date( 0 ) } }, { v: { $eq: { d: new Date( 0 ) } } } ) );
				assert.ok( !await matches( { v: { d: new Date( 0 ) } }, { v: { $eq: { d: '1970-01-01T00:00:00.000Z' } } } ) );
			} );

			it( 'should match an array field by one of its elements', async () =>
			{
				assert.ok( await matches( { v: [ 'red', 'blue' ] }, { v: { $eq: 'red' } } ) );
				assert.ok( await matches( { v: [ 'red', 'blue' ] }, { v: 'red' } ) );
			} );

			it( 'should match an array field as a whole', async () =>
			{
				assert.ok( await matches( { v: [ 'red' ] }, { v: { $eq: [ 'red' ] } } ) );
			} );

			it( 'should not descend into an array inside an array without an index', async () =>
			{
				assert.ok( !await matches( { v: [ [ 'red' ] ] }, { v: { $eq: 'red' } } ) );
			} );

			it( 'should match through a path which crosses an array', async () =>
			{
				assert.ok( await matches( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $eq: 2 } } ) );
			} );

			it( 'should match through two levels of array', async () =>
			{
				assert.ok( await matches( { a: [ { b: [ { c: 1 } ] } ] }, { 'a.b.c': { $eq: 1 } } ) );
			} );

			it( 'should tell a gathered value from a real array', async () =>
			{
				// The first document's 'a.x' gathers to two values, neither an array.
				// The second document's 'a.x' really is a two element array.
				assert.ok( !await matches( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $eq: [ 1, 2 ] } } ) );
				assert.ok( await matches( { a: [ { x: [ 1, 2 ] } ] }, { 'a.x': { $eq: [ 1, 2 ] } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$ne Tests', () =>
		{

			it( 'should be the negation of $eq', async () =>
			{
				assert.ok( await matches( { v: 1 }, { v: { $ne: 2 } } ) );
				assert.ok( !await matches( { v: 1 }, { v: { $ne: 1 } } ) );
			} );

			it( 'should not match a field which is not there when the value is null', async () =>
			{
				assert.ok( !await matches( { other: 1 }, { v: { $ne: null } } ) );
			} );

			it( 'should not match when any element of an array equals the value', async () =>
			{
				assert.ok( !await matches( { v: [ 1, 2 ] }, { v: { $ne: 1 } } ) );
				assert.ok( await matches( { v: [ 1, 2 ] }, { v: { $ne: 3 } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Range Operator Tests', () =>
		{

			it( 'should compare numbers', async () =>
			{
				assert.ok( await matches( { v: 5 }, { v: { $gt: 4 } } ) );
				assert.ok( !await matches( { v: 5 }, { v: { $gt: 5 } } ) );
				assert.ok( await matches( { v: 5 }, { v: { $gte: 5 } } ) );
				assert.ok( await matches( { v: 5 }, { v: { $lt: 6 } } ) );
				assert.ok( !await matches( { v: 5 }, { v: { $lt: 5 } } ) );
				assert.ok( await matches( { v: 5 }, { v: { $lte: 5 } } ) );
			} );

			it( 'should compare strings', async () =>
			{
				assert.ok( await matches( { v: 'b' }, { v: { $gt: 'a' } } ) );
				assert.ok( await matches( { v: 'b' }, { v: { $lt: 'c' } } ) );
			} );

			it( 'should compare dates', async () =>
			{
				assert.ok( await matches( { v: new Date( 2000 ) }, { v: { $gt: new Date( 1000 ) } } ) );
				assert.ok( await matches( { v: new Date( 1000 ) }, { v: { $lte: new Date( 1000 ) } } ) );
			} );

			it( 'should bracket the comparison by type', async () =>
			{
				// A number is never greater than a string, however the BSON ordering ranks the
				// two types against each other.
				assert.ok( !await matches( { v: 5 }, { v: { $gt: 'hello' } } ) );
				assert.ok( !await matches( { v: 'hello' }, { v: { $gt: 5 } } ) );
				assert.ok( !await matches( { v: 5 }, { v: { $lt: 'hello' } } ) );
			} );

			it( 'should compare any element of an array', async () =>
			{
				assert.ok( await matches( { v: [ 1, 9 ] }, { v: { $gt: 5 } } ) );
				assert.ok( !await matches( { v: [ 1, 2 ] }, { v: { $gt: 5 } } ) );
			} );

			it( 'should compare through a path which crosses an array', async () =>
			{
				assert.ok( await matches( { a: [ { x: 1 }, { x: 9 } ] }, { 'a.x': { $gt: 5 } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$in and $nin Tests', () =>
		{

			it( 'should match any of the given values', async () =>
			{
				assert.ok( await matches( { v: 2 }, { v: { $in: [ 1, 2, 3 ] } } ) );
				assert.ok( !await matches( { v: 9 }, { v: { $in: [ 1, 2, 3 ] } } ) );
			} );

			it( 'should match nothing for an empty list', async () =>
			{
				assert.ok( !await matches( { v: 1 }, { v: { $in: [] } } ) );
				assert.ok( await matches( { v: 1 }, { v: { $nin: [] } } ) );
			} );

			it( 'should match when any element of an array field is in the list', async () =>
			{
				assert.ok( await matches( { v: [ 1, 9 ] }, { v: { $in: [ 9 ] } } ) );
			} );

			it( 'should match dates by their time value', async () =>
			{
				assert.ok( await matches( { v: new Date( 0 ) }, { v: { $in: [ new Date( 0 ) ] } } ) );
			} );

			it( 'should pattern match a string with a regexp in the list', async () =>
			{
				assert.ok( await matches( { v: 'hello' }, { v: { $in: [ /ell/ ] } } ) );
				assert.ok( !await matches( { v: 5 }, { v: { $in: [ /5/ ] } } ) );
			} );

			it( 'should be negated by $nin', async () =>
			{
				assert.ok( await matches( { v: 9 }, { v: { $nin: [ 1, 2 ] } } ) );
				assert.ok( !await matches( { v: 1 }, { v: { $nin: [ 1, 2 ] } } ) );
			} );

			it( 'should match a sub-document in the list', async () =>
			{
				assert.ok( await matches( { v: { x: 1 } }, { v: { $in: [ { x: 1 } ] } } ) );
			} );

			it( 'should match an array in the list', async () =>
			{
				assert.ok( await matches( { v: [ 1, 2 ] }, { v: { $in: [ [ 1, 2 ] ] } } ) );
			} );

			it( 'should match a field which is not there against null', async () =>
			{
				// { $in: [ null ] } is the idiom for "missing or null".
				assert.ok( await matches( { other: 1 }, { v: { $in: [ null ] } } ) );
				assert.ok( !await matches( { other: 1 }, { v: { $nin: [ null ] } } ) );
			} );

			it( 'should match through a path which crosses an array', async () =>
			{
				assert.ok( await matches( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $in: [ 5 ] } } ) );
				assert.ok( await matches( { a: [ { x: [ 5, 6 ] } ] }, { 'a.x': { $in: [ [ 5, 6 ] ] } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$exists Tests', () =>
		{

			it( 'should find a field which is there', async () =>
			{
				assert.ok( await matches( { v: 1 }, { v: { $exists: true } } ) );
				assert.ok( !await matches( { v: 1 }, { v: { $exists: false } } ) );
			} );

			it( 'should find a field which holds null', async () =>
			{
				assert.ok( await matches( { v: null }, { v: { $exists: true } } ) );
			} );

			it( 'should not find a field which is not there', async () =>
			{
				assert.ok( !await matches( { other: 1 }, { v: { $exists: true } } ) );
				assert.ok( await matches( { other: 1 }, { v: { $exists: false } } ) );
			} );

			it( 'should tell a missing field from a present one through an array', async () =>
			{
				assert.ok( !await matches( { a: [ { y: 1 } ] }, { 'a.x': { $exists: true } } ) );
				assert.ok( await matches( { a: [ { x: 1 } ] }, { 'a.x': { $exists: true } } ) );
			} );

			it( 'should coerce a non-boolean value to a boolean', async () =>
			{
				// The value is documented as a boolean, but any value is accepted and read for
				// its truthiness.
				assert.ok( await matches( { v: 1 }, { v: { $exists: 1 } } ) );
				assert.ok( await matches( { other: 1 }, { v: { $exists: 0 } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$type Tests', () =>
		{

			it( 'should select by type name', async () =>
			{
				assert.ok( await matches( { v: 'abc' }, { v: { $type: 'string' } } ) );
				assert.ok( await matches( { v: true }, { v: { $type: 'bool' } } ) );
				assert.ok( await matches( { v: null }, { v: { $type: 'null' } } ) );
				assert.ok( await matches( { v: new Date( 0 ) }, { v: { $type: 'date' } } ) );
				assert.ok( await matches( { v: { a: 1 } }, { v: { $type: 'object' } } ) );
			} );

			it( 'should select an array by the type of its elements, or as an array', async () =>
			{
				assert.ok( await matches( { v: [ 1, 2 ] }, { v: { $type: 'array' } } ) );
				assert.ok( await matches( { v: [ 1, 'x' ] }, { v: { $type: 'string' } } ) );
			} );

			it( 'should accept a list of types', async () =>
			{
				assert.ok( await matches( { v: 'x' }, { v: { $type: [ 'int', 'string' ] } } ) );
			} );

			it( 'should not select a field which is not there', async () =>
			{
				assert.ok( !await matches( { other: 1 }, { v: { $type: 'null' } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$size Tests', () =>
		{

			it( 'should measure an array field', async () =>
			{
				assert.ok( await matches( { v: [ 1, 2 ] }, { v: { $size: 2 } } ) );
				assert.ok( !await matches( { v: [ 1, 2 ] }, { v: { $size: 3 } } ) );
				assert.ok( await matches( { v: [] }, { v: { $size: 0 } } ) );
			} );

			it( 'should not measure a field which is not an array', async () =>
			{
				assert.ok( !await matches( { v: 'ab' }, { v: { $size: 2 } } ) );
			} );

			it( 'should measure the field rather than a gathered value', async () =>
			{
				assert.ok( !await matches( { a: [ { x: 1 }, { x: 2 } ] }, { 'a.x': { $size: 2 } } ) );
				assert.ok( await matches( { a: [ { x: [ 1, 2 ] } ] }, { 'a.x': { $size: 2 } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$all Tests', () =>
		{

			it( 'should require every value to be present', async () =>
			{
				assert.ok( await matches( { v: [ 1, 2, 3 ] }, { v: { $all: [ 1, 3 ] } } ) );
				assert.ok( !await matches( { v: [ 1, 2 ] }, { v: { $all: [ 1, 9 ] } } ) );
			} );

			it( 'should match a field which is not an array', async () =>
			{
				assert.ok( await matches( { v: 50 }, { v: { $all: [ 50 ] } } ) );
			} );

			it( 'should select nothing for an empty list', async () =>
			{
				assert.ok( !await matches( { v: [ 1 ] }, { v: { $all: [] } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$elemMatch Tests', () =>
		{

			it( 'should require one element to satisfy every condition', async () =>
			{
				assert.ok( await matches( { v: [ 1, 5, 9 ] }, { v: { $elemMatch: { $gt: 4, $lt: 6 } } } ) );
				assert.ok( !await matches( { v: [ 1, 9 ] }, { v: { $elemMatch: { $gt: 4, $lt: 6 } } } ) );
			} );

			it( 'should match a field of an element', async () =>
			{
				assert.ok( await matches( { v: [ { x: 1 }, { x: 2 } ] }, { v: { $elemMatch: { x: 2 } } } ) );
			} );

			it( 'should not match a field which is not an array', async () =>
			{
				assert.ok( !await matches( { v: 5 }, { v: { $elemMatch: { $gt: 1 } } } ) );
			} );

			it( 'should match an array reached through a path which crosses an array', async () =>
			{
				assert.ok( await matches( { a: [ { b: [ 1, 2 ] } ] }, { 'a.b': { $elemMatch: { $gt: 1 } } } ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( '$regex Tests', () =>
		{

			it( 'should pattern match a string', async () =>
			{
				assert.ok( await matches( { v: 'hello' }, { v: { $regex: 'ell' } } ) );
				assert.ok( await matches( { v: 'hello' }, { v: /ell/ } ) );
				assert.ok( !await matches( { v: 'hello' }, { v: { $regex: 'xyz' } } ) );
			} );

			it( 'should not pattern match a value which is not a string', async () =>
			{
				assert.ok( !await matches( { v: 5 }, { v: { $regex: '5' } } ) );
			} );

			it( 'should pattern match any element of an array', async () =>
			{
				assert.ok( await matches( { v: [ 'foo', 'bar' ] }, { v: { $regex: 'oo' } } ) );
			} );

			it( 'should pattern match through a path which crosses an array', async () =>
			{
				assert.ok( await matches( { a: [ { x: 'zed' } ] }, { 'a.x': { $regex: 'ze' } } ) );
			} );

			it( 'should apply the flags given by $options', async () =>
			{
				assert.ok( await matches( { v: 'FOO' }, { v: { $regex: 'foo', $options: 'i' } } ) );
				assert.ok( !await matches( { v: 'FOO' }, { v: { $regex: 'foo' } } ) );
			} );

			it( 'should test each document independently of the last', async () =>
			{
				// A pattern carrying the global flag holds a lastIndex, and reusing one object
				// across documents must not let one document's match move the next one's
				// starting point.
				await Driver.SetData( [ { v: 'xx' }, { v: 'xx' }, { v: 'xx' }, { v: 'xx' } ] );
				let found = await Driver.Find( { v: /x/g } );
				assert.strictEqual( found.length, 4 );
			} );

		} );


	} );

};
