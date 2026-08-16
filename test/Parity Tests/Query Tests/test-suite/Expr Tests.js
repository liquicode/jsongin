'use strict';

const assert = require( 'assert' );

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	describe( '$expr Query Tests', () =>
	{

		let entities = [
			{ _id: 1, name: 'Alice', dmg: 8, armor: 5, hp: 3, max: 10 },
			{ _id: 2, name: 'Bob', dmg: 4, armor: 6, hp: 9, max: 10 },
			{ _id: 3, name: 'Eve', dmg: 7, armor: 7, hp: 1, max: 10 },
		];


		it( 'should compare one field to another field', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( { $expr: { $gt: [ '$dmg', '$armor' ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should match documents where two fields are equal', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( { $expr: { $eq: [ '$dmg', '$armor' ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Eve' );
		} );


		it( 'should match computed conditions', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// Match entities which are at or below 25% health.
			let result = await Driver.Find( { $expr: { $lte: [ { $divide: [ '$hp', '$max' ] }, 0.25 ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Eve' );
		} );


		it( 'should combine field comparisons with arithmetic', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// Match entities which would take more than 2 points of damage.
			let result = await Driver.Find( { $expr: { $gt: [ { $subtract: [ '$dmg', '$armor' ] }, 2 ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should appear within a top level $and', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( {
				$and: [
					{ $expr: { $gt: [ '$dmg', 5 ] } },
					{ $expr: { $lt: [ '$hp', 3 ] } },
				]
			} );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Eve' );
		} );


		it( 'should appear within a top level $or', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( {
				$or: [
					{ $expr: { $gt: [ '$dmg', '$armor' ] } },
					{ $expr: { $gt: [ '$hp', 8 ] } },
				]
			} );
			assert.ok( result.length === 2 );
		} );


		it( 'should combine with the other query operators', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( {
				name: 'Alice',
				$expr: { $gt: [ '$dmg', '$armor' ] },
			} );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should match nothing when the expression is false for every document', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( { $expr: { $gt: [ '$armor', 100 ] } } );
			assert.ok( result.length === 0 );
		} );


		it( 'should use $cond to select a comparison value', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// Wounded entities (hp < 5) are compared against a lower threshold.
			let result = await Driver.Find( {
				$expr: {
					$lt: [ '$dmg', { $cond: [ { $lt: [ '$hp', 5 ] }, 8, 100 ] } ]
				}
			} );
			assert.ok( result.length === 2 );
		} );

	} );


};
