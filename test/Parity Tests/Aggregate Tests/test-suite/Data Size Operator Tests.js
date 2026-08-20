'use strict';

const assert = require( 'assert' );

/*
	The data size operators: $binarySize and $bsonSize.

	This is a ***gap suite***: every test here passes under MongoDB and fails under jsongin by
	design. See `Aggregate Gaps.js` and Standing Decision 6 in .plans/story.md.

	***These two ask how many bytes a value would occupy***, which is a question about the BSON
	encoding rather than about the value. Every number below is the encoding's arithmetic:

		document        4 for its own length, then each element, then 1 for the terminator
		element         1 for the type, then the field name and a terminating zero, then the
		                value
		double          8              int32           4
		bool            1              null            0
		date            8              string          4 for its length, the bytes, then 1

	***An array is encoded as a document whose keys are '0', '1', and so on***, which is why
	[ 1, 2 ] costs more than two int32s.

	A number is an int32 when it is whole and inside the 32 bit range, and a double otherwise.
	That is the same rule $type follows and the same rule the BSON serializer uses, so a
	document written by the driver and the same document held by jsongin agree.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Data Size Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				one: { a: 1 },
				pi: { a: 3.14 },
				text: { a: 'abc' },
				flag: { a: true },
				empty_value: { a: null },
				nothing: {},
				list: { a: [ 1, 2 ] },
				nested: { a: { b: 1 } },
				when: { a: new Date( '2020-01-02T03:04:05.678Z' ) },
				pattern: { a: /ab/i },
				ascii: 'abc',
				wide: 'héllo',
				blank: '',
				number: 5,
			},
		];


		//---------------------------------------------------------------------
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
		describe( 'Sizes', () =>
		{

			it( 'should count the bytes of a string with $binarySize', async () =>
			{
				// ***A string is measured in bytes, not in characters.*** The accented letter
				// of 'héllo' is two bytes, so its size is six where its length is five.
				assert.strictEqual( await evaluated( { $binarySize: '$ascii' } ), 3 );
				assert.strictEqual( await evaluated( { $binarySize: '$wide' } ), 6 );
				assert.strictEqual( await evaluated( { $binarySize: '$blank' } ), 0 );
				assert.strictEqual( await evaluated( { $binarySize: 'abc' } ), 3 );
				// A null propagates, and a value which is neither a string nor binary data
				// has no binary size.
				assert.strictEqual( await evaluated( { $binarySize: null } ), null );
				assert.strictEqual( await evaluated( { $binarySize: '$missing' } ), null );
				assert.strictEqual( await refused( { $binarySize: '$number' } ), true );
				assert.strictEqual( await refused( { $binarySize: '$one' } ), true );
			} );

			it( 'should count the encoded bytes of a document with $bsonSize', async () =>
			{
				// 4 for the length + [ 1 type + 2 for 'a\0' + 4 for the int32 ] + 1 = 12.
				assert.strictEqual( await evaluated( { $bsonSize: '$one' } ), 12 );
				// A double costs four more bytes than an int32.
				assert.strictEqual( await evaluated( { $bsonSize: '$pi' } ), 16 );
				// A string carries its own length: 4 + 3 bytes + 1.
				assert.strictEqual( await evaluated( { $bsonSize: '$text' } ), 16 );
				assert.strictEqual( await evaluated( { $bsonSize: '$flag' } ), 9 );
				// A null occupies no bytes beyond its type and name.
				assert.strictEqual( await evaluated( { $bsonSize: '$empty_value' } ), 8 );
				// An empty document is its length and its terminator.
				assert.strictEqual( await evaluated( { $bsonSize: '$nothing' } ), 5 );
				assert.strictEqual( await evaluated( { $bsonSize: '$when' } ), 16 );
				// A regex is two zero terminated strings, the pattern and its flags, with no
				// length ahead of either: 4 + [ 1 + 2 + ( 2 + 1 ) + ( 1 + 1 ) ] + 1.
				assert.strictEqual( await evaluated( { $bsonSize: '$pattern' } ), 13 );
				// An array is a document whose keys are '0' and '1'.
				assert.strictEqual( await evaluated( { $bsonSize: '$list' } ), 27 );
				assert.strictEqual( await evaluated( { $bsonSize: '$nested' } ), 20 );
				// A null propagates. Anything which is not a document is refused, because
				// only a document has a BSON size.
				assert.strictEqual( await evaluated( { $bsonSize: null } ), null );
				assert.strictEqual( await evaluated( { $bsonSize: '$missing' } ), null );
				assert.strictEqual( await refused( { $bsonSize: '$ascii' } ), true );
				assert.strictEqual( await refused( { $bsonSize: '$number' } ), true );
				assert.strictEqual( await refused( { $bsonSize: '$list.a' } ), true );
			} );

		} );

	} );

};
