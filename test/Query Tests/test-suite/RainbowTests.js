'use strict';

const assert = require( 'assert' );

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	let RainbowData =
	{

		// Test Values
		b0: false,
		b1: true,
		s0: '',

		// Primitive Values: bnslu
		b: true,
		n: 3.14,
		s: 'abc',
		l: null,

		// Object: o
		o: {
			b: true,
			n: 3.14,
			s: 'abc',
			l: null,
			o: {},
			a: [],
			r: /expression/,
			u: undefined,
		},

		// Array: a
		a: [
			true,
			3.14,
			'abc',
			null,
			{},
			[],
			/expression/,
			undefined,
		],

		// Function: f
		f: function () { },

		// RegExp: r
		r: /expression/,

		// Undefined: u
		u: undefined,

		// Empty (default) values for each type.
		default: {
			b: false,
			n: 0,
			s: '',
			l: null,
			a: [],
			o: {},
			r: /expression/,
			u: undefined,
		},

	};


	//---------------------------------------------------------------------
	describe( `Rainbow Tests`, () =>
	{

		//---------------------------------------------------------------------
		before(
			async function ()
			{
				let result = await Driver.SetData( [ RainbowData ] );
				assert.ok( result );
				return;
			} );


		//=====================================================================
		//=====================================================================
		//
		//		Nested Fields
		//
		//=====================================================================
		//=====================================================================

		describe( `Nested Fields (explicit)`, () =>
		{

			it( `should not perform matching on nested fields using implicit $eq`, async () => 
			{
				assert.ok( ( await Driver.Find( { o: { n: 3.14 } } ) ).length === 0 );
			} );

			it( `should not perform matching on nested fields using explicit $eq`, async () => 
			{
				assert.ok( ( await Driver.Find( { o: { n: { $eq: 3.14 } } } ) ).length === 0 );
			} );

		} );


		describe( `Nested Fields (dot notation)`, () =>
		{

			it( `should perform matching on nested fields using implicit $eq and dot notation`, async () => 
			{
				assert.ok( ( await Driver.Find( { 'o.n': 3.14 } ) ).length === 1 );
			} );

			it( `should perform matching on nested fields using explicit $eq and dot notation`, async () => 
			{
				assert.ok( ( await Driver.Find( { 'o.n': { $eq: 3.14 } } ) ).length === 1 );
			} );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $eq (===)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $eq (===)`, () =>
		{

			//---------------------------------------------------------------------
			it( `should perform strict equality (===) on 'bns'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( { b: { $eq: true } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $eq: 3.14 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $eq: 'abc' } } ) ).length === 1 );
				// Implicit
				assert.ok( ( await Driver.Find( { b: true } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: 3.14 } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: 'abc' } ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should perform strict equality (===) on 'o'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( {
					o: {
						$eq: {
							b: true,
							n: 3.14,
							s: 'abc',
							l: null,
							o: {},
							a: [],
							r: /expression/,
							u: undefined,
						}
					}
				} ) ).length === 1 );
				// Implicit
				assert.ok( ( await Driver.Find( {
					o: {
						b: true,
						n: 3.14,
						s: 'abc',
						l: null,
						o: {},
						a: [],
						r: /expression/,
						u: undefined,
					}
				} ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should perform strict equality (===) on 'a'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( {
					a: {
						$eq: [
							true,
							3.14,
							'abc',
							null,
							{},
							[],
							/expression/,
							undefined,
						]
					}
				} ) ).length === 1 );
				// Implicit
				assert.ok( ( await Driver.Find( {
					a: [
						true,
						3.14,
						'abc',
						null,
						{},
						[],
						/expression/,
						undefined,
					]
				} ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose equality (==) on 'bns'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( { b: { $eq: '1' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $eq: '3.14' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s0: { $eq: 0 } } ) ).length === 0 );
				// Implicit
				assert.ok( ( await Driver.Find( { b: '1' } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: '3.14' } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s0: 0 } ) ).length === 0 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose equality (==) on 'o'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( {
					o: {
						$eq: {
							n: 3.14,
							s: 'abc',
							l: null,
							o: {},
							a: [],
							r: /expression/,
							u: undefined,
							b: true,
						}
					}
				} ) ).length === 0 );
				// Implicit
				assert.ok( ( await Driver.Find( {
					o: {
						n: 3.14,
						s: 'abc',
						l: null,
						o: {},
						a: [],
						r: /expression/,
						u: undefined,
						b: true,
					}
				} ) ).length === 0 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose equality (==) on 'a'`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( {
					a: {
						$eq: [
							3.14,
							'abc',
							null,
							{},
							[],
							/expression/,
							undefined,
							true,
						]
					}
				} ) ).length === 0 );
				// Implicit
				assert.ok( ( await Driver.Find( {
					a: [
						3.14,
						'abc',
						null,
						{},
						[],
						/expression/,
						undefined,
						true,
					]
				} ) ).length === 0 );
			} );

			//---------------------------------------------------------------------
			it( `should equate null with undefined`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( { l: { $eq: undefined } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { u: { $eq: null } } ) ).length === 1 );
			} );

			// //---------------------------------------------------------------------
			// it( `should equate empty object {} with anything`, async () => 
			// {
			// 	// Explicit
			// 	assert.ok( ( await Driver.Find( { o: { $eq: {} } } ) ).length === 1 );
			// 	// Implicit
			// 	assert.ok( ( await Driver.Find( { o: {} } ) ).length === 1 );
			// } );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $ne (!==)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $ne (!==)`, () =>
		{

			//---------------------------------------------------------------------
			it( `should perform strict inequality (!==) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $ne: true } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $ne: 3.14 } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s: { $ne: 'abc' } } ) ).length === 0 );

				assert.ok( ( await Driver.Find( { b: { $ne: false } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $ne: 42 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $ne: '123' } } ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should perform strict inequality (!==) on 'o'`, async () => 
			{
				assert.ok( ( await Driver.Find( {
					o: {
						$ne: {
							n: 3.14,
							s: 'abc',
							l: null,
							o: {},
							a: [],
							r: /expression/,
							u: undefined,
							b: true,
						}
					}
				} ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should perform strict inequality (!==) on 'a'`, async () => 
			{
				assert.ok( ( await Driver.Find( {
					o: {
						$ne: [
							3.14,
							'abc',
							null,
							{},
							[],
							/expression/,
							undefined,
							true,
						]
					}
				} ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose inequality (!=) on 'bns'`, async () => 
			{// Does this test make any sense? Is it trying to prove a negative?
				// These tests always fail because the values are of different types.
				assert.ok( ( await Driver.Find( { b: { $ne: '0' } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $ne: '3.14' } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s0: { $ne: 0 } } ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose inequality (!=) on 'o'`, async () => 
			{
				assert.ok( ( await Driver.Find( {
					o: {
						$ne: {
							n: 3.14,
							s: 'abc',
							l: null,
							o: {},
							a: [],
							r: /expression/,
							u: undefined,
							b: true,
						}
					}
				} ) ).length === 1 );
			} );

			//---------------------------------------------------------------------
			it( `should not perform loose inequality (!=) on 'a'`, async () => 
			{
				assert.ok( ( await Driver.Find( {
					o: {
						$ne: [
							3.14,
							'abc',
							null,
							{},
							[],
							/expression/,
							undefined,
							true,
						]
					}
				} ) ).length === 1 );
			} );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $gte (>=)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $gte (>=)`, () =>
		{

			it( `should perform strict comparison (>=) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $gte: true } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $gte: 3.14 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $gte: 'abc' } } ) ).length === 1 );

				assert.ok( ( await Driver.Find( { b: { $gte: false } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $gte: 3 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $gte: '123' } } ) ).length === 1 );
			} );

			it( `should not perform loose comparison (>=) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $gte: '0' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $gte: '3' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s: { $gte: 0 } } ) ).length === 0 );
			} );

			//---------------------------------------------------------------------
			it( `should equate null with undefined`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( { l: { $gte: undefined } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { u: { $gte: null } } ) ).length === 1 );
			} );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $gt (>)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $gt (>)`, () =>
		{

			it( `should perform strict comparison (>=) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $gt: false } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $gt: 3 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $gt: '123' } } ) ).length === 1 );
			} );

			it( `should not perform loose comparison (>=) on 'bns'`, async () => 
			{
				// These values are always not $gte because of different types.
				assert.ok( ( await Driver.Find( { b: { $gt: '0' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $gt: '3' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s: { $gt: 0 } } ) ).length === 0 );
			} );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $lte (<=)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $lte (<=)`, () =>
		{

			it( `should perform strict comparison (<=) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $lte: true } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $lte: 4 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $lte: 'def' } } ) ).length === 1 );
			} );

			it( `should not perform loose comparison (<=) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b: { $lte: '1' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $lte: '4' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s0: { $lte: 0 } } ) ).length === 0 );
			} );

			//---------------------------------------------------------------------
			it( `should equate null with undefined`, async () => 
			{
				// Explicit
				assert.ok( ( await Driver.Find( { l: { $lte: undefined } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { u: { $lte: null } } ) ).length === 1 );
			} );

		} );


		//=====================================================================
		//=====================================================================
		//
		//		Operator $lt (<)
		//
		//=====================================================================
		//=====================================================================

		describe( `Operator $lt (<)`, () =>
		{

			it( `should perform strict comparison (<) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b0: { $lt: true } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { n: { $lt: 4 } } ) ).length === 1 );
				assert.ok( ( await Driver.Find( { s: { $lt: 'def' } } ) ).length === 1 );
			} );

			it( `should not perform loose comparison (<) on 'bns'`, async () => 
			{
				assert.ok( ( await Driver.Find( { b0: { $lt: '1' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { n: { $lt: '4' } } ) ).length === 0 );
				assert.ok( ( await Driver.Find( { s0: { $lt: 1 } } ) ).length === 0 );
			} );

		} );


	} );


};
