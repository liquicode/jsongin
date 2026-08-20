'use strict';

const assert = require( 'assert' );

/*
	The bitwise query operators, and the miscellaneous ones which are not predicates.

	$bitsAllSet, $bitsAllClear, $bitsAnySet, $bitsAnyClear, the query $mod, $comment,
	$sampleRate, and the two names in this part of the reference which turn out not to be
	query operators at all - $rand and $natural.

	***Two of these have no fixed answer***, which is new. $rand and $sampleRate are random,
	so there is no value to assert. What can be asserted is the shape of the answer and the
	two rates which are not random at all - nothing is selected at 0 and everything is at 1 -
	and that is what the tests below do. Asserting a particular draw would be asserting the
	seed.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	// Answers whether one document satisfies one criteria.
	async function matches( Document, Criteria )
	{
		await Driver.SetData( [ Document ] );
		let found = await Driver.Find( Criteria );
		return ( found.length === 1 );
	}


	//---------------------------------------------------------------------
	// Answers how many of the given documents satisfy one criteria.
	async function count_matching( Documents, Criteria )
	{
		await Driver.SetData( Documents );
		let found = await Driver.Find( Criteria );
		return found.length;
	}


	//---------------------------------------------------------------------
	// Answers whether the engine refused the criteria.
	async function refused( Criteria )
	{
		try
		{
			await count_matching( [ { _id: 1, v: 1 } ], Criteria );
			return false;
		}
		catch ( error )
		{
			return true;
		}
	}


	//---------------------------------------------------------------------
	describe( 'Bitwise and Miscellaneous Query Tests', () =>
	{

		// 20 is binary 10100, so bits 2 and 4 are set and every other bit is clear.
		// A bit position is counted from the least significant bit, which is position 0.
		let bits = { _id: 1, v: 20 };


		//---------------------------------------------------------------------
		describe( 'Bitwise', () =>
		{

			it( 'should match every bit set with $bitsAllSet', async () =>
			{
				// As a list of bit positions.
				assert.ok( await matches( bits, { v: { $bitsAllSet: [ 2, 4 ] } } ) );
				assert.ok( await matches( bits, { v: { $bitsAllSet: [ 2 ] } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAllSet: [ 2, 3 ] } } ) );
				// As a bitmask. 20 is 10100, so the mask 4 asks for bit 2 alone.
				assert.ok( await matches( bits, { v: { $bitsAllSet: 20 } } ) );
				assert.ok( await matches( bits, { v: { $bitsAllSet: 4 } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAllSet: 21 } } ) );
				// An empty list asks for nothing, and nothing is always satisfied.
				assert.ok( await matches( bits, { v: { $bitsAllSet: [] } } ) );
				// A value which is not a number cannot have its bits read.
				assert.ok( !await matches( { _id: 1, v: 'abc' }, { v: { $bitsAllSet: [ 2 ] } } ) );
				assert.ok( !await matches( { _id: 1, v: null }, { v: { $bitsAllSet: [ 2 ] } } ) );
			} );

			it( 'should match every bit clear with $bitsAllClear', async () =>
			{
				assert.ok( await matches( bits, { v: { $bitsAllClear: [ 0, 1, 3 ] } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAllClear: [ 0, 2 ] } } ) );
				assert.ok( await matches( bits, { v: { $bitsAllClear: 11 } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAllClear: 20 } } ) );
				assert.ok( await matches( bits, { v: { $bitsAllClear: [] } } ) );
			} );

			it( 'should match any bit set with $bitsAnySet', async () =>
			{
				assert.ok( await matches( bits, { v: { $bitsAnySet: [ 2, 3 ] } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAnySet: [ 0, 1, 3 ] } } ) );
				assert.ok( await matches( bits, { v: { $bitsAnySet: 20 } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAnySet: 11 } } ) );
				// ***An empty list asks whether any of no bits is set***, which is false,
				// where the All operators answer true to the same empty list.
				assert.ok( !await matches( bits, { v: { $bitsAnySet: [] } } ) );
			} );

			it( 'should match any bit clear with $bitsAnyClear', async () =>
			{
				assert.ok( await matches( bits, { v: { $bitsAnyClear: [ 0, 2 ] } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAnyClear: [ 2, 4 ] } } ) );
				assert.ok( await matches( bits, { v: { $bitsAnyClear: 21 } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAnyClear: 20 } } ) );
				assert.ok( !await matches( bits, { v: { $bitsAnyClear: [] } } ) );
			} );

			it( 'should read the bits of a value only when it has bits to read', async () =>
			{
				// A fractional number has no bit pattern to match against.
				assert.ok( !await matches( { _id: 1, v: 20.5 }, { v: { $bitsAllSet: [ 2 ] } } ) );
				// A negative integer does, in two's complement: -20 is ...101100, so bits 2
				// and 3 are set where 20 had 2 and 4.
				assert.ok( await matches( { _id: 1, v: -20 }, { v: { $bitsAllSet: [ 2, 3 ] } } ) );
				assert.ok( !await matches( { _id: 1, v: -20 }, { v: { $bitsAllSet: [ 4 ] } } ) );
				// A position beyond the low 32 bits is still a position.
				assert.ok( await matches( { _id: 1, v: -20 }, { v: { $bitsAllSet: [ 40 ] } } ) );
				assert.ok( !await matches( { _id: 1, v: 20 }, { v: { $bitsAllSet: [ 40 ] } } ) );
			} );

			it( 'should refuse a bit specification which is not one', async () =>
			{
				assert.strictEqual( await refused( { v: { $bitsAllSet: 'abc' } } ), true );
				assert.strictEqual( await refused( { v: { $bitsAllSet: -1 } } ), true );
				assert.strictEqual( await refused( { v: { $bitsAllSet: 1.5 } } ), true );
				assert.strictEqual( await refused( { v: { $bitsAllSet: [ -1 ] } } ), true );
				assert.strictEqual( await refused( { v: { $bitsAllSet: [ 1.5 ] } } ), true );
				assert.strictEqual( await refused( { v: { $bitsAllSet: [ 'a' ] } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Miscellaneous', () =>
		{

			it( 'should match a remainder with the query $mod', async () =>
			{
				// ***This is not the expression $mod.*** It takes [ divisor, remainder ] and
				// answers whether the field divided by the first leaves the second.
				assert.ok( await matches( { _id: 1, v: 10 }, { v: { $mod: [ 5, 0 ] } } ) );
				assert.ok( await matches( { _id: 1, v: 11 }, { v: { $mod: [ 5, 1 ] } } ) );
				assert.ok( !await matches( { _id: 1, v: 11 }, { v: { $mod: [ 5, 0 ] } } ) );
				// A fractional value is truncated toward zero before the division.
				assert.ok( await matches( { _id: 1, v: 10.5 }, { v: { $mod: [ 5, 0 ] } } ) );
				// A negative dividend keeps its sign in the remainder.
				assert.ok( await matches( { _id: 1, v: -11 }, { v: { $mod: [ 5, -1 ] } } ) );
				// A non-numeric field cannot satisfy it.
				assert.ok( !await matches( { _id: 1, v: 'abc' }, { v: { $mod: [ 5, 0 ] } } ) );
				// Neither can a number with no remainder to speak of.
				assert.ok( !await matches( { _id: 1, v: NaN }, { v: { $mod: [ 5, 0 ] } } ) );
				assert.ok( !await matches( { _id: 1, v: Infinity }, { v: { $mod: [ 5, 0 ] } } ) );
				// The array must hold exactly two numbers, and the divisor cannot be zero.
				assert.strictEqual( await refused( { v: { $mod: [ 5 ] } } ), true );
				assert.strictEqual( await refused( { v: { $mod: [ 5, 0, 1 ] } } ), true );
				assert.strictEqual( await refused( { v: { $mod: 5 } } ), true );
				assert.strictEqual( await refused( { v: { $mod: [ 0, 0 ] } } ), true );
				assert.strictEqual( await refused( { v: { $mod: [ 'a', 0 ] } } ), true );
			} );

			it( 'should select everything with $comment', async () =>
			{
				// ***A comment is not a predicate.*** It annotates the query and selects
				// everything, so it changes nothing about what is found.
				assert.ok( await matches( { _id: 1, v: 1 }, { $comment: 'why this query exists' } ) );
				assert.ok( await matches( { _id: 1, v: 1 }, { v: 1, $comment: 'still matches' } ) );
				assert.ok( !await matches( { _id: 1, v: 1 }, { v: 2, $comment: 'still does not' } ) );
			} );

			it( 'should draw from zero through one with $rand', async () =>
			{
				// $rand is an expression, reached from a query through $expr. There is no
				// value to assert, so what is asserted is the range it draws from.
				assert.ok( await matches( { _id: 1, v: 1 }, { $expr: { $gte: [ { $rand: {} }, 0 ] } } ) );
				assert.ok( await matches( { _id: 1, v: 1 }, { $expr: { $lt: [ { $rand: {} }, 1 ] } } ) );
				// Two draws are two values, not one repeated. This can agree by chance, so it
				// is asked of a hundred documents rather than of one.
				let documents = [];
				for ( let index = 0; index < 100; index++ ) { documents.push( { _id: index, v: 1 } ); }
				let selected = await count_matching( documents, { $expr: { $lt: [ { $rand: {} }, 0.5 ] } } );
				assert.ok( selected > 10, `only ${selected} of 100 documents were selected.` );
				assert.ok( selected < 90, `${selected} of 100 documents were selected.` );
			} );

			it( 'should refuse the miscellaneous names which are not predicates', async () =>
			{
				// ***The Query section lists $rand and $natural, and neither is a predicate.***
				// $rand is an expression, reached only through $expr; $natural is a hint about
				// how a collection is scanned, which is not a thing a criteria can say. Which
				// of the two the reference means matters, because a row marked supported has
				// to be supported as written.
				assert.strictEqual( await refused( { $rand: {} } ), true );
				assert.strictEqual( await refused( { v: { $rand: {} } } ), true );
				assert.strictEqual( await refused( { $natural: 1 } ), true );
				assert.strictEqual( await refused( { v: { $natural: 1 } } ), true );
				// And the reverse of the same question: $sampleRate is a query operator and
				// not an expression, so it cannot be used where an expression is expected.
				assert.strictEqual( await refused( { $expr: { $sampleRate: 0.5 } } ), true );
			} );

			it( 'should select a random fraction with $sampleRate', async () =>
			{
				let documents = [];
				for ( let index = 0; index < 100; index++ ) { documents.push( { _id: index, v: 1 } ); }
				// ***The two rates which are not random.***
				assert.strictEqual( await count_matching( documents, { $sampleRate: 0 } ), 0 );
				assert.strictEqual( await count_matching( documents, { $sampleRate: 1 } ), 100 );
				// And one which is.
				let selected = await count_matching( documents, { $sampleRate: 0.5 } );
				assert.ok( selected > 10, `only ${selected} of 100 documents were selected.` );
				assert.ok( selected < 90, `${selected} of 100 documents were selected.` );
				// A rate is a number between 0 and 1.
				assert.strictEqual( await refused( { $sampleRate: 2 } ), true );
				assert.strictEqual( await refused( { $sampleRate: -1 } ), true );
				assert.strictEqual( await refused( { $sampleRate: 'half' } ), true );
			} );

		} );

	} );

};
