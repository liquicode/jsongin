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


} );
