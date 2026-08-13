'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' );

/*
	Covers the engine functions which had no direct test coverage.

	These were found by a mutation sweep: each function here was replaced with a
	plausible-but-wrong implementation and the suite still passed, or very nearly did.
	A test which does not fail when the code is broken is not doing any work.
*/


describe( '130) Engine Function Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'IsQuery Tests', () =>
	{

		it( 'should identify an object which uses a query operator', () =>
		{
			assert.strictEqual( jsongin.IsQuery( { $eq: 1 } ), true );
			assert.strictEqual( jsongin.IsQuery( { $gt: 1 } ), true );
			assert.strictEqual( jsongin.IsQuery( { $and: [] } ), true );
		} );

		it( 'should not identify a plain document as a query', () =>
		{
			assert.strictEqual( jsongin.IsQuery( { a: 1 } ), false );
			assert.strictEqual( jsongin.IsQuery( {} ), false );
		} );

		it( 'should only inspect the top level of the object', () =>
		{
			// An operator nested within a field is not detected. This is the documented
			// limitation noted in the source, not an accident.
			assert.strictEqual( jsongin.IsQuery( { a: { $gt: 1 } } ), false );
		} );

		it( 'should return false for values which are not objects', () =>
		{
			assert.strictEqual( jsongin.IsQuery( [] ), false );
			assert.strictEqual( jsongin.IsQuery( null ), false );
			assert.strictEqual( jsongin.IsQuery( 42 ), false );
			assert.strictEqual( jsongin.IsQuery( 'abc' ), false );
			assert.strictEqual( jsongin.IsQuery(), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Filter Tests', () =>
	{

		it( 'should return only the documents which match', () =>
		{
			let documents = [ { id: 1, team: 'a' }, { id: 2, team: 'b' }, { id: 3, team: 'a' } ];
			let filtered = jsongin.Filter( documents, { team: 'a' } );
			assert.strictEqual( filtered.length, 2 );
			assert.strictEqual( filtered[ 0 ].id, 1 );
			assert.strictEqual( filtered[ 1 ].id, 3 );
		} );

		it( 'should return an empty array when nothing matches', () =>
		{
			let filtered = jsongin.Filter( [ { a: 1 }, { a: 2 } ], { a: 99 } );
			assert.strictEqual( filtered.length, 0 );
		} );

		it( 'should match everything with an empty query', () =>
		{
			let filtered = jsongin.Filter( [ { a: 1 }, { a: 2 } ], {} );
			assert.strictEqual( filtered.length, 2 );
		} );

		it( 'should filter an empty array', () =>
		{
			assert.strictEqual( jsongin.Filter( [], { a: 1 } ).length, 0 );
		} );

		it( 'should support query operators', () =>
		{
			let documents = [ { n: 1 }, { n: 5 }, { n: 9 } ];
			assert.strictEqual( jsongin.Filter( documents, { n: { $gt: 4 } } ).length, 2 );
			assert.strictEqual( jsongin.Filter( documents, { n: { $in: [ 1, 9 ] } } ).length, 2 );
			assert.strictEqual( jsongin.Filter( documents, { $expr: { $gt: [ '$n', 4 ] } } ).length, 2 );
		} );

		it( 'should return the original document objects, not copies', () =>
		{
			let documents = [ { a: 1 } ];
			let filtered = jsongin.Filter( documents, { a: 1 } );
			assert.strictEqual( filtered[ 0 ], documents[ 0 ] );
		} );

		it( 'should not modify the array it was given', () =>
		{
			let documents = [ { a: 1 }, { a: 2 } ];
			jsongin.Filter( documents, { a: 1 } );
			assert.strictEqual( documents.length, 2 );
		} );

		it( 'should throw when the parameters are wrong', () =>
		{
			assert.throws( function () { jsongin.Filter( { a: 1 }, {} ); }, /Documents must be an array/ );
			assert.throws( function () { jsongin.Filter( [ { a: 1 } ], 42 ); }, /QueryCriteria must be an object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Distinct Tests', () =>
	{

		it( 'should return one entry per unique value', () =>
		{
			let result = jsongin.Distinct( [ { a: 1 }, { a: 2 }, { a: 1 } ], { a: 1 } );
			assert.strictEqual( result.length, 2 );
			assert.ok( jsongin.StrictEquals( result, [ { a: 1 }, { a: 2 } ] ) );
		} );

		it( 'should treat a combination of fields as the unique key', () =>
		{
			let documents = [ { a: 1, b: 1 }, { a: 1, b: 2 }, { a: 1, b: 1 } ];
			let result = jsongin.Distinct( documents, { a: 1, b: 1 } );
			assert.strictEqual( result.length, 2 );
		} );

		it( 'should support nested field paths', () =>
		{
			let documents = [ { u: { n: 'x' } }, { u: { n: 'x' } }, { u: { n: 'y' } } ];
			let result = jsongin.Distinct( documents, { 'u.n': 1 } );
			assert.strictEqual( result.length, 2 );
		} );

		it( 'should return only the fields named in the criteria', () =>
		{
			let result = jsongin.Distinct( [ { a: 1, b: 'ignored' } ], { a: 1 } );
			assert.ok( jsongin.StrictEquals( Object.keys( result[ 0 ] ), [ 'a' ] ) );
		} );

		it( 'should return an empty array for no documents', () =>
		{
			assert.strictEqual( jsongin.Distinct( [], { a: 1 } ).length, 0 );
		} );

		it( 'should throw when the parameters are wrong', () =>
		{
			assert.throws( function () { jsongin.Distinct( 42, { a: 1 } ); }, /Documents must be an array/ );
			assert.throws( function () { jsongin.Distinct( [], 42 ); }, /DistinctCriteria must be an object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Update Tests', () =>
	{

		// The update operators are covered by 250). These cover the Update() dispatcher
		// itself, which routes to them.

		it( 'should apply an update operator', () =>
		{
			let result = jsongin.Update( { a: 1 }, { $set: { a: 2 } } );
			assert.strictEqual( result.a, 2 );
		} );

		it( 'should apply several update operators in one call', () =>
		{
			let result = jsongin.Update( { a: 1, b: 1 }, { $set: { a: 2 }, $inc: { b: 5 } } );
			assert.strictEqual( result.a, 2 );
			assert.strictEqual( result.b, 6 );
		} );

		it( 'should return a copy and leave the original document unchanged', () =>
		{
			let document = { a: 1 };
			let result = jsongin.Update( document, { $set: { a: 9 } } );
			assert.strictEqual( document.a, 1 );
			assert.strictEqual( result.a, 9 );
			assert.notStrictEqual( result, document );
		} );

		it( 'should return the document unchanged when there are no updates', () =>
		{
			assert.strictEqual( jsongin.Update( { a: 1 }, null ).a, 1 );
			assert.strictEqual( jsongin.Update( { a: 1 }, undefined ).a, 1 );
		} );

		it( 'should ignore an unknown update operator', () =>
		{
			// The operator is logged to the OpLog and skipped, rather than throwing.
			let result = jsongin.Update( { a: 1 }, { $bogus: { a: 2 } } );
			assert.strictEqual( result.a, 1 );
		} );

		it( 'should return null when the parameters are wrong', () =>
		{
			assert.strictEqual( jsongin.Update( 42, { $set: { a: 1 } } ), null );
			assert.strictEqual( jsongin.Update( { a: 1 }, 42 ), null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'StrictEquals and LooseEquals Tests', () =>
	{

		it( 'should compare primitives strictly', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( 42, 42 ), true );
			assert.strictEqual( jsongin.StrictEquals( 42, '42' ), false );
			assert.strictEqual( jsongin.StrictEquals( true, 1 ), false );
			assert.strictEqual( jsongin.StrictEquals( 'abc', 'abc' ), true );
		} );

		it( 'should compare primitives loosely', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( 42, '42' ), true );
			assert.strictEqual( jsongin.LooseEquals( 42, 43 ), false );
		} );

		it( 'should equate null and undefined', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( null, undefined ), true );
			assert.strictEqual( jsongin.LooseEquals( null, undefined ), true );
		} );

		it( 'should compare objects by value', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( { a: 1, b: 2 }, { a: 1, b: 2 } ), true );
			assert.strictEqual( jsongin.StrictEquals( { a: 1 }, { a: 2 } ), false );
		} );

		it( 'should require key order to match strictly, but not loosely', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ), true );
		} );

		it( 'should compare arrays by value', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ 1, 2 ] ), true );
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ), false );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'BsonType Tests', () =>
	{

		it( 'should return the BSON type number and alias', () =>
		{
			assert.strictEqual( jsongin.BsonType( true ), 8 );
			assert.strictEqual( jsongin.BsonType( true, true ), 'bool' );
			assert.strictEqual( jsongin.BsonType( 'abc' ), 2 );
			assert.strictEqual( jsongin.BsonType( 'abc', true ), 'string' );
			assert.strictEqual( jsongin.BsonType( null ), 10 );
			assert.strictEqual( jsongin.BsonType( null, true ), 'null' );
			assert.strictEqual( jsongin.BsonType( {} ), 3 );
			assert.strictEqual( jsongin.BsonType( {}, true ), 'object' );
			assert.strictEqual( jsongin.BsonType( [] ), 4 );
			assert.strictEqual( jsongin.BsonType( [], true ), 'array' );
			assert.strictEqual( jsongin.BsonType( /abc/ ), 11 );
			assert.strictEqual( jsongin.BsonType( /abc/, true ), 'regex' );
			assert.strictEqual( jsongin.BsonType( undefined ), 6 );
			assert.strictEqual( jsongin.BsonType( undefined, true ), 'undefined' );
		} );

		it( 'should distinguish integers from doubles', () =>
		{
			assert.strictEqual( jsongin.BsonType( 42, true ), 'int' );
			assert.strictEqual( jsongin.BsonType( 3.14, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( 42 ), 16 );
			assert.strictEqual( jsongin.BsonType( 3.14 ), 1 );
		} );

		it( 'should report dates as the date BSON type', () =>
		{
			assert.strictEqual( jsongin.BsonType( new Date(), true ), 'date' );
			assert.strictEqual( jsongin.BsonType( new Date() ), 9 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Clone Tests', () =>
	{

		it( 'should copy a document by value', () =>
		{
			let document = { a: 1, nested: { b: 2 }, list: [ 1, 2 ] };
			let clone = jsongin.Clone( document );
			assert.ok( jsongin.StrictEquals( clone, document ) );
			assert.notStrictEqual( clone, document );
			assert.notStrictEqual( clone.nested, document.nested );
		} );

		it( 'should not share nested structure with the original', () =>
		{
			let document = { nested: { b: 2 } };
			let clone = jsongin.Clone( document );
			clone.nested.b = 99;
			assert.strictEqual( document.nested.b, 2 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Expand Tests', () =>
	{

		it( 'should expand dot notation into nested objects', () =>
		{
			let expanded = jsongin.Expand( { 'user.name': 'Alice', 'user.role': 'admin' } );
			assert.strictEqual( expanded.user.name, 'Alice' );
			assert.strictEqual( expanded.user.role, 'admin' );
		} );

		it( 'should expand numeric path elements into arrays', () =>
		{
			let expanded = jsongin.Expand( { 'list.0': 'a', 'list.1': 'b' } );
			assert.ok( Array.isArray( expanded.list ) );
			assert.strictEqual( expanded.list[ 0 ], 'a' );
			assert.strictEqual( expanded.list[ 1 ], 'b' );
		} );

		it( 'should reverse Flatten', () =>
		{
			let document = { id: 1, user: { name: 'Alice', tags: [ 'x', 'y' ] } };
			let round_tripped = jsongin.Expand( jsongin.Flatten( document ) );
			assert.ok( jsongin.StrictEquals( round_tripped, document ) );
		} );

	} );


} );
