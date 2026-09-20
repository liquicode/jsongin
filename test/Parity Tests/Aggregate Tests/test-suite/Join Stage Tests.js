'use strict';

const assert = require( 'assert' );
const HELPERS = require( './_join-helpers.js' );

/*
	The stages which read a second set of documents.

	***The one thing this suite cannot compare is the argument which names that set.*** MongoDB
	names a collection in `from`; jsongin takes the documents themselves, because it has no
	collections. So a test never writes either: `Driver.SetJoinData()` puts the documents where
	the engine can reach them and `Driver.JoinFrom()` answers what to write, which is a
	collection name on the server and the documents under jsongin. Everything below that line is
	compared exactly.

	***And the order is compared as a set.*** The array a joining stage fills comes back in the
	server's own order - measured, stable across runs, and not one an in-memory engine can
	reproduce. `_join-helpers.js` states that relaxation once; nothing else about a document is
	relaxed.

	***Every case here was measured against a server first***, by
	`jsonx/.plans/tools/lookup-parity-probe.js`, and the rules it found are what jsongin was
	then built to. Run this against the baseline to see it for yourself:

		JSONGIN_MONGODB_URL=mongodb://cube4:27018 npm run parity-test-mongodb

	***The joining stages are the one part of the surface which no version moved.*** The probe
	was run against 6.0.28, 7.0.40 and 8.3.8 on 2026-09-20: of its 38 cases, `$lookup` and
	`$unionWith` answered identically on all three - the same documents in the same order - and
	the only difference anywhere was the order `$graphLookup` fills its array in, which differs
	on all three and is what the set comparison above exists for. So these cases hold at the
	7.0.40 baseline and would hold at either neighbour.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Join Stage Tests', () =>
	{

		//---------------------------------------------------------------------
		// Sets both sides, then runs a pipeline built around whatever names the second set.
		async function joined( Documents, JoinDocuments, Stage )
		{
			await Driver.SetData( Documents );
			await Driver.SetJoinData( JoinDocuments );
			let args = Object.assign( { from: Driver.JoinFrom() }, Stage );
			return await Driver.Aggregate( [ { $lookup: args } ] );
		}


		//---------------------------------------------------------------------
		async function refused( Documents, JoinDocuments, Stage )
		{
			try
			{
				await joined( Documents, JoinDocuments, Stage );
				return false;
			}
			catch ( error ) { return true; }
		}


		//---------------------------------------------------------------------
		describe( 'Matching On A Field ($lookup)', () =>
		{

			it( 'should gather the matches under the name it was given', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: 'A' }, { _id: 2, Dome: 'C' } ],
					[ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: 'B' } ],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				HELPERS.SameDocuments( assert, answer, [
					{ _id: 1, Dome: 'A', F: [ { _id: 'a', DomeId: 'A' } ] },
					{ _id: 2, Dome: 'C', F: [] },
				], 'F' );
			} );

			// ***The equality is an $in over the local values.*** An array on either side
			// matches element by element, which is the same rule an ordinary query path follows.
			it( 'should match an array on either side', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: [ 'A', 'B' ] }, { _id: 2, Dome: 'A' } ],
					[ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: [ 'B', 'Z' ] }, { _id: 'c', DomeId: 'C' } ],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( answer.find( function ( E ) { return E._id === 1; } ), 'F', '_id' ), [ 'a', 'b' ] );
				assert.deepStrictEqual( HELPERS.FoundValues( answer.find( function ( E ) { return E._id === 2; } ), 'F', '_id' ), [ 'a' ] );
			} );

			// ***A missing field is a null one***, in both directions.
			it( 'should treat a missing key as null', async () =>
			{
				let some = [ { _id: 'a', DomeId: null }, { _id: 'b' }, { _id: 'c', DomeId: 'A' } ];
				let answer = await joined( [ { _id: 1 }, { _id: 2, Dome: null } ], some,
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( answer.find( function ( E ) { return E._id === 1; } ), 'F', '_id' ), [ 'a', 'b' ] );
				assert.deepStrictEqual( HELPERS.FoundValues( answer.find( function ( E ) { return E._id === 2; } ), 'F', '_id' ), [ 'a', 'b' ] );
			} );

			it( 'should compare numbers across their types, and not a number with its text', async () =>
			{
				let answer = await joined( [ { _id: 1, Dome: 1 } ], [ { _id: 'a', DomeId: 1.0 }, { _id: 'b', DomeId: '1' } ],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( answer[ 0 ], 'F', '_id' ), [ 'a' ] );
			} );

			it( 'should reach a nested field, and through an array of documents', async () =>
			{
				let nights = [ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: 'B' } ];
				let nested = await joined( [ { _id: 1, Site: { Dome: 'A' } } ], nights,
					{ localField: 'Site.Dome', foreignField: 'DomeId', as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( nested[ 0 ], 'F', '_id' ), [ 'a' ] );

				let through = await joined( [ { _id: 1, Sites: [ { Dome: 'A' }, { Dome: 'B' } ] } ], nights,
					{ localField: 'Sites.Dome', foreignField: 'DomeId', as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( through[ 0 ], 'F', '_id' ), [ 'a', 'b' ] );
			} );

			it( 'should write the name at a dotted path, keeping its siblings', async () =>
			{
				let answer = await joined( [ { _id: 1, Dome: 'A', Site: { Name: 'North' } } ], [ { _id: 'a', DomeId: 'A' } ],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'Site.F' } );
				HELPERS.SameDocuments( assert, answer, [
					{ _id: 1, Dome: 'A', Site: { Name: 'North', F: [ { _id: 'a', DomeId: 'A' } ] } },
				], [] );
			} );

			it( 'should replace a field which is already there', async () =>
			{
				let answer = await joined( [ { _id: 1, Dome: 'A', F: 'was here' } ], [ { _id: 'a', DomeId: 'A' } ],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				HELPERS.SameDocuments( assert, answer, [ { _id: 1, Dome: 'A', F: [ { _id: 'a', DomeId: 'A' } ] } ], 'F' );
			} );

			it( 'should answer an empty array when the second set holds nothing', async () =>
			{
				let answer = await joined( [ { _id: 1, Dome: 'A' } ], [],
					{ localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
				HELPERS.SameDocuments( assert, answer, [ { _id: 1, Dome: 'A', F: [] } ], 'F' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Running A Pipeline ($lookup with let)', () =>
		{

			it( 'should bind let and read it in a $match', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: 'A', Minimum: 2 } ],
					[ { _id: 'a', DomeId: 'A', N: 1 }, { _id: 'b', DomeId: 'A', N: 5 } ],
					{
						let: { dome: '$Dome', minimum: '$Minimum' },
						pipeline: [ { $match: { $expr: { $and: [ { $eq: [ '$DomeId', '$$dome' ] }, { $gt: [ '$N', '$$minimum' ] } ] } } } ],
						as: 'F',
					} );
				HELPERS.SameDocuments( assert, answer, [
					{ _id: 1, Dome: 'A', Minimum: 2, F: [ { _id: 'b', DomeId: 'A', N: 5 } ] },
				], 'F' );
			} );

			it( 'should apply a key match and a pipeline together', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: 'A' } ],
					[ { _id: 'a', DomeId: 'A', N: 1 }, { _id: 'b', DomeId: 'A', N: 9 }, { _id: 'c', DomeId: 'B', N: 9 } ],
					{ localField: 'Dome', foreignField: 'DomeId', pipeline: [ { $match: { N: { $gt: 5 } } } ], as: 'F' } );
				assert.deepStrictEqual( HELPERS.FoundValues( answer[ 0 ], 'F', '_id' ), [ 'b' ] );
			} );

			it( 'should give every document the same answer when nothing is correlated', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: 'A' }, { _id: 2, Dome: 'C' } ],
					[ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: 'B' } ],
					{ pipeline: [ { $match: { DomeId: 'B' } } ], as: 'F' } );
				assert.deepStrictEqual( answer[ 0 ].F, answer[ 1 ].F );
				assert.deepStrictEqual( HELPERS.FoundValues( answer[ 0 ], 'F', '_id' ), [ 'b' ] );
			} );

			it( 'should run the rest of a sub-pipeline, a sort and a projection', async () =>
			{
				let answer = await joined(
					[ { _id: 1, Dome: 'A' } ],
					[ { _id: 'a', DomeId: 'A', N: 9 }, { _id: 'b', DomeId: 'A', N: 1 } ],
					{
						localField: 'Dome', foreignField: 'DomeId',
						pipeline: [ { $sort: { N: 1 } }, { $project: { N: 1, _id: 0 } } ],
						as: 'F',
					} );
				HELPERS.SameDocuments( assert, answer, [ { _id: 1, Dome: 'A', F: [ { N: 1 }, { N: 9 } ] } ], 'F' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'What A Join Refuses', () =>
		{

			it( 'should refuse a lookup which says neither how to match nor what to run', async () =>
			{
				assert.strictEqual( await refused( [ { _id: 1 } ], [ { _id: 'a' } ], { as: 'F' } ), true );
			} );

			it( 'should refuse a localField without a foreignField', async () =>
			{
				assert.strictEqual( await refused( [ { _id: 1 } ], [ { _id: 'a' } ], { localField: 'Dome', as: 'F' } ), true );
				assert.strictEqual( await refused( [ { _id: 1 } ], [ { _id: 'a' } ], { foreignField: 'DomeId', as: 'F' } ), true );
			} );

			it( 'should refuse a lookup with no as', async () =>
			{
				assert.strictEqual( await refused( [ { _id: 1 } ], [ { _id: 'a' } ], { localField: 'Dome', foreignField: 'DomeId' } ), true );
			} );

			// ***$out writes a collection***, which a sub-pipeline may not do. The server says
			// so in as many words; jsongin has no $out at all, and refuses it as a stage it does
			// not know - the same refusal for a different reason, which is what parity means
			// here. Measured on 8.3.8.
			it( 'should refuse $out inside a sub-pipeline', async () =>
			{
				assert.strictEqual( await refused( [ { _id: 1 } ], [ { _id: 'a' } ],
					{ pipeline: [ { $out: 'somewhere' } ], as: 'F' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Adding A Second Set ($unionWith)', () =>
		{

			//---------------------------------------------------------------------
			async function united( Documents, UnionDocuments, Args, After )
			{
				await Driver.SetData( Documents );
				await Driver.SetJoinData( UnionDocuments );
				// The short form is the second set itself; the long form names it in coll.
				let stage = ( Args === null ) ? Driver.JoinFrom() : Object.assign( { coll: Driver.JoinFrom() }, Args );
				return await Driver.Aggregate( [ { $unionWith: stage } ].concat( After || [] ) );
			}

			let main = [ { _id: 1, Side: 'main' }, { _id: 2, Side: 'main' } ];
			let other = [ { _id: 'a', Side: 'join', Keep: true }, { _id: 'b', Side: 'join', Keep: false } ];

			it( 'should add the second set, in either form', async () =>
			{
				let short_form = await united( main, other, null );
				HELPERS.SameDocuments( assert, short_form, main.concat( other ), [] );
				let long_form = await united( main, other, {} );
				HELPERS.SameDocuments( assert, long_form, short_form, [] );
			} );

			// ***A concatenation, not a set union.*** The same _id in both sets comes back twice.
			it( 'should keep a document which is in both sets', async () =>
			{
				let answer = await united( [ { _id: 1, Side: 'main' } ], [ { _id: 1, Side: 'join' } ], null );
				assert.strictEqual( answer.length, 2 );
				HELPERS.SameDocuments( assert, answer, [ { _id: 1, Side: 'main' }, { _id: 1, Side: 'join' } ], [] );
			} );

			it( 'should run a pipeline over the second set only', async () =>
			{
				let answer = await united( main, other, { pipeline: [ { $match: { Keep: true } } ] } );
				HELPERS.SameDocuments( assert, answer, main.concat( [ { _id: 'a', Side: 'join', Keep: true } ] ), [] );
			} );

			it( 'should let a later stage see both sets', async () =>
			{
				let answer = await united( main, other, null, [ { $match: { Side: 'join' } } ] );
				HELPERS.SameDocuments( assert, answer, other, [] );
			} );

			it( 'should refuse a union which names nothing to add', async () =>
			{
				await Driver.SetData( main );
				await Driver.SetJoinData( other );
				let refused_it = false;
				try { await Driver.Aggregate( [ { $unionWith: {} } ] ); }
				catch ( error ) { refused_it = true; }
				assert.strictEqual( refused_it, true );
			} );

			it( 'should refuse $out inside its pipeline', async () =>
			{
				let refused_it = false;
				try { await united( main, other, { pipeline: [ { $out: 'somewhere' } ] } ); }
				catch ( error ) { refused_it = true; }
				assert.strictEqual( refused_it, true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Following A Chain ($graphLookup)', () =>
		{

			//---------------------------------------------------------------------
			async function walked( Documents, WalkDocuments, Args )
			{
				await Driver.SetData( Documents );
				await Driver.SetJoinData( WalkDocuments );
				let base = {
					from: Driver.JoinFrom(),
					startWith: '$Dome', connectFromField: 'Parent', connectToField: 'Name',
					as: 'Chain', depthField: 'Level',
				};
				return await Driver.Aggregate( [ { $graphLookup: Object.assign( base, Args ) } ] );
			}

			// ***The order of what it found is the server's own***, so a test reads the names
			// and their depths rather than the array as it stands.
			function reached( Answer, Field )
			{
				let found = Answer[ 0 ][ Field || 'Chain' ];
				return found.map( function ( Each ) { return Each.Name + '@' + Each.Level; } ).sort();
			}

			let chain = [
				{ _id: 'a', Name: 'A', Parent: 'B' },
				{ _id: 'b', Name: 'B', Parent: 'C' },
				{ _id: 'c', Name: 'C' },
			];

			it( 'should follow the chain, numbering from zero', async () =>
			{
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], chain, {} ) ), [ 'A@0', 'B@1', 'C@2' ] );
			} );

			it( 'should stop at maxDepth, where zero is the first round alone', async () =>
			{
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], chain, { maxDepth: 0 } ) ), [ 'A@0' ] );
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], chain, { maxDepth: 1 } ) ), [ 'A@0', 'B@1' ] );
			} );

			it( 'should end on a cycle, reaching each document once', async () =>
			{
				let ring = [ { _id: 'a', Name: 'A', Parent: 'B' }, { _id: 'b', Name: 'B', Parent: 'A' } ];
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], ring, {} ) ), [ 'A@0', 'B@1' ] );
			} );

			// ***De-duplication is by document, not by the value it connects on.***
			it( 'should follow two documents which share a connecting value', async () =>
			{
				let forked = [
					{ _id: 'a1', Name: 'A', Parent: 'B' },
					{ _id: 'a2', Name: 'A', Parent: 'C' },
					{ _id: 'b', Name: 'B' },
					{ _id: 'c', Name: 'C' },
				];
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], forked, {} ) ), [ 'A@0', 'A@0', 'B@1', 'C@1' ] );
			} );

			// ***The shallowest depth wins.*** D is one hop away and also three.
			it( 'should stamp a document reached twice with the shallower depth', async () =>
			{
				let both_ways = [
					{ _id: 'a', Name: 'A', Parent: [ 'B', 'D' ] },
					{ _id: 'b', Name: 'B', Parent: 'C' },
					{ _id: 'c', Name: 'C', Parent: 'D' },
					{ _id: 'd', Name: 'D' },
				];
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], both_ways, {} ) ), [ 'A@0', 'B@1', 'C@2', 'D@1' ] );
			} );

			it( 'should start from every value of an array, and from an expression', async () =>
			{
				let names = [ { _id: 'a', Name: 'A' }, { _id: 'b', Name: 'B' }, { _id: 'c', Name: 'C' } ];
				let several = await walked( [ { _id: 1, Domes: [ 'A', 'C' ] } ], names, { startWith: '$Domes', connectFromField: 'Name' } );
				assert.deepStrictEqual( reached( several ), [ 'A@0', 'C@0' ] );
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'a' } ], chain, { startWith: { $toUpper: '$Dome' } } ) ), [ 'A@0', 'B@1', 'C@2' ] );
			} );

			it( 'should find nothing when startWith has no value, and look for null when it is null', async () =>
			{
				let nothing = await walked( [ { _id: 1 } ], chain, {} );
				assert.deepStrictEqual( nothing[ 0 ].Chain, [] );
				let with_null = chain.concat( [ { _id: 'n', Name: null } ] );
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: null } ], with_null, {} ) ), [ 'null@0' ] );
			} );

			it( 'should match an array on the connecting field', async () =>
			{
				let arrayed = [ { _id: 'a', Name: [ 'A', 'X' ], Parent: 'B' }, { _id: 'b', Name: 'B' } ];
				let answer = await walked( [ { _id: 1, Dome: 'A' } ], arrayed, {} );
				assert.strictEqual( answer[ 0 ].Chain.length, 2 );
			} );

			// ***restrictSearchWithMatch prunes the walk***, the first round included.
			it( 'should apply restrictSearchWithMatch, and stop at what it excludes', async () =>
			{
				let gated = [
					{ _id: 'a', Name: 'A', Parent: 'B', Open: true },
					{ _id: 'b', Name: 'B', Parent: 'C', Open: false },
					{ _id: 'c', Name: 'C', Open: true },
				];
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], gated, { restrictSearchWithMatch: { Open: true } } ) ), [ 'A@0' ] );
				let excluded_start = await walked( [ { _id: 1, Dome: 'A' } ], gated, { restrictSearchWithMatch: { Name: { $ne: 'A' } } } );
				assert.deepStrictEqual( excluded_start[ 0 ].Chain, [] );
			} );

			// ***The manual says an aggregation expression is not allowed there.*** The server
			// accepts one, which is why this is measured rather than read.
			it( 'should accept an expression in restrictSearchWithMatch', async () =>
			{
				assert.deepStrictEqual( reached( await walked( [ { _id: 1, Dome: 'A' } ], chain, { restrictSearchWithMatch: { $expr: { $eq: [ '$Name', 'A' ] } } } ) ), [ 'A@0' ] );
			} );

			it( 'should write the depth only when it is asked for', async () =>
			{
				await Driver.SetData( [ { _id: 1, Dome: 'A' } ] );
				await Driver.SetJoinData( chain );
				let answer = await Driver.Aggregate( [ {
					$graphLookup: {
						from: Driver.JoinFrom(), startWith: '$Dome',
						connectFromField: 'Parent', connectToField: 'Name', as: 'Chain',
					},
				} ] );
				assert.strictEqual( answer[ 0 ].Chain.length, 3 );
				assert.strictEqual( typeof answer[ 0 ].Chain[ 0 ].Level, 'undefined' );
			} );

			it( 'should write what it found at a dotted path, keeping its siblings', async () =>
			{
				let answer = await walked( [ { _id: 1, Dome: 'A', S: { N: 1 } } ], chain, { as: 'S.Chain' } );
				assert.strictEqual( answer[ 0 ].S.N, 1 );
				assert.strictEqual( answer[ 0 ].S.Chain.length, 3 );
				let names = answer[ 0 ].S.Chain.map( function ( Each ) { return Each.Name + '@' + Each.Level; } ).sort();
				assert.deepStrictEqual( names, [ 'A@0', 'B@1', 'C@2' ] );
			} );

			it( 'should refuse a maxDepth which is negative or fractional', async () =>
			{
				let refused_negative = false;
				try { await walked( [ { _id: 1, Dome: 'A' } ], chain, { maxDepth: -1 } ); }
				catch ( error ) { refused_negative = true; }
				assert.strictEqual( refused_negative, true );

				let refused_fraction = false;
				try { await walked( [ { _id: 1, Dome: 'A' } ], chain, { maxDepth: 1.5 } ); }
				catch ( error ) { refused_fraction = true; }
				assert.strictEqual( refused_fraction, true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'A Join Inside A Pipeline', () =>
		{

			it( 'should run inside a $facet', async () =>
			{
				await Driver.SetData( [ { _id: 1, Dome: 'A' } ] );
				await Driver.SetJoinData( [ { _id: 'a', DomeId: 'A' } ] );
				let answer = await Driver.Aggregate( [ {
					$facet: {
						branch: [ { $lookup: { from: Driver.JoinFrom(), localField: 'Dome', foreignField: 'DomeId', as: 'F' } } ],
					},
				} ] );
				assert.strictEqual( answer.length, 1 );
				HELPERS.SameDocuments( assert, answer[ 0 ].branch, [ { _id: 1, Dome: 'A', F: [ { _id: 'a', DomeId: 'A' } ] } ], 'F' );
			} );

			it( 'should be followed by other stages, which see what it wrote', async () =>
			{
				await Driver.SetData( [ { _id: 1, Dome: 'A' }, { _id: 2, Dome: 'C' } ] );
				await Driver.SetJoinData( [ { _id: 'a', DomeId: 'A' } ] );
				let answer = await Driver.Aggregate( [
					{ $lookup: { from: Driver.JoinFrom(), localField: 'Dome', foreignField: 'DomeId', as: 'F' } },
					{ $match: { 'F.0': { $exists: true } } },
				] );
				HELPERS.SameDocuments( assert, answer, [ { _id: 1, Dome: 'A', F: [ { _id: 'a', DomeId: 'A' } ] } ], 'F' );
			} );

		} );

	} );

};
