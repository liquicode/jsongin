'use strict';

const assert = require( 'assert' );

/*
	The expression operators, measured one at a time.

	These reach the operators through a $project stage, which is the shortest route to an
	expression. The aggregation pipeline is the only place they are reachable, apart from
	$expr within a query, which has its own suite.

	Note that the expression comparison operators are ***not*** bracketed by type, which is
	the opposite of the query operators of the same name: { $gt: [ 'abc', 1 ] } is true here
	by the BSON ordering, while { a: { $gt: 1 } } never matches a string. See the
	Operators Which Share a Name section of the operator reference.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Expression Operator Tests', () =>
	{

		let documents = [
			{ _id: 1, n: 4, s: 'text', b: true, l: null, o: { x: 7 }, t: [ 1, 2 ], when: new Date( 1700000000000 ) },
		];


		//---------------------------------------------------------------------
		// Returns what one expression produced for the stock document.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [ { $project: { _id: 0, r: Expression } } ] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		// Answers whether the field was produced at all. A field path which resolves to
		// nothing omits the field rather than setting it to null.
		async function produced_a_field( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [ { $project: { _id: 0, r: Expression } } ] );
			return ( 'r' in result[ 0 ] );
		}


		//---------------------------------------------------------------------
		describe( 'Field Paths and $literal', () =>
		{

			it( 'should read a field by its path', async () =>
			{
				assert.strictEqual( await evaluated( '$n' ), 4 );
				assert.strictEqual( await evaluated( '$s' ), 'text' );
			} );

			it( 'should read a nested field by its path', async () =>
			{
				assert.strictEqual( await evaluated( '$o.x' ), 7 );
			} );

			it( 'should read an array field whole', async () =>
			{
				assert.deepStrictEqual( await evaluated( '$t' ), [ 1, 2 ] );
			} );

			it( 'should omit the field for a path which resolves to nothing', async () =>
			{
				assert.strictEqual( await produced_a_field( '$nope' ), false );
			} );

			// ***Gathering through an array was asserted only by unit tests until 2026-08-20.***
			// It is MongoDB-defined, it is the behavior a whole breaking change was written
			// around, and a unit test could only ever have confirmed whatever jsongin did.
			// Swept in here, where the server has a say.

			it( 'should gather a field reference through an array', async () =>
			{
				await Driver.SetData( [ { _id: 1, a: [ { x: 1 }, { x: 2 } ] } ] );
				let result = await Driver.Aggregate( [ { $project: { _id: 0, r: '$a.x' } } ] );
				assert.deepStrictEqual( result[ 0 ].r, [ 1, 2 ] );
			} );

			it( 'should leave out an element which does not have the field', async () =>
			{
				// ***An element without the field contributes nothing***, rather than a
				// placeholder standing in for it, so the gathered array can be shorter than
				// the one it came from - or empty.
				await Driver.SetData( [
					{ _id: 1, a: [ { x: 5 }, { y: 9 } ] },
					{ _id: 2, a: [ { y: 9 } ] },
					{ _id: 3, a: [] },
				] );
				let result = await Driver.Aggregate( [
					{ $sort: { _id: 1 } },
					{ $project: { _id: 0, r: '$a.x' } },
				] );
				assert.deepStrictEqual( result[ 0 ].r, [ 5 ] );
				assert.deepStrictEqual( result[ 1 ].r, [] );
				assert.deepStrictEqual( result[ 2 ].r, [] );
			} );

			it( 'should tell an empty gather from a path which traversed nothing', async () =>
			{
				// ***An empty array and no field at all are different answers.*** The first
				// says an array was walked and held nothing matching; the second says the path
				// never reached an array to walk.
				await Driver.SetData( [ { _id: 1, b: 1 }, { _id: 2, a: 5 } ] );
				let result = await Driver.Aggregate( [
					{ $sort: { _id: 1 } },
					{ $project: { _id: 0, r: '$a.x' } },
				] );
				assert.strictEqual( 'r' in result[ 0 ], false );
				assert.strictEqual( 'r' in result[ 1 ], false );
			} );

			it( 'should keep a gathered value which is itself an array whole', async () =>
			{
				await Driver.SetData( [ { _id: 1, a: [ { x: [ 5, 6 ] } ] } ] );
				let result = await Driver.Aggregate( [ { $project: { _id: 0, r: '$a.x' } } ] );
				assert.deepStrictEqual( result[ 0 ].r, [ [ 5, 6 ] ] );
			} );

			it( 'should nest rather than flatten when gathering through two arrays', async () =>
			{
				// ***One level of nesting per array crossed.*** Flattening would lose which
				// element each value came from, and is the obvious wrong implementation.
				await Driver.SetData( [ { _id: 1, a: [ { b: [ { c: 1 } ] } ] } ] );
				let result = await Driver.Aggregate( [ { $project: { _id: 0, r: '$a.b.c' } } ] );
				assert.deepStrictEqual( result[ 0 ].r, [ [ 1 ] ] );
			} );

			it( 'should not index an array, with any numeric key', async () =>
			{
				// An aggregation field path never indexes an array. Every key applies to the
				// elements, so '$t.0' gathers the field '0' from each element of [ 1, 2 ] and
				// finds none, giving []. Positional access is $arrayElemAt, which is a
				// different operator with a different name for a reason.
				//
				// This is the opposite of a query path, where { 'a.0': 1 } does index. The two
				// languages resolve a path differently, and jsongin used to apply the query
				// rule to both, so '$t.0' returned 1 and '$t.-1' returned 2.
				assert.deepStrictEqual( await evaluated( '$t.0' ), [] );
				assert.deepStrictEqual( await evaluated( '$t.1' ), [] );
				assert.deepStrictEqual( await evaluated( '$t.9' ), [] );
				assert.deepStrictEqual( await evaluated( '$t.-1' ), [] );
			} );

			it( 'should read a numeric field name on a document', async () =>
			{
				// Against a document the key is a field name, so it resolves. This is what the
				// rule above must not break.
				assert.strictEqual( await evaluated( '$o.x' ), 7 );
			} );

			it( 'should return a field path as text with $literal', async () =>
			{
				assert.strictEqual( await evaluated( { $literal: '$n' } ), '$n' );
				assert.strictEqual( await evaluated( { $literal: 3 } ), 3 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Arithmetic Expression Operators', () =>
		{

			it( 'should add with $add', async () =>
			{
				assert.strictEqual( await evaluated( { $add: [ 1, 2 ] } ), 3 );
				assert.strictEqual( await evaluated( { $add: [ '$n', 10 ] } ), 14 );
				assert.strictEqual( await evaluated( { $add: [ 1, 2, 3 ] } ), 6 );
			} );

			it( 'should subtract with $subtract', async () =>
			{
				assert.strictEqual( await evaluated( { $subtract: [ 10, 4 ] } ), 6 );
				assert.strictEqual( await evaluated( { $subtract: [ '$n', 1 ] } ), 3 );
			} );

			it( 'should multiply with $multiply', async () =>
			{
				assert.strictEqual( await evaluated( { $multiply: [ 3, 4 ] } ), 12 );
				assert.strictEqual( await evaluated( { $multiply: [ 2, 3, 4 ] } ), 24 );
			} );

			it( 'should divide with $divide', async () =>
			{
				assert.strictEqual( await evaluated( { $divide: [ 10, 4 ] } ), 2.5 );
			} );

			it( 'should refuse to divide by zero, in $divide and $mod', async () =>
			{
				// ***Swept in from the unit tests on 2026-08-20.*** Refusing rather than
				// answering an infinity or a NaN is MongoDB's choice, not an obvious one, and
				// only a unit test had ever said so.
				let divided = false;
				try { await evaluated( { $divide: [ 12, 0 ] } ); }
				catch ( error ) { divided = true; }
				assert.strictEqual( divided, true );

				let remainder = false;
				try { await evaluated( { $mod: [ 13, 0 ] } ); }
				catch ( error ) { remainder = true; }
				assert.strictEqual( remainder, true );
			} );

			it( 'should take the remainder with $mod', async () =>
			{
				assert.strictEqual( await evaluated( { $mod: [ 10, 3 ] } ), 1 );
			} );

			it( 'should take the magnitude with $abs', async () =>
			{
				assert.strictEqual( await evaluated( { $abs: -5 } ), 5 );
				assert.strictEqual( await evaluated( { $abs: 5 } ), 5 );
			} );

			it( 'should give null for an operand which is not there', async () =>
			{
				// An arithmetic operator returns null rather than omitting the field, which is
				// how it differs from a bare field path.
				assert.strictEqual( await evaluated( { $add: [ '$nope', 1 ] } ), null );
				assert.strictEqual( await evaluated( { $multiply: [ '$nope', 2 ] } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Comparison Expression Operators', () =>
		{

			it( 'should rank a missing value below a null, not equal to it', async () =>
			{
				// ***Swept in from the unit tests on 2026-08-20, and it found a defect.*** A
				// unit test asserted that the expression $eq equates a null and a missing
				// value - which is the ***query*** rule - and no parity test had ever put the
				// question to a server. jsongin answered true and MongoDB answers false.
				//
				// ***MongoDB is inconsistent about this on purpose.*** In an expression a
				// missing value ranks below a null and equals only another missing one, while
				// $sort still orders a document missing the sort field as though it held a
				// null. Both rules are measured, here and in Stage and Accumulator Tests.
				assert.strictEqual( await evaluated( { $eq: [ '$nope', null ] } ), false );
				assert.strictEqual( await evaluated( { $eq: [ '$l', '$nope' ] } ), false );
				assert.strictEqual( await evaluated( { $ne: [ '$nope', null ] } ), true );

				// A missing value equals only another missing one.
				assert.strictEqual( await evaluated( { $eq: [ '$nope', '$nope2' ] } ), true );
				assert.strictEqual( await evaluated( { $eq: [ '$l', null ] } ), true );
			} );

			it( 'should order a missing value below everything with the ranking operators', async () =>
			{
				assert.strictEqual( await evaluated( { $cmp: [ '$nope', null ] } ), -1 );
				assert.strictEqual( await evaluated( { $cmp: [ '$l', '$nope' ] } ), 1 );
				assert.strictEqual( await evaluated( { $cmp: [ '$nope', '$nope2' ] } ), 0 );
				assert.strictEqual( await evaluated( { $cmp: [ '$nope', 5 ] } ), -1 );

				assert.strictEqual( await evaluated( { $lt: [ '$nope', null ] } ), true );
				assert.strictEqual( await evaluated( { $gt: [ '$l', '$nope' ] } ), true );
				assert.strictEqual( await evaluated( { $lt: [ '$nope', 5 ] } ), true );
			} );

			it( 'should select a zero rather than reading it as no value', async () =>
			{
				// Swept in from the unit tests. A zero is falsy in Javascript, which is
				// exactly the mistake this guards against.
				assert.strictEqual( await evaluated( { $min: [ 3, 0 ] } ), 0 );
				assert.strictEqual( await evaluated( { $max: [ -3, 0 ] } ), 0 );
			} );

			it( 'should compare for equality with $eq and $ne', async () =>
			{
				assert.strictEqual( await evaluated( { $eq: [ 1, 1 ] } ), true );
				assert.strictEqual( await evaluated( { $eq: [ 1, 2 ] } ), false );
				assert.strictEqual( await evaluated( { $eq: [ '$s', 'text' ] } ), true );
				assert.strictEqual( await evaluated( { $ne: [ 1, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $ne: [ 1, 1 ] } ), false );
			} );

			it( 'should order with $gt, $gte, $lt, and $lte', async () =>
			{
				assert.strictEqual( await evaluated( { $gt: [ 2, 1 ] } ), true );
				assert.strictEqual( await evaluated( { $gt: [ 1, 2 ] } ), false );
				assert.strictEqual( await evaluated( { $gte: [ 2, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lt: [ 1, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lte: [ 2, 2 ] } ), true );
				assert.strictEqual( await evaluated( { $lte: [ 3, 2 ] } ), false );
			} );

			it( 'should rank with $cmp', async () =>
			{
				assert.strictEqual( await evaluated( { $cmp: [ 2, 1 ] } ), 1 );
				assert.strictEqual( await evaluated( { $cmp: [ 1, 2 ] } ), -1 );
				assert.strictEqual( await evaluated( { $cmp: [ 1, 1 ] } ), 0 );
			} );

			it( 'should compare across types by the BSON ordering', async () =>
			{
				// The query operator of the same name brackets by type and would match
				// nothing here. The expression operator ranks the types instead.
				assert.strictEqual( await evaluated( { $gt: [ 'abc', 1 ] } ), true );
				assert.strictEqual( await evaluated( { $lt: [ 1, 'abc' ] } ), true );
				assert.strictEqual( await evaluated( { $gt: [ 1, null ] } ), true );
			} );

			it( 'should compare dates by their time value', async () =>
			{
				assert.strictEqual( await evaluated( { $gt: [ new Date( 2000 ), new Date( 1000 ) ] } ), true );
				assert.strictEqual( await evaluated( { $eq: [ new Date( 1000 ), new Date( 1000 ) ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Boolean Expression Operators', () =>
		{

			it( 'should combine with $and and $or', async () =>
			{
				assert.strictEqual( await evaluated( { $and: [ true, true ] } ), true );
				assert.strictEqual( await evaluated( { $and: [ true, false ] } ), false );
				assert.strictEqual( await evaluated( { $or: [ false, true ] } ), true );
				assert.strictEqual( await evaluated( { $or: [ false, false ] } ), false );
			} );

			it( 'should negate with $not', async () =>
			{
				assert.strictEqual( await evaluated( { $not: [ false ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ true ] } ), false );
			} );

			it( 'should treat a value as true unless it is false, zero, null, or missing', async () =>
			{
				// The boolean operators coerce, and only those four are false.
				assert.strictEqual( await evaluated( { $and: [ 1, 'abc' ] } ), true );
				assert.strictEqual( await evaluated( { $and: [ 0, true ] } ), false );
				assert.strictEqual( await evaluated( { $not: [ null ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ 0 ] } ), true );
				assert.strictEqual( await evaluated( { $not: [ '$nope' ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Conditional Expression Operators', () =>
		{

			it( 'should choose with the $cond array form', async () =>
			{
				assert.strictEqual( await evaluated( { $cond: [ true, 'yes', 'no' ] } ), 'yes' );
				assert.strictEqual( await evaluated( { $cond: [ false, 'yes', 'no' ] } ), 'no' );
			} );

			it( 'should choose with the $cond document form', async () =>
			{
				assert.strictEqual( await evaluated( { $cond: { if: false, then: 'yes', else: 'no' } } ), 'no' );
				assert.strictEqual( await evaluated( { $cond: { if: { $gt: [ '$n', 1 ] }, then: 'big', else: 'small' } } ), 'big' );
			} );

			it( 'should substitute a value with $ifNull', async () =>
			{
				assert.strictEqual( await evaluated( { $ifNull: [ '$nope', 'fallback' ] } ), 'fallback' );
				assert.strictEqual( await evaluated( { $ifNull: [ '$l', 'fallback' ] } ), 'fallback' );
				assert.strictEqual( await evaluated( { $ifNull: [ '$n', 'fallback' ] } ), 4 );
			} );

			it( 'should take the first matching branch with $switch', async () =>
			{
				assert.strictEqual( await evaluated( {
					$switch: { branches: [ { case: false, then: 1 }, { case: true, then: 2 } ], default: 3 },
				} ), 2 );
			} );

			it( 'should fall through to the $switch default', async () =>
			{
				assert.strictEqual( await evaluated( {
					$switch: { branches: [ { case: false, then: 1 } ], default: 3 },
				} ), 3 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Expression $min and $max', () =>
		{

			it( 'should take the smallest and largest of a list', async () =>
			{
				assert.strictEqual( await evaluated( { $min: [ 3, 1, 2 ] } ), 1 );
				assert.strictEqual( await evaluated( { $max: [ 3, 1, 2 ] } ), 3 );
			} );

			it( 'should take the smallest and largest within an array field', async () =>
			{
				assert.strictEqual( await evaluated( { $min: '$t' } ), 1 );
				assert.strictEqual( await evaluated( { $max: '$t' } ), 2 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Rounding Expression Operators', () =>
		{

			it( 'should round up with $ceil', async () =>
			{
				assert.strictEqual( await evaluated( { $ceil: 1.2 } ), 2 );
				assert.strictEqual( await evaluated( { $ceil: -2.5 } ), -2 );
				assert.strictEqual( await evaluated( { $ceil: 7 } ), 7 );
			} );

			it( 'should round down with $floor', async () =>
			{
				assert.strictEqual( await evaluated( { $floor: 1.8 } ), 1 );
				assert.strictEqual( await evaluated( { $floor: -2.5 } ), -3 );
				assert.strictEqual( await evaluated( { $floor: 7 } ), 7 );
			} );

			it( 'should give null for a null or missing operand', async () =>
			{
				// Null propagates rather than being treated as a zero, and a missing field is
				// the same as a null here. This is a null, not an omitted field.
				assert.strictEqual( await evaluated( { $ceil: null } ), null );
				assert.strictEqual( await evaluated( { $ceil: '$nope' } ), null );
				assert.strictEqual( await evaluated( { $floor: null } ), null );
				assert.strictEqual( await evaluated( { $floor: '$nope' } ), null );
				assert.strictEqual( await evaluated( { $round: [ null, 1 ] } ), null );
				assert.strictEqual( await evaluated( { $trunc: [ null, 1 ] } ), null );
			} );

			it( 'should round half to even with $round', async () =>
			{
				// ***This is not the usual rounding.*** A value exactly half way is rounded to
				// the ***even*** neighbour, so 2.5 goes down to 2 while 3.5 goes up to 4. The
				// familiar Math.round() rounds half up and would give 3 and 4.
				assert.strictEqual( await evaluated( { $round: [ 2.5 ] } ), 2 );
				assert.strictEqual( await evaluated( { $round: [ 3.5 ] } ), 4 );
				assert.strictEqual( await evaluated( { $round: [ -2.5 ] } ), -2 );
				assert.strictEqual( await evaluated( { $round: [ 1.25, 1 ] } ), 1.2 );
			} );

			it( 'should round to a place with $round', async () =>
			{
				assert.strictEqual( await evaluated( { $round: [ 1.567, 2 ] } ), 1.57 );
				assert.strictEqual( await evaluated( { $round: [ 1.35, 1 ] } ), 1.4 );

				// A negative place rounds to the left of the decimal point.
				assert.strictEqual( await evaluated( { $round: [ 1234, -2 ] } ), 1200 );

				// The place defaults to zero, and the argument list may be given bare.
				assert.strictEqual( await evaluated( { $round: 2.5 } ), 2 );
			} );

			it( 'should truncate toward zero with $trunc', async () =>
			{
				// $trunc discards, it does not round: -1.567 to one place is -1.5, not -1.6.
				assert.strictEqual( await evaluated( { $trunc: [ 1.567, 1 ] } ), 1.5 );
				assert.strictEqual( await evaluated( { $trunc: [ -1.567, 1 ] } ), -1.5 );
				assert.strictEqual( await evaluated( { $trunc: [ 1.567, 0 ] } ), 1 );
				assert.strictEqual( await evaluated( { $trunc: [ -2.5 ] } ), -2 );
				assert.strictEqual( await evaluated( { $trunc: [ 1234, -2 ] } ), 1200 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Array Expression Operators', () =>
		{

			it( 'should count the elements of an array with $size', async () =>
			{
				assert.strictEqual( await evaluated( { $size: '$t' } ), 2 );
				assert.strictEqual( await evaluated( { $size: [ [ 1, 2, 3 ] ] } ), 3 );
			} );

			it( 'should count an empty array as zero with $size', async () =>
			{
				assert.strictEqual( await evaluated( { $size: [ [] ] } ), 0 );
			} );

			it( 'should read one element with $arrayElemAt', async () =>
			{
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', 0 ] } ), 1 );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', 1 ] } ), 2 );
			} );

			it( 'should index from the end for a negative $arrayElemAt position', async () =>
			{
				// ***This is the one place a negative index counts back from the end.*** It is
				// an operand here rather than a path element, which is why it survived the
				// removal of reverse indexing from the path syntax.
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', -1 ] } ), 2 );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', -2 ] } ), 1 );
			} );

			it( 'should omit the field for an $arrayElemAt position out of range', async () =>
			{
				// Out of range is ***missing***, not null, so the projected field is not
				// produced at all. Both ends behave the same way.
				assert.strictEqual( await produced_a_field( { $arrayElemAt: [ '$t', 9 ] } ), false );
				assert.strictEqual( await produced_a_field( { $arrayElemAt: [ '$t', -9 ] } ), false );
			} );

			it( 'should give null for an $arrayElemAt over a null or missing array', async () =>
			{
				assert.strictEqual( await evaluated( { $arrayElemAt: [ null, 0 ] } ), null );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$nope', 0 ] } ), null );
			} );

			it( 'should join arrays with $concatArrays', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $concatArrays: [ [ 1 ], [ 2, 3 ] ] } ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await evaluated( { $concatArrays: [ '$t', [ 9 ] ] } ), [ 1, 2, 9 ] );
				assert.deepStrictEqual( await evaluated( { $concatArrays: [] } ), [] );
			} );

			it( 'should give null when any $concatArrays operand is null or missing', async () =>
			{
				// One null operand takes the whole result, rather than being skipped.
				assert.strictEqual( await evaluated( { $concatArrays: [ [ 1 ], null ] } ), null );
				assert.strictEqual( await evaluated( { $concatArrays: [ [ 1 ], '$nope' ] } ), null );
			} );

			it( 'should test for membership with the $in expression', async () =>
			{
				// The expression $in takes [ value, array ], which is not the query operator
				// of the same name. See the Operators Which Share a Name reference.
				assert.strictEqual( await evaluated( { $in: [ 2, '$t' ] } ), true );
				assert.strictEqual( await evaluated( { $in: [ 9, '$t' ] } ), false );
			} );

			it( 'should compare by content in the $in expression', async () =>
			{
				// The value is compared to each element by content, so an array or a document
				// is found rather than being compared by reference.
				assert.strictEqual( await evaluated( { $in: [ [ 1 ], [ [ 1 ], 2 ] ] } ), true );
				assert.strictEqual( await evaluated( { $in: [ { x: 1 }, [ { x: 1 } ] ] } ), true );
				assert.strictEqual( await evaluated( { $in: [ { x: 1 }, [ { x: 2 } ] ] } ), false );
			} );

			it( 'should not match a null against an array which has none', async () =>
			{
				// A null value is an ordinary value here, not a wildcard and not an error.
				assert.strictEqual( await evaluated( { $in: [ null, '$t' ] } ), false );
				assert.strictEqual( await evaluated( { $in: [ null, [ 1, null ] ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Null Operands', () =>
		{

			/*
				A null operand ***propagates*** through the arithmetic operators rather than
				being treated as a zero or as an error. A missing field resolves to nothing and
				takes the same route, which is why '$nope' behaves as null does here.
			*/

			it( 'should return null for a null operand to the arithmetic operators', async () =>
			{
				assert.strictEqual( await evaluated( { $mod: [ '$n', null ] } ), null );
				assert.strictEqual( await evaluated( { $mod: [ null, 2 ] } ), null );
				assert.strictEqual( await evaluated( { $mod: [ '$n', '$nope' ] } ), null );
				assert.strictEqual( await evaluated( { $multiply: [ '$n', null ] } ), null );
				assert.strictEqual( await evaluated( { $add: [ '$n', null ] } ), null );
			} );

			it( 'should return null for a null place given to the rounding operators', async () =>
			{
				assert.strictEqual( await evaluated( { $round: [ '$n', null ] } ), null );
				assert.strictEqual( await evaluated( { $trunc: [ '$n', null ] } ), null );

				// The value itself takes the same route.
				assert.strictEqual( await evaluated( { $round: [ null, 1 ] } ), null );
				assert.strictEqual( await evaluated( { $ceil: [ null ] } ), null );
				assert.strictEqual( await evaluated( { $floor: [ null ] } ), null );
			} );

			it( 'should return null for a null position given to $arrayElemAt', async () =>
			{
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', null ] } ), null );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ null, 0 ] } ), null );
				assert.strictEqual( await evaluated( { $arrayElemAt: [ '$t', '$nope' ] } ), null );
			} );

			it( 'should return null when a null is subtracted from a date', async () =>
			{
				assert.strictEqual( await evaluated( { $subtract: [ '$when', null ] } ), null );
				assert.strictEqual( await evaluated( { $subtract: [ null, 5 ] } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Values Which Are Not Finite', () =>
		{

			/*
				Infinity and NaN are ordinary BSON doubles, so they reach the operators as
				numbers rather than being refused as the wrong type. What each operator does
				with one is its own rule.
			*/

			it( 'should carry an infinity through the rounding operators', async () =>
			{
				assert.strictEqual( await evaluated( { $round: [ Infinity, 2 ] } ), Infinity );
				assert.strictEqual( await evaluated( { $round: [ -Infinity, 2 ] } ), -Infinity );
				assert.strictEqual( await evaluated( { $trunc: [ Infinity, 2 ] } ), Infinity );
				assert.strictEqual( await evaluated( { $ceil: [ Infinity ] } ), Infinity );
			} );

			it( 'should round a value already in exponential notation', async () =>
			{
				assert.strictEqual( await evaluated( { $round: [ 1e21, 2 ] } ), 1e21 );
				assert.strictEqual( await evaluated( { $round: [ 1.5e-7, 8 ] } ), 1.5e-7 );
			} );

			it( 'should carry a NaN through arithmetic', async () =>
			{
				assert.ok( Number.isNaN( await evaluated( { $add: [ NaN, 1 ] } ) ) );
				assert.ok( Number.isNaN( await evaluated( { $multiply: [ NaN, 2 ] } ) ) );
				assert.ok( Number.isNaN( await evaluated( { $round: [ NaN, 2 ] } ) ) );
			} );

		} );

	} );

};
