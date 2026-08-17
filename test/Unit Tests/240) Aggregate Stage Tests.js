'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' )
	.NewJsongin( {
		PathExtensions: false,
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

		it( 'should omit a field whose accumulated value is missing', () =>
		{
			let documents = [ {}, { n: 1 } ];
			let result = jsongin.Aggregate( documents, [ { $group: { _id: null, first: { $first: '$n' } } } ] );
			assert.ok( jsongin.StrictEquals( result, [ { _id: null } ] ) );
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
