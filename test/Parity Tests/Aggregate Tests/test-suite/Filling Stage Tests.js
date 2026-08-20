'use strict';

const assert = require( 'assert' );

/*
	The pipeline stages which invent values or documents, and the two which cannot be built.

	$fill supplies a value for a field which is missing; $densify adds whole documents to close
	a gap in a sequence. Both were introduced after 6.0's predecessors but before 6.0 itself, so
	the baseline has them.

	***$documents and $redact are recorded here as boundaries rather than measured.*** Both are
	reachable in MongoDB and neither is reachable from where jsongin stands - the first because
	of how the parity driver talks to the server, the second because it needs expression system
	variables the engine does not have. The tests say which, so that neither is mistaken for an
	oversight.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Filling Stage Tests', () =>
	{

		let documents = [
			{ _id: 1, t: 1, k: 'a', v: 10 },
			{ _id: 2, t: 2, k: 'a' },
			{ _id: 3, t: 3, k: 'a', v: 30 },
			{ _id: 4, t: 5, k: 'b', v: 50 },
		];


		//---------------------------------------------------------------------
		async function piped( Pipeline )
		{
			await Driver.SetData( documents );
			return await Driver.Aggregate( Pipeline );
		}


		//---------------------------------------------------------------------
		async function refused( Pipeline )
		{
			try
			{
				await piped( Pipeline );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Supplying a Missing Value ($fill)', () =>
		{

			it( 'should fill a missing field with a constant', async () =>
			{
				let result = await piped( [
					{ $sort: { t: 1 } },
					{ $fill: { output: { v: { value: 0 } } } },
					{ $project: { _id: 0, t: 1, v: 1 } },
				] );
				assert.deepStrictEqual( result, [
					{ t: 1, v: 10 }, { t: 2, v: 0 }, { t: 3, v: 30 }, { t: 5, v: 50 },
				] );
			} );

			it( 'should carry the last observed value forward with locf', async () =>
			{
				let result = await piped( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
					{ $project: { _id: 0, t: 1, v: 1 } },
				] );
				assert.deepStrictEqual( result, [
					{ t: 1, v: 10 }, { t: 2, v: 10 }, { t: 3, v: 30 }, { t: 5, v: 50 },
				] );
			} );

			it( 'should interpolate between the values on either side with linear', async () =>
			{
				let result = await piped( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					{ $project: { _id: 0, t: 1, v: 1 } },
				] );
				assert.deepStrictEqual( result, [
					{ t: 1, v: 10 }, { t: 2, v: 20 }, { t: 3, v: 30 }, { t: 5, v: 50 },
				] );
			} );

			it( 'should fill within a partition only', async () =>
			{
				// ***A partition is a separate series.*** Nothing carries across from one
				// value of the partition field to the next.
				let result = await piped( [
					{ $fill: { partitionByFields: [ 'k' ], sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
					{ $project: { _id: 0, k: 1, t: 1, v: 1 } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 1 ].v, 10 );
			} );

			it( 'should partition by an expression as well as by field names', async () =>
			{
				// ***partitionBy takes a document, not a path.*** A bare '$k' is refused for
				// being a string; the two forms below are the same partition written two ways.
				let by_expression = await piped( [
					{ $fill: { partitionBy: { k: '$k' }, sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
					{ $project: { _id: 0, k: 1, t: 1, v: 1 } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( by_expression[ 1 ].v, 10 );

				assert.strictEqual(
					await refused( [ { $fill: { partitionBy: '$k', sortBy: { t: 1 }, output: { v: { method: 'locf' } } } } ] ),
					true );
			} );

			it( 'should fill a value which is null as well as one which is missing', async () =>
			{
				// ***A null counts as nothing here***, which is unusual: almost everywhere
				// else in this engine a null is a value and only a missing field is absent.
				// $fill treats the two the same and replaces both.
				await Driver.SetData( [ { _id: 1, t: 1, v: 1 }, { _id: 2, t: 2, v: null } ] );
				let result = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
				] );
				assert.strictEqual( result[ 1 ].v, 1 );
			} );

			it( 'should refuse a method which is not one it knows', async () =>
			{
				assert.strictEqual(
					await refused( [ { $fill: { sortBy: { t: 1 }, output: { v: { method: 'guess' } } } } ] ), true );
			} );

			it( 'should take a method without a sortBy, and use the order it was given', async () =>
			{
				// ***Not a refusal***, which is worth pinning: a method needs an order to work
				// along, and without a sortBy the order is whatever reached the stage. Here
				// that is _id order, which happens to be t order too.
				let result = await piped( [
					{ $fill: { output: { v: { method: 'locf' } } } },
					{ $project: { _id: 0, t: 1, v: 1 } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 1 ].v, 10 );
			} );

			it( 'should refuse both a value and a method for the same field', async () =>
			{
				// Exactly one of the two, not both: they are two answers to the same question.
				assert.strictEqual(
					await refused( [ { $fill: { sortBy: { t: 1 }, output: { v: { value: 0, method: 'locf' } } } } ] ), true );
			} );

			it( 'should take an output field naming neither, and fill nothing', async () =>
			{
				// ***Also not a refusal***, although naming both is one. An output field which
				// says nothing about how to fill leaves the field exactly as it was, missing
				// documents included.
				let result = await piped( [
					{ $fill: { sortBy: { t: 1 }, output: { v: {} } } },
					{ $project: { _id: 0, t: 1, v: 1 } },
					{ $sort: { t: 1 } },
				] );
				assert.deepStrictEqual( result[ 1 ], { t: 2 } );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $fill: {} } ] ), true );
				assert.strictEqual( await refused( [ { $fill: { output: { v: { value: 0 } }, extra: 1 } } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Adding Missing Documents ($densify)', () =>
		{

			it( 'should add a document for each step the sequence skipped', async () =>
			{
				// t runs 1, 2, 3, 5 - so 4 is missing. ***The added document holds the field
				// and nothing else***, not even the partition it fell in when there is none.
				let result = await piped( [
					{ $densify: { field: 't', range: { step: 1, bounds: 'full' } } },
					{ $sort: { t: 1 } },
					{ $project: { _id: 0, t: 1, v: 1 } },
				] );
				assert.strictEqual( result.length, 5 );
				assert.deepStrictEqual( result[ 3 ], { t: 4 } );
			} );

			it( 'should step by more than one', async () =>
			{
				// ***The series is counted from the smallest value***, so a step of 2 over
				// values starting at 1 wants 1, 3, 5 - all of which are already there. Nothing
				// is added, and the 2 which does not sit on the series is kept rather than
				// removed. Densifying only ever adds documents.
				let result = await piped( [
					{ $densify: { field: 't', range: { step: 2, bounds: 'full' } } },
					{ $sort: { t: 1 } },
					{ $project: { _id: 0, t: 1 } },
				] );
				assert.deepStrictEqual( result.map( function ( D ) { return D.t; } ), [ 1, 2, 3, 5 ] );
			} );

			it( 'should take explicit bounds', async () =>
			{
				let result = await piped( [
					{ $densify: { field: 't', range: { step: 1, bounds: [ 0, 3 ] } } },
					{ $sort: { t: 1 } },
					{ $project: { _id: 0, t: 1 } },
				] );
				assert.deepStrictEqual( result.map( function ( D ) { return D.t; } ), [ 0, 1, 2, 3, 5 ] );
			} );

			it( 'should densify each partition separately', async () =>
			{
				let result = await piped( [
					{ $densify: { field: 't', partitionByFields: [ 'k' ], range: { step: 1, bounds: 'partition' } } },
					{ $sort: { k: 1, t: 1 } },
				] );
				// Partition a runs 1..3 with nothing missing; partition b holds one value.
				assert.strictEqual( result.length, 4 );
			} );

			it( 'should step through dates with a unit', async () =>
			{
				// ***A date series needs a unit***, since a step of 1 says nothing on its own.
				await Driver.SetData( [
					{ _id: 1, d: new Date( '2024-01-01T00:00:00Z' ) },
					{ _id: 2, d: new Date( '2024-01-04T00:00:00Z' ) },
				] );
				let result = await Driver.Aggregate( [
					{ $densify: { field: 'd', range: { step: 1, unit: 'day', bounds: 'full' } } },
					{ $sort: { d: 1 } },
				] );
				assert.strictEqual( result.length, 4 );
				assert.strictEqual( result[ 1 ].d.toISOString(), '2024-01-02T00:00:00.000Z' );
			} );

			it( 'should refuse a unit on a numeric field', async () =>
			{
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', range: { step: 1, unit: 'day', bounds: 'full' } } } ] ), true );
			} );

			it( 'should refuse a date field without a unit', async () =>
			{
				// ***A step of 1 says nothing about a date on its own.***
				await Driver.SetData( [
					{ _id: 1, d: new Date( '2024-01-01T00:00:00Z' ) },
					{ _id: 2, d: new Date( '2024-01-04T00:00:00Z' ) },
				] );
				let refused_it = false;
				try
				{
					await Driver.Aggregate( [
						{ $densify: { field: 'd', range: { step: 1, bounds: 'full' } } },
					] );
				}
				catch ( error ) { refused_it = true; }
				assert.strictEqual( refused_it, true );
			} );

			it( 'should refuse a step which is not positive', async () =>
			{
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', range: { step: 0, bounds: 'full' } } } ] ), true );
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', range: { step: -1, bounds: 'full' } } } ] ), true );
			} );

			it( 'should refuse a missing or unknown argument', async () =>
			{
				assert.strictEqual( await refused( [ { $densify: { field: 't' } } ] ), true );
				assert.strictEqual( await refused( [ { $densify: { range: { step: 1, bounds: 'full' } } } ] ), true );
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', range: { step: 1, bounds: 'full' }, extra: 1 } } ] ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Edges of $fill', () =>
		{

			it( 'should refuse a malformed output specification', async () =>
			{
				assert.strictEqual( await refused( [ { $fill: { output: 'nope' } } ] ), true );
				assert.strictEqual( await refused( [ { $fill: { output: { v: 'nope' } } } ] ), true );
				assert.strictEqual( await refused( [ { $fill: { output: { v: { wrong: 1 } } } } ] ), true );
			} );

			it( 'should refuse a malformed sortBy and partition', async () =>
			{
				assert.strictEqual(
					await refused( [ { $fill: { sortBy: 't', output: { v: { value: 0 } } } } ] ), true );
				assert.strictEqual(
					await refused( [ { $fill: { partitionByFields: 'k', output: { v: { value: 0 } } } } ] ), true );
			} );

			it( 'should take a sort direction other than 1 or -1', async () =>
			{
				// ***$fill is more forgiving than $top and $bottom***, which refuse a direction
				// that is not exactly 1 or -1. Here any positive number sorts ascending.
				assert.strictEqual(
					await refused( [ { $fill: { sortBy: { t: 2 }, output: { v: { value: 0 } } } } ] ), false );
			} );

			it( 'should write a null before the first observed value with locf', async () =>
			{
				// ***Nothing has been observed yet***, so there is nothing to carry forward -
				// and the field is written as a null rather than left missing. That is the
				// same rule $group follows for an accumulator with nothing to report.
				await Driver.SetData( [
					{ _id: 1, t: 1 }, { _id: 2, t: 2, v: 20 }, { _id: 3, t: 3 },
				] );
				let result = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 0 ].v, null );
				assert.strictEqual( result[ 2 ].v, 20 );
			} );

			it( 'should write a null at either end with linear', async () =>
			{
				// ***Interpolation needs two sides***, so only the middle gap gets a computed
				// value. The ends are written as nulls.
				await Driver.SetData( [
					{ _id: 1, t: 1 }, { _id: 2, t: 2, v: 20 }, { _id: 3, t: 3 },
					{ _id: 4, t: 4, v: 40 }, { _id: 5, t: 5 },
				] );
				let result = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 0 ].v, null );
				assert.strictEqual( result[ 2 ].v, 30 );
				assert.strictEqual( result[ 4 ].v, null );
			} );

			it( 'should interpolate across several missing documents at once', async () =>
			{
				await Driver.SetData( [
					{ _id: 1, t: 0, v: 0 }, { _id: 2, t: 1 }, { _id: 3, t: 2 },
					{ _id: 4, t: 3, v: 30 },
				] );
				let result = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 1 ].v, 10 );
				assert.strictEqual( result[ 2 ].v, 20 );
			} );

			it( 'should write nulls for a run of gaps before the first value', async () =>
			{
				// ***Two leading gaps, not one.*** The second one looks back past a position
				// which has itself just been written as a null, so it has to keep looking
				// rather than read that null as a value to interpolate from.
				await Driver.SetData( [
					{ _id: 1, t: 1 }, { _id: 2, t: 2 }, { _id: 3, t: 3, v: 30 }, { _id: 4, t: 4, v: 40 },
				] );
				let result = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					{ $sort: { t: 1 } },
				] );
				assert.strictEqual( result[ 0 ].v, null );
				assert.strictEqual( result[ 1 ].v, null );
				assert.strictEqual( result[ 2 ].v, 30 );
			} );

			it( 'should refuse a repeated value in the sort field with linear', async () =>
			{
				// ***linear needs a strictly increasing axis.*** Two documents at the same
				// point give the interpolation nothing to advance along, and MongoDB refuses
				// the whole pipeline rather than answering something arbitrary. locf has no
				// such requirement, since it never divides by the distance between two points.
				await Driver.SetData( [
					{ _id: 1, t: 1, v: 10 }, { _id: 2, t: 2 }, { _id: 3, t: 2, v: 20 },
				] );

				let refused_it = false;
				try
				{
					await Driver.Aggregate( [
						{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					] );
				}
				catch ( error ) { refused_it = true; }
				assert.strictEqual( refused_it, true );

				let carried = await Driver.Aggregate( [
					{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'locf' } } } },
				] );
				assert.strictEqual( carried.length, 3 );
			} );

			it( 'should refuse to interpolate between values which are not numbers', async () =>
			{
				await Driver.SetData( [
					{ _id: 1, t: 1, v: 'low' }, { _id: 2, t: 2 }, { _id: 3, t: 3, v: 'high' },
				] );
				let refused_it = false;
				try
				{
					await Driver.Aggregate( [
						{ $fill: { sortBy: { t: 1 }, output: { v: { method: 'linear' } } } },
					] );
				}
				catch ( error ) { refused_it = true; }
				assert.strictEqual( refused_it, true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Edges of $densify', () =>
		{

			it( 'should refuse a malformed field, range, and partition', async () =>
			{
				assert.strictEqual( await refused( [ { $densify: { field: 5, range: { step: 1, bounds: 'full' } } } ] ), true );
				assert.strictEqual( await refused( [ { $densify: { field: 't', range: 'nope' } } ] ), true );
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', range: { step: 1, bounds: 'full', extra: 1 } } } ] ), true );
				assert.strictEqual(
					await refused( [ { $densify: { field: 't', partitionByFields: 'k', range: { step: 1, bounds: 'full' } } } ] ), true );
			} );

			it( 'should refuse a malformed bounds', async () =>
			{
				assert.strictEqual( await refused( [ { $densify: { field: 't', range: { step: 1, bounds: 'most' } } } ] ), true );
				assert.strictEqual( await refused( [ { $densify: { field: 't', range: { step: 1, bounds: [ 1 ] } } } ] ), true );
				assert.strictEqual( await refused( [ { $densify: { field: 't', range: { step: 1, bounds: 5 } } } ] ), true );
			} );

			it( 'should refuse a field which is neither a number nor a date', async () =>
			{
				// ***There is no step from one string to the next.*** Only the two ordered
				// types with a defined interval can be densified.
				assert.strictEqual(
					await refused( [ { $densify: { field: 'k', range: { step: 1, bounds: 'full' } } } ] ), true );
			} );

			it( 'should ignore a document which does not hold the field', async () =>
			{
				// ***A document with no value is not part of the series***, and is passed
				// along untouched rather than being given one.
				await Driver.SetData( [
					{ _id: 1, t: 1 }, { _id: 2, t: 3 }, { _id: 3, other: 'x' },
				] );
				let result = await Driver.Aggregate( [
					{ $densify: { field: 't', range: { step: 1, bounds: 'full' } } },
				] );
				assert.strictEqual( result.length, 4 );
			} );

			it( 'should add nothing when nothing holds the field at all', async () =>
			{
				await Driver.SetData( [ { _id: 1, other: 'x' } ] );
				let result = await Driver.Aggregate( [
					{ $densify: { field: 't', range: { step: 1, bounds: 'full' } } },
				] );
				assert.strictEqual( result.length, 1 );
			} );

			it( 'should carry the partition onto every document it adds', async () =>
			{
				let result = await piped( [
					{ $densify: { field: 't', partitionByFields: [ 'k' ], range: { step: 1, bounds: [ 1, 4 ] } } },
					{ $match: { v: { $exists: false } } },
				] );
				// Every added document names the partition it belongs to.
				for ( let index = 0; index < result.length; index++ )
				{
					assert.strictEqual( typeof result[ index ].k, 'string' );
				}
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The Stage Which Cannot Be Reached From Here', () =>
		{

			it( 'should refuse $documents in a collection aggregate', async () =>
			{
				// ***$documents is a source stage of a ***database-level*** aggregation.*** It
				// replaces the input rather than transforming it, so it belongs to
				// db.aggregate() and not to a collection's, and MongoDB refuses it here.
				//
				// Both engines refuse it, which is why this is a parity test rather than a gap:
				// there is no behavior to build toward while the driver holds a collection.
				// Adding it would mean giving Aggregate() a way to be handed no input at all.
				assert.strictEqual( await refused( [ { $documents: [ { a: 1 } ] } ] ), true );
			} );

		} );

	} );

};
