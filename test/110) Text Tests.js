'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' );


describe( '110) Text Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'Compare Tests (case sensitive)', () =>
	{

		it( 'should compare text', () => 
		{
			assert.ok( jsongin.Text.Compare( 'a', 'a', true ) === 0 );
			assert.ok( jsongin.Text.Compare( 'a', 'A', true ) === -1 );
			assert.ok( jsongin.Text.Compare( 'A', 'a', true ) === 1 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Compare Tests (case insensitive)', () =>
	{

		it( 'should compare text', () => 
		{
			assert.ok( jsongin.Text.Compare( 'a', 'a', false ) === 0 );
			assert.ok( jsongin.Text.Compare( 'a', 'A', false ) === 0 );
			assert.ok( jsongin.Text.Compare( 'A', 'a', false ) === 0 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'FindBetween Tests (case sensitive)', () =>
	{

		it( 'should find the entire string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', '', '', true ) === 'The red fox' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', null, null, true ) === 'The red fox' );
		} );

		it( 'should find text at start of string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', '', ' ', true ) === 'The' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', null, ' ', true ) === 'The' );
		} );

		it( 'should find text in middle of string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', true ) === ' red ' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', true ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'FindBetween Tests (case insensitive)', () =>
	{

		it( 'should find the entire string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', '', '', false ) === 'The red fox' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', null, null, false ) === 'The red fox' );
		} );

		it( 'should find text at start of string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', '', ' ', false ) === 'The' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', null, ' ', false ) === 'The' );
		} );

		it( 'should find text in middle of string', () => 
		{
			assert.ok( jsongin.Text.FindBetween( 'The red fox', 'The', 'fox', false ) === ' red ' );
			assert.ok( jsongin.Text.FindBetween( 'The red fox', 'THE', 'FOX', false ) === ' red ' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Matches Tests (case sensitive)', () =>
	{

		it( 'should match entire string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'The red fox', 'The red fox', true ) === true );
			assert.ok( jsongin.Text.Matches( 'The red fox', 'Not the red fox', true ) === false );
		} );

		it( 'should match text at start of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'The red fox', 'The *', true ) === true );
		} );

		it( 'should match text in middle of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'The red fox', 'The * fox', true ) === true );
		} );

		it( 'should match text at end of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'The red fox', '* fox', true ) === true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Matches Tests (case insensitive)', () =>
	{

		it( 'should match entire string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'THE RED FOX', 'The red fox', false ) === true );
			assert.ok( jsongin.Text.Matches( 'THE RED FOX', 'Not the red fox', false ) === false );
		} );

		it( 'should match text at start of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'THE RED FOX', 'The *', false ) === true );
		} );

		it( 'should match text in middle of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'THE RED FOX', 'The * fox', false ) === true );
		} );

		it( 'should match text at end of string', () => 
		{
			assert.ok( jsongin.Text.Matches( 'THE RED FOX', '* fox', false ) === true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SearchReplacements Tests (case sensitive)', () =>
	{

		it( 'should replace entire string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'The red fox', { 'The red fox': 'A blue dog' }, true ) === 'A blue dog' );
		} );

		it( 'should replace text at start of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A' }, true ) === 'A red fox' );
		} );

		it( 'should replace text in middle of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'The red fox', { 'red': 'blue' }, true ) === 'The blue fox' );
		} );

		it( 'should replace text at end of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'The red fox', { 'fox': 'dog' }, true ) === 'The red dog' );
		} );

		it( 'should replace multiple strings', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'The red fox', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, true ) === 'A blue dog' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SearchReplacements Tests (case insensitive)', () =>
	{

		it( 'should replace entire string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The red fox': 'A blue dog' }, false ) === 'A blue dog' );
		} );

		it( 'should replace text at start of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A' }, false ) === 'A RED FOX' );
		} );

		it( 'should replace text in middle of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'THE RED FOX', { 'red': 'blue' }, false ) === 'THE blue FOX' );
		} );

		it( 'should replace text at end of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'THE RED FOX', { 'fox': 'dog' }, false ) === 'THE RED dog' );
		} );

		it( 'should replace multiple strings', () => 
		{
			assert.ok( jsongin.Text.SearchReplacements( 'THE RED FOX', { 'The': 'A', 'red': 'blue', 'fox': 'dog' }, false ) === 'A blue dog' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SearchReplace Tests (case sensitive)', () =>
	{

		it( 'should replace entire string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'The red fox', 'The red fox', 'A blue dog', true ) === 'A blue dog' );
		} );

		it( 'should replace text at start of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'The red fox', 'The', 'A', true ) === 'A red fox' );
		} );

		it( 'should replace text in middle of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'The red fox', 'red', 'blue', true ) === 'The blue fox' );
		} );

		it( 'should replace text at end of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'The red fox', 'fox', 'dog', true ) === 'The red dog' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'SearchReplace Tests (case insensitive)', () =>
	{

		it( 'should replace entire string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'THE RED FOX', 'The red fox', 'A blue dog', false ) === 'A blue dog' );
		} );

		it( 'should replace text at start of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'THE RED FOX', 'The', 'A', false ) === 'A RED FOX' );
		} );

		it( 'should replace text in middle of string', () => 
		{
			assert.ok( jsongin.Text.SearchReplace( 'THE RED FOX', 'red', 'blue', false ) === 'THE blue FOX' );
		} );

		it( 'should replace text at end of string', () =>
		{
			assert.ok( jsongin.Text.SearchReplace( 'THE RED FOX', 'fox', 'dog', false ) === 'THE RED dog' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Regular Expression Characters in the Search Text', () =>
	{

		/*
			The search text was joined straight into a regular expression, so its characters
			were interpreted rather than matched. Searching for 'a.b' also matched 'axb', and
			the replacement lookup for that match then failed and wrote the text 'undefined'.
			A search for '(' threw a SyntaxError while the expression was being built.
		*/

		it( 'should match a metacharacter as itself', () =>
		{
			assert.strictEqual( jsongin.Text.SearchReplace( 'a.b axb', 'a.b', 'X' ), 'X axb' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a+b', '+', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a*b', '*', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a?b', '?', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a|b', '|', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a^b', '^', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a$b', '$', '-' ), 'a-b' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a\\b', '\\', '/' ), 'a/b' );
		} );

		it( 'should not throw on a search text which is not a valid expression', () =>
		{
			assert.strictEqual( jsongin.Text.SearchReplace( 'c(d)', '(', '[' ), 'c[d)' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a[b]', '[', ' ' ), 'a b]' );
			assert.strictEqual( jsongin.Text.SearchReplace( 'a{2}', '{', '(' ), 'a(2}' );
		} );

		it( 'should never write the text undefined into the result', () =>
		{
			assert.strictEqual( jsongin.Text.SearchReplace( 'a.b axb', 'a.b', 'X' ).includes( 'undefined' ), false );
		} );

		it( 'should escape the search text when matching without regard to case', () =>
		{
			assert.strictEqual( jsongin.Text.SearchReplace( 'A.B AXB', 'a.b', 'X', false ), 'X AXB' );
		} );

		it( 'should escape every key of a replacement map', () =>
		{
			assert.strictEqual( jsongin.Text.SearchReplacements( 'a.b|c', { 'a.b': '1', '|': '2' } ), '12c' );
		} );

		it( 'should return the text unchanged for an empty replacement map', () =>
		{
			// An empty expression otherwise matches at every position.
			assert.strictEqual( jsongin.Text.SearchReplacements( 'abc', {} ), 'abc' );
			assert.strictEqual( jsongin.Text.SearchReplacements( 'abc', null ), 'abc' );
			assert.strictEqual( jsongin.Text.SearchReplacements( 'abc', undefined ), 'abc' );
		} );

		it( 'should reject parameters of the wrong type', () =>
		{
			assert.throws( function () { jsongin.Text.SearchReplacements( 42, { a: 'b' } ); }, /must be a string/ );
			assert.throws( function () { jsongin.Text.SearchReplace( 'abc', 42, 'b' ); }, /must be a string/ );
		} );

		it( 'should reject Matches parameters of the wrong type', () =>
		{
			// Matches was the one function here which did not validate, so a non string
			// surfaced as a raw TypeError from .replace() rather than a described error.
			assert.throws( function () { jsongin.Text.Matches( 'abc', 123 ); }, /must be a string/ );
			assert.throws( function () { jsongin.Text.Matches( 123, 'abc' ); }, /must be a string/ );
			assert.throws( function () { jsongin.Text.Matches( 'abc', null ); }, /must be a string/ );
			assert.throws( function () { jsongin.Text.Matches( 'abc' ); }, /must be a string/ );

			// The error is an Error, not a TypeError leaking from the implementation.
			assert.throws( function () { jsongin.Text.Matches( 'abc', 123 ); },
				function ( Error_ ) { return ( Error_.constructor === Error ); } );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Detached Function Tests', () =>
	{

		// SearchReplace called its sibling SearchReplacements through `this`, so it threw
		// whenever it was called as anything other than a member of the Text object.

		it( 'should support SearchReplace when detached', () =>
		{
			let search_replace = jsongin.Text.SearchReplace;
			assert.strictEqual( search_replace( 'a-b-c', '-', '+' ), 'a+b+c' );
			assert.strictEqual( search_replace( 'THE RED FOX', 'red', 'blue', false ), 'THE blue FOX' );
		} );

		it( 'should support SearchReplace as a callback', () =>
		{
			let values = [ 'a-1', 'b-2' ];
			let search_replace = jsongin.Text.SearchReplace;
			let replaced = values.map( function ( Value ) { return search_replace( Value, '-', '=' ); } );
			assert.deepStrictEqual( replaced, [ 'a=1', 'b=2' ] );
		} );

		it( 'should support every Text function when detached', () =>
		{
			let compare = jsongin.Text.Compare;
			let find_between = jsongin.Text.FindBetween;
			let matches = jsongin.Text.Matches;
			let search_replacements = jsongin.Text.SearchReplacements;

			assert.strictEqual( compare( 'a', 'b' ), -1 );
			assert.strictEqual( find_between( '[x]', '[', ']' ), 'x' );
			assert.strictEqual( matches( 'abc', 'a*' ), true );
			assert.strictEqual( search_replacements( 'a-b-c', { '-': '+' } ), 'a+b+c' );
		} );

	} );


} );
