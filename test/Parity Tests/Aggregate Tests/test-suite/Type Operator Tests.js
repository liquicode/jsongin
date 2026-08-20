'use strict';

const assert = require( 'assert' );

/*
	The type operators.

	Nine of the eleven in the Type section: $type, $isNumber, $toString, $toBool, $toDate,
	$toInt, $toLong, $toDouble, and $convert. ($toDecimal and $toObjectId need BSON types
	jsongin does not carry - see .reviews/2026-08-19/review.md, Bucket D.)

	***This family asks a question the string and trigonometry families did not.*** Those
	operators take values jsongin can hold and return values jsongin can hold. These ones are
	about ***BSON types***, and jsongin holds JSON: one number kind, where MongoDB has four.
	The last describe() below marks where that difference falls. The converted values agree
	everywhere; what $type says about a number afterwards does not, and that boundary is
	asserted in test/Unit Tests/220) Expression Operator Tests.js rather than here, because
	it is a statement about jsongin and not a comparison.

	***Javascript's own conversions are the wrong ones almost everywhere in this family.***
	Number( ' 5' ) is 5, Number( '' ) is 0, Boolean( '' ) is false, and Date.parse() reads a
	zone-less time as local and accepts a bare year. MongoDB disagrees with every one of those,
	so the tests below pin each down.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Type Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				int: 42, dbl: 3.14, big: 3000000000,
				str: 'abc', numeric: '5', flag: true, off: false,
				dt: new Date( '2020-01-02T03:04:05.678Z' ),
				empty: null, list: [ 1, 2 ], obj: { a: 1 },
			},
		];


		//---------------------------------------------------------------------
		// Runs one expression against the document and returns what it produced.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		// Answers whether the engine refused to evaluate the expression.
		async function refused( Expression )
		{
			try
			{
				await evaluated( Expression );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Reading a Type', () =>
		{

			it( 'should report the type of a value with $type', async () =>
			{
				assert.strictEqual( await evaluated( { $type: '$int' } ), 'int' );
				assert.strictEqual( await evaluated( { $type: '$dbl' } ), 'double' );
				assert.strictEqual( await evaluated( { $type: '$big' } ), 'double' );
				assert.strictEqual( await evaluated( { $type: '$str' } ), 'string' );
				assert.strictEqual( await evaluated( { $type: '$flag' } ), 'bool' );
				assert.strictEqual( await evaluated( { $type: '$dt' } ), 'date' );
				assert.strictEqual( await evaluated( { $type: '$empty' } ), 'null' );
				assert.strictEqual( await evaluated( { $type: '$list' } ), 'array' );
				assert.strictEqual( await evaluated( { $type: '$obj' } ), 'object' );
				// ***A missing field has a type of its own***, and it is not null.
				assert.strictEqual( await evaluated( { $type: '$nothing' } ), 'missing' );
			} );

			it( 'should answer whether a value is a number with $isNumber', async () =>
			{
				assert.strictEqual( await evaluated( { $isNumber: '$int' } ), true );
				assert.strictEqual( await evaluated( { $isNumber: '$dbl' } ), true );
				assert.strictEqual( await evaluated( { $isNumber: '$numeric' } ), false );
				assert.strictEqual( await evaluated( { $isNumber: '$flag' } ), false );
				assert.strictEqual( await evaluated( { $isNumber: '$dt' } ), false );
				// Unlike most of this family, a null is answered rather than propagated.
				assert.strictEqual( await evaluated( { $isNumber: '$empty' } ), false );
				assert.strictEqual( await evaluated( { $isNumber: '$nothing' } ), false );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Converting to a Scalar', () =>
		{

			it( 'should convert to a string with $toString', async () =>
			{
				assert.strictEqual( await evaluated( { $toString: '$int' } ), '42' );
				assert.strictEqual( await evaluated( { $toString: '$dbl' } ), '3.14' );
				assert.strictEqual( await evaluated( { $toString: '$flag' } ), 'true' );
				assert.strictEqual( await evaluated( { $toString: '$str' } ), 'abc' );
				assert.strictEqual( await evaluated( { $toString: '$off' } ), 'false' );
				assert.strictEqual( await evaluated( { $toString: '$dt' } ), '2020-01-02T03:04:05.678Z' );
				// A null propagates here, where $isNumber answered it.
				assert.strictEqual( await evaluated( { $toString: '$empty' } ), null );
				assert.strictEqual( await evaluated( { $toString: '$nothing' } ), null );
			} );

			it( 'should convert to a boolean with $toBool', async () =>
			{
				assert.strictEqual( await evaluated( { $toBool: '$int' } ), true );
				assert.strictEqual( await evaluated( { $toBool: 0 } ), false );
				assert.strictEqual( await evaluated( { $toBool: '$flag' } ), true );
				assert.strictEqual( await evaluated( { $toBool: '$off' } ), false );
				assert.strictEqual( await evaluated( { $toBool: '$dt' } ), true );
				// ***Every string is true, including an empty one.*** This is not Javascript's
				// rule, and it is not the rule for numbers either.
				assert.strictEqual( await evaluated( { $toBool: '$str' } ), true );
				assert.strictEqual( await evaluated( { $toBool: '' } ), true );
				assert.strictEqual( await evaluated( { $toBool: '$empty' } ), null );
			} );

			it( 'should convert to a date with $toDate', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $toDate: '$dt' } ), new Date( '2020-01-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: 1577934245678 } ), new Date( '2020-01-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02T03:04:05.678Z' } ), new Date( '2020-01-02T03:04:05.678Z' ) );
				assert.strictEqual( await evaluated( { $toDate: '$empty' } ), null );
				// A string which is not a date, and a type which has no date reading.
				assert.strictEqual( await refused( { $toDate: '$str' } ), true );
				assert.strictEqual( await refused( { $toDate: '$flag' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Converting to a Number', () =>
		{

			it( 'should convert to an int with $toInt', async () =>
			{
				assert.strictEqual( await evaluated( { $toInt: '$numeric' } ), 5 );
				assert.strictEqual( await evaluated( { $toInt: '$flag' } ), 1 );
				assert.strictEqual( await evaluated( { $toInt: '$off' } ), 0 );
				assert.strictEqual( await evaluated( { $toInt: '$empty' } ), null );
				// ***A double is truncated, not rounded.***
				assert.strictEqual( await evaluated( { $toInt: '$dbl' } ), 3 );
				assert.strictEqual( await evaluated( { $toInt: -3.9 } ), -3 );
				// The int32 range is enforced, and a date has no int reading.
				assert.strictEqual( await refused( { $toInt: '$big' } ), true );
				assert.strictEqual( await refused( { $toInt: '$str' } ), true );
				assert.strictEqual( await refused( { $toInt: '$dt' } ), true );
			} );

			it( 'should convert to a long with $toLong', async () =>
			{
				assert.strictEqual( await evaluated( { $toLong: '$numeric' } ), 5 );
				assert.strictEqual( await evaluated( { $toLong: '$dbl' } ), 3 );
				assert.strictEqual( await evaluated( { $toLong: '$flag' } ), 1 );
				assert.strictEqual( await evaluated( { $toLong: '$empty' } ), null );
				// ***Where it differs from $toInt***: the range is wider, and a date reads as
				// milliseconds since the epoch rather than being refused.
				assert.strictEqual( await evaluated( { $toLong: '$big' } ), 3000000000 );
				assert.strictEqual( await evaluated( { $toLong: '$dt' } ), 1577934245678 );
				assert.strictEqual( await refused( { $toLong: '$str' } ), true );
			} );

			it( 'should convert to a double with $toDouble', async () =>
			{
				assert.strictEqual( await evaluated( { $toDouble: '$numeric' } ), 5 );
				assert.strictEqual( await evaluated( { $toDouble: '3.14' } ), 3.14 );
				assert.strictEqual( await evaluated( { $toDouble: '$flag' } ), 1 );
				assert.strictEqual( await evaluated( { $toDouble: '$empty' } ), null );
				// ***Where it differs from $toInt***: no truncation.
				assert.strictEqual( await evaluated( { $toDouble: '$dbl' } ), 3.14 );
				assert.strictEqual( await evaluated( { $toDouble: '$dt' } ), 1577934245678 );
				assert.strictEqual( await refused( { $toDouble: '$str' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Converting by Name', () =>
		{

			it( 'should convert to a named type with $convert', async () =>
			{
				assert.strictEqual( await evaluated( { $convert: { input: '$numeric', to: 'int' } } ), 5 );
				assert.strictEqual( await evaluated( { $convert: { input: '$int', to: 'string' } } ), '42' );
				assert.strictEqual( await evaluated( { $convert: { input: '$int', to: 'bool' } } ), true );
				// The target may be named or given as its BSON type number.
				assert.strictEqual( await evaluated( { $convert: { input: '$numeric', to: 16 } } ), 5 );
				// ***onError and onNull are what $convert has and the $toX shorthands do not.***
				assert.strictEqual( await evaluated( { $convert: { input: '$str', to: 'int', onError: -1 } } ), -1 );
				assert.strictEqual( await evaluated( { $convert: { input: '$empty', to: 'int', onNull: -2 } } ), -2 );
				// onError does not cover a missing `to`, which is a malformed expression.
				assert.strictEqual( await refused( { $convert: { input: '$str', to: 'int' } } ), true );
				assert.strictEqual( await refused( { $convert: { input: '$str' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		// A conversion has two ways to fail - the value has no reading in the target type, or
		// it has one which does not fit - and MongoDB does not treat them alike everywhere.
		describe( 'The Edges of a Conversion', () =>
		{

			it( 'should require a numeric string to be wholly numeric', async () =>
			{
				assert.strictEqual( await evaluated( { $toInt: '5' } ), 5 );
				assert.strictEqual( await evaluated( { $toInt: '-5' } ), -5 );
				assert.strictEqual( await refused( { $toInt: '5abc' } ), true );
				assert.strictEqual( await refused( { $toInt: '' } ), true );
				// ***Not even surrounding whitespace is consumed.*** Javascript's own Number()
				// accepts both of these - ' 5' is 5 and '' is 0 - so the string cannot simply
				// be handed to it.
				assert.strictEqual( await refused( { $toInt: ' 5' } ), true );
				assert.strictEqual( await refused( { $toDouble: '3.14 ' } ), true );
				// ***A fractional string is refused by $toInt***, where a fractional number is
				// truncated. The string is parsed as an integer or not at all.
				assert.strictEqual( await refused( { $toInt: '3.14' } ), true );
				assert.strictEqual( await evaluated( { $toDouble: '3.14' } ), 3.14 );
			} );

			it( 'should refuse a number which does not fit the target', async () =>
			{
				assert.strictEqual( await refused( { $toInt: 2147483648 } ), true );
				assert.strictEqual( await evaluated( { $toInt: 2147483647 } ), 2147483647 );
				assert.strictEqual( await evaluated( { $toInt: -2147483648 } ), -2147483648 );
				// NaN and the infinities are numbers, but no integer reading of them exists.
				assert.strictEqual( await refused( { $toInt: NaN } ), true );
				assert.strictEqual( await refused( { $toInt: Infinity } ), true );
				assert.strictEqual( await refused( { $toLong: NaN } ), true );
				// A double holds them, so $toDouble does not refuse.
				assert.strictEqual( Number.isNaN( await evaluated( { $toDouble: NaN } ) ), true );
				assert.strictEqual( await evaluated( { $toDouble: Infinity } ), Infinity );
				// A long is wider than an int but not unbounded.
				assert.strictEqual( await evaluated( { $toLong: 1000000000000000 } ), 1000000000000000 );
				assert.strictEqual( await refused( { $toLong: 1e30 } ), true );
			} );

			it( 'should read a date string as ISO 8601 and nothing else', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02' } ), new Date( '2020-01-02T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02T03:04:05Z' } ), new Date( '2020-01-02T03:04:05.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: 'Jan 2, 2020' } ), new Date( '2020-01-02T00:00:00.000Z' ) );
				assert.strictEqual( await refused( { $toDate: '2020' } ), true );
				// ***A string carrying no zone is read as UTC***, which is where Javascript
				// differs: it reads a date-and-time with no offset as local, so the same
				// string means different instants on two machines.
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02T03:04:05' } ), new Date( '2020-01-02T03:04:05.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02 03:04:05' } ), new Date( '2020-01-02T03:04:05.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $toDate: '01/02/2020' } ), new Date( '2020-01-02T00:00:00.000Z' ) );
				// An offset is honored when one is given.
				assert.deepStrictEqual( await evaluated( { $toDate: '2020-01-02T03:04:05+02:00' } ), new Date( '2020-01-02T01:04:05.000Z' ) );
			} );

			it( 'should refuse a value which has no reading at all', async () =>
			{
				assert.strictEqual( await refused( { $toString: '$list' } ), true );
				assert.strictEqual( await refused( { $toString: '$obj' } ), true );
				assert.strictEqual( await refused( { $toInt: '$list' } ), true );
				assert.strictEqual( await refused( { $toDate: '$list' } ), true );
				// ***$toBool refuses nothing.*** An array and an object are both true, which
				// is what makes it the one conversion with no failing case.
				assert.strictEqual( await evaluated( { $toBool: '$list' } ), true );
				assert.strictEqual( await evaluated( { $toBool: '$obj' } ), true );
			} );

			it( 'should refuse a number which has no date reading', async () =>
			{
				assert.strictEqual( await refused( { $toDate: NaN } ), true );
				assert.strictEqual( await refused( { $toDate: Infinity } ), true );
			} );

			it( 'should refuse a target which names no type', async () =>
			{
				assert.strictEqual( await refused( { $convert: { input: '$int', to: 'banana' } } ), true );
				assert.strictEqual( await refused( { $convert: { input: '$int', to: 99 } } ), true );
				assert.strictEqual( await refused( { $convert: { input: '$int', to: true } } ), true );
				// ***onError does not cover it.*** A `to` which names no type is a malformed
				// expression, not a conversion which failed.
				assert.strictEqual( await refused( { $convert: { input: '$int', to: 'banana', onError: 'caught' } } ), true );
			} );

			it( 'should refuse the wrong number of operands', async () =>
			{
				assert.strictEqual( await refused( { $type: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $isNumber: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $toBool: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $toString: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $toInt: [] } ), true );
			} );

			it( 'should let onError catch either kind of failure', async () =>
			{
				assert.strictEqual( await evaluated( { $convert: { input: '5abc', to: 'int', onError: 'bad' } } ), 'bad' );
				assert.strictEqual( await evaluated( { $convert: { input: 2147483648, to: 'int', onError: 'big' } } ), 'big' );
				assert.strictEqual( await evaluated( { $convert: { input: '$list', to: 'int', onError: 'nope' } } ), 'nope' );
				// onNull answers a null, and onError does not: they are not interchangeable.
				assert.strictEqual( await evaluated( { $convert: { input: '$empty', to: 'int', onError: 'bad' } } ), null );
				assert.strictEqual( await evaluated( { $convert: { input: '$nothing', to: 'int', onNull: 'was null' } } ), 'was null' );
			} );

		} );


		//---------------------------------------------------------------------
		// ***Where this family stops.***
		//
		// MongoDB has int, long, and double as separate BSON types and tags a converted number
		// with the one it was converted to, so { $type: { $toLong: 42 } } is 'long' there.
		// jsongin holds JSON, which has one number kind, and reports a number's type from the
		// value: 42 is an int however it was produced.
		//
		// Only the assertions which survive that difference belong here. MongoDB has an
		// opinion about the rest and jsongin cannot share it, which makes them a statement
		// about jsongin rather than a comparison - see 220) Expression Operator Tests.js,
		// where the boundary is asserted and explained.
		describe( 'The Type of a Converted Number', () =>
		{

			it( 'should report a type which follows from the value', async () =>
			{
				// A truncation genuinely produces an int, in both engines.
				assert.strictEqual( await evaluated( { $type: { $toInt: '$dbl' } } ), 'int' );
				assert.strictEqual( await evaluated( { $type: { $toString: '$int' } } ), 'string' );
				assert.strictEqual( await evaluated( { $type: { $toBool: '$int' } } ), 'bool' );
				assert.strictEqual( await evaluated( { $type: { $toDate: 1577934245678 } } ), 'date' );
				// A double which is not whole is a double in both.
				assert.strictEqual( await evaluated( { $type: { $toDouble: '3.14' } } ), 'double' );
			} );

		} );

	} );

};
