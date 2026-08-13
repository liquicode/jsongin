'use strict';

const assert = require( 'assert' );

/*
	These tests cover the jsongin `$exprx` extension operator and the placement rules which
	distinguish it from `$expr`. A real MongoDB server does not implement `$exprx`, so this
	test suite is only used by the jsongin driver.
*/

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	describe( '$exprx Query Tests', () =>
	{

		let entities = [
			{
				_id: 1, name: 'Alice',
				stats: { dmg: 8, armor: 5 },
				items: [ { weight: 3, limit: 5 }, { weight: 9, limit: 5 } ],
			},
			{
				_id: 2, name: 'Bob',
				stats: { dmg: 4, armor: 6 },
				items: [ { weight: 1, limit: 5 }, { weight: 2, limit: 5 } ],
			},
		];


		it( 'should evaluate against the entire document at the top level', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( { $exprx: { $eq: [ '$name', 'Alice' ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should evaluate against a sub-document when used within a field', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// The field references address stats, not the entire document.
			let result = await Driver.Find( { stats: { $exprx: { $gt: [ '$dmg', '$armor' ] } } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should match when any element of an array sub-document matches', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// Alice has one item which is over its weight limit.
			let result = await Driver.Find( { items: { $exprx: { $gt: [ '$weight', '$limit' ] } } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should not match when no element of an array sub-document matches', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let result = await Driver.Find( { items: { $exprx: { $gt: [ '$weight', 100 ] } } } );
			assert.ok( result.length === 0 );
		} );


		it( 'should not match when the field is missing or is not a document', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			assert.ok( ( await Driver.Find( { missing: { $exprx: { $eq: [ 1, 1 ] } } } ) ).length === 0 );
			assert.ok( ( await Driver.Find( { name: { $exprx: { $eq: [ 1, 1 ] } } } ) ).length === 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$expr and $exprx Placement Tests', () =>
	{

		let entities = [
			{ _id: 1, name: 'Alice', dmg: 8, stats: { dmg: 8, armor: 5 } },
			{ _id: 2, name: 'Bob', dmg: 4, stats: { dmg: 4, armor: 6 } },
		];


		it( 'should not allow $expr to appear within a field', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			// $expr is a top level operator. Use $exprx to address a sub-document.
			let result = await Driver.Find( { stats: { $expr: { $gt: [ '$dmg', '$armor' ] } } } );
			assert.ok( result.length === 0 );
		} );


		it( 'should give $expr and $exprx the same meaning at the top level', async () =>
		{
			assert.ok( await Driver.SetData( entities ) );
			let expr_result = await Driver.Find( { $expr: { $gt: [ '$dmg', 5 ] } } );
			let exprx_result = await Driver.Find( { $exprx: { $gt: [ '$dmg', 5 ] } } );
			assert.ok( expr_result.length === 1 );
			assert.ok( exprx_result.length === 1 );
			assert.ok( expr_result[ 0 ].name === exprx_result[ 0 ].name );
		} );


		it( 'should resolve the same field name differently at each level', async () =>
		{
			assert.ok( await Driver.SetData( [
				{ _id: 1, name: 'Alice', dmg: 1, stats: { dmg: 99 } },
			] ) );
			// At the top level, $dmg is the document field.
			assert.ok( ( await Driver.Find( { $exprx: { $gt: [ '$dmg', 50 ] } } ) ).length === 0 );
			// Within stats, $dmg is the sub-document field.
			assert.ok( ( await Driver.Find( { stats: { $exprx: { $gt: [ '$dmg', 50 ] } } } ) ).length === 1 );
		} );

	} );


};
