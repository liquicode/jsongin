'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
		Explain: false,
	} );


describe( '240) Aggregate Stage Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Pipeline Dispatch', () =>
	{

		it( 'should return the documents when the pipeline is empty', () =>
		{
			let documents = [ { n: 1 }, { n: 2 } ];
			let result = jsongin.Aggregate( documents, [] );
			assert.ok( result.length === 2 );
			assert.ok( result !== documents );
		} );

		it( 'should run the stages in order', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $match: { n: { $gt: 1 } } }, { $limit: 1 } ] );
			assert.ok( jsongin.StrictEquals( result, [ { n: 2 } ] ) );
		} );

		it( 'should throw when Documents is not an array', () =>
		{
			assert.throws( function () { jsongin.Aggregate( { n: 1 }, [] ); }, /Documents must be an array/ );
		} );

		it( 'should throw when Pipeline is not an array', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], { $limit: 1 } ); }, /Pipeline must be an array/ );
		} );

		it( 'should throw when a stage is not an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ '$limit' ] ); }, /Pipeline stage \[0\] must be an object/ );
		} );

		it( 'should throw when a stage has more than one key', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $match: {}, $limit: 1 } ] ); }, /Pipeline stage \[0\] must have exactly one key/ );
		} );

		it( 'should throw when a stage is not recognized', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $bogus: 1 } ] ); }, /Unrecognized aggregation stage \[\$bogus\]/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$match Tests', () =>
	{

		it( 'should select the matching documents', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $match: { n: { $gte: 2 } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { n: 2 }, { n: 3 } ] ) );
		} );

		it( 'should support $expr', () =>
		{
			let documents = [ { a: 1, b: 2 }, { a: 3, b: 2 } ];
			let result = jsongin.Aggregate( documents, [ { $match: { $expr: { $gt: [ '$a', '$b' ] } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: 3, b: 2 } ] ) );
		} );

		it( 'should not clone the selected documents', () =>
		{
			let documents = [ { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $match: {} } ] );
			assert.ok( result[ 0 ] === documents[ 0 ] );
		} );

		it( 'should throw when the argument is not an object', () =>
		{
			// Aggregate() checks the argument against the stage's declared ArgTypes before it
			// dispatches, so that is the error a pipeline sees. The stage keeps its own check
			// for when its Stage function is called directly.
			assert.throws( function () { jsongin.Aggregate( [], [ { $match: 'n' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$match.Stage( [], 'n' ); }, /\$match requires a query object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$project Tests', () =>
	{

		it( 'should include fields', () =>
		{
			let documents = [ { a: 1, b: 2, c: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $project: { a: 1, c: 1 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: 1, c: 3 } ] ) );
		} );

		it( 'should exclude fields', () =>
		{
			let documents = [ { a: 1, b: 2, c: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $project: { b: 0 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: 1, c: 3 } ] ) );
		} );

		it( 'should compute fields from expressions', () =>
		{
			let documents = [ { name: 'a', dmg: 8, armor: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $project: { name: 1, net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { name: 'a', net: 5 } ] ) );
		} );

		it( 'should clone the documents it emits', () =>
		{
			let documents = [ { a: { b: 1 } } ];
			let result = jsongin.Aggregate( documents, [ { $project: { a: 1 } } ] );
			assert.ok( result[ 0 ] !== documents[ 0 ] );
			assert.ok( result[ 0 ].a !== documents[ 0 ].a );
		} );

		it( 'should throw when the projection is not valid', () =>
		{
			let documents = [ { a: 1, b: 2 } ];
			// Project() raises this itself now, so the stage's own "Unable to project" wrapper
			// is reached only if Project ever returns null instead of throwing.
			assert.throws( function () { jsongin.Aggregate( documents, [ { $project: { a: 1, b: 0 } } ] ); }, /Cannot combine inclusion and exclusion/ );
		} );

		it( 'should throw when the argument is not an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $project: 'a' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$project.Stage( [], 'a' ); }, /\$project requires a projection object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$addFields and $set Tests', () =>
	{

		it( 'should add a computed field, keeping the existing fields', () =>
		{
			let documents = [ { dmg: 8, armor: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { dmg: 8, armor: 3, net: 5 } ] ) );
		} );

		it( 'should overwrite an existing field', () =>
		{
			let documents = [ { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { n: { $add: [ '$n', 10 ] } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { n: 11 } ] ) );
		} );

		it( 'should not add a field whose expression evaluates to a missing value', () =>
		{
			let documents = [ { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { x: '$nope' } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { n: 1 } ] ) );
		} );

		it( 'should evaluate every expression against the original document', () =>
		{
			// A field added by this stage is not visible to the other expressions in it.
			let documents = [ { a: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { b: '$a', c: '$b' } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: 1, b: 1 } ] ) );
		} );

		it( 'should set a nested field', () =>
		{
			let documents = [ { a: { b: 1 } } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { 'a.c': 2 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: { b: 1, c: 2 } } ] ) );
		} );

		it( 'should clone the documents it emits', () =>
		{
			let documents = [ { a: { b: 1 } } ];
			let result = jsongin.Aggregate( documents, [ { $addFields: { n: 1 } } ] );
			assert.ok( result[ 0 ] !== documents[ 0 ] );
			assert.ok( result[ 0 ].a !== documents[ 0 ].a );
		} );

		/*
			A field reference such as '$user' evaluates to the value inside the original
			document, so an added field which is a field reference has to be cloned too.
			Cloning the document alone left the added field pointing back into the input.
		*/

		it( 'should clone a field added from a field reference', () =>
		{
			let stages = [ '$addFields', '$set' ];
			for ( let index = 0; index < stages.length; index++ )
			{
				let documents = [ { user: { name: 'Alice' } } ];
				let stage = {};
				stage[ stages[ index ] ] = { copy: '$user' };

				let result = jsongin.Aggregate( documents, [ stage ] );
				assert.ok( result[ 0 ].copy !== documents[ 0 ].user, `${stages[ index ]} shared the value.` );

				result[ 0 ].copy.name = 'Bob';
				assert.strictEqual( documents[ 0 ].user.name, 'Alice', `${stages[ index ]} wrote to the input.` );
			}
		} );

		it( 'should keep a date on a field added from a field reference', () =>
		{
			let result = jsongin.Aggregate( [ { when: new Date( 1000 ) } ], [ { $addFields: { w: '$when' } } ] );
			assert.ok( result[ 0 ].w instanceof Date );
			assert.strictEqual( result[ 0 ].w.getTime(), 1000 );
		} );

		it( 'should behave identically as $set', () =>
		{
			let documents = [ { dmg: 8, armor: 3 } ];
			let added = jsongin.Aggregate( documents, [ { $addFields: { net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
			let assigned = jsongin.Aggregate( documents, [ { $set: { net: { $subtract: [ '$dmg', '$armor' ] } } } ] );
			assert.ok( jsongin.StrictEquals( added, assigned ) );
		} );

		it( 'should throw when the argument is not an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $addFields: 'a' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$addFields.Stage( [], 'a' ); }, /\$addFields requires an object/ );
			// $set shares the implementation but reports under its own name.
			assert.throws( function () { jsongin.Aggregate( [], [ { $set: 'a' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$set.Stage( [], 'a' ); }, /\$set requires an object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$unwind Tests', () =>
	{

		it( 'should emit one document per array element', () =>
		{
			let documents = [ { id: 1, items: [ 'a', 'b' ] } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: '$items' } ] );
			assert.ok( jsongin.StrictEquals( result, [ { id: 1, items: 'a' }, { id: 1, items: 'b' } ] ) );
		} );

		it( 'should emit a non-array value once, unchanged', () =>
		{
			let documents = [ { id: 1, items: 'a' } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: '$items' } ] );
			assert.ok( jsongin.StrictEquals( result, [ { id: 1, items: 'a' } ] ) );
		} );

		it( 'should emit nothing for an empty array, a null, or a missing field', () =>
		{
			let documents = [ { id: 1, items: [] }, { id: 2, items: null }, { id: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: '$items' } ] );
			assert.ok( jsongin.StrictEquals( result, [] ) );
		} );

		it( 'should preserve empty arrays, nulls, and missing fields when asked to', () =>
		{
			let documents = [ { id: 1, items: [] }, { id: 2, items: null }, { id: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } } ] );
			assert.ok( result.length === 3 );
			// An empty array is removed, a null is left in place, a missing field stays missing.
			assert.ok( jsongin.StrictEquals( result[ 0 ], { id: 1 } ) );
			assert.ok( jsongin.StrictEquals( result[ 1 ], { id: 2, items: null } ) );
			assert.ok( jsongin.StrictEquals( result[ 2 ], { id: 3 } ) );
		} );

		it( 'should include the array index when asked to', () =>
		{
			let documents = [ { id: 1, items: [ 'a', 'b' ] } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: { path: '$items', includeArrayIndex: 'i' } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { id: 1, items: 'a', i: 0 }, { id: 1, items: 'b', i: 1 } ] ) );
		} );

		it( 'should set the array index to null for a document which was not unwound', () =>
		{
			let documents = [ { id: 1, items: 'a' } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: { path: '$items', includeArrayIndex: 'i' } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { id: 1, items: 'a', i: null } ] ) );
		} );

		it( 'should unwind a nested path', () =>
		{
			let documents = [ { a: { b: [ 1, 2 ] } } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: '$a.b' } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: { b: 1 } }, { a: { b: 2 } } ] ) );
		} );

		it( 'should clone the documents it emits', () =>
		{
			let documents = [ { a: { b: 1 }, items: [ 1, 2 ] } ];
			let result = jsongin.Aggregate( documents, [ { $unwind: '$items' } ] );
			assert.ok( result[ 0 ] !== documents[ 0 ] );
			assert.ok( result[ 0 ].a !== documents[ 0 ].a );
			assert.ok( result[ 0 ].a !== result[ 1 ].a );
		} );

		it( 'should throw when the path does not begin with a $', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $unwind: 'items' } ] ); }, /must begin with a \$/ );
		} );

		it( 'should throw when the argument is not a string or an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $unwind: 3 } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$unwind.Stage( [], 3 ); }, /requires a path string or an object/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $unwind: {} } ] ); }, /requires a path string/ );
		} );

		it( 'should throw when the options are not valid', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $unwind: { path: '$items', includeArrayIndex: 1 } } ] ); }, /includeArrayIndex must be a string/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $unwind: { path: '$items', preserveNullAndEmptyArrays: 'yes' } } ] ); }, /preserveNullAndEmptyArrays must be a boolean/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$group Tests', () =>
	{

		it( 'should group the documents by a field', () =>
		{
			let documents = [ { t: 'a', n: 1 }, { t: 'b', n: 2 }, { t: 'a', n: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: '$t', total: { $sum: '$n' } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: 'a', total: 4 }, { _id: 'b', total: 2 } ] ) );
		} );

		it( 'should gather every document into one group with a null _id', () =>
		{
			let documents = [ { n: 1 }, { n: 2 } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: null, total: { $sum: '$n' } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: null, total: 3 } ] ) );
		} );

		it( 'should group by a computed expression', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 }, { n: 4 } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: { $mod: [ '$n', 2 ] }, values: { $push: '$n' } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: 1, values: [ 1, 3 ] }, { _id: 0, values: [ 2, 4 ] } ] ) );
		} );

		it( 'should group a missing group key with the nulls', () =>
		{
			let documents = [ { t: 'a' }, {}, { t: null } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: '$t', n: { $count: {} } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: 'a', n: 1 }, { _id: null, n: 2 } ] ) );
		} );

		it( 'should not group values of different types together', () =>
		{
			let documents = [ { t: 5 }, { t: '5' } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: '$t', n: { $count: {} } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: 5, n: 1 }, { _id: '5', n: 1 } ] ) );
		} );

		it( 'should emit the groups in the order they were first seen', () =>
		{
			let documents = [ { t: 'c' }, { t: 'a' }, { t: 'b' }, { t: 'a' } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: '$t' } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: 'c' }, { _id: 'a' }, { _id: 'b' } ] ) );
		} );

		it( 'should support several accumulators at once', () =>
		{
			let documents = [ { t: 'a', n: 1 }, { t: 'a', n: 5 }, { t: 'a', n: 3 } ];
			let result = jsongin.Aggregate( documents, [
				{
					$group: {
						_id: '$t',
						total: { $sum: '$n' },
						average: { $avg: '$n' },
						smallest: { $min: '$n' },
						largest: { $max: '$n' },
						count: { $count: {} },
						values: { $push: '$n' },
						first: { $first: '$n' },
						last: { $last: '$n' },
					}
				} ] );
			assert.ok( jsongin.StrictEquals( result, [ {
				_id: 'a',
				total: 9,
				average: 3,
				smallest: 1,
				largest: 5,
				count: 3,
				values: [ 1, 5, 3 ],
				first: 1,
				last: 3,
			} ] ) );
		} );

		// ***This asserted the opposite until 2026-08-20, and was wrong the whole time.***
		// It claimed the field was omitted, on the reasonable-looking analogy with $project,
		// where an expression producing no value leaves its field out. MongoDB writes a null.
		//
		// It survived because it was a ***unit*** test making a claim about behavior MongoDB
		// has an opinion on, which is exactly what the parity rule exists to prevent: a unit
		// test can only ever confirm what jsongin already does. The parity test which now
		// covers it is in Stage and Accumulator Tests.js, and this one is kept because it
		// pins the shape a caller sees from Aggregate() directly.
		it( 'should write a null for a field whose accumulated value is missing', () =>
		{
			let documents = [ {}, { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: null, first: { $first: '$n' } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: null, first: null } ] ) );
		} );

		it( 'should not alias the documents it grouped', () =>
		{
			let documents = [ { t: 'a', item: { n: 1 } } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: '$t', items: { $push: '$item' } } } ] );
			assert.ok( result[ 0 ].items[ 0 ] !== documents[ 0 ].item );
			assert.ok( jsongin.StrictEquals( result[ 0 ].items[ 0 ], { n: 1 } ) );
		} );

		it( 'should throw when _id is not given', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: { total: { $sum: 1 } } } ] ); }, /\$group requires an _id field/ );
		} );

		it( 'should throw when a field is not an accumulator object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: { _id: null, total: '$n' } } ] ); }, /must be an accumulator object/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: { _id: null, total: { $sum: 1, $avg: 1 } } } ] ); }, /must have exactly one accumulator/ );
		} );

		it( 'should throw when an accumulator is not recognized', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: { _id: null, total: { $bogus: 1 } } } ] ); }, /Unrecognized accumulator \[\$bogus\]/ );
		} );

		it( 'should throw when the argument is not an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $group: 'a' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$group.Stage( [], 'a' ); }, /\$group requires an object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$sort Tests', () =>
	{

		it( 'should sort ascending and descending', () =>
		{
			let documents = [ { n: 2 }, { n: 3 }, { n: 1 } ];
			assert.ok( jsongin.StrictEquals(
				jsongin.Aggregate( documents, [ { $sort: { n: 1 } } ] ),
				[ { n: 1 }, { n: 2 }, { n: 3 } ] ) );
			assert.ok( jsongin.StrictEquals(
				jsongin.Aggregate( documents, [ { $sort: { n: -1 } } ] ),
				[ { n: 3 }, { n: 2 }, { n: 1 } ] ) );
		} );

		it( 'should sort documents which are missing the sort field as though it were null', () =>
		{
			let documents = [ { n: 2 }, { x: 9 }, { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $sort: { n: 1 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { x: 9 }, { n: 1 }, { n: 2 } ] ) );
		} );

		it( 'should sort mixed types by the BSON type order', () =>
		{
			let documents = [ { n: 'abc' }, { n: 5 }, { n: null }, { n: true } ];
			let result = jsongin.Aggregate( documents, [ { $sort: { n: 1 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { n: null }, { n: 5 }, { n: 'abc' }, { n: true } ] ) );
		} );

		it( 'should sort by several fields', () =>
		{
			let documents = [ { a: 1, b: 2 }, { a: 1, b: 1 }, { a: 0, b: 9 } ];
			let result = jsongin.Aggregate( documents, [ { $sort: { a: 1, b: -1 } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { a: 0, b: 9 }, { a: 1, b: 2 }, { a: 1, b: 1 } ] ) );
		} );

		it( 'should reduce an array sort field to one key, smallest ascending and largest descending', () =>
		{
			// A sort field which holds an array is reduced to a single sort key first.
			// docA's only element is 3; docB holds 1 and 2.
			let documents = [ { v: [ 3 ] }, { v: [ 1, 2 ] } ];
			let asc = jsongin.Aggregate( documents, [ { $sort: { v: 1 } } ] );
			// Ascending takes the smallest element: docB (1) comes before docA (3).
			assert.deepEqual( asc[ 0 ].v, [ 1, 2 ] );
			let desc = jsongin.Aggregate( documents, [ { $sort: { v: -1 } } ] );
			// Descending takes the largest element: docA (3) comes before docB (2).
			assert.deepEqual( desc[ 0 ].v, [ 3 ] );
		} );

		it( 'should leave the input array ordering untouched', () =>
		{
			let documents = [ { n: 2 }, { n: 1 } ];
			jsongin.Aggregate( documents, [ { $sort: { n: 1 } } ] );
			assert.ok( jsongin.StrictEquals( documents, [ { n: 2 }, { n: 1 } ] ) );
		} );

		it( 'should throw when the argument is not an object', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $sort: 'n' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$sort.Stage( [], 'n' ); }, /\$sort requires a sort criteria object/ );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$limit and $skip Tests', () =>
	{

		it( 'should limit the documents', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $limit: 2 } ] ), [ { n: 1 }, { n: 2 } ] ) );
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $limit: 0 } ] ), [] ) );
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $limit: 9 } ] ), documents ) );
		} );

		it( 'should skip the documents', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $skip: 2 } ] ), [ { n: 3 } ] ) );
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $skip: 0 } ] ), documents ) );
			assert.ok( jsongin.StrictEquals( jsongin.Aggregate( documents, [ { $skip: 9 } ] ), [] ) );
		} );

		it( 'should throw when the count is not a non-negative integer', () =>
		{
			assert.throws( function () { jsongin.Aggregate( [], [ { $limit: '2' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$limit.Stage( [], '2' ); }, /\$limit requires a number/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $limit: 1.5 } ] ); }, /\$limit requires an integer/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $limit: -1 } ] ); }, /\$limit cannot be negative/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $skip: '2' } ] ); }, /does not take an argument of type/ );
			assert.throws( function () { jsongin.StageOperators.$skip.Stage( [], '2' ); }, /\$skip requires a number/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $skip: 1.5 } ] ); }, /\$skip requires an integer/ );
			assert.throws( function () { jsongin.Aggregate( [], [ { $skip: -1 } ] ); }, /\$skip cannot be negative/ );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***$lookup, which reads a second set of documents.***

		MongoDB names a collection in `from`; jsongin takes the documents themselves, inline or
		from a `$$name` bound in the pipeline's scope. ***That is the only difference***, and
		everything below was measured against MongoDB 8.3.8 on 2026-09-20 - the equality rules
		especially, which are `$in` over the local values rather than anything new:
		`jsonx/.plans/tools/lookup-parity-probe.js`.

		The same cases run against a live server in the parity suite. These run without one.
	*/
	describe( '$lookup Tests', () =>
	{

		let bookings = [ { _id: 1, Dome: 'A' }, { _id: 2, Dome: 'C' } ];
		let nights = [ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: 'B' } ];

		function looked_up( Documents, Args, Scope )
		{
			return jsongin.Aggregate( Documents, [ { $lookup: Args } ], Scope );
		}

		it( 'should gather the matches, and write an empty array where there were none', () =>
		{
			let answer = looked_up( bookings, { from: nights, localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
			assert.deepStrictEqual( answer[ 0 ].F, [ { _id: 'a', DomeId: 'A' } ] );
			assert.deepStrictEqual( answer[ 1 ].F, [] );
			assert.strictEqual( answer.length, 2 );
		} );

		it( 'should take the documents from a variable in the scope', () =>
		{
			let scope = jsongin.Scope.NewPipeline().Child( { Nights: nights } );
			let answer = looked_up( bookings, { from: '$$Nights', localField: 'Dome', foreignField: 'DomeId', as: 'F' }, scope );
			assert.deepStrictEqual( answer[ 0 ].F, [ { _id: 'a', DomeId: 'A' } ] );
		} );

		// ***jsongin has no collections***, so a name is refused rather than read as one.
		it( 'should refuse a from which is neither documents nor a bound variable', () =>
		{
			assert.throws( () => looked_up( bookings, { from: 'nights', localField: 'Dome', foreignField: 'DomeId', as: 'F' } ), /no collections/ );
			assert.throws( () => looked_up( bookings, { from: '$$Nope', localField: 'Dome', foreignField: 'DomeId', as: 'F' } ), /is not defined/ );
			assert.throws( () => looked_up( bookings, { localField: 'Dome', foreignField: 'DomeId', as: 'F' } ), /from/ );
		} );

		// ***The equality rules, all measured on 8.3.8.*** An array on either side matches
		// element by element, and a missing field is a null one.
		it( 'should match an array on either side, element by element', () =>
		{
			let many = [ { _id: 1, Dome: [ 'A', 'B' ] } ];
			let some = [ { _id: 'a', DomeId: 'A' }, { _id: 'b', DomeId: [ 'B', 'Z' ] }, { _id: 'c', DomeId: 'C' } ];
			let answer = looked_up( many, { from: some, localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
			assert.deepStrictEqual( answer[ 0 ].F.map( function ( Each ) { return Each._id; } ), [ 'a', 'b' ] );
		} );

		it( 'should treat a missing local field as null, and match a missing foreign field', () =>
		{
			let nothing = [ { _id: 1 } ];
			let some = [ { _id: 'a', DomeId: null }, { _id: 'b' }, { _id: 'c', DomeId: 'A' } ];
			let answer = looked_up( nothing, { from: some, localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
			assert.deepStrictEqual( answer[ 0 ].F.map( function ( Each ) { return Each._id; } ), [ 'a', 'b' ] );
			// And the same from the other side: a local null matches both.
			let null_local = looked_up( [ { _id: 1, Dome: null } ], { from: some, localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
			assert.deepStrictEqual( null_local[ 0 ].F.map( function ( Each ) { return Each._id; } ), [ 'a', 'b' ] );
		} );

		it( 'should reach a nested field, and through an array of documents', () =>
		{
			let nested = [ { _id: 1, Site: { Dome: 'A' } } ];
			assert.strictEqual( looked_up( nested, { from: nights, localField: 'Site.Dome', foreignField: 'DomeId', as: 'F' } )[ 0 ].F.length, 1 );
			let sites = [ { _id: 1, Sites: [ { Dome: 'A' }, { Dome: 'B' } ] } ];
			assert.strictEqual( looked_up( sites, { from: nights, localField: 'Sites.Dome', foreignField: 'DomeId', as: 'F' } )[ 0 ].F.length, 2 );
		} );

		it( 'should write as at a dotted path, keeping its siblings, and replace what was there', () =>
		{
			let sites = [ { _id: 1, Dome: 'A', Site: { Name: 'North' } } ];
			let nested = looked_up( sites, { from: nights, localField: 'Dome', foreignField: 'DomeId', as: 'Site.F' } );
			assert.strictEqual( nested[ 0 ].Site.Name, 'North' );
			assert.strictEqual( nested[ 0 ].Site.F.length, 1 );
			let occupied = [ { _id: 1, Dome: 'A', F: 'was here' } ];
			assert.deepStrictEqual( looked_up( occupied, { from: nights, localField: 'Dome', foreignField: 'DomeId', as: 'F' } )[ 0 ].F, [ { _id: 'a', DomeId: 'A' } ] );
		} );

		// ***The correlated form.*** `let` binds variables the sub-pipeline reads with $$, and
		// a $match's $expr is where they are read - which is what the pipeline's frame carries.
		it( 'should run a pipeline with let bound', () =>
		{
			let bookings_with_minimum = [ { _id: 1, Dome: 'A', Minimum: 2 } ];
			let stays = [ { _id: 'a', DomeId: 'A', N: 1 }, { _id: 'b', DomeId: 'A', N: 5 } ];
			let answer = looked_up( bookings_with_minimum, {
				from: stays,
				let: { dome: '$Dome', minimum: '$Minimum' },
				pipeline: [ { $match: { $expr: { $and: [ { $eq: [ '$DomeId', '$$dome' ] }, { $gt: [ '$N', '$$minimum' ] } ] } } } ],
				as: 'F',
			} );
			assert.deepStrictEqual( answer[ 0 ].F, [ { _id: 'b', DomeId: 'A', N: 5 } ] );
		} );

		it( 'should apply a key match and a pipeline together', () =>
		{
			let stays = [ { _id: 'a', DomeId: 'A', N: 1 }, { _id: 'b', DomeId: 'A', N: 9 }, { _id: 'c', DomeId: 'B', N: 9 } ];
			let answer = looked_up( [ { _id: 1, Dome: 'A' } ], {
				from: stays, localField: 'Dome', foreignField: 'DomeId',
				pipeline: [ { $match: { N: { $gt: 5 } } } ], as: 'F',
			} );
			assert.deepStrictEqual( answer[ 0 ].F.map( function ( Each ) { return Each._id; } ), [ 'b' ] );
		} );

		it( 'should run an uncorrelated pipeline, giving every document the same answer', () =>
		{
			let answer = looked_up( bookings, { from: nights, pipeline: [ { $match: { DomeId: 'B' } } ], as: 'F' } );
			assert.deepStrictEqual( answer[ 0 ].F, answer[ 1 ].F );
			assert.deepStrictEqual( answer[ 0 ].F, [ { _id: 'b', DomeId: 'B' } ] );
		} );

		it( 'should refuse arguments it cannot use', () =>
		{
			assert.throws( () => looked_up( bookings, { from: nights, localField: 'Dome', as: 'F' } ), /foreignField/ );
			assert.throws( () => looked_up( bookings, { from: nights, foreignField: 'DomeId', as: 'F' } ), /localField/ );
			assert.throws( () => looked_up( bookings, { from: nights, localField: 'Dome', foreignField: 'DomeId' } ), /as/ );
			assert.throws( () => looked_up( bookings, { from: nights, as: 'F' } ), /localField and a foreignField, or a pipeline/ );
			assert.throws( () => looked_up( bookings, { from: nights, pipeline: 'nope', as: 'F' } ), /pipeline must be an array/ );
			assert.throws( () => looked_up( bookings, { from: nights, let: 'nope', pipeline: [], as: 'F' } ), /let must be a document/ );
		} );

		// A production, so the documents it writes are new ones.
		it( 'should leave both sets alone', () =>
		{
			let left = [ { _id: 1, Dome: 'A' } ];
			let right = [ { _id: 'a', DomeId: 'A' } ];
			let answer = looked_up( left, { from: right, localField: 'Dome', foreignField: 'DomeId', as: 'F' } );
			answer[ 0 ].Dome = 'changed';
			answer[ 0 ].F[ 0 ].DomeId = 'changed';
			assert.deepStrictEqual( left, [ { _id: 1, Dome: 'A' } ] );
			assert.deepStrictEqual( right, [ { _id: 'a', DomeId: 'A' } ] );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***$unionWith, which adds a second set of documents to the stream.***

		A concatenation and not a set union: measured against MongoDB 8.3.8, a document in both
		collections came back twice, `_id` and all.
	*/
	describe( '$unionWith Tests', () =>
	{

		let main = [ { _id: 1, Side: 'main' } ];
		let other = [ { _id: 'a', Side: 'join', Keep: true }, { _id: 'b', Side: 'join', Keep: false } ];

		it( 'should add the second set after the first', () =>
		{
			let answer = jsongin.Aggregate( main, [ { $unionWith: other } ] );
			assert.deepStrictEqual( answer.map( function ( Each ) { return Each._id; } ), [ 1, 'a', 'b' ] );
			// The long form says the same thing.
			assert.deepStrictEqual( jsongin.Aggregate( main, [ { $unionWith: { coll: other } } ] ), answer );
		} );

		it( 'should take the documents from a variable in the scope', () =>
		{
			let scope = jsongin.Scope.NewPipeline().Child( { Other: other } );
			let answer = jsongin.Aggregate( main, [ { $unionWith: { coll: '$$Other' } } ], scope );
			assert.strictEqual( answer.length, 3 );
			assert.deepStrictEqual( jsongin.Aggregate( main, [ { $unionWith: '$$Other' } ], scope ), answer );
		} );

		it( 'should run a pipeline over the second set only', () =>
		{
			let answer = jsongin.Aggregate( main, [ { $unionWith: { coll: other, pipeline: [ { $match: { Keep: true } } ] } } ] );
			assert.deepStrictEqual( answer.map( function ( Each ) { return Each._id; } ), [ 1, 'a' ] );
		} );

		// ***A concatenation, not a set union.***
		it( 'should keep a document which is in both sets', () =>
		{
			let answer = jsongin.Aggregate( main, [ { $unionWith: [ { _id: 1, Side: 'join' } ] } ] );
			assert.strictEqual( answer.length, 2 );
			assert.deepStrictEqual( answer.map( function ( Each ) { return Each.Side; } ), [ 'main', 'join' ] );
		} );

		it( 'should let a later stage see both sets', () =>
		{
			let answer = jsongin.Aggregate( main, [ { $unionWith: other }, { $match: { Side: 'join' } } ] );
			assert.strictEqual( answer.length, 2 );
		} );

		it( 'should refuse what it cannot add', () =>
		{
			assert.throws( () => jsongin.Aggregate( main, [ { $unionWith: {} } ] ), /requires documents to add/ );
			assert.throws( () => jsongin.Aggregate( main, [ { $unionWith: 3 } ] ), /\$unionWith/ );
			assert.throws( () => jsongin.Aggregate( main, [ { $unionWith: 'somecollection' } ] ), /no collections/ );
			assert.throws( () => jsongin.Aggregate( main, [ { $unionWith: '$$Nope' } ] ), /is not defined/ );
			assert.throws( () => jsongin.Aggregate( main, [ { $unionWith: { coll: other, pipeline: 'nope' } } ] ), /pipeline must be an array/ );
		} );

	} );


	//---------------------------------------------------------------------
	/*
		***$graphLookup, which follows a chain through a second set of documents.***

		Every rule here was measured against MongoDB 8.3.8 on 2026-09-20 before it was built:
		`jsonx/.plans/tools/lookup-parity-probe.js`. The parity suite runs the same cases
		against a live server; these run without one.

		***What is deliberately not asserted is the order of what it finds.*** The server
		answers in its own, which an in-memory engine cannot reproduce, so these tests read the
		names and the depths rather than the array as it stands.
	*/
	describe( '$graphLookup Tests', () =>
	{

		let chain = [
			{ _id: 'a', Name: 'A', Parent: 'B' },
			{ _id: 'b', Name: 'B', Parent: 'C' },
			{ _id: 'c', Name: 'C' },
		];

		function walked( Documents, Args, Scope )
		{
			let base = { startWith: '$Dome', connectFromField: 'Parent', connectToField: 'Name', as: 'Chain', depthField: 'Level' };
			return jsongin.Aggregate( Documents, [ { $graphLookup: Object.assign( base, Args ) } ], Scope );
		}

		// The names and their depths, sorted, which is what can be compared.
		function reached( Answer, Field )
		{
			let found = Field ? Answer[ 0 ][ Field ] : Answer[ 0 ].Chain;
			return found.map( function ( Each ) { return Each.Name + '@' + Each.Level; } ).sort();
		}

		it( 'should follow the chain, numbering from zero', () =>
		{
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: chain } ) ), [ 'A@0', 'B@1', 'C@2' ] );
		} );

		it( 'should stop at maxDepth, where zero is the first round alone', () =>
		{
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: chain, maxDepth: 0 } ) ), [ 'A@0' ] );
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: chain, maxDepth: 1 } ) ), [ 'A@0', 'B@1' ] );
		} );

		// ***A cycle ends***, because a document is reached once - by its place in the array,
		// which is what an _id does on a server.
		it( 'should end on a cycle', () =>
		{
			let ring = [ { _id: 'a', Name: 'A', Parent: 'B' }, { _id: 'b', Name: 'B', Parent: 'A' } ];
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: ring } ) ), [ 'A@0', 'B@1' ] );
		} );

		// ***Identity is the document, not the value it connects on.***
		it( 'should follow two documents which share a connecting value', () =>
		{
			let forked = [
				{ _id: 'a1', Name: 'A', Parent: 'B' },
				{ _id: 'a2', Name: 'A', Parent: 'C' },
				{ _id: 'b', Name: 'B' },
				{ _id: 'c', Name: 'C' },
			];
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: forked } ) ), [ 'A@0', 'A@0', 'B@1', 'C@1' ] );
		} );

		// ***The shallowest depth wins.*** D is one hop away and also three.
		it( 'should stamp a document reached twice with the shallower depth', () =>
		{
			let both_ways = [
				{ _id: 'a', Name: 'A', Parent: [ 'B', 'D' ] },
				{ _id: 'b', Name: 'B', Parent: 'C' },
				{ _id: 'c', Name: 'C', Parent: 'D' },
				{ _id: 'd', Name: 'D' },
			];
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: both_ways } ) ), [ 'A@0', 'B@1', 'C@2', 'D@1' ] );
		} );

		it( 'should start from every value when startWith is an array, and evaluate an expression', () =>
		{
			let names = [ { _id: 'a', Name: 'A' }, { _id: 'b', Name: 'B' }, { _id: 'c', Name: 'C' } ];
			let several = walked( [ { _id: 1, Domes: [ 'A', 'C' ] } ], { from: names, startWith: '$Domes', connectFromField: 'Name' } );
			assert.deepStrictEqual( reached( several ), [ 'A@0', 'C@0' ] );
			// An expression is evaluated against the document.
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'a' } ], { from: chain, startWith: { $toUpper: '$Dome' } } ) ), [ 'A@0', 'B@1', 'C@2' ] );
		} );

		it( 'should find nothing when startWith has no value, and look for null when it is null', () =>
		{
			assert.deepStrictEqual( walked( [ { _id: 1 } ], { from: chain } )[ 0 ].Chain, [] );
			let with_null = chain.concat( [ { _id: 'n', Name: null } ] );
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: null } ], { from: with_null } ) ), [ 'null@0' ] );
		} );

		// ***restrictSearchWithMatch prunes the walk***, including the first round, so what lies
		// beyond an excluded document is never reached.
		it( 'should apply restrictSearchWithMatch, and stop the walk at what it excludes', () =>
		{
			let gated = [
				{ _id: 'a', Name: 'A', Parent: 'B', Open: true },
				{ _id: 'b', Name: 'B', Parent: 'C', Open: false },
				{ _id: 'c', Name: 'C', Open: true },
			];
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: gated, restrictSearchWithMatch: { Open: true } } ) ), [ 'A@0' ] );
			// Excluding the starting document finds nothing at all.
			assert.deepStrictEqual( walked( [ { _id: 1, Dome: 'A' } ], { from: gated, restrictSearchWithMatch: { Name: { $ne: 'A' } } } )[ 0 ].Chain, [] );
			// An expression is allowed there, which the server accepts although its manual says otherwise.
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: chain, restrictSearchWithMatch: { $expr: { $eq: [ '$Name', 'A' ] } } } ) ), [ 'A@0' ] );
		} );

		it( 'should write the depth only when it is asked for, and write as at a dotted path', () =>
		{
			let plain = jsongin.Aggregate( [ { _id: 1, Dome: 'A' } ], [ {
				$graphLookup: { from: chain, startWith: '$Dome', connectFromField: 'Parent', connectToField: 'Name', as: 'Chain' },
			} ] );
			assert.strictEqual( plain[ 0 ].Chain.length, 3 );
			assert.strictEqual( typeof plain[ 0 ].Chain[ 0 ].Level, 'undefined' );

			let nested = walked( [ { _id: 1, Dome: 'A', S: { N: 1 } } ], { from: chain, as: 'S.Chain' } );
			assert.strictEqual( nested[ 0 ].S.N, 1 );
			assert.strictEqual( nested[ 0 ].S.Chain.length, 3 );
		} );

		it( 'should take the documents from a variable, and refuse what it cannot walk', () =>
		{
			let scope = jsongin.Scope.NewPipeline().Child( { Chain: chain } );
			assert.deepStrictEqual( reached( walked( [ { _id: 1, Dome: 'A' } ], { from: '$$Chain' }, scope ) ), [ 'A@0', 'B@1', 'C@2' ] );

			assert.throws( () => walked( [ { _id: 1 } ], { from: 'somecollection' } ), /no collections/ );
			assert.throws( () => walked( [ { _id: 1 } ], { from: chain, maxDepth: -1 } ), /nonnegative/ );
			assert.throws( () => walked( [ { _id: 1 } ], { from: chain, maxDepth: 1.5 } ), /whole number/ );
			assert.throws( () => walked( [ { _id: 1 } ], { from: chain, connectToField: undefined } ), /connectToField/ );
			assert.throws( () => walked( [ { _id: 1 } ], { from: chain, as: undefined } ), /as/ );
			assert.throws( () => walked( [ { _id: 1 } ], { from: chain, restrictSearchWithMatch: 'nope' } ), /restrictSearchWithMatch/ );
		} );

		it( 'should leave both sets alone', () =>
		{
			let documents = [ { _id: 1, Dome: 'A' } ];
			let answer = walked( documents, { from: chain } );
			answer[ 0 ].Chain[ 0 ].Name = 'changed';
			answer[ 0 ].Dome = 'changed';
			assert.deepStrictEqual( documents, [ { _id: 1, Dome: 'A' } ] );
			assert.deepStrictEqual( chain[ 0 ], { _id: 'a', Name: 'A', Parent: 'B' } );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Input Immutability', () =>
	{

		it( 'should not modify the input array or its documents', () =>
		{
			let documents = [
				{ t: 'a', n: 1, when: new Date( 0 ), item: { tags: [ 'x' ] } },
				{ t: 'b', n: 2, when: new Date( 1000 ), item: { tags: [ 'y', 'z' ] } },
			];
			let before = jsongin.Format( documents );

			jsongin.Aggregate( documents, [
				{ $sort: { n: -1 } },
				{ $addFields: { doubled: { $multiply: [ '$n', 2 ] } } },
				{ $unwind: '$item.tags' },
				{ $group: { _id: '$t', tags: { $push: '$item.tags' }, when: { $first: '$when' } } },
				{ $project: { tags: 1 } },
			] );

			assert.ok( jsongin.Format( documents ) === before );
			assert.ok( documents.length === 2 );
			assert.ok( documents[ 0 ].when instanceof Date );
			assert.ok( documents[ 0 ].when.getTime() === 0 );
		} );

		// $sort is the stage which could reorder the caller's array, because jsongin.Sort()
		// sorts in place. Two separate copies stop it, and they protect different callers:
		// Aggregate() copies the array before the first stage runs, which is what protects the
		// caller here, and the $sort stage copies again, which is what protects someone calling
		// the stage directly. The test below covers the second one, which the pipeline cannot
		// reach.
		it( 'should not reorder the input array when sorting it', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			let result = jsongin.Aggregate( documents, [ { $sort: { n: -1 } } ] );

			assert.deepStrictEqual( documents.map( function ( D ) { return D.n; } ), [ 1, 2, 3 ] );
			assert.deepStrictEqual( result.map( function ( D ) { return D.n; } ), [ 3, 2, 1 ] );
			// Pass-through, so the documents themselves are still the caller's own.
			assert.strictEqual( result[ 0 ], documents[ 2 ] );
		} );

		it( 'should not reorder the array given to the $sort stage directly', () =>
		{
			let documents = [ { n: 1 }, { n: 2 }, { n: 3 } ];
			let result = jsongin.StageOperators.$sort.Stage( documents, { n: -1 } );

			assert.deepStrictEqual( documents.map( function ( D ) { return D.n; } ), [ 1, 2, 3 ] );
			assert.deepStrictEqual( result.map( function ( D ) { return D.n; } ), [ 3, 2, 1 ] );
		} );

		it( 'should carry dates through the pipeline as dates', () =>
		{
			let documents = [ { t: 'a', when: new Date( 0 ) } ];
			let result = jsongin.Aggregate( documents, [
				{ $addFields: { copied: '$when' } },
				{ $group: { _id: '$t', when: { $first: '$when' } } },
			] );
			assert.ok( result[ 0 ].when instanceof Date );
			assert.ok( result[ 0 ].when.getTime() === 0 );
			assert.ok( result[ 0 ].when !== documents[ 0 ].when );
		} );

	} );


} );
