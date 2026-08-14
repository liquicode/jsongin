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
	describe( 'Browser Globals', () =>
	{

		/*
			The browser build publishes two globals. window.jsongin is this module's export,
			written by the bundle, and window.liquicode.jsongin is written by the module itself.
			The Browser Usage document says the two are the same instance, and they have to be:
			the operator registries belong to an instance, so an operator registered through one
			global would otherwise be invisible through the other.

			The module used to build a second engine for window.liquicode.jsongin.
		*/

		function load_with_window()
		{
			let path = require.resolve( '../src/jsongin' );
			let saved_window = global.window;
			let saved_module = require.cache[ path ];

			delete require.cache[ path ];
			global.window = {};
			let engine = require( '../src/jsongin' );
			let published = global.window.liquicode;

			// Put the environment back the way it was found.
			delete require.cache[ path ];
			if ( typeof saved_window === 'undefined' ) { delete global.window; }
			else { global.window = saved_window; }
			if ( saved_module ) { require.cache[ path ] = saved_module; }

			return { Export: engine, Published: published };
		}

		it( 'should publish the module export rather than a second engine', () =>
		{
			let loaded = load_with_window();
			assert.ok( loaded.Published, 'window.liquicode was not defined.' );
			assert.strictEqual( loaded.Published.jsongin, loaded.Export );
		} );

		it( 'should publish the factory as well', () =>
		{
			let loaded = load_with_window();
			assert.strictEqual( typeof loaded.Published.NewJsongin, 'function' );
			assert.strictEqual( loaded.Published.NewJsongin, loaded.Export.NewJsongin );
		} );

		it( 'should share one operator registry between the two globals', () =>
		{
			let loaded = load_with_window();
			loaded.Published.jsongin.QueryOperators.$probe = { ValueTypes: 's' };
			assert.ok( typeof loaded.Export.QueryOperators.$probe !== 'undefined',
				'an operator registered through one global was invisible through the other.' );
			delete loaded.Export.QueryOperators.$probe;
		} );

	} );


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

		// The key of a multiple field criteria has to keep the fields apart.
		// Concatenating the values gave { a: 1, b: 23 } and { a: 12, b: 3 } the same key.
		it( 'should not run one field value into the next when building the key', () =>
		{
			let documents = [ { a: 1, b: 23 }, { a: 12, b: 3 } ];
			let result = jsongin.Distinct( documents, { a: 1, b: 1 } );
			assert.strictEqual( result.length, 2 );
			assert.ok( jsongin.StrictEquals( result, [ { a: 1, b: 23 }, { a: 12, b: 3 } ] ) );
		} );

		it( 'should not run one string value into the next when building the key', () =>
		{
			let documents = [ { a: 'x', b: 'yz' }, { a: 'xy', b: 'z' } ];
			assert.strictEqual( jsongin.Distinct( documents, { a: 1, b: 1 } ).length, 2 );
		} );

		// Values which serialize alike but are of different types are different values.
		it( 'should distinguish a date from its ISO string', () =>
		{
			let when = new Date( 1000 );
			let documents = [ { a: when }, { a: when.toISOString() } ];
			assert.strictEqual( jsongin.Distinct( documents, { a: 1 } ).length, 2 );
		} );

		it( 'should distinguish a number from its text', () =>
		{
			assert.strictEqual( jsongin.Distinct( [ { a: 1 }, { a: '1' } ], { a: 1 } ).length, 2 );
		} );

		it( 'should not alias the given documents', () =>
		{
			let documents = [ { a: { n: 1 } } ];
			let result = jsongin.Distinct( documents, { a: 1 } );
			result[ 0 ].a.n = 999;
			assert.strictEqual( documents[ 0 ].a.n, 1 );
		} );

		it( 'should preserve a date in the returned values', () =>
		{
			let when = new Date( 1000 );
			let result = jsongin.Distinct( [ { a: when } ], { a: 1 } );
			assert.ok( result[ 0 ].a instanceof Date );
			assert.strictEqual( result[ 0 ].a.getTime(), when.getTime() );
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

		it( 'should work when detached from the engine', () =>
		{
			// BsonType read the engine through `this`, so it threw whenever it was called
			// as anything other than a method of the engine.
			let bson_type = jsongin.BsonType;
			assert.strictEqual( bson_type( 42 ), 16 );
			assert.strictEqual( bson_type( 42, true ), 'int' );
			assert.strictEqual( bson_type( new Date() ), 9 );
		} );

		it( 'should work when passed as a callback', () =>
		{
			let values = [ true, 'abc', null ];
			let types = values.map( function ( Value ) { return jsongin.BsonType( Value ); } );
			assert.deepStrictEqual( types, [ 8, 2, 10 ] );
		} );

		it( 'should report NaN and the infinities as doubles', () =>
		{
			// These have no decimal point in their text and are not safe integers, so
			// classifying by text alone reported them as a long.
			assert.strictEqual( jsongin.BsonType( NaN ), 1 );
			assert.strictEqual( jsongin.BsonType( NaN, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( Infinity, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( -Infinity, true ), 'double' );
		} );

		it( 'should report an integer inside the int32 range as an int', () =>
		{
			assert.strictEqual( jsongin.BsonType( 42, true ), 'int' );
			assert.strictEqual( jsongin.BsonType( 0, true ), 'int' );
			assert.strictEqual( jsongin.BsonType( -7, true ), 'int' );
			assert.strictEqual( jsongin.BsonType( 2147483647, true ), 'int' );
			assert.strictEqual( jsongin.BsonType( -2147483648, true ), 'int' );
		} );

		it( 'should report a number outside the int32 range as a double', () =>
		{
			// A Javascript number is a double, and BSON stores it as an int32 only when it
			// fits that range. It is never a long. Verified against MongoDB 6.0.1 by
			// inserting each of these and reading back $type.
			assert.strictEqual( jsongin.BsonType( 2147483648, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( -2147483649, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( 3000000000, true ), 'double' );
			assert.strictEqual( jsongin.BsonType( Math.pow( 2, 53 ), true ), 'double' );
			assert.strictEqual( jsongin.BsonType( 3.14, true ), 'double' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'CompareValues Tests', () =>
	{

		it( 'should order NaN below every other number', () =>
		{
			// Every comparison against NaN is false, so comparing with < and > and falling
			// through reported NaN as equal to every number.
			assert.strictEqual( jsongin.CompareValues( NaN, NaN ), 0 );
			assert.strictEqual( jsongin.CompareValues( NaN, 1 ), -1 );
			assert.strictEqual( jsongin.CompareValues( 1, NaN ), 1 );
			assert.strictEqual( jsongin.CompareValues( NaN, -1e300 ), -1 );
		} );

		it( 'should keep NaN within the number type rank', () =>
		{
			assert.strictEqual( jsongin.CompareValues( NaN, null ), 1 );
			assert.strictEqual( jsongin.CompareValues( NaN, 'abc' ), -1 );
		} );

		it( 'should give Sort a total order when a NaN is present', () =>
		{
			let documents = [ { n: 3 }, { n: NaN }, { n: 1 }, { n: 2 } ];
			jsongin.Sort( documents, { n: 1 } );
			assert.ok( isNaN( documents[ 0 ].n ) );
			assert.deepStrictEqual( documents.slice( 1 ).map( function ( D ) { return D.n; } ), [ 1, 2, 3 ] );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'StrictEquals Symmetry Tests', () =>
	{

		it( 'should be symmetric', () =>
		{
			// StrictEquals called the $eq query operator, whose parameters are not peers:
			// a match value may equal an element of a document array. Correct for querying,
			// wrong for equality.
			assert.strictEqual( jsongin.StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] ), false );
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ [ 1, 2 ] ] ), false );
			assert.strictEqual( jsongin.StrictEquals( [ [ 1 ], [ 2 ] ], [ 1 ] ), false );
			assert.strictEqual( jsongin.StrictEquals( [ 1 ], [ [ 1 ], [ 2 ] ] ), false );
		} );

		it( 'should leave the $eq query operator alone', () =>
		{
			// The query behavior is MongoDB's and must not change.
			assert.strictEqual( jsongin.Query( { tags: [ [ 1, 2 ] ] }, { tags: { $eq: [ 1, 2 ] } } ), true );
		} );

		it( 'should let Diff see a change between those values', () =>
		{
			let before = { a: [ [ 1, 2 ] ] };
			let after = { a: [ 1, 2 ] };
			let patch = jsongin.Diff( before, after );
			assert.deepStrictEqual( patch, { $set: { a: [ 1, 2 ] } } );
			assert.deepStrictEqual( jsongin.Update( before, patch ), after );
		} );

		it( 'should still compare ordinary values as before', () =>
		{
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ 1, 2 ] ), true );
			assert.strictEqual( jsongin.StrictEquals( [ 1, 2 ], [ 2, 1 ] ), false );
			assert.strictEqual( jsongin.StrictEquals( { a: 1, b: 2 }, { b: 2, a: 1 } ), false );
			assert.strictEqual( jsongin.StrictEquals( 1, '1' ), false );
			assert.strictEqual( jsongin.StrictEquals( 0, false ), false );
			assert.strictEqual( jsongin.StrictEquals( null, undefined ), true );
			assert.strictEqual( jsongin.StrictEquals( new Date( 0 ), new Date( 0 ) ), true );
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


	//---------------------------------------------------------------------
	describe( 'DeleteValue Tests', () =>
	{

		/*
			DeleteValue is reachable through $unset, Project, and the $unwind stage, but its
			own contracts were never asserted directly.
		*/

		it( 'should remove a field', () =>
		{
			let document = { a: 1, b: 2 };
			assert.strictEqual( jsongin.DeleteValue( document, 'a' ), true );
			assert.deepStrictEqual( Object.keys( document ), [ 'b' ] );
		} );

		it( 'should remove the key rather than setting it to undefined', () =>
		{
			// This is the whole point of the function. Object.keys() and the document's
			// contents have to agree with each other.
			let document = { a: 1 };
			jsongin.DeleteValue( document, 'a' );
			assert.strictEqual( 'a' in document, false );
			assert.strictEqual( Object.keys( document ).length, 0 );
		} );

		it( 'should remove a nested field, leaving its parent', () =>
		{
			let document = { n: { x: 1, y: 2 } };
			assert.strictEqual( jsongin.DeleteValue( document, 'n.x' ), true );
			assert.deepStrictEqual( document, { n: { y: 2 } } );
		} );

		it( 'should remove a field from an array document', () =>
		{
			let document = [ { x: 1, y: 2 } ];
			assert.strictEqual( jsongin.DeleteValue( document, '0.x' ), true );
			assert.deepStrictEqual( document, [ { y: 2 } ] );
		} );

		it( 'should leave a hole rather than shortening an array', () =>
		{
			// Documented behavior, matching the Javascript delete operator. Diff never emits
			// a path into an array, so nothing in the library depends on this.
			let document = { t: [ 1, 2, 3 ] };
			assert.strictEqual( jsongin.DeleteValue( document, 't.1' ), true );
			assert.strictEqual( document.t.length, 3 );
			assert.strictEqual( document.t[ 1 ], undefined );
		} );

		it( 'should return false for a field which was not there', () =>
		{
			// The Javascript delete operator returns true for a property which was never
			// there, so reporting its result made every path whose parent resolved look
			// like a successful removal.
			assert.strictEqual( jsongin.DeleteValue( { a: 1 }, 'nope' ), false );
			assert.strictEqual( jsongin.DeleteValue( { a: { b: 1 } }, 'a.nope' ), false );
			assert.strictEqual( jsongin.DeleteValue( { a: [ 1, 2 ] }, 'a.9' ), false );
		} );

		it( 'should report a field holding undefined as present', () =>
		{
			let document = { a: undefined };
			assert.strictEqual( jsongin.DeleteValue( document, 'a' ), true );
			assert.deepStrictEqual( Object.keys( document ), [] );
		} );

		it( 'should not reach into an array by field name by default', () =>
		{
			// MongoDB's $unset does nothing here and reports modifiedCount 0. Verified
			// against MongoDB 6.0.1. Deleting from every element is a jsongin path
			// extension, off unless PathExtensions is enabled.
			let document = { a: [ { x: 1 }, { x: 2 } ] };
			assert.strictEqual( jsongin.DeleteValue( document, 'a.x' ), false );
			assert.deepStrictEqual( document, { a: [ { x: 1 }, { x: 2 } ] } );
		} );

		it( 'should run the implicit iterator against an array when PathExtensions is enabled', () =>
		{
			let engine = jsongin.NewJsongin( { PathExtensions: true } );
			let document = { a: [ { x: 1 }, { x: 2 } ] };
			assert.strictEqual( engine.DeleteValue( document, 'a.x' ), true );
			assert.deepStrictEqual( document, { a: [ {}, {} ] } );
		} );

		it( 'should iterate partially and skip non containers when PathExtensions is enabled', () =>
		{
			let engine = jsongin.NewJsongin( { PathExtensions: true } );
			let document = { a: [ { x: 1 }, { y: 2 }, 'scalar' ] };
			assert.strictEqual( engine.DeleteValue( document, 'a.x' ), true );
			assert.deepStrictEqual( document, { a: [ {}, { y: 2 }, 'scalar' ] } );

			// Nothing matched, so nothing was removed.
			assert.strictEqual( engine.DeleteValue( { a: [ { y: 1 } ] }, 'a.x' ), false );
		} );

		it( 'should run the implicit iterator at depth when PathExtensions is enabled', () =>
		{
			let engine = jsongin.NewJsongin( { PathExtensions: true } );
			let document = { a: [ { b: { c: 1 } }, { b: { c: 2 } } ] };
			assert.strictEqual( engine.DeleteValue( document, 'a.b.c' ), true );
			assert.deepStrictEqual( document, { a: [ { b: {} }, { b: {} } ] } );
		} );

		it( 'should accept a negative array index', () =>
		{
			let document = { a: [ 1, 2, 3 ] };
			assert.strictEqual( jsongin.DeleteValue( document, 'a.-1' ), true );
			assert.strictEqual( document.a.length, 3 );
			assert.strictEqual( Object.prototype.hasOwnProperty.call( document.a, 2 ), false );
		} );

		it( 'should accept a numeric path', () =>
		{
			let document = [ 'a', 'b' ];
			assert.strictEqual( jsongin.DeleteValue( document, 1 ), true );
			assert.strictEqual( document[ 1 ], undefined );
		} );

		it( 'should return false for an empty path', () =>
		{
			assert.strictEqual( jsongin.DeleteValue( { a: 1 }, '' ), false );
		} );

		it( 'should return false when the parent path does not resolve', () =>
		{
			assert.strictEqual( jsongin.DeleteValue( { a: 1 }, 'q.r' ), false );
			assert.strictEqual( jsongin.DeleteValue( { a: 1 }, 'a.b.c' ), false );
		} );

		it( 'should throw when the document is not an object or array', () =>
		{
			assert.throws( function () { jsongin.DeleteValue( 'abc', 'a' ); }, /must be an object or array/ );
			assert.throws( function () { jsongin.DeleteValue( 42, 'a' ); }, /must be an object or array/ );
		} );

		it( 'should throw when the path is not a string or a number', () =>
		{
			assert.throws( function () { jsongin.DeleteValue( { a: 1 }, {} ); }, /Path is invalid/ );
			assert.throws( function () { jsongin.DeleteValue( { a: 1 }, null ); }, /Path is invalid/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'CompareValues Ordering Tests', () =>
	{

		/*
			Sort(), the $min and $max operators, and Diff() all rest on CompareValues, and its
			array and object ordering rules had no direct assertions. The empty-array sort rule
			was found to be wrong once already, during the aggregation work, which is the
			argument for pinning the rest of them.
		*/

		it( 'should order values of different types by the BSON type order', () =>
		{
			// null < numbers < strings < objects < arrays < booleans < dates < regexes
			let ordered = [ null, 5, 'abc', { a: 1 }, [ 1 ], true, new Date( 0 ), /x/ ];
			for ( let index = 1; index < ordered.length; index++ )
			{
				assert.strictEqual( jsongin.CompareValues( ordered[ index - 1 ], ordered[ index ] ), -1,
					`[${index - 1}] should sort below [${index}].` );
				assert.strictEqual( jsongin.CompareValues( ordered[ index ], ordered[ index - 1 ] ), 1 );
			}
		} );

		it( 'should compare arrays element-wise', () =>
		{
			assert.strictEqual( jsongin.CompareValues( [ 1, 2 ], [ 1, 2 ] ), 0 );
			assert.strictEqual( jsongin.CompareValues( [ 1, 2 ], [ 1, 3 ] ), -1 );
			assert.strictEqual( jsongin.CompareValues( [ 2 ], [ 1, 9 ] ), 1 );
		} );

		it( 'should break an array tie on length', () =>
		{
			assert.strictEqual( jsongin.CompareValues( [ 1 ], [ 1, 2 ] ), -1 );
			assert.strictEqual( jsongin.CompareValues( [ 1, 2 ], [ 1 ] ), 1 );
			assert.strictEqual( jsongin.CompareValues( [], [] ), 0 );
			assert.strictEqual( jsongin.CompareValues( [], [ 1 ] ), -1 );
		} );

		it( 'should compare objects by their key names', () =>
		{
			assert.strictEqual( jsongin.CompareValues( { a: 1 }, { b: 1 } ), -1 );
			assert.strictEqual( jsongin.CompareValues( { b: 1 }, { a: 1 } ), 1 );
		} );

		it( 'should compare objects by their values when the keys match', () =>
		{
			assert.strictEqual( jsongin.CompareValues( { a: 1 }, { a: 1 } ), 0 );
			assert.strictEqual( jsongin.CompareValues( { a: 1 }, { a: 2 } ), -1 );
			assert.strictEqual( jsongin.CompareValues( { a: 2 }, { a: 1 } ), 1 );
		} );

		it( 'should break an object tie on key count', () =>
		{
			assert.strictEqual( jsongin.CompareValues( { a: 1 }, { a: 1, b: 2 } ), -1 );
			assert.strictEqual( jsongin.CompareValues( { a: 1, b: 2 }, { a: 1 } ), 1 );
			assert.strictEqual( jsongin.CompareValues( {}, {} ), 0 );
		} );

		it( 'should treat null and missing values as equivalent', () =>
		{
			assert.strictEqual( jsongin.CompareValues( null, undefined ), 0 );
			assert.strictEqual( jsongin.CompareValues( undefined, null ), 0 );
		} );

		it( 'should compare dates by their time value', () =>
		{
			assert.strictEqual( jsongin.CompareValues( new Date( 0 ), new Date( 0 ) ), 0 );
			assert.strictEqual( jsongin.CompareValues( new Date( 0 ), new Date( 1 ) ), -1 );
		} );

	} );


} );
