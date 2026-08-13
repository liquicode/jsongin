'use strict';

const assert = require( 'assert' );

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	describe( 'Ad-Hoc Aggregate Tests', () =>
	{

		let players = [
			{ _id: 1, name: 'Alice', team: 'red', points: 3, alive: true, tags: [ 'melee', 'tank' ] },
			{ _id: 2, name: 'Bob', team: 'red', points: 5, alive: true, tags: [ 'ranged' ] },
			{ _id: 3, name: 'Eve', team: 'blue', points: 9, alive: false, tags: [ 'ranged', 'tank' ] },
			{ _id: 4, name: 'Mallory', team: 'blue', points: 1, alive: true, tags: [] },
		];


		//---------------------------------------------------------------------
		it( 'should score the living players by team', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $match: { alive: true } },
				{ $group: { _id: '$team', score: { $sum: '$points' }, top: { $max: '$points' } } },
				{ $sort: { score: -1 } },
			] );
			assert.ok( result.length === 2 );
			assert.ok( result[ 0 ]._id === 'red' );
			assert.ok( result[ 0 ].score === 8 );
			assert.ok( result[ 0 ].top === 5 );
			assert.ok( result[ 1 ]._id === 'blue' );
			assert.ok( result[ 1 ].score === 1 );
			assert.ok( result[ 1 ].top === 1 );
		} );


		//---------------------------------------------------------------------
		it( 'should reshape documents with a computed projection', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $match: { team: 'red' } },
				{ $project: { _id: 0, name: 1, doubled: { $multiply: [ '$points', 2 ] } } },
				{ $sort: { doubled: 1 } },
			] );
			assert.ok( result.length === 2 );
			assert.ok( Object.keys( result[ 0 ] ).length === 2 );
			assert.ok( result[ 0 ].name === 'Alice' );
			assert.ok( result[ 0 ].doubled === 6 );
			assert.ok( result[ 1 ].name === 'Bob' );
			assert.ok( result[ 1 ].doubled === 10 );
		} );


		//---------------------------------------------------------------------
		it( 'should build a leaderboard with $addFields, $sort, and $limit', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $addFields: { bonus: { $multiply: [ '$points', 2 ] } } },
				{ $sort: { bonus: -1 } },
				{ $limit: 2 },
			] );
			assert.ok( result.length === 2 );
			assert.ok( result[ 0 ].name === 'Eve' );
			assert.ok( result[ 0 ].bonus === 18 );
			assert.ok( result[ 0 ].points === 9 );
			assert.ok( result[ 1 ].name === 'Bob' );
			assert.ok( result[ 1 ].bonus === 10 );
		} );


		//---------------------------------------------------------------------
		it( 'should tally the tags with $unwind and $group', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $unwind: '$tags' },
				{ $group: { _id: '$tags', count: { $sum: 1 } } },
				{ $sort: { count: -1, _id: 1 } },
			] );
			assert.ok( result.length === 3 );
			assert.ok( result[ 0 ]._id === 'ranged' );
			assert.ok( result[ 0 ].count === 2 );
			assert.ok( result[ 1 ]._id === 'tank' );
			assert.ok( result[ 1 ].count === 2 );
			assert.ok( result[ 2 ]._id === 'melee' );
			assert.ok( result[ 2 ].count === 1 );
		} );


		//---------------------------------------------------------------------
		it( 'should number the elements of an unwound array', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $match: { name: 'Alice' } },
				{ $unwind: { path: '$tags', includeArrayIndex: 'position' } },
				{ $project: { _id: 0, tags: 1, position: 1 } },
			] );
			assert.ok( result.length === 2 );
			assert.ok( result[ 0 ].tags === 'melee' );
			assert.ok( result[ 0 ].position === 0 );
			assert.ok( result[ 1 ].tags === 'tank' );
			assert.ok( result[ 1 ].position === 1 );
		} );


		//---------------------------------------------------------------------
		it( 'should page through the documents with $skip and $limit', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $sort: { _id: 1 } },
				{ $skip: 1 },
				{ $limit: 2 },
			] );
			assert.ok( result.length === 2 );
			assert.ok( result[ 0 ].name === 'Bob' );
			assert.ok( result[ 1 ].name === 'Eve' );
		} );


		//---------------------------------------------------------------------
		it( 'should summarize every document in a single group', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{
					$group: {
						_id: null,
						count: { $sum: 1 },
						total: { $sum: '$points' },
						average: { $avg: '$points' },
						smallest: { $min: '$points' },
						largest: { $max: '$points' },
					}
				},
			] );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ]._id === null );
			assert.ok( result[ 0 ].count === 4 );
			assert.ok( result[ 0 ].total === 18 );
			assert.ok( result[ 0 ].average === 4.5 );
			assert.ok( result[ 0 ].smallest === 1 );
			assert.ok( result[ 0 ].largest === 9 );
		} );


		//---------------------------------------------------------------------
		it( 'should collect values with $push, $first, and $last', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $sort: { points: 1 } },
				{ $group: { _id: null, names: { $push: '$name' }, weakest: { $first: '$name' }, strongest: { $last: '$name' } } },
			] );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].names.length === 4 );
			assert.ok( result[ 0 ].names.join( ',' ) === 'Mallory,Alice,Bob,Eve' );
			assert.ok( result[ 0 ].weakest === 'Mallory' );
			assert.ok( result[ 0 ].strongest === 'Eve' );
		} );


		//---------------------------------------------------------------------
		it( 'should group the teams and list their members', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $sort: { name: 1 } },
				{ $group: { _id: '$team', members: { $push: '$name' } } },
				{ $sort: { _id: 1 } },
			] );
			assert.ok( result.length === 2 );
			assert.ok( result[ 0 ]._id === 'blue' );
			assert.ok( result[ 0 ].members.join( ',' ) === 'Eve,Mallory' );
			assert.ok( result[ 1 ]._id === 'red' );
			assert.ok( result[ 1 ].members.join( ',' ) === 'Alice,Bob' );
		} );


		//---------------------------------------------------------------------
		it( 'should return an empty result when nothing matches', async () =>
		{
			assert.ok( await Driver.SetData( players ) );
			let result = await Driver.Aggregate( [
				{ $match: { team: 'green' } },
				{ $group: { _id: '$team', count: { $sum: 1 } } },
			] );
			assert.ok( result.length === 0 );
		} );


	} );


	return;
};
