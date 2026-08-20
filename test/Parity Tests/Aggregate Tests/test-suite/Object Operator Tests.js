'use strict';

const assert = require( 'assert' );

/*
	The object expression operators.

	Five of them: $mergeObjects, $objectToArray, $getField, $setField, and $unsetField.

	***This family is about field names rather than values***, which is what makes it
	different from everything built before it. $getField, $setField, and $unsetField name a
	field with a string computed at run time, and that string is a ***field name and never a
	path***: a dot in it means a field whose name contains a dot, not a step into a nested
	document. That is the whole reason the three exist, since ordinary dotted-path syntax
	cannot reach such a field at all.

	***Field order is part of the answer here***, not an implementation detail. MongoDB
	compares documents field by field in the order they hold them, so where a merged or a
	newly set field lands is observable. Every test below which can pin an order does.

	***The shorthand forms are not tested here***, and that is deliberate rather than an
	oversight. `{ $getField: 'name' }` and `{ $setField: { ..., value: '$$REMOVE' } }` read
	the field from `$$CURRENT` and remove it with `$$REMOVE`, and both of those are system
	variables which need the variable scope in Evaluate that jsongin has not built. A parity
	suite can only hold what an operator will one day satisfy; jsongin's refusal of the
	shorthand is a unit test instead. See .reviews/2026-08-19/review.md, Bucket C.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Object Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				doc: { a: 1, b: 2 },
				other: { b: 20, c: 30 },
				ordered: { z: 1, m: 2, a: 3 },
				nested: { a: { x: 1 } },
				dotted: { 'a.b': 'literal', a: { b: 'nested' } },
				empty_doc: {},
				empty: null,
				list: [ 1, 2 ],
				text: 'nope',
				number: 7,
			},
		];


		//---------------------------------------------------------------------
		// Evaluates an expression as a computed field of a $project stage.
		//
		// The field is read back out of the projected document rather than returned directly,
		// because an expression producing ***no value*** leaves the field out entirely, and
		// that is a distinct answer from producing a null. Several operators here do it.
		async function projected( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ];
		}


		//---------------------------------------------------------------------
		async function evaluated( Expression )
		{
			let document = await projected( Expression );
			return document.r;
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
		// The field names of a document, in the order it holds them. Field order is part of
		// what these operators answer, and assert.deepStrictEqual does not compare it.
		function keys_of( Value )
		{
			return Object.keys( Value ).join( ',' );
		}


		//---------------------------------------------------------------------
		describe( 'Merging Documents ($mergeObjects)', () =>
		{

			it( 'should combine the fields of several documents', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ { a: 1 }, { b: 2 } ] } ),
					{ a: 1, b: 2 } );
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ '$doc', '$other' ] } ),
					{ a: 1, b: 20, c: 30 } );
			} );

			it( 'should let the last document win a shared field', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ { a: 1 }, { a: 2 }, { a: 3 } ] } ),
					{ a: 3 } );
			} );

			it( 'should keep an overwritten field in its original position', async () =>
			{
				// The value comes from the later document and the position from the earlier
				// one, which is what makes the result comparable to a document written by hand.
				let result = await evaluated( { $mergeObjects: [ { a: 1, b: 2 }, { a: 9 } ] } );
				assert.strictEqual( keys_of( result ), 'a,b' );
				assert.deepStrictEqual( result, { a: 9, b: 2 } );
			} );

			it( 'should append a new field after the fields already there', async () =>
			{
				let result = await evaluated( { $mergeObjects: [ { b: 1 }, { a: 2 } ] } );
				assert.strictEqual( keys_of( result ), 'b,a' );
			} );

			it( 'should merge one level only', async () =>
			{
				// The later document replaces the whole sub-document rather than merging into it.
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ { a: { x: 1 } }, { a: { y: 2 } } ] } ),
					{ a: { y: 2 } } );
			} );

			it( 'should ignore a null or missing operand', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ { a: 1 }, null ] } ), { a: 1 } );
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ { a: 1 }, '$nothing' ] } ), { a: 1 } );
				assert.deepStrictEqual(
					await evaluated( { $mergeObjects: [ null, { a: 1 } ] } ), { a: 1 } );
			} );

			it( 'should answer nothing at all with an empty document', async () =>
			{
				// ***Not a null.*** An operator whose operands all vanish still produces a
				// document, which is what makes $mergeObjects safe to fold over a list.
				assert.deepStrictEqual( await evaluated( { $mergeObjects: [] } ), {} );
				assert.deepStrictEqual( await evaluated( { $mergeObjects: [ null, null ] } ), {} );
				assert.deepStrictEqual( await evaluated( { $mergeObjects: null } ), {} );
				assert.deepStrictEqual( await evaluated( { $mergeObjects: '$empty' } ), {} );
			} );

			it( 'should take a single document without a list', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $mergeObjects: '$doc' } ), { a: 1, b: 2 } );
				assert.deepStrictEqual( await evaluated( { $mergeObjects: { a: 1 } } ), { a: 1 } );
				assert.deepStrictEqual( await evaluated( { $mergeObjects: '$empty_doc' } ), {} );
			} );

			it( 'should refuse an operand which is not a document', async () =>
			{
				assert.strictEqual( await refused( { $mergeObjects: [ { a: 1 }, 5 ] } ), true );
				assert.strictEqual( await refused( { $mergeObjects: [ { a: 1 }, '$text' ] } ), true );
				assert.strictEqual( await refused( { $mergeObjects: '$number' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking a Document Apart ($objectToArray)', () =>
		{

			it( 'should turn each field into a k and v pair', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $objectToArray: '$doc' } ),
					[ { k: 'a', v: 1 }, { k: 'b', v: 2 } ] );
			} );

			it( 'should keep the fields in the order the document holds them', async () =>
			{
				// Not sorted. The document was written z, m, a and comes back that way.
				assert.deepStrictEqual(
					await evaluated( { $objectToArray: '$ordered' } ),
					[ { k: 'z', v: 1 }, { k: 'm', v: 2 }, { k: 'a', v: 3 } ] );
			} );

			it( 'should keep a value of any type as it is', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $objectToArray: '$nested' } ),
					[ { k: 'a', v: { x: 1 } } ] );
				assert.deepStrictEqual(
					await evaluated( { $objectToArray: { a: [ 1, 2 ], b: null } } ),
					[ { k: 'a', v: [ 1, 2 ] }, { k: 'b', v: null } ] );
			} );

			it( 'should answer an empty document with an empty array', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $objectToArray: '$empty_doc' } ), [] );
			} );

			it( 'should answer a null or missing operand with a null', async () =>
			{
				assert.strictEqual( await evaluated( { $objectToArray: '$empty' } ), null );
				assert.strictEqual( await evaluated( { $objectToArray: '$nothing' } ), null );
				assert.strictEqual( await evaluated( { $objectToArray: null } ), null );
			} );

			it( 'should refuse an operand which is not a document', async () =>
			{
				assert.strictEqual( await refused( { $objectToArray: '$list' } ), true );
				assert.strictEqual( await refused( { $objectToArray: '$text' } ), true );
				assert.strictEqual( await refused( { $objectToArray: '$number' } ), true );
			} );

			it( 'should undo $arrayToObject', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $arrayToObject: { $objectToArray: '$doc' } } ),
					{ a: 1, b: 2 } );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Reading a Field by Name ($getField)', () =>
		{

			it( 'should read the named field of the input document', async () =>
			{
				assert.strictEqual(
					await evaluated( { $getField: { field: 'a', input: '$doc' } } ), 1 );
				assert.deepStrictEqual(
					await evaluated( { $getField: { field: 'a', input: '$nested' } } ), { x: 1 } );
			} );

			it( 'should read a field whose name contains a dot', async () =>
			{
				// ***The name is a name and not a path.*** The document holds both a field
				// literally called 'a.b' and a nested a.b, and this reaches the first.
				assert.strictEqual(
					await evaluated( { $getField: { field: 'a.b', input: '$dotted' } } ), 'literal' );
			} );

			it( 'should produce no value at all for a field which is not there', async () =>
			{
				// Not a null. The projected document has no r field.
				let document = await projected( { $getField: { field: 'nope', input: '$doc' } } );
				assert.deepStrictEqual( document, {} );
			} );

			it( 'should answer a null input with a null', async () =>
			{
				assert.strictEqual(
					await evaluated( { $getField: { field: 'a', input: '$empty' } } ), null );
				assert.strictEqual(
					await evaluated( { $getField: { field: 'a', input: null } } ), null );
			} );

			it( 'should produce no value at all for a missing input', async () =>
			{
				// ***A null and a missing part company here***, which they do almost nowhere
				// else in the expression language. A null input is a value, and reading a
				// field of it gives null; a missing input is not, and gives back the same
				// nothing that reading an absent field gives. $setField and $unsetField do
				// not make this distinction - both answer either one with a null.
				assert.deepStrictEqual(
					await projected( { $getField: { field: 'a', input: '$nothing' } } ), {} );
			} );

			it( 'should produce no value at all for an input which is not a document', async () =>
			{
				// ***It does not refuse one.*** An array or a number has no field of any name,
				// so the answer is the same nothing a missing field gives. $setField and
				// $unsetField do refuse it, because they have to produce a document back.
				assert.deepStrictEqual(
					await projected( { $getField: { field: 'a', input: '$list' } } ), {} );
				assert.deepStrictEqual(
					await projected( { $getField: { field: 'a', input: '$number' } } ), {} );
				assert.deepStrictEqual(
					await projected( { $getField: { field: 'a', input: '$text' } } ), {} );
			} );

			it( 'should take the field name from a constant only', async () =>
			{
				// ***The name has to be known before the pipeline runs.*** A $literal is a
				// constant and is accepted - it is how a name beginning with a '$' is written,
				// since a bare '$a' would be read as a field path. A computed expression is
				// refused however simple it is, even one whose operands are all constants.
				assert.strictEqual(
					await evaluated( { $getField: { field: { $literal: 'a' }, input: '$doc' } } ), 1 );
				assert.strictEqual(
					await refused( { $getField: { field: { $concat: [ 'a' ] }, input: '$doc' } } ), true );
				assert.strictEqual(
					await refused( { $getField: { field: '$text', input: '$doc' } } ), true );
			} );

			it( 'should refuse a field name which is not a string', async () =>
			{
				assert.strictEqual(
					await refused( { $getField: { field: 3, input: '$doc' } } ), true );
				assert.strictEqual(
					await refused( { $getField: { field: null, input: '$doc' } } ), true );
			} );

			it( 'should refuse an unknown argument and a missing one', async () =>
			{
				assert.strictEqual(
					await refused( { $getField: { field: 'a', input: '$doc', extra: 1 } } ), true );
				assert.strictEqual(
					await refused( { $getField: { input: '$doc' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Writing a Field by Name ($setField)', () =>
		{

			it( 'should add a field which was not there', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $setField: { field: 'c', input: '$doc', value: 3 } } ),
					{ a: 1, b: 2, c: 3 } );
			} );

			it( 'should replace a field which was there, in its own position', async () =>
			{
				let result = await evaluated( { $setField: { field: 'a', input: '$doc', value: 9 } } );
				assert.strictEqual( keys_of( result ), 'a,b' );
				assert.deepStrictEqual( result, { a: 9, b: 2 } );
			} );

			it( 'should append a new field after the fields already there', async () =>
			{
				let result = await evaluated( { $setField: { field: 'aaa', input: '$doc', value: 3 } } );
				assert.strictEqual( keys_of( result ), 'a,b,aaa' );
			} );

			it( 'should write a field whose name contains a dot', async () =>
			{
				let result = await evaluated( { $setField: { field: 'x.y', input: '$doc', value: 3 } } );
				assert.strictEqual( keys_of( result ), 'a,b,x.y' );
				assert.strictEqual( result[ 'x.y' ], 3 );
			} );

			it( 'should write a null value rather than ignoring it', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $setField: { field: 'c', input: '$doc', value: null } } ),
					{ a: 1, b: 2, c: null } );
			} );

			it( 'should leave the input document alone', async () =>
			{
				// The operator answers a new document. The source is not modified, which is
				// observable when the same field is read again in the same stage.
				await Driver.SetData( documents );
				let result = await Driver.Aggregate( [
					{ $match: { _id: 1 } },
					{
						$project: {
							_id: 0,
							changed: { $setField: { field: 'a', input: '$doc', value: 9 } },
							original: '$doc',
						}
					},
				] );
				assert.deepStrictEqual( result[ 0 ].changed, { a: 9, b: 2 } );
				assert.deepStrictEqual( result[ 0 ].original, { a: 1, b: 2 } );
			} );

			it( 'should answer a null or missing input with a null', async () =>
			{
				assert.strictEqual(
					await evaluated( { $setField: { field: 'c', input: '$empty', value: 3 } } ), null );
				assert.strictEqual(
					await evaluated( { $setField: { field: 'c', input: '$nothing', value: 3 } } ), null );
			} );

			it( 'should refuse an input which is not a document', async () =>
			{
				assert.strictEqual(
					await refused( { $setField: { field: 'c', input: '$list', value: 3 } } ), true );
				assert.strictEqual(
					await refused( { $setField: { field: 'c', input: '$text', value: 3 } } ), true );
			} );

			it( 'should refuse a field name which is not a string', async () =>
			{
				assert.strictEqual(
					await refused( { $setField: { field: 3, input: '$doc', value: 1 } } ), true );
			} );

			it( 'should refuse an unknown argument and a missing one', async () =>
			{
				assert.strictEqual(
					await refused( { $setField: { field: 'c', input: '$doc', value: 1, extra: 1 } } ), true );
				assert.strictEqual(
					await refused( { $setField: { field: 'c', input: '$doc' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Removing a Field by Name ($unsetField)', () =>
		{

			it( 'should remove the named field', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $unsetField: { field: 'a', input: '$doc' } } ), { b: 2 } );
			} );

			it( 'should keep the remaining fields in order', async () =>
			{
				let result = await evaluated( { $unsetField: { field: 'm', input: '$ordered' } } );
				assert.strictEqual( keys_of( result ), 'z,a' );
			} );

			it( 'should remove a field whose name contains a dot, and only that one', async () =>
			{
				let result = await evaluated( { $unsetField: { field: 'a.b', input: '$dotted' } } );
				assert.deepStrictEqual( result, { a: { b: 'nested' } } );
			} );

			it( 'should leave a document which does not have the field alone', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $unsetField: { field: 'nope', input: '$doc' } } ), { a: 1, b: 2 } );
				assert.deepStrictEqual(
					await evaluated( { $unsetField: { field: 'a', input: '$empty_doc' } } ), {} );
			} );

			it( 'should answer a null or missing input with a null', async () =>
			{
				assert.strictEqual(
					await evaluated( { $unsetField: { field: 'a', input: '$empty' } } ), null );
				assert.strictEqual(
					await evaluated( { $unsetField: { field: 'a', input: '$nothing' } } ), null );
			} );

			it( 'should refuse an input which is not a document', async () =>
			{
				assert.strictEqual(
					await refused( { $unsetField: { field: 'a', input: '$list' } } ), true );
			} );

			it( 'should refuse an unknown argument and a missing one', async () =>
			{
				assert.strictEqual(
					await refused( { $unsetField: { field: 'a', input: '$doc', value: 1 } } ), true );
				assert.strictEqual(
					await refused( { $unsetField: { input: '$doc' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The Field Name Rule', () =>
		{

			// ***All three field operators name a field the same way***, and the rule is
			// worth stating once rather than three times: the name is a string constant,
			// known before the pipeline runs. That is what makes these operators different
			// from a dotted path, and it is also why a name beginning with a '$' has to be
			// written as a $literal - a bare '$a' is a field path and would be read as one.

			it( 'should take a constant field name in $setField and $unsetField', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $setField: { field: { $literal: 'c' }, input: '$doc', value: 3 } } ),
					{ a: 1, b: 2, c: 3 } );
				assert.deepStrictEqual(
					await evaluated( { $unsetField: { field: { $literal: 'a' }, input: '$doc' } } ),
					{ b: 2 } );
			} );

			it( 'should refuse a computed field name in $setField and $unsetField', async () =>
			{
				assert.strictEqual(
					await refused( { $setField: { field: { $concat: [ 'c' ] }, input: '$doc', value: 3 } } ), true );
				assert.strictEqual(
					await refused( { $setField: { field: '$text', input: '$doc', value: 3 } } ), true );
				assert.strictEqual(
					await refused( { $unsetField: { field: { $concat: [ 'a' ] }, input: '$doc' } } ), true );
				assert.strictEqual(
					await refused( { $unsetField: { field: '$text', input: '$doc' } } ), true );
			} );

			it( 'should reach a field whose name begins with a dollar sign', async () =>
			{
				// The reason $literal is the way a name is written at all. These operators are
				// the only way to reach such a field, which is why the error MongoDB gives for
				// a '$' in a path names them.
				let written = { $setField: { field: { $literal: '$price' }, input: '$doc', value: 5 } };
				let result = await evaluated( written );
				assert.strictEqual( keys_of( result ), 'a,b,$price' );

				// ***The document has to be reached as an expression, not written out.*** A
				// document literal holding a '$price' key would be read as a field path and
				// refused before any of this ran, so the $setField above is nested here rather
				// than its result being handed back in.
				assert.strictEqual(
					await evaluated( { $getField: { field: { $literal: '$price' }, input: written } } ), 5 );
				assert.deepStrictEqual(
					await evaluated( { $unsetField: { field: { $literal: '$price' }, input: written } } ),
					{ a: 1, b: 2 } );
			} );

		} );

	} );

};
