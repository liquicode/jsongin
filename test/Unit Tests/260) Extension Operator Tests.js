'use strict';

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );

/*
	The jsongin extension query operators.

	These have no MongoDB counterpart, so there is no baseline to measure them against and they
	do not belong in the parity tests. They live here, where the question is whether jsongin
	behaves as jsongin intends.

	Moved from test/Parity Tests/Query Tests/test-suite/Exprx Tests.js, which had to be guarded
	out of every parity run and reported as excluded from every parity measurement.

	The other extensions are covered beside the operators they resemble:
	$eqx and $nex in 200) Comparison Operator Tests, $noop in 210) Logical Operator Tests.
*/


describe( '260) Extension Operator Tests', () =>
{

	//---------------------------------------------------------------------
	// The parity suites reach the engine through a Driver, so that one suite can be pointed at
	// several engines. Nothing else implements these operators, so this asks jsongin directly.
	function find( Documents, Criteria )
	{
		return jsongin.Filter( Documents, Criteria );
	}


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


		it( 'should evaluate against the entire document at the top level', () =>
		{
			let result = find( entities, { $exprx: { $eq: [ '$name', 'Alice' ] } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should evaluate against a sub-document when used within a field', () =>
		{
			// The field references address stats, not the entire document.
			let result = find( entities, { stats: { $exprx: { $gt: [ '$dmg', '$armor' ] } } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should match when any element of an array sub-document matches', () =>
		{
			// Alice has one item which is over its weight limit.
			let result = find( entities, { items: { $exprx: { $gt: [ '$weight', '$limit' ] } } } );
			assert.ok( result.length === 1 );
			assert.ok( result[ 0 ].name === 'Alice' );
		} );


		it( 'should not match when no element of an array sub-document matches', () =>
		{
			let result = find( entities, { items: { $exprx: { $gt: [ '$weight', 100 ] } } } );
			assert.ok( result.length === 0 );
		} );


		it( 'should not match when the field is missing or is not a document', () =>
		{
			assert.ok( find( entities, { missing: { $exprx: { $eq: [ 1, 1 ] } } } ).length === 0 );
			assert.ok( find( entities, { name: { $exprx: { $eq: [ 1, 1 ] } } } ).length === 0 );
		} );


		it( 'should skip an array element which is not a document', () =>
		{
			// An expression reads fields, so an element which has none cannot satisfy one. The
			// element is passed over rather than failing the whole array, so a mixed array
			// still matches on the documents in it.
			let documents = [ { a: [ 5, { n: 2 } ] } ];
			assert.ok( find( documents, { a: { $exprx: { $gt: [ '$n', 1 ] } } } ).length === 1 );

			// With nothing but non-documents there is nothing left to match.
			assert.ok( find( [ { a: [ 5, 'x', null ] } ], { a: { $exprx: { $gt: [ '$n', 1 ] } } } ).length === 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( '$expr and $exprx Placement Tests', () =>
	{

		let entities = [
			{ _id: 1, name: 'Alice', dmg: 8, stats: { dmg: 8, armor: 5 } },
			{ _id: 2, name: 'Bob', dmg: 4, stats: { dmg: 4, armor: 6 } },
		];


		it( 'should not allow $expr to appear within a field', () =>
		{
			// $expr is a top level operator. Use $exprx to address a sub-document.
			let result = find( entities, { stats: { $expr: { $gt: [ '$dmg', '$armor' ] } } } );
			assert.ok( result.length === 0 );
		} );


		it( 'should give $expr and $exprx the same meaning at the top level', () =>
		{
			let expr_result = find( entities, { $expr: { $gt: [ '$dmg', 5 ] } } );
			let exprx_result = find( entities, { $exprx: { $gt: [ '$dmg', 5 ] } } );
			assert.ok( expr_result.length === 1 );
			assert.ok( exprx_result.length === 1 );
			assert.ok( expr_result[ 0 ].name === exprx_result[ 0 ].name );
		} );


		it( 'should resolve the same field name differently at each level', () =>
		{
			let documents = [ { _id: 1, name: 'Alice', dmg: 1, stats: { dmg: 99 } } ];
			// At the top level, $dmg is the document field.
			assert.ok( find( documents, { $exprx: { $gt: [ '$dmg', 50 ] } } ).length === 0 );
			// Within stats, $dmg is the sub-document field.
			assert.ok( find( documents, { stats: { $exprx: { $gt: [ '$dmg', 50 ] } } } ).length === 1 );
		} );

	} );

} );
