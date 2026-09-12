'use strict';

const assert = require( 'assert' );

/*
	The $jsonSchema query operator.

	MongoDB reads a JSON Schema as draft 4 with `bsonType`, refuses every keyword it does not
	know, and departs from the specification in two places which are asserted here rather than
	smoothed over: a dotted name in `required` or `properties` is a path through the document,
	and a date is a `date` rather than a `string`. Inside $elemMatch only an object element can
	match.

	Every behavior here was measured on MongoDB 6.0.28, 7.0.40 and 8.3.8 by
	.plans/tools/jsongin-jsonschema-probe.js at the jsonx root before it was written down. The
	refusals assert only that a schema was refused, never the wording.
*/

module.exports = function ( Driver )
{

	const DOCUMENTS = [
		{ _id: 1, n: 42, s: 'abc', b: true, o: { x: 1 }, a: [ 1, 2, 3 ], d: new Date( 1700000000000 ), r: /ab+c/i, z: null },
		{ _id: 2, n: 3.5, s: 'abcdef', a: [ 'x', 'y' ], o: { x: 'one', y: 2 }, big: 2147483648 },
		{ _id: 3, n: 'seven', s: 'zzz', a: [], extra: 1 },
		{ _id: 4, s: 'a.b', a: [ { k: 1 }, { k: 2 } ], o: {}, dup: [ 1, 1 ], uniq: [ 1, '1' ] },
		{ _id: 5 },
	];


	//---------------------------------------------------------------------
	// Answers the ids the criteria selects, in order.
	async function ids( Criteria )
	{
		await Driver.SetData( DOCUMENTS );
		let found = await Driver.Find( Criteria );
		let result = found.map( function ( Document ) { return Document._id; } );
		result.sort( function ( A, B ) { return A - B; } );
		return result;
	}


	//---------------------------------------------------------------------
	// Answers whether the engine refused the criteria.
	async function refused( Criteria )
	{
		await Driver.SetData( DOCUMENTS );
		try
		{
			await Driver.Find( Criteria );
			return false;
		}
		catch ( error )
		{
			return true;
		}
	}

	function schema( Schema ) { return { $jsonSchema: Schema }; }


	//---------------------------------------------------------------------
	describe( 'JSON Schema Query Tests', () =>
	{

		//---------------------------------------------------------------------
		describe( 'Placement', () =>
		{

			it( 'should match every document with an empty schema at the top level', async () =>
			{
				assert.deepStrictEqual( await ids( schema( {} ) ), [ 1, 2, 3, 4, 5 ] );
			} );

			it( 'should stand inside $and, $or and $nor', async () =>
			{
				assert.deepStrictEqual( await ids( { $or: [ schema( { required: [ 'n' ] } ), { _id: 5 } ] } ), [ 1, 2, 3, 5 ] );
				assert.deepStrictEqual( await ids( { $and: [ schema( { required: [ 'n' ] } ), { _id: { $lt: 3 } } ] } ), [ 1, 2 ] );
				assert.deepStrictEqual( await ids( { $nor: [ schema( { required: [ 'n' ] } ) ] } ), [ 4, 5 ] );
			} );

			it( 'should apply to an element inside $elemMatch, and match only an object element', async () =>
			{
				assert.deepStrictEqual( await ids( { a: { $elemMatch: schema( { required: [ 'k' ] } ) } } ), [ 4 ] );
				assert.deepStrictEqual( await ids( { a: { $elemMatch: schema( {} ) } } ), [ 4 ] );
				assert.deepStrictEqual( await ids( { a: { $elemMatch: schema( { bsonType: 'int' } ) } } ), [] );
			} );

			it( 'should be refused below a field and inside $not', async () =>
			{
				assert.ok( await refused( { o: schema( {} ) } ) );
				assert.ok( await refused( { n: { $not: schema( {} ) } } ) );
			} );

			it( 'should refuse a value which is not an object', async () =>
			{
				assert.ok( await refused( schema( 1 ) ) );
				assert.ok( await refused( schema( [] ) ) );
				assert.ok( await refused( schema( true ) ) );
				assert.ok( await refused( schema( null ) ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Keywords', () =>
		{

			it( 'should refuse the keywords of the draft it does not support', async () =>
			{
				assert.ok( await refused( schema( { $ref: '#/definitions/x' } ) ) );
				assert.ok( await refused( schema( { $schema: 'http://json-schema.org/draft-04/schema#' } ) ) );
				assert.ok( await refused( schema( { id: 'http://x/y' } ) ) );
				assert.ok( await refused( schema( { definitions: { x: {} } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { default: 1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { s: { format: 'email' } } } ) ) );
			} );

			it( 'should refuse the keywords of later drafts and any unknown keyword', async () =>
			{
				assert.ok( await refused( schema( { $id: 'http://x/y' } ) ) );
				assert.ok( await refused( schema( { $defs: { x: {} } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { const: 42 } } } ) ) );
				assert.ok( await refused( schema( { properties: { a: { contains: {} } } } ) ) );
				assert.ok( await refused( schema( { propertyNames: { pattern: '^[a-z]' } } ) ) );
				assert.ok( await refused( schema( { if: {}, then: {} } ) ) );
				assert.ok( await refused( schema( { examples: [ 1 ] } ) ) );
				assert.ok( await refused( schema( { $comment: 'x' } ) ) );
				assert.ok( await refused( schema( { readOnly: true } ) ) );
				assert.ok( await refused( schema( { dependentRequired: { n: [ 's' ] } } ) ) );
				assert.ok( await refused( schema( { foo: 1 } ) ) );
			} );

			it( 'should accept title and description, as strings', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { title: 't', description: 'd', required: [ 'n' ] } ) ), [ 1, 2, 3 ] );
				assert.ok( await refused( schema( { title: 1 } ) ) );
				assert.ok( await refused( schema( { description: 1 } ) ) );
			} );

			it( 'should refuse a nested schema which is not an object', async () =>
			{
				assert.ok( await refused( schema( { properties: { n: true } } ) ) );
				assert.ok( await refused( schema( { properties: { n: 1 } } ) ) );
				assert.ok( await refused( schema( { properties: 1 } ) ) );
				assert.ok( await refused( schema( { not: [] } ) ) );
				assert.ok( await refused( schema( { properties: { a: { items: 1 } } } ) ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Types', () =>
		{

			it( 'should read type as the six JSON type names, with no integer', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { type: 'object' } ) ), [ 1, 2, 3, 4, 5 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { type: 'number' } } } ) ), [ 1, 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'z' ], properties: { z: { type: 'null' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { type: [ 'number', 'string' ] } } } ) ), [ 1, 2, 3 ] );
				assert.ok( await refused( schema( { properties: { n: { type: 'integer' } } } ) ) );
				assert.ok( await refused( schema( { properties: { d: { type: 'date' } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { type: 'thing' } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { type: [] } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { type: 1 } } } ) ) );
			} );

			it( 'should never read a date or a regular expression as a string', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'd' ], properties: { d: { type: 'string' } } } ) ), [] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'r' ], properties: { r: { type: 'string' } } } ) ), [] );
				// A string keyword on a date asserts nothing, since the date is not a string.
				assert.deepStrictEqual( await ids( schema( { required: [ 'd' ], properties: { d: { pattern: '2023' } } } ) ), [ 1 ] );
			} );

			it( 'should read bsonType as a BSON type alias', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { bsonType: 'int' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { bsonType: 'double' } } } ) ), [ 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { bsonType: 'number' } } } ) ), [ 1, 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'd' ], properties: { d: { bsonType: 'date' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'r' ], properties: { r: { bsonType: 'regex' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'b' ], properties: { b: { bsonType: 'bool' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'z' ], properties: { z: { bsonType: 'null' } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { bsonType: [ 'int', 'string' ] } } } ) ), [ 1, 3 ] );
			} );

			it( 'should store a whole number beyond int32 as a double, never a long', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'big' ], properties: { big: { bsonType: 'long' } } } ) ), [] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'big' ], properties: { big: { bsonType: 'double' } } } ) ), [ 2 ] );
			} );

			it( 'should refuse an unknown bsonType, and type beside bsonType', async () =>
			{
				assert.ok( await refused( schema( { properties: { n: { bsonType: 'thing' } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { bsonType: 1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { type: 'number', bsonType: 'int' } } } ) ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Objects', () =>
		{

			it( 'should require properties, counting null as present', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n', 's' ] } ) ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'z' ] } ) ), [ 1 ] );
			} );

			it( 'should refuse a required which is empty, not an array, not strings, or repeats a name', async () =>
			{
				assert.ok( await refused( schema( { required: [] } ) ) );
				assert.ok( await refused( schema( { required: 'n' } ) ) );
				assert.ok( await refused( schema( { required: [ 1 ] } ) ) );
				assert.ok( await refused( schema( { required: [ 'n', 'n' ] } ) ) );
			} );

			it( 'should read a dotted name in required as a path, through arrays and by index', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'o.x' ] } ) ), [ 1, 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a.k' ] } ) ), [ 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a.0' ] } ) ), [ 1, 2, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'o' ], properties: { o: { required: [ 'x.y' ] } } } ) ), [] );
			} );

			it( 'should read a dotted name in properties as a path to the value it applies to', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'o' ], properties: { 'o.x': { bsonType: 'int' } } } ) ), [ 1, 4 ] );
				assert.deepStrictEqual( await ids( schema( { properties: { 'o.x': { bsonType: 'int' } }, required: [ 'o.x' ] } ) ), [ 1 ] );
			} );

			it( 'should let an absent property pass its schema, and descend into a present one', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { properties: { n: { bsonType: 'int' } } } ) ), [ 1, 4, 5 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'o' ], properties: { o: { required: [ 'x' ], properties: { x: { bsonType: 'int' } } } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { properties: {} } ) ), [ 1, 2, 3, 4, 5 ] );
			} );

			it( 'should not look inside an array for an object keyword', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { required: [ 'k' ] } } } ) ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { properties: { q: {} }, required: [ 'q' ] } } } ) ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { minProperties: 5 } } } ) ), [ 1, 2, 3 ] );
			} );

			it( 'should apply additionalProperties to the properties nothing else named', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { properties: { _id: {}, n: {}, s: {}, b: {}, o: {}, a: {}, d: {}, r: {}, z: {} }, additionalProperties: false } ) ), [ 1, 5 ] );
				assert.deepStrictEqual( await ids( schema( { properties: { _id: {}, s: {}, a: {}, o: {}, dup: {}, uniq: {}, n: {} }, additionalProperties: { bsonType: 'int' } } ) ), [ 3, 4, 5 ] );
				assert.deepStrictEqual( await ids( schema( { properties: { _id: {} }, patternProperties: { '^[a-z]$': {} }, additionalProperties: false } ) ), [ 1, 5 ] );
				assert.ok( await refused( schema( { additionalProperties: 1 } ) ) );
			} );

			it( 'should apply patternProperties, and refuse an invalid pattern', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], patternProperties: { '^n$': { bsonType: 'int' } } } ) ), [ 1 ] );
				assert.ok( await refused( schema( { patternProperties: { '(': {} } } ) ) );
			} );

			it( 'should count properties, as whole numbers', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { minProperties: 8 } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { maxProperties: 1 } ) ), [ 5 ] );
				assert.ok( await refused( schema( { minProperties: 1.5 } ) ) );
			} );

			it( 'should apply dependencies as names or as a schema', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { dependencies: { n: [ 'b' ] } } ) ), [ 1, 4, 5 ] );
				assert.deepStrictEqual( await ids( schema( { dependencies: { n: { required: [ 'b' ] } } } ) ), [ 1, 4, 5 ] );
				assert.ok( await refused( schema( { dependencies: { n: 1 } } ) ) );
				assert.ok( await refused( schema( { dependencies: { n: [] } } ) ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Arrays', () =>
		{

			it( 'should apply items as one schema or as a list by position', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { items: { bsonType: 'int' } } } } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { items: [ { bsonType: 'int' }, { bsonType: 'int' } ] } } } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { items: [ { bsonType: 'int' }, { bsonType: 'int' } ], additionalItems: false } } } ) ), [ 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { additionalItems: { bsonType: 'int' } } } } ) ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( await ids( schema( { properties: { a: { items: [] } } } ) ), [ 1, 2, 3, 4, 5 ] );
			} );

			it( 'should count and compare elements', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { minItems: 3 } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { maxItems: 2 } } } ) ), [ 2, 3, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'dup' ], properties: { dup: { uniqueItems: true } } } ) ), [] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'uniq' ], properties: { uniq: { uniqueItems: true } } } ) ), [ 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { minItems: 100 } } } ) ), [ 1, 2, 3 ] );
				assert.ok( await refused( schema( { properties: { a: { maxItems: 1.5 } } } ) ) );
				assert.ok( await refused( schema( { properties: { a: { minItems: -1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { a: { uniqueItems: 1 } } } ) ) );
			} );

			it( 'should apply an object keyword inside items to object elements only', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { items: { required: [ 'k' ] } } } } ) ), [ 1, 2, 3, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { items: { minimum: 2 } } } } ) ), [ 2, 3, 4 ] );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Numbers and Strings', () =>
		{

			it( 'should bound numbers, with boolean exclusive bounds', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { minimum: 42 } } } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { minimum: 42, exclusiveMinimum: true } } } ) ), [ 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { maximum: 3.5 } } } ) ), [ 2, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { minimum: 1000 } } } ) ), [ 3 ] );
				assert.ok( await refused( schema( { properties: { n: { exclusiveMaximum: 10 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { exclusiveMaximum: true } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { minimum: 1, exclusiveMinimum: 1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { minimum: 'x' } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { maximum: 'x' } } } ) ) );
			} );

			it( 'should apply multipleOf to a positive divisor', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { multipleOf: 7 } } } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { multipleOf: 0.5 } } } ) ), [ 1, 2, 3 ] );
				assert.ok( await refused( schema( { properties: { n: { multipleOf: 0 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { multipleOf: -2 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { multipleOf: 'x' } } } ) ) );
			} );

			it( 'should measure and match strings', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 's' ], properties: { s: { minLength: 4 } } } ) ), [ 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 's' ], properties: { s: { maxLength: 3 } } } ) ), [ 1, 3, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 's' ], properties: { s: { pattern: '^ab' } } } ) ), [ 1, 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 's' ], properties: { s: { pattern: '(?<=a)b' } } } ) ), [ 1, 2 ] );
				assert.ok( await refused( schema( { properties: { s: { minLength: -1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { s: { maxLength: 2.5 } } } ) ) );
				assert.ok( await refused( schema( { properties: { s: { maxLength: 'x' } } } ) ) );
				assert.ok( await refused( schema( { properties: { s: { pattern: '(' } } } ) ) );
				assert.ok( await refused( schema( { properties: { s: { pattern: 1 } } } ) ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Enum and Combinators', () =>
		{

			it( 'should match enum by value, whatever the key order, and refuse an empty or repeated one', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { required: [ 'n' ], properties: { n: { enum: [ 42, 'seven' ] } } } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'o' ], properties: { o: { enum: [ { x: 1 }, {} ] } } } ) ), [ 1, 4 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'o' ], properties: { o: { enum: [ { y: 2, x: 'one' } ] } } } ) ), [ 2 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'z' ], properties: { z: { enum: [ null ] } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'd' ], properties: { d: { enum: [ new Date( 1700000000000 ) ] } } } ) ), [ 1 ] );
				assert.deepStrictEqual( await ids( schema( { required: [ 'a' ], properties: { a: { enum: [ [ 1.0, 2, 3 ] ] } } } ) ), [ 1 ] );
				assert.ok( await refused( schema( { properties: { n: { enum: [] } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { enum: 1 } } } ) ) );
				assert.ok( await refused( schema( { properties: { n: { enum: [ 1, 1 ] } } } ) ) );
			} );

			it( 'should combine schemas, and refuse an empty list', async () =>
			{
				assert.deepStrictEqual( await ids( schema( { allOf: [ { required: [ 'n' ] }, { required: [ 's' ] } ] } ) ), [ 1, 2, 3 ] );
				assert.deepStrictEqual( await ids( schema( { anyOf: [ { required: [ 'b' ] }, { required: [ 'extra' ] } ] } ) ), [ 1, 3 ] );
				assert.deepStrictEqual( await ids( schema( { oneOf: [ { required: [ 'n' ] }, { required: [ 's' ] } ] } ) ), [ 4 ] );
				assert.deepStrictEqual( await ids( schema( { not: { required: [ 'n' ] } } ) ), [ 4, 5 ] );
				assert.ok( await refused( schema( { allOf: [] } ) ) );
				assert.ok( await refused( schema( { oneOf: [] } ) ) );
				assert.ok( await refused( schema( { anyOf: {} } ) ) );
			} );

		} );

	} );
};
