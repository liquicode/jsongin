'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );

/*
	Covers the engine functions which had no direct test coverage.

	These were found by a mutation sweep: each function here was replaced with a
	plausible-but-wrong implementation and the suite still passed, or very nearly did.
	A test which does not fail when the code is broken is not doing any work.
*/


describe( '130) Engine Function Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Default Settings Tests', () =>
	{
		/*
			The parity suites run against an unconfigured engine, on the grounds that MongoDB
			behavior is what jsongin does when it is told nothing. That only holds while the
			defaults stay where they are, and nothing else pins them.

			Changing a default is allowed. Changing one without noticing that it moves the
			whole parity claim is not, which is what these tests are here to prevent.

			See test/Parity Tests/jsongin-Tests.js.
		*/

		it( 'should not carry a PathExtensions setting', () =>
		{
			// There is nothing to turn on. jsongin's path syntax is MongoDB's path syntax:
			// the implicit iterator is not a write target on either engine, so the setting
			// which used to relax that was removed rather than defaulted.
			assert.strictEqual( 'PathExtensions' in jsongin.Settings, false );
			assert.strictEqual( 'PathExtensions' in jsongin.NewJsongin().Settings, false );
		} );

		it( 'should default the OpLog and OpError hooks to null', () =>
		{
			assert.strictEqual( jsongin.OpLog, null );
			assert.strictEqual( jsongin.OpError, null );
		} );

		it( 'should export a configured engine, not a factory', () =>
		{
			// require( '@liquicode/jsongin' ) is a ready to use engine. The parity driver
			// takes this same instance when it is given no settings.
			assert.strictEqual( typeof jsongin.Query, 'function' );
			assert.strictEqual( typeof jsongin.NewJsongin, 'function' );
		} );

		it( 'should give a new engine its own operator registry', () =>
		{
			// Registries belong to an instance, which is why the parity driver must not build
			// a second engine when it means to test the one the package exports.
			let engine = jsongin.NewJsongin();
			assert.notStrictEqual( engine, jsongin );
			assert.notStrictEqual( engine.QueryOperators, jsongin.QueryOperators );
		} );

	} );


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
			let path = require.resolve( '../../src/jsongin' );
			let saved_window = global.window;
			let saved_module = require.cache[ path ];

			delete require.cache[ path ];
			global.window = {};
			let engine = require( '../../src/jsongin' );
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
	describe( 'ValidateQuery Tests', () =>
	{

		it( 'should accept every criteria Query accepts', () =>
		{
			jsongin.ValidateQuery( {} );
			jsongin.ValidateQuery( { a: 1 } );
			jsongin.ValidateQuery( { a: { $gt: 1, $lt: 5 }, b: /x/, c: { $regex: 'x', $options: 'i' } } );
			jsongin.ValidateQuery( { $or: [ { a: 1 }, { $and: [ { b: { $in: [ 1, 2 ] } }, { c: { $not: { $gt: 1 } } } ] } ] } );
			jsongin.ValidateQuery( { a: { $elemMatch: { b: 1, c: { $gt: 1 } } }, d: { $elemMatch: { $gt: 1, $lt: 5 } } } );
			jsongin.ValidateQuery( { a: { $elemMatch: { $or: [ { b: 1 }, { c: 1 } ] } } } );
			jsongin.ValidateQuery( { a: { $all: [ { $elemMatch: { b: 1 } }, { $elemMatch: { c: 1 } } ] } } );
			jsongin.ValidateQuery( { $expr: { $gt: [ '$a', 1 ] }, $comment: 'x' } );
			jsongin.ValidateQuery( { 'a.b': null, 'a.0': { $exists: false } } );
		} );

		it( 'should refuse what Query refuses', () =>
		{
			assert.throws( () => jsongin.ValidateQuery( { $nope: 1 } ) );
			assert.throws( () => jsongin.ValidateQuery( { $and: [] } ) );
			assert.throws( () => jsongin.ValidateQuery( { $and: { a: 1 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { $not: { a: 1 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $or: [ { $gt: 0 } ] } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $size: 2.5 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $size: -1 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $mod: [ 0, 1 ] } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $type: 'bogus' } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $all: [ { $elemMatch: { b: 1 } }, 1 ] } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $regex: 'x', $options: 'q' } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $options: 'i' } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: undefined } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $exists: true, b: 1 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { $or: [ { a: { $gt: 1, b: 1 } } ] } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $not: { b: 1 } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $not: { b: 1, $gt: 1 } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { $exists: true, b: 1 } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { b: 1, $exists: true } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { $gt: 1, $comment: 'x' } } } ) );
		} );

		it( 'should read an object whose first key is a field name as a value', () =>
		{
			// The first key decides whether an object is an operator object or a value.
			jsongin.ValidateQuery( { a: { b: 1, $exists: true } } );
			jsongin.ValidateQuery( { a: { $in: [ { b: 1, $gt: 5 } ] }, c: { $all: [ { d: 1, $gt: 5 } ] } } );
			assert.strictEqual( jsongin.Query( { a: { b: 1 } }, { a: { b: 1, $exists: true } } ), false );
			assert.strictEqual( jsongin.Query( { a: { b: 1 } }, { a: { $nin: [ { b: 1, $gt: 5 } ] } } ), true );
		} );

		it( 'should refuse a mistake behind a condition Query would never reach', () =>
		{
			// Query stops at the first false condition; a document with a: 1 never reaches
			// the $size. ValidateQuery walks everything.
			assert.strictEqual( jsongin.Query( { a: 1 }, { a: 2, b: { $size: 2.5 } } ), false );
			assert.throws( () => jsongin.ValidateQuery( { a: 2, b: { $size: 2.5 } } ) );
			assert.throws( () => jsongin.ValidateQuery( { $or: [ { a: 1 }, { b: { $type: 'bogus' } } ] } ) );
			assert.throws( () => jsongin.ValidateQuery( { $and: [ { a: 1 }, { b: { $or: [ { $gt: 0 } ] } } ] } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $not: { $size: -1 } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { b: { $size: 2.5 } } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { b: { $or: [ { $gt: 0 } ] } } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $elemMatch: { $expr: { $gt: [ '$a', 1 ] } } } } ) );
			assert.throws( () => jsongin.ValidateQuery( { a: { $all: [ { $elemMatch: { b: { $size: 2.5 } } } ] } } ) );
		} );

		it( 'should refuse a criteria which is not an object', () =>
		{
			assert.throws( () => jsongin.ValidateQuery( 'abc' ) );
			assert.throws( () => jsongin.ValidateQuery( null ) );
			assert.throws( () => jsongin.ValidateQuery() );
			assert.throws( () => jsongin.ValidateQuery( [ { a: 1 } ] ) );
		} );

	} );


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

		// The consequence of the test above, stated the way a caller meets it. Filter is a
		// selection and clones nothing, which the pass-through aggregation stages follow and
		// Filter.md states. A document-producing stage clones instead.
		it( 'should let a write through the result reach the source document', () =>
		{
			let documents = [ { a: { n: 1 } } ];
			let filtered = jsongin.Filter( documents, { a: { n: 1 } } );
			filtered[ 0 ].a.n = 999;
			assert.strictEqual( documents[ 0 ].a.n, 999 );
		} );

		it( 'should return a new array, so the result can be reordered safely', () =>
		{
			let documents = [ { a: 1 }, { a: 1 } ];
			let filtered = jsongin.Filter( documents, { a: 1 } );
			assert.notStrictEqual( filtered, documents );
			filtered.pop();
			assert.strictEqual( documents.length, 2 );
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

		it( 'should leave out a field which a document does not have', () =>
		{
			// An absent field is deleted rather than set to undefined, everywhere in the family.
			// The key used to be written holding undefined.
			let result = jsongin.Distinct( [ { a: 1, b: 2 }, { a: 1 } ], { a: 1, b: 1 } );
			assert.strictEqual( result.length, 2 );
			assert.ok( jsongin.StrictEquals( Object.keys( result[ 1 ] ), [ 'a' ] ) );
			assert.strictEqual( Object.prototype.hasOwnProperty.call( result[ 1 ], 'b' ), false );
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
	/*
		***Two sets of documents, matched against each other.***

		MongoDB does this as the `$lookup` stage, which names a collection on a server; this
		takes the documents themselves, so the engine needs no collection to join. The shape of
		the answer is `$lookup`'s: one document out for each document in, holding everything it
		matched - not SQL's row multiplication.

		The criteria is matched against each join document with the document being joined from
		lent as `$$Left`, which is what the options a query carries were built for.
	*/
	describe( 'Join Tests', () =>
	{

		let bookings = [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'C' } ];
		let nights = [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' }, { DomeId: 'B', Night: 'fog' } ];
		let on_dome = { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } };

		it( 'should gather the matches under a name, one document out for each in', () =>
		{
			let joined = jsongin.Join( bookings, nights, on_dome, 'Left', 'Nights' );
			assert.strictEqual( joined.length, 2 );
			assert.deepStrictEqual( joined[ 0 ], {
				Id: 1, Dome: 'A',
				Nights: [ { DomeId: 'A', Night: 'clear' }, { DomeId: 'A', Night: 'rain' } ],
			} );
			// ***A document which matched nothing keeps the shape***, so the answer can be read
			// without asking whether anything matched.
			assert.deepStrictEqual( joined[ 1 ], { Id: 2, Dome: 'C', Nights: [] } );
		} );

		it( 'should merge the matches into the document when it is given no name', () =>
		{
			let joined = jsongin.Join( bookings, nights, on_dome );
			// Merged one after another, so a field two matches share takes the last one's value.
			assert.deepStrictEqual( joined[ 0 ], { Id: 1, Dome: 'A', DomeId: 'A', Night: 'rain' } );
			// And a document which matched nothing is itself.
			assert.deepStrictEqual( joined[ 1 ], { Id: 2, Dome: 'C' } );
		} );

		it( 'should answer for each of the four joins', () =>
		{
			function ids( Joined )
			{
				return Joined.map( function ( Each ) { return ( typeof Each.Id === 'undefined' ) ? Each.Night : Each.Id; } );
			}
			assert.deepStrictEqual( ids( jsongin.Join( bookings, nights, on_dome, 'Left', 'N' ) ), [ 1, 2 ] );
			assert.deepStrictEqual( ids( jsongin.Join( bookings, nights, on_dome, 'Inner', 'N' ) ), [ 1 ] );
			// An unmatched join document comes back alone: there is nothing to attach it to.
			assert.deepStrictEqual( ids( jsongin.Join( bookings, nights, on_dome, 'Right', 'N' ) ), [ 1, 'fog' ] );
			assert.deepStrictEqual( ids( jsongin.Join( bookings, nights, on_dome, 'Outer', 'N' ) ), [ 1, 2, 'fog' ] );
			// The unmatched one carries no JoinName field.
			let outer = jsongin.Join( bookings, nights, on_dome, 'Outer', 'N' );
			assert.deepStrictEqual( outer[ 2 ], { DomeId: 'B', Night: 'fog' } );
			// The name is matched without regard to case, and Left is the default.
			assert.deepStrictEqual( jsongin.Join( bookings, nights, on_dome, 'inner', 'N' ).length, 1 );
			assert.deepStrictEqual( jsongin.Join( bookings, nights, on_dome, null, 'N' ).length, 2 );
		} );

		it( 'should take one document on either side', () =>
		{
			assert.deepStrictEqual( jsongin.Join( { Dome: 'A' }, { DomeId: 'A' }, on_dome, 'Left', 'N' ),
				[ { Dome: 'A', N: [ { DomeId: 'A' } ] } ] );
			assert.deepStrictEqual( jsongin.Join( [], nights, on_dome, 'Left', 'N' ), [] );
			assert.deepStrictEqual( jsongin.Join( bookings, [], on_dome, 'Inner', 'N' ), [] );
		} );

		it( 'should take a criteria which lends neither side, and one which matches every pair', () =>
		{
			// An ordinary filter on the join documents: every document gets the same matches.
			let filtered = jsongin.Join( bookings, nights, { Night: 'fog' }, 'Left', 'N' );
			assert.deepStrictEqual( filtered[ 0 ].N, [ { DomeId: 'B', Night: 'fog' } ] );
			assert.deepStrictEqual( filtered[ 1 ].N, [ { DomeId: 'B', Night: 'fog' } ] );
			// An empty criteria matches every pair, which is a cross product gathered by document.
			let every = jsongin.Join( bookings, nights, {}, 'Left', 'N' );
			assert.strictEqual( every[ 0 ].N.length, 3 );
			assert.strictEqual( every[ 1 ].N.length, 3 );
		} );

		it( 'should read $$Right, and the join document, as the same document', () =>
		{
			let by_root = jsongin.Join( bookings, nights, { $expr: { $eq: [ '$$Right.DomeId', '$$Left.Dome' ] } }, 'Inner', 'N' );
			assert.deepStrictEqual( by_root, jsongin.Join( bookings, nights, on_dome, 'Inner', 'N' ) );
		} );

		// ***A production, so it clones.*** Neither input is touched, and nothing in the answer
		// is a document the caller handed over.
		it( 'should leave both inputs alone', () =>
		{
			let left = [ { Id: 1, Dome: 'A' } ];
			let right = [ { DomeId: 'A', Night: 'clear' } ];
			let joined = jsongin.Join( left, right, on_dome, 'Left', 'N' );
			joined[ 0 ].Dome = 'changed';
			joined[ 0 ].N[ 0 ].Night = 'changed';
			assert.deepStrictEqual( left, [ { Id: 1, Dome: 'A' } ] );
			assert.deepStrictEqual( right, [ { DomeId: 'A', Night: 'clear' } ] );
			// The same for the merged form, and for an unmatched join document.
			let merged = jsongin.Join( left, right, on_dome );
			merged[ 0 ].Night = 'changed';
			assert.deepStrictEqual( right, [ { DomeId: 'A', Night: 'clear' } ] );
			let outer = jsongin.Join( [], right, on_dome, 'Outer' );
			outer[ 0 ].Night = 'changed';
			assert.deepStrictEqual( right, [ { DomeId: 'A', Night: 'clear' } ] );
		} );

		// ***Which document this is, is where it sits in the array.*** These documents carry no
		// identifier of their own, so two identical ones are two documents - as they are two
		// rows on a server, where an _id tells them apart.
		it( 'should treat two identical join documents as two documents', () =>
		{
			let twice = [ { DomeId: 'A' }, { DomeId: 'A' } ];
			let joined = jsongin.Join( [ { Dome: 'A' } ], twice, on_dome, 'Left', 'N' );
			assert.strictEqual( joined[ 0 ].N.length, 2 );
			// And neither is left over as unmatched.
			assert.strictEqual( jsongin.Join( [ { Dome: 'A' } ], twice, on_dome, 'Outer', 'N' ).length, 1 );
		} );

		it( 'should write the matches at a path, keeping what is beside it', () =>
		{
			let joined = jsongin.Join( [ { Dome: 'A', Site: { Name: 'North' } } ], nights, on_dome, 'Left', 'Site.Nights' );
			assert.deepStrictEqual( joined[ 0 ].Site.Name, 'North' );
			assert.strictEqual( joined[ 0 ].Site.Nights.length, 2 );
		} );

		it( 'should join on a Date, and keep one in a joined document', () =>
		{
			// A Date has its own short type, and a function which walks documents member-wise is
			// where that distinction goes missing. See 120).
			let instant = new Date( '2026-09-20T04:00:00.000Z' );
			let left = [ { At: instant } ];
			let right = [ { When: new Date( instant.getTime() ), Night: 'clear' }, { When: new Date( 0 ), Night: 'fog' } ];
			let joined = jsongin.Join( left, right, { $expr: { $eq: [ '$When', '$$Left.At' ] } }, 'Inner', 'N' );
			assert.strictEqual( joined.length, 1 );
			assert.strictEqual( joined[ 0 ].N.length, 1 );
			assert.strictEqual( jsongin.ShortType( joined[ 0 ].At ), 'd' );
			assert.strictEqual( jsongin.ShortType( joined[ 0 ].N[ 0 ].When ), 'd' );
			assert.strictEqual( joined[ 0 ].N[ 0 ].When.getTime(), instant.getTime() );
		} );

		// ***A criteria which cannot mean anything is refused before any of it runs.*** Query()
		// only refuses a mistake when it reaches it, and a join whose second side holds nothing
		// evaluates nothing at all - so a typo would quietly answer a set of unjoined documents.
		it( 'should refuse a malformed criteria even when nothing would be matched', () =>
		{
			assert.throws( () => jsongin.Join( bookings, [], { $bogus: 1 }, 'Left', 'N' ), /\$bogus/ );
			assert.throws( () => jsongin.Join( bookings, [], { a: { $size: 'two' } }, 'Left', 'N' ), /\$size/ );
			// And the names it lends are bound while it is checked, so a join criteria is not
			// refused for naming them.
			assert.doesNotThrow( () => jsongin.Join( bookings, [], on_dome, 'Left', 'N' ) );
		} );

		it( 'should refuse what it cannot join', () =>
		{
			assert.throws( () => jsongin.Join( 'nope', nights, on_dome ), /Documents must be an array/ );
			assert.throws( () => jsongin.Join( bookings, 7, on_dome ), /JoinDocuments must be an array/ );
			assert.throws( () => jsongin.Join( [ 1 ], nights, on_dome ), /Documents\[ 0 \] must be an object/ );
			assert.throws( () => jsongin.Join( bookings, nights, 'nope' ), /JoinCriteria must be an object/ );
			assert.throws( () => jsongin.Join( bookings, nights, on_dome, 'sideways' ), /is not one of Left, Inner, Right, Outer/ );
			assert.throws( () => jsongin.Join( bookings, nights, on_dome, 7 ), /JoinType must be one of/ );
			assert.throws( () => jsongin.Join( bookings, nights, on_dome, 'Left', 7 ), /JoinName must be a string/ );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***One set of documents after another.***

		This is MongoDB's `$unionWith`, which is a concatenation and not a set union: measured
		against 8.3.8 on 2026-09-20, a document repeated across two collections came back twice,
		`_id` and all. `Distinct()` is what reduces the result.
	*/
	describe( 'Union Tests', () =>
	{

		it( 'should answer one set after the other', () =>
		{
			assert.deepStrictEqual(
				jsongin.Union( [ { Id: 1 }, { Id: 2 } ], [ { Id: 3 } ] ),
				[ { Id: 1 }, { Id: 2 }, { Id: 3 } ] );
			assert.deepStrictEqual( jsongin.Union( [], [ { Id: 1 } ] ), [ { Id: 1 } ] );
			assert.deepStrictEqual( jsongin.Union( [ { Id: 1 } ], [] ), [ { Id: 1 } ] );
			assert.deepStrictEqual( jsongin.Union( [], [] ), [] );
		} );

		it( 'should take one document on either side', () =>
		{
			assert.deepStrictEqual( jsongin.Union( { Id: 1 }, { Id: 2 } ), [ { Id: 1 }, { Id: 2 } ] );
			assert.deepStrictEqual( jsongin.Union( { Id: 1 }, [ { Id: 2 } ] ), [ { Id: 1 }, { Id: 2 } ] );
		} );

		// ***A concatenation, not a set union.*** Two identical documents are two documents.
		it( 'should keep every duplicate', () =>
		{
			let repeated = jsongin.Union( [ { Id: 1, Dome: 'A' } ], [ { Id: 1, Dome: 'A' }, { Id: 2, Dome: 'A' } ] );
			assert.strictEqual( repeated.length, 3 );
			assert.deepStrictEqual( repeated[ 0 ], repeated[ 1 ] );
			// Distinct is what reduces it, which is the same division of labour MongoDB has.
			assert.strictEqual( jsongin.Distinct( repeated, { Id: 1 } ).length, 2 );
		} );

		// ***A selection, so the documents are the caller's own.*** Filter states the rule: a
		// function which selects hands back what it was given, and only one which produces new
		// documents copies first.
		it( 'should hand back the documents it was given, uncopied', () =>
		{
			let left = [ { Id: 1 } ];
			let right = [ { Id: 2 } ];
			let united = jsongin.Union( left, right );
			assert.strictEqual( united[ 0 ], left[ 0 ] );
			assert.strictEqual( united[ 1 ], right[ 0 ] );
			// The array itself is new, so adding to it does not reach either input.
			united.push( { Id: 3 } );
			assert.strictEqual( left.length, 1 );
			assert.strictEqual( right.length, 1 );
		} );

		it( 'should refuse what it cannot join together', () =>
		{
			assert.throws( () => jsongin.Union( 'nope', [] ), /Documents must be an array/ );
			assert.throws( () => jsongin.Union( [], 7 ), /UnionDocuments must be an array/ );
			assert.throws( () => jsongin.Union( [ 1 ], [] ), /Documents\[ 0 \] must be an object/ );
			assert.throws( () => jsongin.Union( [], [ null ] ), /UnionDocuments\[ 0 \] must be an object/ );
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

		it( 'should refuse an unknown update operator', () =>
		{
			// This used to be logged and skipped, which returned a clone of the original
			// document — indistinguishable from a legitimate no-op, so a typo in an operator
			// name was silently nothing at all. MongoDB refuses it.
			assert.throws(
				function () { jsongin.Update( { a: 1 }, { $bogus: { a: 2 } } ); },
				/Unknown update operator/ );
		} );

		it( 'should refuse an update document which is not made of operators', () =>
		{
			// A replacement document is a different call in MongoDB, and it refuses this one.
			assert.throws(
				function () { jsongin.Update( { a: 1 }, { a: 2 } ); },
				/Unknown update operator/ );
		} );

		it( 'should refuse two operators which write to conflicting paths', () =>
		{
			// The result would depend on which operator happened to run first.
			assert.throws(
				function () { jsongin.Update( { a: 1 }, { $set: { a: 2 }, $inc: { a: 1 } } ); },
				/conflict/ );
			assert.throws(
				function () { jsongin.Update( { a: {} }, { $set: { a: 2 }, $inc: { 'a.b': 1 } } ); },
				/conflict/ );
		} );

		it( 'should allow two operators which write to different paths', () =>
		{
			let result = jsongin.Update( { a: 1, b: 1 }, { $set: { a: 2 }, $inc: { b: 1 } } );
			assert.deepStrictEqual( result, { a: 2, b: 2 } );
		} );

		it( 'should leave the document untouched when it refuses', () =>
		{
			// The whole update document is checked before any of it is applied.
			let document = { a: 1, b: 1 };
			assert.throws( function () { jsongin.Update( document, { $set: { b: 9 }, $bogus: { c: 1 } } ); } );
			assert.deepStrictEqual( document, { a: 1, b: 1 } );
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

		// LooseEquals used to be the $eqx query operator applied to two whole values, and its
		// object comparison walked the keys of the first value only. A key which only the
		// second value carried was never examined, so an empty object loosely equalled
		// everything and the answer depended on which value was named first.
		it( 'should not equate an object with one which has more keys', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( {}, { a: 1 } ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: 1 }, {} ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: 1 }, { a: 1, b: 2 } ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: 1, b: 2 }, { a: 1 } ), false );
			assert.strictEqual( jsongin.LooseEquals( { a: {} }, { a: { b: 1 } } ), false );
			assert.strictEqual( jsongin.LooseEquals( [ { a: 1 } ], [ { a: 1, b: 2 } ] ), false );
		} );

		it( 'should answer the same in either order', () =>
		{
			let values = [
				{}, { a: 1 }, { a: '1' }, { a: 1, b: 2 }, { b: 2, a: 1 }, { a: null },
				{ a: {} }, { a: { b: 1 } }, { a: [ 1, 2 ] },
				[], [ 1 ], [ 1, 2 ], [ 2, 1 ], [ [ 1, 2 ] ], [ { a: 1 } ],
				null, undefined, 0, 1, '0', '', 'abc', true, false,
				new Date( 1 ), new Date( 2 ), /abc/, /abc/i,
			];
			for ( let index_a = 0; index_a < values.length; index_a++ )
			{
				for ( let index_b = 0; index_b < values.length; index_b++ )
				{
					let forward = jsongin.LooseEquals( values[ index_a ], values[ index_b ] );
					let reverse = jsongin.LooseEquals( values[ index_b ], values[ index_a ] );
					assert.strictEqual( forward, reverse,
						`LooseEquals is not symmetric for [${JSON.stringify( values[ index_a ] )}] `
						+ `and [${JSON.stringify( values[ index_b ] )}].` );
				}
			}
		} );

		// A key which is not there reads as undefined, and null and undefined are equivalent,
		// so a null member and a missing member are the same thing to the loose comparison.
		// StrictEquals reports them as different, which is the point of having both.
		it( 'should equate a null member with a missing member, unlike StrictEquals', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( { a: null }, {} ), true );
			assert.strictEqual( jsongin.LooseEquals( { a: undefined }, {} ), true );
			assert.strictEqual( jsongin.LooseEquals( { a: null }, { a: undefined } ), true );
			assert.strictEqual( jsongin.StrictEquals( { a: null }, {} ), false );
		} );

		// A query operator lets a match value equal an element of a document array, which is
		// what makes $eqx asymmetric and why LooseEquals cannot be defined on it.
		it( 'should not match an array by one of its elements, unlike the $eqx operator', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( [ [ 1, 2 ] ], [ 1, 2 ] ), false );
			assert.strictEqual( jsongin.LooseEquals( [ 1, 2 ], [ [ 1, 2 ] ] ), false );
			assert.strictEqual( jsongin.QueryOperators.$eqx.Query( [ [ 1, 2 ] ], [ 1, 2 ] ), true );
		} );

		it( 'should ignore element order loosely', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( [ 1, 2 ], [ 2, 1 ] ), true );
			assert.strictEqual( jsongin.LooseEquals( [ 1, 1 ], [ 1, 2 ] ), false );
		} );

		it( 'should compare dates and regular expressions by value', () =>
		{
			assert.strictEqual( jsongin.LooseEquals( new Date( 1 ), new Date( 1 ) ), true );
			assert.strictEqual( jsongin.LooseEquals( new Date( 1 ), new Date( 2 ) ), false );
			assert.strictEqual( jsongin.LooseEquals( new Date( 1 ), {} ), false );
			assert.strictEqual( jsongin.LooseEquals( /abc/, /abc/ ), true );
			assert.strictEqual( jsongin.LooseEquals( /abc/, /xyz/ ), false );
			assert.strictEqual( jsongin.LooseEquals( /abc/, /abc/i ), false );
			// A regexp is compared as a pattern here, not applied as one. $regex applies it.
			assert.strictEqual( jsongin.LooseEquals( /abc/, 'abc' ), false );
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

		it( 'should not reach into an array by field name', () =>
		{
			// MongoDB's $unset does nothing here and reports modifiedCount 0. Verified
			// against MongoDB 6.0.1. Reaching through an array on the write side requires
			// the all positional operator, 'a.$[].x'.
			let document = { a: [ { x: 1 }, { x: 2 } ] };
			assert.strictEqual( jsongin.DeleteValue( document, 'a.x' ), false );
			assert.deepStrictEqual( document, { a: [ { x: 1 }, { x: 2 } ] } );

			// The same at depth, and through elements which cannot hold the field.
			assert.strictEqual( jsongin.DeleteValue( { a: [ { b: { c: 1 } } ] }, 'a.b.c' ), false );
			assert.strictEqual( jsongin.DeleteValue( { a: [ { x: 1 }, 'scalar' ] }, 'a.x' ), false );
		} );

		it( 'should refuse a negative array index', () =>
		{
			// A negative index is not an index. MongoDB reads '-1' as a field name, which an
			// array does not have, so $unset of 'a.-1' is a no-op that changes nothing.
			// Verified against MongoDB 6.0.1.
			let document = { a: [ 1, 2, 3 ] };
			assert.strictEqual( jsongin.DeleteValue( document, 'a.-1' ), false );
			assert.deepStrictEqual( document, { a: [ 1, 2, 3 ] } );
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


	//---------------------------------------------------------------------
	describe( 'Javascript Values Which BSON Has No Place For', () =>
	{

		/*
			A document held in memory can carry values BSON cannot: a symbol, a function, an
			Error, an `undefined` member. These are outside the parity suite by definition,
			because MongoDB has no opinion about a value it cannot store, so what the engine
			does with them is stated here.
		*/

		it( 'should name a symbol and an undefined in ShortType', () =>
		{
			assert.strictEqual( jsongin.ShortType( Symbol( 'x' ) ), 'y' );
			assert.strictEqual( jsongin.ShortType( undefined ), 'u' );
		} );

		it( 'should return a symbol from SafeClone as it is', () =>
		{
			// A symbol is immutable and has no interior, so there is nothing to copy. The
			// clone is the same symbol, which is the only thing it could be.
			let symbol = Symbol( 'x' );
			assert.strictEqual( jsongin.SafeClone( symbol ), symbol );
		} );

		it( 'should clone a null and a string as themselves', () =>
		{
			assert.strictEqual( jsongin.SafeClone( null ), null );
			assert.strictEqual( jsongin.SafeClone( 'abc' ), 'abc' );
			assert.strictEqual( jsongin.SafeClone( 42 ), 42 );
			assert.strictEqual( jsongin.SafeClone( true ), true );
		} );

		it( 'should give a BsonType for a symbol and none for a function', () =>
		{
			// BSON has a symbol type, deprecated but real. It has nothing for a function.
			assert.strictEqual( jsongin.BsonType( Symbol( 'x' ), true ), 'symbol' );
			assert.strictEqual( jsongin.BsonType( Symbol( 'x' ), false ), 14 );
			assert.strictEqual( jsongin.BsonType( undefined, true ), 'undefined' );
			assert.strictEqual( jsongin.BsonType( function () { return; }, true ), null );
		} );

		it( 'should refuse to compare a value which has no place in the ordering', () =>
		{
			// The BSON ordering ranks the types it knows. A value outside it cannot be placed,
			// and guessing a position would put documents in an order nothing justifies.
			assert.throws( function () { jsongin.CompareValues( Symbol( 'x' ), 1 ); }, /Cannot compare values of type/ );
			assert.throws( function () { jsongin.CompareValues( 1, function () { return; } ); }, /Cannot compare values of type/ );
		} );

		it( 'should carry a symbol through a Hybridize round trip', () =>
		{
			// Hybridize flattens a document to values a simple store can hold, and Unhybridize
			// reads it back. A symbol survives by its description, which is all a symbol
			// carries; the result is an equal symbol rather than the same one.
			let hybridized = jsongin.Hybridize( { s: Symbol( 'x' ), b: true, n: 1 } );
			assert.strictEqual( typeof hybridized.s, 'string' );
			assert.strictEqual( hybridized.b, true );

			let restored = jsongin.Unhybridize( hybridized );
			assert.strictEqual( typeof restored.s, 'symbol' );
			assert.strictEqual( restored.s.description, 'x' );
			assert.strictEqual( restored.b, true );
			assert.strictEqual( restored.n, 1 );
		} );

		it( 'should restore a symbol hybridized before its description was stored', () =>
		{
			// The envelope used to hold Symbol.toString(), which is 'Symbol(x)', and the symbol
			// came back as Symbol(Symbol(x)). A value stored that way still reads back as x.
			let restored = jsongin.Unhybridize( { s: JSON.stringify( { type: 'y', source: 'Symbol(x)' } ) } );
			assert.strictEqual( restored.s.description, 'x' );
			let unnamed = jsongin.Unhybridize( jsongin.Hybridize( { s: Symbol() } ) );
			assert.strictEqual( typeof unnamed.s, 'symbol' );
			assert.strictEqual( unnamed.s.description, undefined );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Engine Function Paths and Criteria', () =>
	{

		it( 'should compare two regular expressions by their text', () =>
		{
			assert.strictEqual( jsongin.CompareValues( /abc/, /abc/ ), 0 );
			assert.strictEqual( jsongin.CompareValues( /abc/, /abd/ ), -1 );
			assert.strictEqual( jsongin.CompareValues( /abd/, /abc/ ), 1 );

			// The flags are part of the text, so they take part in the comparison.
			assert.strictEqual( jsongin.CompareValues( /a/, /a/i ), -1 );
		} );

		it( 'should return false from SetValue for a path which names nothing', () =>
		{
			// An empty path, however it is spelled, addresses the document itself rather than
			// a field in it, so there is nothing to set.
			assert.strictEqual( jsongin.SetValue( {}, '', 1 ), false );
			assert.strictEqual( jsongin.SetValue( {}, null, 1 ), false );
			assert.strictEqual( jsongin.SetValue( {}, undefined, 1 ), false );
		} );

		it( 'should refuse a SortCriteria which is not an object', () =>
		{
			assert.throws( function () { jsongin.Sort( [ { a: 1 } ], 5 ); }, /SortCriteria must be an object/ );
			assert.throws( function () { jsongin.Sort( [ { a: 1 } ], 'a' ); }, /SortCriteria must be an object/ );
		} );

		it( 'should sort a document whose key path runs past the end of an array', () =>
		{
			// An index past the end addresses nothing, so the document offers no sort key and
			// sorts with the others which offered none.
			let documents = [ { _id: 1, a: [ 1, 2, 3 ] }, { _id: 2, a: [ 1 ] }, { _id: 3, a: [ 1, 2 ] } ];
			let sorted = jsongin.Sort( documents, { 'a.2': 1 } );
			assert.strictEqual( sorted.length, 3 );

			// _id 2 and _id 3 have no element at index 2, so both sort below _id 1.
			assert.strictEqual( sorted[ 2 ]._id, 1 );
		} );

		it( 'should keep the order of two documents which both offer no sort key', () =>
		{
			let documents = [ { _id: 1 }, { _id: 2 } ];
			let sorted = jsongin.Sort( documents, { nope: 1 } );
			assert.deepStrictEqual( sorted.map( function ( D ) { return D._id; } ), [ 1, 2 ] );
		} );

		it( 'should refuse a data type it has no ShortType for', () =>
		{
			// Every Javascript type maps to a ShortType except BigInt, which has no BSON
			// counterpart and no place in the ordering. It is refused rather than being
			// silently treated as a number, which would lose precision — the one thing a
			// BigInt exists to keep.
			assert.throws( function () { jsongin.ShortType( 10n ); }, /Unsupported data type \[bigint\]/ );
		} );

		it( 'should take the SafeClone exceptions in every form', () =>
		{
			// null and undefined mean no exceptions, a string is one path, and an array is
			// several.
			assert.deepStrictEqual( jsongin.SafeClone( { a: 1 }, null ), { a: 1 } );
			assert.deepStrictEqual( jsongin.SafeClone( { a: 1 }, undefined ), { a: 1 } );
			assert.deepStrictEqual( jsongin.SafeClone( { a: 1 }, 'a' ), { a: 1 } );
			assert.deepStrictEqual( jsongin.SafeClone( { a: 1 }, [ 'a' ] ), { a: 1 } );

			assert.throws( function () { jsongin.SafeClone( { a: 1 }, 5 ); },
				/Exceptions parameter must be a document path/ );
		} );

		it( 'should leave an excepted path uncloned', () =>
		{
			// The point of an exception: the named value is carried across by reference rather
			// than copied, so the clone shares it with the original.
			let original = { kept: { n: 1 }, copied: { n: 1 } };
			let clone = jsongin.SafeClone( original, 'kept' );
			assert.strictEqual( clone.kept, original.kept );
			assert.notStrictEqual( clone.copied, original.copied );
		} );

		it( 'should except a path which names an array element', () =>
		{
			let original = { a: [ { n: 1 }, { n: 2 } ] };
			let clone = jsongin.SafeClone( original, 'a.0' );
			assert.strictEqual( clone.a[ 0 ], original.a[ 0 ] );
			assert.notStrictEqual( clone.a[ 1 ], original.a[ 1 ] );
		} );

		it( 'should sort documents which offer no key below those which do', () =>
		{
			// A path which resolves to no candidate at all gives the document no sort key, and
			// a document with no key sorts below every document which has one.
			let documents = [ { _id: 1 }, { _id: 2, a: 5 }, { _id: 3 }, { _id: 4, a: 1 } ];
			let sorted = jsongin.Sort( documents, { a: 1 } );
			assert.deepStrictEqual( sorted.map( function ( D ) { return D._id; } ), [ 1, 3, 4, 2 ] );

			let descending = jsongin.Sort( documents, { a: -1 } );
			assert.deepStrictEqual( descending.map( function ( D ) { return D._id; } ), [ 2, 4, 1, 3 ] );
		} );

		it( 'should format a value which JSON has no representation for', () =>
		{
			// These are the four types with nothing to write: undefined, a symbol, a function,
			// and a BigInt, which is the one of the four that does have a representation.
			assert.strictEqual( jsongin.Format( { a: 10n } ), '{"a":10}' );

			// ***The other three used to produce a key with no value, which is not parseable
			// JSON.*** This test asserted that output and said in as many words that it was
			// stated rather than blessed. It is now the JSON.stringify rule: the field is left
			// out of a document, and an array element becomes null because dropping it would
			// renumber everything after it.
			//
			// What changed is that the output has to be readable again. Format and Parse are
			// meant to be inverses, and Parse read '{"a":}' back as the punctuation which
			// followed the colon. See .plans/2026-08-22/process-language-spec.md, finding S1,
			// and the Storage Round-Trip Tests in `100) Core Tests.js` for the whole rule.
			assert.strictEqual( jsongin.Format( { a: undefined } ), '{}' );
			assert.strictEqual( jsongin.Format( { a: Symbol( 'x' ) } ), '{}' );
			assert.strictEqual( jsongin.Format( { a: function () { return; } } ), '{}' );
			assert.strictEqual( jsongin.Format( [ undefined ] ), '[null]' );

			// Nothing is lost when TypedValues is set, which is what a stored scope needs:
			// $$REMOVE is bound to nothing, and that is not the same as being bound to null.
			assert.strictEqual( jsongin.Format( { a: undefined }, { TypedValues: true } ), '{"a":{"$undefined":true}}' );

			// At the top level there is no key, so the result is empty.
			assert.strictEqual( jsongin.Format( undefined ), '' );
		} );

		it( 'should take a ResolveCandidates path in every form', () =>
		{
			// An empty path, however it is spelled, means the document itself.
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: 1 }, undefined ), [ { a: 1 } ] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: 1 }, null ), [ { a: 1 } ] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: 1 }, '' ), [ { a: 1 } ] );

			// A numeric path is a key, which is what indexes an array.
			assert.deepStrictEqual( jsongin.ResolveCandidates( [ 9, 8 ], 0 ), [ 9 ] );

			assert.throws( function () { jsongin.ResolveCandidates( { a: 1 }, true ); }, /Path is invalid/ );
		} );

		it( 'should read a numeric path element on an array as an index and as a field name', () =>
		{
			// Both readings contribute, the way MongoDB reads a query path: the element at
			// the index, and the field of that name in every element which is a document.
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: [ 'x', 'y' ] }, 'a.0' ), [ 'x' ] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: [ { '0': 'x' } ] }, 'a.0' ), [ 'x', { '0': 'x' } ] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: [ 'y', { '0': 'x' } ] }, 'a.0' ), [ 'x', 'y' ] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( { a: [ { '1': 'x' } ] }, 'a.1' ), [ 'x' ] );
		} );

		it( 'should report a missing field apart from an empty candidate list', () =>
		{
			// Report.Missing is what $eq reads to match null against a missing field, and it
			// is set only for a field a document lacks or a path which runs on below a scalar
			// reached by field name - never for an array which offered no document, an index
			// past the end, or a scalar reached by index. The candidate list can be empty
			// either way, and it can be non-empty with the field missing as well.
			function resolve( Document, Path )
			{
				let report = { Missing: false };
				let candidates = jsongin.ResolveCandidates( Document, Path, true, report );
				return { Candidates: candidates, Missing: report.Missing };
			}
			assert.deepStrictEqual( resolve( {}, 'a' ), { Candidates: [], Missing: true } );
			assert.deepStrictEqual( resolve( { a: 5 }, 'a.b' ), { Candidates: [], Missing: true } );
			assert.deepStrictEqual( resolve( { a: null }, 'a.b' ), { Candidates: [], Missing: true } );
			assert.deepStrictEqual( resolve( { a: [ { c: 1 } ] }, 'a.b' ), { Candidates: [], Missing: true } );
			assert.deepStrictEqual( resolve( { a: [ { b: 1 }, { c: 1 } ] }, 'a.b' ), { Candidates: [ 1 ], Missing: true } );
			assert.deepStrictEqual( resolve( { a: [ {} ] }, 'a.0.b' ), { Candidates: [], Missing: true } );

			assert.deepStrictEqual( resolve( { a: [] }, 'a.b' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: [ 1 ] }, 'a.b' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: [ [ {} ] ] }, 'a.b' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: [ 1 ] }, 'a.5' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: [ 1 ] }, 'a.0.b' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: [ { b: [] } ] }, 'a.b.c' ), { Candidates: [], Missing: false } );
			assert.deepStrictEqual( resolve( { a: 1 }, 'a' ), { Candidates: [ 1 ], Missing: false } );

			// Without a report object the walk is the same and nothing is reported.
			assert.deepStrictEqual( jsongin.ResolveCandidates( {}, 'a' ), [] );
			assert.deepStrictEqual( jsongin.ResolveCandidates( {}, 'a', true, null ), [] );
		} );

	} );


	//---------------------------------------------------------------------
	// The JSON Schema functions. The evaluator itself is measured against the specification's
	// own test suite in 170); these tests state the engine's own answers - the findings it
	// returns, its options, and how a value JSON has no form for is read.
	describe( 'ValidateDocument Tests', () =>
	{

		it( 'should return no findings for a valid document', () =>
		{
			let schema = { type: 'object', required: [ 'a' ], properties: { a: { type: 'integer' }, b: { type: 'array', items: { type: 'string' } } } };
			assert.deepStrictEqual( jsongin.ValidateDocument( { a: 1, b: [ 'x' ] }, schema ), [] );
			assert.deepStrictEqual( jsongin.ValidateDocument( { a: 1 }, schema ), [] );
			assert.deepStrictEqual( jsongin.ValidateDocument( 42, true ), [] );
		} );

		it( 'should return one finding per failed assertion, in the basic output form', () =>
		{
			let findings = jsongin.ValidateDocument( { a: 'x', c: 1 }, { required: [ 'a', 'b' ], properties: { a: { type: 'integer' } } } );
			assert.strictEqual( findings.length, 2 );
			assert.deepStrictEqual( findings[ 0 ], { valid: false, keywordLocation: '/required', absoluteKeywordLocation: '#/required', instanceLocation: '', error: 'The property [b] is required.' } );
			assert.strictEqual( findings[ 1 ].keywordLocation, '/properties/a/type' );
			assert.strictEqual( findings[ 1 ].instanceLocation, '/a' );
			assert.strictEqual( jsongin.ValidateDocument( 42, false ).length, 1 );
		} );

		it( 'should locate a finding through a reference', () =>
		{
			let schema = { $defs: { N: { type: 'number' } }, properties: { a: { $ref: '#/$defs/N' } } };
			let findings = jsongin.ValidateDocument( { a: 'x' }, schema );
			assert.strictEqual( findings.length, 1 );
			assert.strictEqual( findings[ 0 ].keywordLocation, '/properties/a/$ref/type' );
			assert.strictEqual( findings[ 0 ].absoluteKeywordLocation, '#/$defs/N/type' );
		} );

		it( 'should read the dialect from $schema, and from the Dialect option when the schema is silent', () =>
		{
			let draft4 = { maximum: 5, exclusiveMaximum: true };
			assert.strictEqual( jsongin.ValidateDocument( 5, draft4 ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( 5, draft4, { Dialect: 'draft-04' } ).length, 1 );
			assert.strictEqual( jsongin.ValidateDocument( 5, Object.assign( { $schema: 'http://json-schema.org/draft-04/schema#' }, draft4 ) ).length, 1 );
			assert.strictEqual( jsongin.ValidateDocument( 5, Object.assign( { $schema: 'http://json-schema.org/draft-04/schema#' }, draft4 ), { Dialect: '2020-12' } ).length, 1 );
		} );

		it( 'should reach a remote schema through the Registry option and never the network', () =>
		{
			let registry = { 'https://example.com/schemas/id.json': { type: 'string', minLength: 3 } };
			let schema = { properties: { id: { $ref: 'https://example.com/schemas/id.json' } } };
			assert.strictEqual( jsongin.ValidateDocument( { id: 'abc' }, schema, { Registry: registry } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( { id: 'ab' }, schema, { Registry: registry } ).length, 1 );
			assert.throws( () => jsongin.ValidateDocument( { id: 'abc' }, schema ) );
		} );

		it( 'should treat a format as an annotation unless FormatAssertion is set', () =>
		{
			let schema = { format: 'ipv4' };
			assert.strictEqual( jsongin.ValidateDocument( 'nope', schema ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( 'nope', schema, { FormatAssertion: true } ).length, 1 );
			assert.strictEqual( jsongin.ValidateDocument( '10.0.0.1', schema, { FormatAssertion: true } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( 'anything', { format: 'no-such-format' }, { FormatAssertion: true } ).length, 0 );
		} );

		it( 'should read undefined as absent, a date as a string, and a regexp as its source', () =>
		{
			assert.strictEqual( jsongin.ValidateDocument( { a: undefined }, { required: [ 'a' ] } ).length, 1 );
			assert.strictEqual( jsongin.ValidateDocument( { a: undefined }, { properties: { a: false } } ).length, 0 );
			let date = new Date( 1700000000000 );
			assert.strictEqual( jsongin.ValidateDocument( date, { type: 'string', format: 'date-time' }, { FormatAssertion: true } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( date, { type: 'number' } ).length, 1 );
			assert.strictEqual( jsongin.ValidateDocument( date, { const: '2023-11-14T22:13:20.000Z' } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( /ab+c/i, { type: 'string', pattern: '^ab' } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( /ab+c/i, { const: 'ab+c' } ).length, 0 );
		} );

		it( 'should call a whole number an integer, since Javascript has one number type', () =>
		{
			assert.strictEqual( jsongin.ValidateDocument( 1.0, { type: 'integer' } ).length, 0 );
			assert.strictEqual( jsongin.ValidateDocument( 1.5, { type: 'integer' } ).length, 1 );
		} );

		it( 'should refuse what it cannot evaluate', () =>
		{
			assert.throws( () => jsongin.ValidateDocument( 1, { type: 'string' }, { Dialect: 'draft-99' } ) );
			assert.throws( () => jsongin.ValidateDocument( 1, { $ref: 'nowhere.json' } ) );
			assert.throws( () => jsongin.ValidateDocument( 1, 'not a schema' ) );
			assert.throws( () => jsongin.ValidateDocument( { a: 1 }, { properties: { a: 42 } } ) );
		} );

	} );


	describe( 'InferSchema Tests', () =>
	{
		const DOCUMENTS = [
			{ id: 1, name: 'Alice', tags: [ 'a', 'b' ], profile: { role: 'admin', level: 2 }, joined: new Date( 1700000000000 ) },
			{ id: 2, name: 'Bob', tags: [], profile: { role: 'user' }, joined: new Date( 1700000000000 ), note: null },
			{ id: 3, name: null, tags: [ 'c' ], profile: { role: 'user', level: 1.5 }, joined: new Date( 1700000000000 ), note: 'x' },
		];

		it( 'should describe one document', () =>
		{
			let schema = jsongin.InferSchema( DOCUMENTS[ 0 ] );
			assert.strictEqual( schema.$schema, 'https://json-schema.org/draft/2020-12/schema' );
			assert.strictEqual( schema.type, 'object' );
			assert.deepStrictEqual( schema.required, [ 'id', 'name', 'tags', 'profile', 'joined' ] );
			assert.deepStrictEqual( schema.properties.id, { type: 'integer' } );
			assert.deepStrictEqual( schema.properties.tags, { type: 'array', items: { type: 'string' } } );
			assert.deepStrictEqual( schema.properties.joined, { type: 'string', format: 'date-time' } );
			assert.deepStrictEqual( schema.properties.profile.properties.level, { type: 'integer' } );
		} );

		it( 'should describe the union of many documents', () =>
		{
			let schema = jsongin.InferSchema( DOCUMENTS );
			assert.deepStrictEqual( schema.required, [ 'id', 'name', 'tags', 'profile', 'joined' ] );
			assert.deepStrictEqual( schema.properties.name.type, [ 'string', 'null' ] );
			assert.deepStrictEqual( schema.properties.note.type, [ 'null', 'string' ] );
			assert.deepStrictEqual( schema.properties.profile.required, [ 'role' ] );
			assert.deepStrictEqual( schema.properties.profile.properties.level, { type: 'number' } );
			assert.deepStrictEqual( schema.properties.tags, { type: 'array', items: { type: 'string' } } );
		} );

		it( 'should require a field by the share of documents which carry it', () =>
		{
			assert.deepStrictEqual( jsongin.InferSchema( DOCUMENTS, { RequiredThreshold: 0.5 } ).required, [ 'id', 'name', 'tags', 'profile', 'joined', 'note' ] );
			assert.strictEqual( typeof jsongin.InferSchema( DOCUMENTS, { RequiredThreshold: 0 } ).required, 'undefined' );
		} );

		it( 'should list the distinct values of a scalar field when asked and they are few', () =>
		{
			let schema = jsongin.InferSchema( DOCUMENTS, { MaxDistinct: 2 } );
			assert.deepStrictEqual( schema.properties.profile.properties.role.enum, [ 'admin', 'user' ] );
			assert.strictEqual( typeof schema.properties.name.enum, 'undefined' );
			assert.strictEqual( typeof jsongin.InferSchema( DOCUMENTS ).properties.profile.properties.role.enum, 'undefined' );
		} );

		it( 'should produce a schema its own documents satisfy', () =>
		{
			let schema = jsongin.InferSchema( DOCUMENTS, { MaxDistinct: 4 } );
			for ( let index = 0; index < DOCUMENTS.length; index++ )
			{
				assert.deepStrictEqual( jsongin.ValidateDocument( DOCUMENTS[ index ], schema, { FormatAssertion: true } ), [] );
			}
			assert.strictEqual( jsongin.ValidateDocument( { id: 'x' }, schema ).length > 0, true );
		} );

		it( 'should describe nothing from nothing, and refuse what is not a document', () =>
		{
			assert.deepStrictEqual( jsongin.InferSchema( [] ), { $schema: 'https://json-schema.org/draft/2020-12/schema' } );
			assert.deepStrictEqual( jsongin.InferSchema( {} ), { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object' } );
			assert.throws( () => jsongin.InferSchema( 42 ) );
			assert.throws( () => jsongin.InferSchema( 'abc' ) );
			assert.throws( () => jsongin.InferSchema( {}, { Dialect: 'draft-99' } ) );
		} );

	} );


	describe( 'InitSchema Tests', () =>
	{
		const SCHEMA = {
			type: 'object',
			required: [ 'name', 'count', 'flags' ],
			properties: {
				name: { type: 'string' },
				count: { type: 'integer', default: 10 },
				flags: { type: 'array' },
				editor: { type: 'object', properties: { tabs: { type: 'integer', default: 4 }, wrap: { type: 'boolean', default: true } }, default: {} },
				theme: { type: 'string', default: 'light' },
				notes: { type: [ 'string', 'null' ] },
			},
		};

		it( 'should fill an absent field from its default, through nested objects', () =>
		{
			assert.deepStrictEqual( jsongin.InitSchema( {}, SCHEMA ), { count: 10, editor: { tabs: 4, wrap: true }, theme: 'light' } );
			assert.deepStrictEqual( jsongin.InitSchema( null, SCHEMA ), { count: 10, editor: { tabs: 4, wrap: true }, theme: 'light' } );
			assert.deepStrictEqual( jsongin.InitSchema( undefined, SCHEMA ), { count: 10, editor: { tabs: 4, wrap: true }, theme: 'light' } );
		} );

		it( 'should leave a present field as it is, and never modify the document given', () =>
		{
			let document = { count: 3, editor: { tabs: 2 }, extra: 'kept' };
			let result = jsongin.InitSchema( document, SCHEMA );
			assert.deepStrictEqual( result, { count: 3, editor: { tabs: 2, wrap: true }, extra: 'kept', theme: 'light' } );
			assert.deepStrictEqual( document, { count: 3, editor: { tabs: 2 }, extra: 'kept' } );
			assert.notStrictEqual( result.editor, document.editor );
		} );

		it( 'should give a required field with no default its empty value only when ForceRequired is set', () =>
		{
			assert.deepStrictEqual( jsongin.InitSchema( {}, SCHEMA, { ForceRequired: true } ), { name: '', count: 10, flags: [], editor: { tabs: 4, wrap: true }, theme: 'light' } );
			let typed = { required: [ 'a', 'b', 'c', 'd', 'e', 'f' ], properties: { a: { type: 'number' }, b: { type: 'boolean' }, c: { type: 'null' }, d: { type: 'object' }, e: { type: [ 'integer', 'string' ] }, f: {} } };
			assert.deepStrictEqual( jsongin.InitSchema( {}, typed, { ForceRequired: true } ), { a: 0, b: false, c: null, d: {}, e: 0 } );
			assert.deepStrictEqual( jsongin.InitSchema( {}, typed ), {} );
		} );

		it( 'should read the schema through $ref and allOf', () =>
		{
			let schema = { $defs: { Base: { properties: { kind: { default: 'base' } } } }, allOf: [ { $ref: '#/$defs/Base' }, { properties: { size: { default: 1 } } } ], properties: { own: { default: true } } };
			assert.deepStrictEqual( jsongin.InitSchema( {}, schema ), { own: true, kind: 'base', size: 1 } );
		} );

		it( 'should refuse a document which is not an object', () =>
		{
			assert.throws( () => jsongin.InitSchema( 'abc', SCHEMA ) );
			assert.throws( () => jsongin.InitSchema( [ 1 ], SCHEMA ) );
		} );

	} );


	describe( 'ProjectSchema Tests', () =>
	{
		const DOCUMENT = { id: 1, user: { name: 'Alice', location: 'East', secret: 'x' }, tags: [ 'a' ], items: [ { sku: 'A', qty: 1, cost: 5 }, { sku: 'B', qty: 2, cost: 6 } ], extra: true };

		it( 'should keep the fields the schema names, at every depth', () =>
		{
			let schema = { properties: { id: { type: 'integer' }, user: { properties: { name: {}, location: {} } }, tags: { type: 'array' } } };
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, schema ), { id: 1, user: { name: 'Alice', location: 'East' }, tags: [ 'a' ] } );
		} );

		it( 'should reach into the elements of an array through items', () =>
		{
			let schema = { properties: { items: { type: 'array', items: { properties: { sku: {}, qty: {} } } } } };
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, schema ), { items: [ { sku: 'A', qty: 1 }, { sku: 'B', qty: 2 } ] } );
		} );

		it( 'should leave out a named field the document lacks, and name nothing from a schema with no properties', () =>
		{
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, { properties: { id: {}, missing: {} } } ), { id: 1 } );
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, { type: 'object' } ), {} );
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, true ), {} );
		} );

		it( 'should read the schema through $ref and allOf, and never modify the document', () =>
		{
			let schema = { $defs: { Keyed: { properties: { id: {} } } }, allOf: [ { $ref: '#/$defs/Keyed' }, { properties: { extra: {} } } ] };
			let before = JSON.stringify( DOCUMENT );
			assert.deepStrictEqual( jsongin.ProjectSchema( DOCUMENT, schema ), { id: 1, extra: true } );
			assert.strictEqual( JSON.stringify( DOCUMENT ), before );
		} );

		it( 'should refuse a document which is not an object', () =>
		{
			assert.throws( () => jsongin.ProjectSchema( [ 1 ], { properties: { a: {} } } ) );
			assert.throws( () => jsongin.ProjectSchema( null, { properties: { a: {} } } ) );
		} );

	} );


} );
