'use strict';

const assert = require( 'assert' );

/*
	The string expression operators.

	Twenty operators, and what separates them is mostly their operand rules rather than the
	string function underneath. Three rules recur, and the family is inconsistent about which
	one it uses, so each group below states which it follows:

		null propagates      a null or missing operand makes the result null.
		null is empty        a null or missing operand is read as an empty string.
		null is refused      a null operand is an error.

	The byte forms and the code point forms differ only where the string is not ASCII, so
	'héllo' is what tells them apart: the accented letter is two bytes and one code point. A
	test which used only ASCII would pass against either implementation.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'String Operator Tests', () =>
	{

		// 'wide' has a two byte character, 'kanji' three byte characters, and 'emoji' a four
		// byte one. Between them they exercise every width UTF-8 has, which matters because
		// the byte operators and the code point operators only differ where a character is
		// wider than one byte.
		let documents = [
			{
				_id: 1,
				s: 'Hello', t: 'World', pad: '  trim me  ',
				wide: 'héllo', kanji: '日本', emoji: 'a🙂b',
				n: 5, empty: null, scores: [ 10, 20 ],
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
		//
		// Asserts only that it was refused, never the wording. See the Expression Rejection
		// Tests for why.
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
		describe( 'Joining and Splitting', () =>
		{

			it( 'should join strings with $concat', async () =>
			{
				assert.strictEqual( await evaluated( { $concat: [ 'a', 'b', 'c' ] } ), 'abc' );
				assert.strictEqual( await evaluated( { $concat: [ '$s', ' ', '$t' ] } ), 'Hello World' );
				assert.strictEqual( await evaluated( { $concat: [ 'only' ] } ), 'only' );
				assert.strictEqual( await evaluated( { $concat: [] } ), '' );
			} );

			it( 'should propagate null through $concat', async () =>
			{
				assert.strictEqual( await evaluated( { $concat: [ '$s', null ] } ), null );
				assert.strictEqual( await evaluated( { $concat: [ '$s', '$nope' ] } ), null );
				assert.strictEqual( await evaluated( { $concat: [ '$s', '$empty' ] } ), null );
			} );

			it( 'should refuse a $concat operand which is not a string', async () =>
			{
				assert.ok( await refused( { $concat: [ '$s', 5 ] } ) );
				assert.ok( await refused( { $concat: [ '$s', '$n' ] } ) );
			} );

			it( 'should split a string with $split', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $split: [ 'a-b-c', '-' ] } ), [ 'a', 'b', 'c' ] );
				// A delimiter which does not occur gives the whole string as one element.
				assert.deepStrictEqual( await evaluated( { $split: [ '$s', '-' ] } ), [ 'Hello' ] );
				// A delimiter at an end leaves an empty element there.
				assert.deepStrictEqual( await evaluated( { $split: [ '-a-', '-' ] } ), [ '', 'a', '' ] );
			} );

			it( 'should propagate null through $split', async () =>
			{
				assert.strictEqual( await evaluated( { $split: [ '$empty', '-' ] } ), null );
				assert.strictEqual( await evaluated( { $split: [ '$nope', '-' ] } ), null );
				assert.strictEqual( await evaluated( { $split: [ '$s', '$empty' ] } ), null );
			} );

			it( 'should refuse a bad $split operand', async () =>
			{
				assert.ok( await refused( { $split: [ '$n', '-' ] } ), 'a non string input' );
				assert.ok( await refused( { $split: [ '$s', 5 ] } ), 'a non string delimiter' );
				assert.ok( await refused( { $split: [ '$s', '' ] } ), 'an empty delimiter' );
				assert.ok( await refused( { $split: [ '$s' ] } ), 'one operand' );
			} );

		} );


		//---------------------------------------------------------------------
		// ***$toLower and $toUpper read null as an empty string***, which is unlike almost
		// every other operator in this family.
		describe( 'Case and Comparison', () =>
		{

			it( 'should lowercase with $toLower', async () =>
			{
				assert.strictEqual( await evaluated( { $toLower: '$s' } ), 'hello' );
				assert.strictEqual( await evaluated( { $toLower: 'ABC' } ), 'abc' );
			} );

			it( 'should read a missing or null $toLower operand as an empty string', async () =>
			{
				assert.strictEqual( await evaluated( { $toLower: '$nope' } ), '' );
				assert.strictEqual( await evaluated( { $toLower: '$empty' } ), '' );
			} );

			it( 'should uppercase with $toUpper', async () =>
			{
				assert.strictEqual( await evaluated( { $toUpper: '$s' } ), 'HELLO' );
				assert.strictEqual( await evaluated( { $toUpper: 'abc' } ), 'ABC' );
			} );

			it( 'should read a missing or null $toUpper operand as an empty string', async () =>
			{
				assert.strictEqual( await evaluated( { $toUpper: '$nope' } ), '' );
				assert.strictEqual( await evaluated( { $toUpper: '$empty' } ), '' );
			} );

			it( 'should compare without case using $strcasecmp', async () =>
			{
				assert.strictEqual( await evaluated( { $strcasecmp: [ 'a', 'B' ] } ), -1 );
				assert.strictEqual( await evaluated( { $strcasecmp: [ 'b', 'A' ] } ), 1 );
				assert.strictEqual( await evaluated( { $strcasecmp: [ 'a', 'A' ] } ), 0 );
				assert.strictEqual( await evaluated( { $strcasecmp: [ '$s', 'HELLO' ] } ), 0 );
			} );

			it( 'should read a missing or null $strcasecmp operand as an empty string', async () =>
			{
				assert.strictEqual( await evaluated( { $strcasecmp: [ '$nope', '' ] } ), 0 );
				assert.strictEqual( await evaluated( { $strcasecmp: [ '$empty', 'a' ] } ), -1 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Trimming', () =>
		{

			it( 'should trim both ends with $trim', async () =>
			{
				assert.strictEqual( await evaluated( { $trim: { input: '$pad' } } ), 'trim me' );
				assert.strictEqual( await evaluated( { $trim: { input: 'xxhixx', chars: 'x' } } ), 'hi' );
				// Every character of chars is trimmed, in any order, not the sequence of them.
				assert.strictEqual( await evaluated( { $trim: { input: 'xyhixy', chars: 'yx' } } ), 'hi' );
			} );

			it( 'should trim the left end with $ltrim', async () =>
			{
				assert.strictEqual( await evaluated( { $ltrim: { input: '$pad' } } ), 'trim me  ' );
				assert.strictEqual( await evaluated( { $ltrim: { input: 'xxhixx', chars: 'x' } } ), 'hixx' );
			} );

			it( 'should trim the right end with $rtrim', async () =>
			{
				assert.strictEqual( await evaluated( { $rtrim: { input: '$pad' } } ), '  trim me' );
				assert.strictEqual( await evaluated( { $rtrim: { input: 'xxhixx', chars: 'x' } } ), 'xxhi' );
			} );

			it( 'should propagate null through the trim operators', async () =>
			{
				assert.strictEqual( await evaluated( { $trim: { input: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $ltrim: { input: '$nope' } } ), null );
				assert.strictEqual( await evaluated( { $rtrim: { input: '$empty' } } ), null );
				// A null chars is a null result too, rather than a fallback to whitespace.
				assert.strictEqual( await evaluated( { $trim: { input: '$pad', chars: null } } ), null );
			} );

			it( 'should refuse a bad trim argument', async () =>
			{
				assert.ok( await refused( { $trim: '$pad' } ), 'an argument which is not a document' );
				assert.ok( await refused( { $trim: {} } ), 'no input' );
				assert.ok( await refused( { $trim: { input: '$n' } } ), 'an input which is not a string' );
				assert.ok( await refused( { $trim: { input: '$pad', chars: 5 } } ), 'chars which is not a string' );
				assert.ok( await refused( { $trim: { input: '$pad', nope: 'x' } } ), 'an unknown field' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Substrings', () =>
		{

			it( 'should take a substring with $substr', async () =>
			{
				// $substr is MongoDB's deprecated name for $substrBytes and behaves the same.
				assert.strictEqual( await evaluated( { $substr: [ '$s', 0, 2 ] } ), 'He' );
				assert.strictEqual( await evaluated( { $substr: [ '$s', 1, 3 ] } ), 'ell' );
			} );

			it( 'should take a substring by bytes with $substrBytes', async () =>
			{
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 1, 3 ] } ), 'ell' );
				// A length which runs past the end stops at the end.
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 3, 99 ] } ), 'lo' );
				// A negative length is read as "to the end".
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 3, -1 ] } ), 'lo' );
				// A start at or past the end gives an empty string.
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 5, 2 ] } ), '' );
			} );

			it( 'should take a substring by code points with $substrCP', async () =>
			{
				assert.strictEqual( await evaluated( { $substrCP: [ '$s', 1, 3 ] } ), 'ell' );
				// Two code points of the accented string are three bytes, which is the
				// difference between this operator and $substrBytes.
				assert.strictEqual( await evaluated( { $substrCP: [ '$wide', 0, 2 ] } ), 'hé' );
				assert.strictEqual( await evaluated( { $substrCP: [ '$wide', 1, 2 ] } ), 'él' );
			} );

			it( 'should read a missing or null substring operand as an empty string', async () =>
			{
				assert.strictEqual( await evaluated( { $substrBytes: [ '$empty', 0, 2 ] } ), '' );
				assert.strictEqual( await evaluated( { $substrCP: [ '$nope', 0, 2 ] } ), '' );
			} );

			// ***The two forms disagree about a fractional position.*** $substrBytes truncates
			// it and $substrCP refuses it, which is not a distinction any documentation draws
			// and is exactly the sort of thing a parity test is for: this suite asserted a
			// refusal for both, and MongoDB corrected half of it.
			it( 'should truncate a fractional $substrBytes position', async () =>
			{
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 1.5, 2 ] } ), 'el' );
				assert.strictEqual( await evaluated( { $substrBytes: [ '$s', 1, 2.9 ] } ), 'el' );
			} );

			it( 'should refuse a fractional $substrCP position', async () =>
			{
				assert.ok( await refused( { $substrCP: [ '$s', 1.5, 2 ] } ), 'a fractional start' );
				assert.ok( await refused( { $substrCP: [ '$s', 1, 2.9 ] } ), 'a fractional length' );
			} );

			// ***A number is not refused***, it is rendered. $substr and its two successors are
			// the only string operators which accept one: everywhere else in this family a
			// number is an error.
			it( 'should render a number operand rather than refusing it', async () =>
			{
				assert.strictEqual( await evaluated( { $substr: [ '$n', 0, 1 ] } ), '5' );
				assert.strictEqual( await evaluated( { $substrBytes: [ '$n', 0, 1 ] } ), '5' );
				assert.strictEqual( await evaluated( { $substrCP: [ '$n', 0, 1 ] } ), '5' );
			} );


			it( 'should refuse a bad substring operand', async () =>
			{
				assert.ok( await refused( { $substrBytes: [ '$s', -1, 2 ] } ), 'a negative start' );
				assert.ok( await refused( { $substrCP: [ '$s', -1, 2 ] } ), 'a negative start' );
				assert.ok( await refused( { $substrCP: [ '$s', 0, -1 ] } ), 'a negative length' );
				assert.ok( await refused( { $substrBytes: [ '$s', 0 ] } ), 'two operands' );
				assert.ok( await refused( { $substrBytes: [ '$s', 0, 2, 4 ] } ), 'four operands' );
			} );

		} );


		//---------------------------------------------------------------------
		// A byte range which does not fall on character boundaries has no string to return,
		// so $substrBytes refuses it. This is the cost of indexing text by bytes, and it is
		// why $substrCP exists.
		describe( 'Byte Boundaries', () =>
		{

			it( 'should refuse a $substrBytes range which splits a character', async () =>
			{
				// 'héllo' is h(1) é(2) l(1) l(1) o(1), so byte 2 is inside the accent.
				assert.ok( await refused( { $substrBytes: [ '$wide', 1, 1 ] } ), 'an end inside a character' );
				assert.ok( await refused( { $substrBytes: [ '$wide', 2, 1 ] } ), 'a start inside a character' );
				// The same range taken by code points is fine.
				assert.strictEqual( await evaluated( { $substrCP: [ '$wide', 1, 1 ] } ), 'é' );
			} );

		} );


		//---------------------------------------------------------------------
		// Which operands a string operator will accept from outside its own type. The three
		// substring operators render a number; the rest of the family refuses one.
		describe( 'Operand Types', () =>
		{

			// ***The operators which predate MongoDB 3.4 render a number; the ones added since
			// refuse it.*** $toLower, $toUpper, $strcasecmp and the three substring operators
			// are the old ones, and they carry the old coercion.
			it( 'should render a number in the operators which predate 3.4', async () =>
			{
				assert.strictEqual( await evaluated( { $toLower: '$n' } ), '5' );
				assert.strictEqual( await evaluated( { $toUpper: '$n' } ), '5' );
				assert.strictEqual( await evaluated( { $strcasecmp: [ '$n', 'a' ] } ), -1 );
			} );

			it( 'should refuse a number in the operators added since 3.4', async () =>
			{
				assert.ok( await refused( { $trim: { input: '$n' } } ), '$trim' );
				assert.ok( await refused( { $indexOfCP: [ '$n', 'a' ] } ), '$indexOfCP' );
				assert.ok( await refused( { $strLenCP: '$n' } ), '$strLenCP' );
				assert.ok( await refused( { $split: [ '$n', '-' ] } ), '$split' );
				assert.ok( await refused( { $concat: [ '$n' ] } ), '$concat' );
				assert.ok( await refused( { $replaceAll: { input: '$n', find: 'a', replacement: 'b' } } ), '$replaceAll' );
			} );

			it( 'should accept a single operand outside an array', async () =>
			{
				// $concat, $split and the index operators take an operand list, but an
				// operator given one operand accepts it without the enclosing array.
				assert.strictEqual( await evaluated( { $concat: '$s' } ), 'Hello' );
				assert.strictEqual( await evaluated( { $toLower: [ '$s' ] } ), 'hello' );
			} );

		} );


		//---------------------------------------------------------------------
		// UTF-8 encodes a character in one to four bytes, and 'héllo' only ever exercises two
		// of those widths. A three byte character and a four byte one are what tell a correct
		// byte count from one which assumes every non-ASCII character is two bytes wide.
		describe( 'Wider Characters', () =>
		{

			it( 'should count three byte characters', async () =>
			{
				assert.strictEqual( await evaluated( { $strLenBytes: '$kanji' } ), 6 );
				assert.strictEqual( await evaluated( { $strLenCP: '$kanji' } ), 2 );
			} );

			it( 'should count a four byte character', async () =>
			{
				// 'a' + the emoji + 'b'. The emoji is one code point and four bytes.
				assert.strictEqual( await evaluated( { $strLenBytes: '$emoji' } ), 6 );
				assert.strictEqual( await evaluated( { $strLenCP: '$emoji' } ), 3 );
			} );

			it( 'should take substrings of wider characters by code point', async () =>
			{
				assert.strictEqual( await evaluated( { $substrCP: [ '$kanji', 0, 1 ] } ), '日' );
				assert.strictEqual( await evaluated( { $substrCP: [ '$emoji', 1, 1 ] } ), '🙂' );
			} );

			it( 'should take substrings of wider characters by byte', async () =>
			{
				assert.strictEqual( await evaluated( { $substrBytes: [ '$kanji', 0, 3 ] } ), '日' );
				assert.strictEqual( await evaluated( { $substrBytes: [ '$emoji', 1, 4 ] } ), '🙂' );
				// A range which ends one byte short of the character is not a string.
				assert.ok( await refused( { $substrBytes: [ '$kanji', 0, 2 ] } ) );
			} );

			it( 'should find wider characters at the right offset', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$emoji', 'b' ] } ), 2 );
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$emoji', 'b' ] } ), 5 );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$kanji', '本' ] } ), 1 );
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$kanji', '本' ] } ), 3 );
			} );

		} );


		//---------------------------------------------------------------------
		// A pattern which is allowed to match nothing has to be made to advance, or the search
		// for the next match starts where the last one did and never ends.
		describe( 'Patterns Which Match Nothing', () =>
		{

			// ***There is no empty match at the end of the string.*** Javascript's own iteration
			// produces one there and MongoDB does not, so a straight port of exec() in a loop
			// reports one match too many. Measured, not assumed.
			it( 'should not stall on a zero length match', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFindAll: { input: 'ab', regex: 'x*' } } ),
					[
						{ match: '', idx: 0, captures: [] },
						{ match: '', idx: 1, captures: [] },
					] );
			} );

			// The empty string is the exception to the rule above: position 0 is the end of it,
			// and the match there is kept. So the rule is not "never match at the end", it is
			// "drop the empty match at the end of a string which has something in it".
			it( 'should still match an empty string', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFindAll: { input: '', regex: 'x*' } } ),
					[ { match: '', idx: 0, captures: [] } ] );
			} );

			it( 'should still report a zero length match between characters', async () =>
			{
				// A pattern which matches something keeps its own places; only the empty
				// match at the very end is dropped.
				assert.deepStrictEqual(
					await evaluated( { $regexFindAll: { input: 'aba', regex: 'a*' } } ),
					[
						{ match: 'a', idx: 0, captures: [] },
						{ match: '', idx: 1, captures: [] },
						{ match: 'a', idx: 2, captures: [] },
					] );
			} );

			it( 'should report a zero length first match', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$s', regex: 'x*' } } ),
					{ match: '', idx: 0, captures: [] } );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Malformed Operands', () =>
		{

			it( 'should refuse a position which is not a number', async () =>
			{
				assert.ok( await refused( { $substrBytes: [ '$s', 'x', 2 ] } ), 'a start' );
				assert.ok( await refused( { $substrCP: [ '$s', 0, 'x' ] } ), 'a length' );
				assert.ok( await refused( { $indexOfCP: [ '$s', 'l', 'x' ] } ), 'a search start' );
			} );

			it( 'should refuse regex options which are not a string', async () =>
			{
				assert.ok( await refused( { $regexMatch: { input: '$s', regex: 'l', options: 5 } } ) );
			} );

			// A number is rendered by the operators which predate 3.4, but nothing else is.
			it( 'should refuse an operand which is neither a string nor a number', async () =>
			{
				assert.ok( await refused( { $toLower: '$scores' } ), '$toLower of an array' );
				assert.ok( await refused( { $toUpper: [ [ 1, 2 ] ] } ), '$toUpper of an array' );
				assert.ok( await refused( { $substrBytes: [ '$scores', 0, 1 ] } ), '$substrBytes of an array' );
				assert.ok( await refused( { $strcasecmp: [ '$scores', 'a' ] } ), '$strcasecmp of an array' );
			} );

			it( 'should refuse a position which is not finite', async () =>
			{
				assert.ok( await refused( { $substrBytes: [ '$s', Infinity, 2 ] } ), 'an infinite start' );
			} );

		} );


		//---------------------------------------------------------------------
		// ***The length operators refuse a null***, where the substring operators read it as
		// an empty string. The family does not agree with itself, and this is measured rather
		// than reasoned about.
		describe( 'Length', () =>
		{

			it( 'should count bytes with $strLenBytes', async () =>
			{
				assert.strictEqual( await evaluated( { $strLenBytes: '$s' } ), 5 );
				assert.strictEqual( await evaluated( { $strLenBytes: '$wide' } ), 6 );
				assert.strictEqual( await evaluated( { $strLenBytes: '' } ), 0 );
			} );

			it( 'should count code points with $strLenCP', async () =>
			{
				assert.strictEqual( await evaluated( { $strLenCP: '$s' } ), 5 );
				assert.strictEqual( await evaluated( { $strLenCP: '$wide' } ), 5 );
				assert.strictEqual( await evaluated( { $strLenCP: '' } ), 0 );
			} );

			it( 'should refuse a null or missing length operand', async () =>
			{
				assert.ok( await refused( { $strLenBytes: '$empty' } ), 'a null' );
				assert.ok( await refused( { $strLenBytes: '$nope' } ), 'a missing field' );
				assert.ok( await refused( { $strLenCP: '$empty' } ), 'a null' );
				assert.ok( await refused( { $strLenCP: '$nope' } ), 'a missing field' );
				assert.ok( await refused( { $strLenBytes: '$n' } ), 'a number' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Searching', () =>
		{

			it( 'should find a byte offset with $indexOfBytes', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'l' ] } ), 2 );
				// 'h', then the two byte accent, then 'l': the accent is what moves the answer.
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$wide', 'l' ] } ), 3 );
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'z' ] } ), -1 );
			} );

			it( 'should find a code point offset with $indexOfCP', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$s', 'l' ] } ), 2 );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$wide', 'l' ] } ), 2 );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$s', 'z' ] } ), -1 );
			} );

			it( 'should search from a start position', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'l', 3 ] } ), 3 );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$s', 'l', 3 ] } ), 3 );
				// A start past the end finds nothing.
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'l', 9 ] } ), -1 );
			} );

			it( 'should search within a start and end window', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'l', 0, 3 ] } ), 2 );
				// The window ends before the second 'l', so only the first is found.
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$s', 'l', 3, 3 ] } ), -1 );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$s', 'l', 0, 3 ] } ), 2 );
			} );

			it( 'should propagate null through the search operators', async () =>
			{
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$empty', 'l' ] } ), null );
				assert.strictEqual( await evaluated( { $indexOfBytes: [ '$nope', 'l' ] } ), null );
				assert.strictEqual( await evaluated( { $indexOfCP: [ '$empty', 'l' ] } ), null );
			} );

			it( 'should refuse a bad search operand', async () =>
			{
				assert.ok( await refused( { $indexOfBytes: [ '$n', 'l' ] } ), 'an input which is not a string' );
				assert.ok( await refused( { $indexOfBytes: [ '$s', 5 ] } ), 'a substring which is not a string' );
				assert.ok( await refused( { $indexOfBytes: [ '$s', 'l', -1 ] } ), 'a negative start' );
				assert.ok( await refused( { $indexOfBytes: [ '$s' ] } ), 'one operand' );
			} );

		} );


		//---------------------------------------------------------------------
		// The regex operators take their pattern as a string rather than a Javascript RegExp,
		// so that the same expression means the same thing over the wire and in process.
		describe( 'Regular Expressions', () =>
		{

			it( 'should test a pattern with $regexMatch', async () =>
			{
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: 'ell' } } ), true );
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: 'zzz' } } ), false );
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: '^H' } } ), true );
			} );

			it( 'should accept a RegExp as the pattern', async () =>
			{
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: /ell/ } } ), true );
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: /zzz/ } } ), false );
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$s', regex: /l+/ } } ),
					{ match: 'll', idx: 2, captures: [] } );
			} );

			it( 'should read the $regexMatch options', async () =>
			{
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: 'hello', options: 'i' } } ), true );
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$s', regex: 'hello' } } ), false );
			} );

			it( 'should return false rather than null for a missing $regexMatch input', async () =>
			{
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$empty', regex: 'l' } } ), false );
				assert.strictEqual( await evaluated( { $regexMatch: { input: '$nope', regex: 'l' } } ), false );
			} );

			it( 'should find the first match with $regexFind', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$s', regex: 'l+' } } ),
					{ match: 'll', idx: 2, captures: [] } );
				// No match is a null rather than an empty result document.
				assert.strictEqual( await evaluated( { $regexFind: { input: '$s', regex: 'zzz' } } ), null );
			} );

			it( 'should report the capture groups of a $regexFind', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$s', regex: '(e)(l+)' } } ),
					{ match: 'ell', idx: 1, captures: [ 'e', 'll' ] } );
				// A group which did not participate is a null in the captures.
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$s', regex: '(z)?(H)' } } ),
					{ match: 'H', idx: 0, captures: [ null, 'H' ] } );
			} );

			it( 'should report an idx in code points rather than bytes', async () =>
			{
				// The accent is two bytes and one code point, so a byte offset would say 3.
				assert.deepStrictEqual(
					await evaluated( { $regexFind: { input: '$wide', regex: 'l' } } ),
					{ match: 'l', idx: 2, captures: [] } );
			} );

			it( 'should find every match with $regexFindAll', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $regexFindAll: { input: '$s', regex: 'l' } } ),
					[
						{ match: 'l', idx: 2, captures: [] },
						{ match: 'l', idx: 3, captures: [] },
					] );
				// No match is an empty array rather than a null.
				assert.deepStrictEqual( await evaluated( { $regexFindAll: { input: '$s', regex: 'zzz' } } ), [] );
			} );

			it( 'should return null or an empty array for a missing regex input', async () =>
			{
				assert.strictEqual( await evaluated( { $regexFind: { input: '$empty', regex: 'l' } } ), null );
				assert.deepStrictEqual( await evaluated( { $regexFindAll: { input: '$nope', regex: 'l' } } ), [] );
			} );

			it( 'should refuse a bad regex argument', async () =>
			{
				assert.ok( await refused( { $regexMatch: '$s' } ), 'an argument which is not a document' );
				assert.ok( await refused( { $regexMatch: { regex: 'l' } } ), 'no input' );
				assert.ok( await refused( { $regexMatch: { input: '$s' } } ), 'no regex' );
				assert.ok( await refused( { $regexMatch: { input: '$n', regex: 'l' } } ), 'an input which is not a string' );
				assert.ok( await refused( { $regexMatch: { input: '$s', regex: 5 } } ), 'a regex which is not a pattern' );
				assert.ok( await refused( { $regexMatch: { input: '$s', regex: 'l', options: 'q' } } ), 'an unknown option' );
				assert.ok( await refused( { $regexMatch: { input: '$s', regex: 'l', nope: 1 } } ), 'an unknown field' );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Replacing', () =>
		{

			it( 'should replace the first occurrence with $replaceOne', async () =>
			{
				assert.strictEqual(
					await evaluated( { $replaceOne: { input: '$s', find: 'l', replacement: 'L' } } ),
					'HeLlo' );
				// A find which does not occur returns the input unchanged.
				assert.strictEqual(
					await evaluated( { $replaceOne: { input: '$s', find: 'z', replacement: 'Z' } } ),
					'Hello' );
			} );

			it( 'should replace every occurrence with $replaceAll', async () =>
			{
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: '$s', find: 'l', replacement: 'L' } } ),
					'HeLLo' );
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: '$s', find: 'z', replacement: 'Z' } } ),
					'Hello' );
			} );

			it( 'should match literally rather than as a pattern', async () =>
			{
				// The find is a string, not a regular expression, so '.' is a full stop.
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: 'a.b', find: '.', replacement: '-' } } ),
					'a-b' );
			} );

			it( 'should propagate null through the replace operators', async () =>
			{
				assert.strictEqual(
					await evaluated( { $replaceOne: { input: '$empty', find: 'l', replacement: 'L' } } ), null );
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: '$nope', find: 'l', replacement: 'L' } } ), null );
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: '$s', find: null, replacement: 'L' } } ), null );
				assert.strictEqual(
					await evaluated( { $replaceAll: { input: '$s', find: 'l', replacement: null } } ), null );
			} );

			it( 'should refuse a bad replace argument', async () =>
			{
				assert.ok( await refused( { $replaceAll: '$s' } ), 'an argument which is not a document' );
				assert.ok( await refused( { $replaceAll: { find: 'l', replacement: 'L' } } ), 'no input' );
				assert.ok( await refused( { $replaceAll: { input: '$s', replacement: 'L' } } ), 'no find' );
				assert.ok( await refused( { $replaceAll: { input: '$s', find: 'l' } } ), 'no replacement' );
				assert.ok( await refused( { $replaceAll: { input: '$n', find: 'l', replacement: 'L' } } ), 'a non string input' );
				assert.ok( await refused( { $replaceAll: { input: '$s', find: 'l', replacement: 'L', nope: 1 } } ), 'an unknown field' );
			} );

		} );

	} );

};
