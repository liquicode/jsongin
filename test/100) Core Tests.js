'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' );


describe( '100) Core Tests', () =>
{


	//---------------------------------------------------------------------
	describe( 'ShortType Tests', () =>
	{

		it( 'should support (b)oolean short type', () => 
		{
			assert.ok( jsongin.ShortType( true ) === 'b' );
			assert.ok( jsongin.ShortType( false ) === 'b' );
		} );
		it( 'should support (n)umeric short type', () => 
		{
			assert.ok( jsongin.ShortType( 42 ) === 'n' );
			assert.ok( jsongin.ShortType( 42.0 ) === 'n' );
			assert.ok( jsongin.ShortType( 3.14 ) === 'n' );
		} );
		it( 'should support (s)tring short type', () => 
		{
			assert.ok( jsongin.ShortType( '' ) === 's' );
			assert.ok( jsongin.ShortType( 'abc' ) === 's' );
		} );
		it( 'should support nul(l) short type', () => 
		{
			assert.ok( jsongin.ShortType( null ) === 'l' );
		} );
		it( 'should support (o)bject short type', () => 
		{
			assert.ok( jsongin.ShortType( {} ) === 'o' );
			assert.ok( jsongin.ShortType( { value: 1 } ) === 'o' );
		} );
		it( 'should support (a)rray short type', () => 
		{
			assert.ok( jsongin.ShortType( [] ) === 'a' );
			assert.ok( jsongin.ShortType( [ 1, 2, 3 ] ) === 'a' );
		} );
		it( 'should support (f)unction short type', () => 
		{
			assert.ok( jsongin.ShortType( function () { } ) === 'f' );
		} );
		it( 'should support (r)egex short type', () => 
		{
			assert.ok( jsongin.ShortType( /test/ ) === 'r' );
		} );
		it( 'should support (u)ndefined short type', () =>
		{
			assert.ok( jsongin.ShortType() === 'u' );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'AsNumber Tests', () =>
	{

		it( 'should convert numeric values', () =>
		{
			assert.ok( jsongin.AsNumber( 42 ) === 42 );
			assert.ok( jsongin.AsNumber( 3.14 ) === 3.14 );
			assert.ok( jsongin.AsNumber( -7 ) === -7 );
			assert.ok( jsongin.AsNumber( Infinity ) === Infinity );
		} );

		it( 'should convert zero, which is a number and not a missing value', () =>
		{
			assert.ok( jsongin.AsNumber( 0 ) === 0 );
			assert.ok( jsongin.AsNumber( -0 ) === 0 );
			assert.ok( jsongin.AsNumber( '0' ) === 0 );
			assert.ok( jsongin.AsNumber( '0.0' ) === 0 );
		} );

		it( 'should convert numeric string values', () =>
		{
			assert.ok( jsongin.AsNumber( '42' ) === 42 );
			assert.ok( jsongin.AsNumber( '3.14' ) === 3.14 );
			assert.ok( jsongin.AsNumber( ' 42 ' ) === 42 );
			assert.ok( jsongin.AsNumber( '-7' ) === -7 );
		} );

		it( 'should return null for non-numeric string values', () =>
		{
			assert.ok( jsongin.AsNumber( 'abc' ) === null );
			assert.ok( jsongin.AsNumber( '42abc' ) === null );
			assert.ok( jsongin.AsNumber( '' ) === null );
			assert.ok( jsongin.AsNumber( '   ' ) === null );
		} );

		it( 'should return null for boolean values', () =>
		{
			// Javascript would convert these to 1 and 0.
			assert.ok( jsongin.AsNumber( true ) === null );
			assert.ok( jsongin.AsNumber( false ) === null );
		} );

		it( 'should return null for objects and arrays', () =>
		{
			// Javascript would convert [] to 0 and [ 5 ] to 5.
			assert.ok( jsongin.AsNumber( [] ) === null );
			assert.ok( jsongin.AsNumber( [ 5 ] ) === null );
			assert.ok( jsongin.AsNumber( {} ) === null );
			assert.ok( jsongin.AsNumber( { value: 5 } ) === null );
		} );

		it( 'should return null for missing and invalid values', () =>
		{
			assert.ok( jsongin.AsNumber( null ) === null );
			assert.ok( jsongin.AsNumber( undefined ) === null );
			assert.ok( jsongin.AsNumber() === null );
			assert.ok( jsongin.AsNumber( NaN ) === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'AsBoolean Tests', () =>
	{

		it( 'should return boolean values unchanged', () =>
		{
			assert.ok( jsongin.AsBoolean( true ) === true );
			assert.ok( jsongin.AsBoolean( false ) === false );
		} );

		it( 'should treat zero as false and other numbers as true', () =>
		{
			assert.ok( jsongin.AsBoolean( 0 ) === false );
			assert.ok( jsongin.AsBoolean( 1 ) === true );
			assert.ok( jsongin.AsBoolean( -1 ) === true );
			assert.ok( jsongin.AsBoolean( 3.14 ) === true );
		} );

		it( 'should treat null and missing values as false', () =>
		{
			assert.ok( jsongin.AsBoolean( null ) === false );
			assert.ok( jsongin.AsBoolean( undefined ) === false );
			assert.ok( jsongin.AsBoolean() === false );
		} );

		it( 'should treat the empty string and the empty array as true', () =>
		{
			// Javascript would treat the empty string as false.
			assert.ok( jsongin.AsBoolean( '' ) === true );
			assert.ok( jsongin.AsBoolean( [] ) === true );
		} );

		it( 'should treat other values as true', () =>
		{
			assert.ok( jsongin.AsBoolean( 'abc' ) === true );
			assert.ok( jsongin.AsBoolean( {} ) === true );
			assert.ok( jsongin.AsBoolean( [ 1, 2 ] ) === true );
			assert.ok( jsongin.AsBoolean( new Date() ) === true );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'AsDate Tests', () =>
	{

		it( 'should convert numeric timestamps', () =>
		{
			assert.ok( jsongin.AsDate( 1 ).getTime() === 1 );
			assert.ok( jsongin.AsDate( 1700000000000 ).getTime() === 1700000000000 );
		} );

		it( 'should convert the zero timestamp, which is a date and not a missing value', () =>
		{
			let date = jsongin.AsDate( 0 );
			assert.ok( date !== null );
			assert.ok( date.getTime() === 0 );
		} );

		it( 'should convert date string values', () =>
		{
			assert.ok( jsongin.AsDate( '2024-01-01T00:00:00.000Z' ).toISOString() === '2024-01-01T00:00:00.000Z' );
		} );

		it( 'should convert Date objects', () =>
		{
			let date = new Date( '2024-01-01T00:00:00.000Z' );
			assert.ok( jsongin.AsDate( date ).getTime() === date.getTime() );
		} );

		it( 'should return null for values which are not dates', () =>
		{
			assert.ok( jsongin.AsDate( 'abc' ) === null );
			assert.ok( jsongin.AsDate( '' ) === null );
			assert.ok( jsongin.AsDate( '   ' ) === null );
			assert.ok( jsongin.AsDate( true ) === null );
			assert.ok( jsongin.AsDate( false ) === null );
			assert.ok( jsongin.AsDate( {} ) === null );
			assert.ok( jsongin.AsDate( [] ) === null );
			assert.ok( jsongin.AsDate( null ) === null );
			assert.ok( jsongin.AsDate( undefined ) === null );
			assert.ok( jsongin.AsDate() === null );
		} );

	} );


	//---------------------------------------------------------------------
	describe( `Parse Tests`, function ()
	{


		//---------------------------------------------------------------------
		describe( `Equivalence with Javascript's JSON.parse()`, function ()
		{


			//---------------------------------------------------------------------
			it( `should parse boolean value: true`, function ()
			{
				let result1 = JSON.parse( 'true' );
				let result = jsongin.Parse( 'true' );
				assert.equal( result, true );
				assert.equal( result, result1 );
			} );


			//---------------------------------------------------------------------
			it( `should parse number value: 3.14`, function ()
			{
				let result1 = JSON.parse( '3.14' );
				let result = jsongin.Parse( '3.14' );
				assert.equal( result, 3.14 );
				assert.equal( result, result1 );
			} );


			//---------------------------------------------------------------------
			it( `should parse string value: "text"`, function ()
			{
				let result1 = JSON.parse( '"text"' );
				let result = jsongin.Parse( '"text"' );
				assert.equal( result, "text" );
				assert.equal( result, result1 );
			} );


			//---------------------------------------------------------------------
			it( `should parse empty array: []`, function ()
			{
				let result1 = JSON.parse( '[]' );
				let result = jsongin.Parse( '[]' );
				assert.equal( typeof result, 'object' );
				assert.equal( Array.isArray( result ), true );
				assert.equal( JSON.stringify( result ), JSON.stringify( result1 ) );
			} );


			//---------------------------------------------------------------------
			it( `should parse empty object: {}`, function ()
			{
				let result1 = JSON.parse( '{}' );
				let result = jsongin.Parse( '{}' );
				assert.equal( typeof result, 'object' );
				assert.equal( JSON.stringify( result ), JSON.stringify( result1 ) );
			} );


			//---------------------------------------------------------------------
			it( `should parse a complex object`, function ()
			{
				let json = `{"id":1001, "user":{"name":"Alice","location":"East"}, "profile":{"login":"alice","role":"admin"}, "tags":["Staff", "Dept. A"]}`;
				let result1 = JSON.parse( json );
				let result = jsongin.Parse( json );
				assert.equal( typeof result, 'object' );
				assert.equal( JSON.stringify( result ), JSON.stringify( result1 ) );
			} );


			//---------------------------------------------------------------------
			it( `should parse multi-line text`, function ()
			{
				let json = `
				{ 
					"id":1001,
					"user":
					{
						"name": "Alice",
						"location":"East"
					},
					"profile":
					{
						"login":"alice",
						"role":"admin"
					},
					"tags":
					[
						"Staff",
						"Dept. A"
					]
				}`;
				let result1 = JSON.parse( json );
				let result = jsongin.Parse( json );
				assert.equal( typeof result, 'object' );
				assert.equal( JSON.stringify( result ), JSON.stringify( result1 ) );
			} );


			//---------------------------------------------------------------------
			it( `should parse javascript object syntax`, function ()
			{
				let json = `
				{ 
					id: 1001,
					user:
					{
						name:     "Alice",
						location: "East",
					},
					profile:
					{
						login: "alice",
						role:  "admin",
					},
					tags:
					[
						"Staff",
						"Dept. A",
					],
				}`;
				let result = jsongin.Parse( json );
				assert.ok( result );
				assert.strictEqual( result.id, 1001 );
				assert.strictEqual( result.user.name, 'Alice' );
				assert.strictEqual( result.user.location, 'East' );
				assert.strictEqual( result.profile.login, 'alice' );
				assert.strictEqual( result.profile.role, 'admin' );
				assert.strictEqual( result.tags[ 0 ], 'Staff' );
				assert.strictEqual( result.tags[ 1 ], 'Dept. A' );
			} );


		} );


		//---------------------------------------------------------------------
		describe( `Functionality Beyond Javascript's JSON.parse()`, function ()
		{


			//---------------------------------------------------------------------
			it( `It should parse an object written with JS (not JSON) syntax`, function ()
			{
				let text = `{ id: 1001, user: { name : 'Alice', location: 'East' }, profile: { login: 'alice', role: 'admin' }, tags: [ 'Staff', 'Dept. A' ] }`;
				let result = jsongin.Parse( text );
				assert.ok( result );
				assert.equal( result.id, 1001 );
				assert.equal( result.user.name, 'Alice' );
				assert.equal( result.user.location, 'East' );
				assert.equal( result.profile.login, 'alice' );
				assert.equal( result.profile.role, 'admin' );
				assert.equal( result.tags.length, 2 );
				assert.equal( result.tags[ 0 ], 'Staff' );
				assert.equal( result.tags[ 1 ], 'Dept. A' );
			} );


			//---------------------------------------------------------------------
			it( `It should parse an object followed by unrelated text`, function ()
			{
				let text = `{ id: 1001 } // This is an example.`;
				let result = jsongin.Parse( text );
				assert.ok( result );
				assert.equal( result.id, 1001 );
			} );


			//---------------------------------------------------------------------
			it( `It should read the bare literals`, function ()
			{
				assert.deepStrictEqual( jsongin.Parse( '[true,false,null]' ), [ true, false, null ] );
				assert.strictEqual( jsongin.Parse( 'null' ), null );
				assert.strictEqual( jsongin.Parse( 'false' ), false );
				// The literals are matched without regard to case, unlike JSON.
				assert.deepStrictEqual( jsongin.Parse( '[TRUE,False,NULL]' ), [ true, false, null ] );
			} );


		} );


		//---------------------------------------------------------------------
		describe( `Escape Sequences`, function ()
		{

			/*
				The tokenizer used to drop the backslash and take the next character as it found
				it, which turned \n into the letter n.
			*/

			it( `should decode the escapes which JSON defines`, function ()
			{
				let cases = [
					'{"a":"x\\ny"}',
					'{"a":"x\\ty"}',
					'{"a":"x\\ry"}',
					'{"a":"x\\by"}',
					'{"a":"x\\fy"}',
					'{"a":"q\\"q"}',
					'{"a":"b\\\\c"}',
					'{"a":"s\\/s"}',
					'{"a":"x\\u0041y"}',
				];
				for ( let index = 0; index < cases.length; index++ )
				{
					assert.deepStrictEqual(
						jsongin.Parse( cases[ index ] ),
						JSON.parse( cases[ index ] ),
						`Parse disagreed with JSON.parse on [${cases[ index ]}].` );
				}
			} );

			it( `should decode an escaped quote inside a single quoted string`, function ()
			{
				assert.deepStrictEqual( jsongin.Parse( `{ a: 'it\\'s' }` ), { a: `it's` } );
			} );

			it( `should read an unrecognized escape as the character itself`, function ()
			{
				assert.deepStrictEqual( jsongin.Parse( '{"a":"\\q"}' ), { a: 'q' } );
			} );

			it( `should round trip an escaped value through Format and Parse`, function ()
			{
				let values = [
					'', 'plain', 'x"y"z', 'a\nb', 'back\\slash', 'tab\there', 'cr\rlf\n',
					'\b\f', 'café', '\u{1F600}', 'quote " and \\ and \n together', '/slash/',
				];
				for ( let index = 0; index < values.length; index++ )
				{
					let value = values[ index ];
					assert.deepStrictEqual(
						jsongin.Parse( jsongin.Format( { v: value } ) ),
						{ v: value },
						`The round trip lost [${JSON.stringify( value )}].` );
				}
			} );

		} );


		//---------------------------------------------------------------------
		describe( `Forgiving Parsing`, function ()
		{

			/*
				Parse never throws. A string it cannot read comes back unchanged and the reason
				goes to OpLog. Several of these used to be a raw TypeError, thrown by
				dereferencing a token which was not there.
			*/

			it( `should return the string unchanged when it cannot be read`, function ()
			{
				let cases = [ '', '"abc', '[', '{ bad', '{a:', '[1,2', '{"a" "b"}', '{"a":"\\u00zz"}' ];
				for ( let index = 0; index < cases.length; index++ )
				{
					assert.strictEqual( jsongin.Parse( cases[ index ] ), cases[ index ] );
				}
			} );

			it( `should return an argument which is not a string unchanged`, function ()
			{
				let document = { a: 1 };
				assert.strictEqual( jsongin.Parse( 42 ), 42 );
				assert.strictEqual( jsongin.Parse( null ), null );
				assert.strictEqual( jsongin.Parse( undefined ), undefined );
				assert.strictEqual( jsongin.Parse( document ), document );
			} );

			it( `should never throw, whatever it is given`, function ()
			{
				let cases = [ '', '[', ']', '{', '}', ':', ',', '"', `'`, '\\', '{a', '{a:',
					'{a:}', '[,]', '{:1}', '{"a"}', '[[[[', '}}}}', '{"a":"\\u12"}', '"\\', '   ' ];
				for ( let index = 0; index < cases.length; index++ )
				{
					assert.doesNotThrow(
						function () { jsongin.Parse( cases[ index ] ); },
						`Parse threw on [${cases[ index ]}].` );
				}
			} );

			it( `should report the reason to OpLog`, function ()
			{
				let messages = [];
				let engine = jsongin.NewJsongin( { OpLog: function ( Message ) { messages.push( Message ); } } );

				engine.Parse( '{ bad' );
				assert.strictEqual( messages.length, 1 );
				assert.ok( messages[ 0 ].startsWith( 'Parse: ' ), `Parse reported [${messages[ 0 ]}].` );
				assert.ok( messages[ 0 ].includes( 'returned unchanged' ) );

				engine.Parse( 42 );
				assert.strictEqual( messages.length, 2 );
				assert.ok( messages[ 1 ].includes( 'must be a string' ) );
			} );

			it( `should stay silent when no OpLog is configured`, function ()
			{
				assert.strictEqual( jsongin.Parse( '{ bad' ), '{ bad' );
			} );

		} );


	} );


	//---------------------------------------------------------------------
	describe( `Format Tests`, function ()
	{


		//---------------------------------------------------------------------
		describe( `Stringify Primitives`, function ()
		{
			it( `should stringify null [null]`, function ()
			{
				let result = jsongin.Format( null );
				assert.strictEqual( result, 'null' );
			} );
			it( `should stringify empty string [""]`, function ()
			{
				let result = jsongin.Format( "" );
				assert.strictEqual( result, '""' );
			} );
			it( `should stringify empty array [[]]`, function ()
			{
				let result = jsongin.Format( [] );
				assert.strictEqual( result, '[]' );
			} );
			it( `should stringify empty object [{}]`, function ()
			{
				let result = jsongin.Format( {} );
				assert.strictEqual( result, '{}' );
			} );
			it( `should stringify [true]`, function ()
			{
				let result = jsongin.Format( true );
				assert.strictEqual( result, 'true' );
			} );
			it( `should stringify [3.14]`, function ()
			{
				let result = jsongin.Format( 3.14 );
				assert.strictEqual( result, '3.14' );
			} );
			it( `should stringify ["Hello World!"]`, function ()
			{
				let result = null;

				result = JSON.stringify( "Hello World!" );
				assert.strictEqual( result, `"Hello World!"` );

				result = jsongin.Format( "Hello World!" );
				assert.strictEqual( result, `"Hello World!"` );
			} );
		} );


		//---------------------------------------------------------------------
		describe( `Equivalence with Javascript's JSON.stringify()`, function ()
		{
			it( `should stringify null the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( null ),
					JSON.stringify( null )
				);
			} );
			it( `should stringify empty string "" the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( "" ),
					JSON.stringify( "" )
				);
			} );
			it( `should stringify empty array [] the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( [] ),
					JSON.stringify( [] )
				);
			} );
			it( `should stringify empty object {} the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( {} ),
					JSON.stringify( {} )
				);
			} );
			it( `should stringify true the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( true ),
					JSON.stringify( true )
				);
			} );
			it( `should stringify 3.14 the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( 3.14 ),
					JSON.stringify( 3.14 )
				);
			} );
			it( `should stringify "Hello World!" the same way`, function ()
			{
				assert.strictEqual(
					jsongin.Format( "Hello World!" ),
					JSON.stringify( "Hello World!" )
				);
			} );

			//---------------------------------------------------------------------
			it( `should stringify complex objects in the same way`, function ()
			{
				let document = {
					id: 1001,
					user: {
						name: 'Alice',
						location: 'East',
					},
					profile: {
						login: 'alice',
						role: 'admin',
					},
					tags: [ 'Staff', 'Dept. A' ]
				};
				let text = jsongin.Format( document );
				assert.strictEqual(
					jsongin.Format( document ),
					JSON.stringify( document )
				);
			} );

			//---------------------------------------------------------------------
			it( `should stringify (with whitespace) complex objects in the same way`, function ()
			{
				let document = {
					id: 1001,
					user: {
						name: 'Alice',
						location: 'East',
					},
					profile: {
						login: 'alice',
						role: 'admin',
					},
					tags: [ 'Staff', 'Dept. A' ]
				};
				let text = jsongin.Format( document, true );
				assert.strictEqual(
					jsongin.Format( document, true ),
					JSON.stringify( document, null, '    ' )
				);
			} );


			/*
				Only the first quote used to be escaped, and the backslash and the control
				characters were not escaped at all, so the output could not be read back.
			*/

			//---------------------------------------------------------------------
			it( `should escape a string value the same way`, function ()
			{
				let values = [
					'', 'plain', 'x"y"z', 'a\nb', 'back\\slash', 'tab\there', 'cr\rlf\n',
					'\b\f', '\u0000\u001f', '\u007f', '\u2028\u2029', 'café',
					'\u{1F600}', '\uD800', '\uDC00', 'a\uD800b',
					'quote " and \\ and \n together', '/slash/',
				];
				for ( let index = 0; index < values.length; index++ )
				{
					assert.strictEqual(
						jsongin.Format( values[ index ] ),
						JSON.stringify( values[ index ] ),
						`Format disagreed on [${JSON.stringify( values[ index ] )}].` );
				}
			} );

			//---------------------------------------------------------------------
			it( `should escape a field name the same way`, function ()
			{
				let documents = [ { 'a"b': 1 }, { 'a\nb': 1 }, { 'a\\b': 1 }, { '': 1 }, { 'a\tb': 1 } ];
				for ( let index = 0; index < documents.length; index++ )
				{
					assert.strictEqual(
						jsongin.Format( documents[ index ] ),
						JSON.stringify( documents[ index ] ),
						`Format disagreed on [${JSON.stringify( documents[ index ] )}].` );
				}
			} );

			//---------------------------------------------------------------------
			it( `should produce output which JSON.parse() can read back`, function ()
			{
				let document = {
					id: 1,
					'he said "this"': 'and \\ this \n and\tthis',
					list: [ 'a\\b', { 'k\ty': null } ],
				};
				assert.deepStrictEqual( JSON.parse( jsongin.Format( document ) ), document );
			} );


		} );


		//---------------------------------------------------------------------
		describe( `Functionality Beyond Javascript's JSON.stringify()`, function ()
		{


			//---------------------------------------------------------------------
			it( `should stringify complex objects with Javascript syntax`, function ()
			{
				let document = {
					id: 1001,
					user: {
						name: 'Alice',
						location: 'East',
					},
					profile: {
						login: 'alice',
						role: 'admin',
					},
					tags: [ 'Staff', 'Dept. A' ]
				};
				let text = jsongin.Format( document, true, true );
				assert.strictEqual(
					jsongin.Format( document, true, true ),
					`{
    id:      1001,
    user:    
    {
        name:     "Alice",
        location: "East",
    },
    profile: 
    {
        login: "alice",
        role:  "admin",
    },
    tags:    
    [
        "Staff",
        "Dept. A",
    ],
}`
				);
			} );


		} );


	} );


	//---------------------------------------------------------------------
	describe( 'SplitPath Tests', () =>
	{


		it( 'It returns an array of path components', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath( 'user' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 'user' );

			elements = jsongin.SplitPath( 'user.name' );
			assert.ok( elements.length === 2 );
			assert.ok( elements[ 0 ] === 'user' );
			assert.ok( elements[ 1 ] === 'name' );
		} );

		it( 'It returns array indexes as numerics in the output array', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath( '1' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === 1 );

			elements = jsongin.SplitPath( 'users.1' );
			assert.ok( elements.length === 2 );
			assert.ok( elements[ 0 ] === 'users' );
			assert.ok( elements[ 1 ] === 1 );

			elements = jsongin.SplitPath( 'users.1.name' );
			assert.ok( elements.length === 3 );
			assert.ok( elements[ 0 ] === 'users' );
			assert.ok( elements[ 1 ] === 1 );
			assert.ok( elements[ 2 ] === 'name' );
		} );

		it( 'It only converts canonical integer text to an index', () =>
		{
			// AsNumber() also accepts these forms, and using it here turned field names
			// like '01' into array indices, making the field unreachable.
			// Verified against MongoDB 6.0.1: a query on 'a.01' finds { a: { '01': 'x' } }.
			assert.strictEqual( jsongin.SplitPath( '01' )[ 0 ], '01' );
			assert.strictEqual( jsongin.SplitPath( '1e2' )[ 0 ], '1e2' );
			assert.strictEqual( jsongin.SplitPath( '0x10' )[ 0 ], '0x10' );
			assert.strictEqual( jsongin.SplitPath( 'Infinity' )[ 0 ], 'Infinity' );
			assert.strictEqual( jsongin.SplitPath( '+1' )[ 0 ], '+1' );

			// Canonical text still becomes an index.
			assert.strictEqual( jsongin.SplitPath( '0' )[ 0 ], 0 );
			assert.strictEqual( jsongin.SplitPath( '7' )[ 0 ], 7 );
			assert.strictEqual( jsongin.SplitPath( '-1' )[ 0 ], -1 );
		} );

		it( 'It reaches fields whose names look numeric', () =>
		{
			assert.strictEqual( jsongin.GetValue( { '01': 'x' }, '01' ), 'x' );
			assert.strictEqual( jsongin.GetValue( { '1e2': 'x' }, '1e2' ), 'x' );
			assert.strictEqual( jsongin.GetValue( { a: { '01': 'x' } }, 'a.01' ), 'x' );

			let document = {};
			jsongin.SetValue( document, 'a.01', 'x' );
			assert.deepStrictEqual( document, { a: { '01': 'x' } } );
		} );

		it( 'Array indexes within a path can be positive or negative', () =>
		{
			let elements = null;

			elements = jsongin.SplitPath( '-1' );
			assert.ok( elements.length === 1 );
			assert.ok( elements[ 0 ] === -1 );

			elements = jsongin.SplitPath( 'users.-1' );
			assert.ok( elements.length === 2 );
			assert.ok( elements[ 0 ] === 'users' );
			assert.ok( elements[ 1 ] === -1 );

			elements = jsongin.SplitPath( 'users.-1.name' );
			assert.ok( elements.length === 3 );
			assert.ok( elements[ 0 ] === 'users' );
			assert.ok( elements[ 1 ] === -1 );
			assert.ok( elements[ 2 ] === 'name' );
		} );

		it( 'If the path is undefined, null, or empty "", then it returns an empty array []', () => 
		{
			let elements = null;

			elements = jsongin.SplitPath();
			assert.ok( elements.length === 0 );

			elements = jsongin.SplitPath( null );
			assert.ok( elements.length === 0 );

			elements = jsongin.SplitPath( '' );
			assert.ok( elements.length === 0 );
		} );

		it( 'It throws an error when an invalid path is given', () => 
		{
			try
			{
				jsongin.SplitPath( true );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path is invalid' ) );
			}
			try
			{
				jsongin.SplitPath( {} );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path is invalid' ) );
			}
			try
			{
				jsongin.SplitPath( [] );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path is invalid' ) );
			}
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'JoinPaths Tests', () =>
	{


		it( 'It returns a combined path in dot-notation', () => 
		{
			assert.strictEqual( jsongin.JoinPaths( 'user' ), 'user' );
			assert.strictEqual( jsongin.JoinPaths( 'user', 'name' ), 'user.name' );
		} );

		it( 'It allows numeric array indexes', () => 
		{
			assert.strictEqual( jsongin.JoinPaths( 'users', 1, 'name' ), 'users.1.name' );
		} );

		it( 'It allows document paths', () => 
		{
			assert.strictEqual( jsongin.JoinPaths( 'users.1', 'name' ), 'users.1.name' );
		} );

		it( 'It allows an array of document paths', () => 
		{
			assert.strictEqual( jsongin.JoinPaths( [ 'users', 1, 'name' ] ), 'users.1.name' );
			assert.strictEqual( jsongin.JoinPaths( [ 'users.1', 'name' ] ), 'users.1.name' );
			assert.strictEqual( jsongin.JoinPaths( 'users', [ 1, 'name' ] ), 'users.1.name' );
		} );

		it( 'Undefined and nulls are ignored', () => 
		{
			assert.strictEqual( jsongin.JoinPaths( 'users', undefined, 'name' ), 'users.name' );
			assert.strictEqual( jsongin.JoinPaths( 'users', null, 'name' ), 'users.name' );
		} );

		it( 'It throws an error when an invalid path segment is given', () => 
		{
			try
			{
				jsongin.JoinPaths( 'users', { a: 1 }, 'name' );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path segment is invalid' ) );
			}
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'GetValue Tests', () =>
	{


		it( 'It returns fields from a document', () => 
		{
			let document = {
				id: 101,
				user: {
					name: 'Alice'
				},
			};
			assert.strictEqual( jsongin.GetValue( document, 'id' ), 101 );
			assert.strictEqual( jsongin.GetValue( document, 'user.name' ), 'Alice' );
		} );

		it( 'It returns elements of an array', () => 
		{
			let document = [ 'one', 'two', 'three' ];
			assert.strictEqual( jsongin.GetValue( document, '0' ), 'one' );
			assert.strictEqual( jsongin.GetValue( document, '1' ), 'two' );
			assert.strictEqual( jsongin.GetValue( document, '-1' ), 'three' );
		} );

		it( 'It returns fields from inside an array of objects', () => 
		{
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ id: 102, name: 'Bob' },
					{ id: 103, name: 'Eve' },
				]
			};
			assert.deepStrictEqual( jsongin.GetValue( document, 'users.1' ), { id: 102, name: 'Bob' } );
			assert.strictEqual( jsongin.GetValue( document, 'users.1.name' ), 'Bob' );
			assert.deepStrictEqual( jsongin.GetValue( document, 'users.name' ), [ 'Alice', 'Bob', 'Eve' ] );
		} );

		it( 'It might return undefined array elements when missing data is encountered', () => 
		{
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ xyz: 102, name: 'Bob' },
					{ id: 103, name: 'Eve' },
				]
			};
			assert.strictEqual( jsongin.GetValue( document, 'users.1.id' ), undefined );
			assert.deepStrictEqual( jsongin.GetValue( document, 'users.id' ), [ 101, undefined, 103 ] );
			assert.deepStrictEqual( jsongin.GetValue( document, 'users.name' ), [ 'Alice', 'Bob', 'Eve' ] );
		} );

		it( 'If the path is undefined, null, or empty "", then it returns the entire document', () => 
		{
			assert.strictEqual( jsongin.GetValue( 'abc' ), 'abc' );
			assert.deepStrictEqual( jsongin.GetValue( [ 'one', 'two', 'three' ], null ), [ 'one', 'two', 'three' ] );
			assert.deepStrictEqual( jsongin.GetValue( { id: 101, name: 'Alice' }, '' ), { id: 101, name: 'Alice' } );
		} );

		it( 'If the path is specified but not found, it returns undefined', () => 
		{
			assert.strictEqual( jsongin.GetValue( 'abc', 'score' ), undefined );
			assert.strictEqual( jsongin.GetValue( { id: 101, name: 'Alice' }, 'score' ), undefined );
			assert.strictEqual( jsongin.GetValue( [ 'one', 'two', 'three' ], 3 ), undefined );
		} );

		it( 'It throws an error when an invalid path is given', () => 
		{
			try
			{
				jsongin.GetValue( 'abc', { a: 1 } );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path is invalid' ) );
			}
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'SetValue Tests', () =>
	{
		let data = null;

		it( 'It sets fields in a document', () => 
		{
			let document = {
				id: 101,
				user: {
					name: 'Alice'
				},
			};

			assert.ok( jsongin.SetValue( document, 'id', 'abc' ) );
			assert.strictEqual( document.id, 'abc' );

			assert.ok( jsongin.SetValue( document, 'user.name', 'Bob' ) );
			assert.strictEqual( document.user.name, 'Bob' );
		} );

		it( 'It creates document fields if they don\'t exist', () => 
		{
			let document = { user: { name: 'Alice' } };

			assert.ok( jsongin.SetValue( document, 'user.status', true ) );
			assert.strictEqual( document.user.status, true );

			assert.ok( jsongin.SetValue( document, 'extra', { more: 'data' } ) );
			assert.strictEqual( document.extra.more, 'data' );
		} );

		it( 'It removes document fields when set to undefined', () => 
		{
			let document = { id: 101, user: { name: 'Alice', status: 42 } };

			assert.ok( jsongin.SetValue( document, 'user.status', undefined ) );
			assert.strictEqual( document.user.status, undefined );

			assert.ok( jsongin.SetValue( document, 'id', undefined ) );
			assert.strictEqual( document.id, undefined );
		} );

		it( 'It sets elements of an array', () => 
		{
			let document = [ 'one', 'two', 'three' ];

			assert.ok( jsongin.SetValue( document, 1, 'abc' ) );
			assert.strictEqual( document[ 1 ], 'abc' );

			assert.ok( jsongin.SetValue( document, '1', 'def' ) );
			assert.strictEqual( document[ 1 ], 'def' );
		} );

		it( 'It creates array elements and grows the array if the elements don\'t exist', () => 
		{
			let document = [ 'one', 'two', 'three' ];

			assert.ok( jsongin.SetValue( document, 4, 'xyz' ) );
			assert.strictEqual( document.length, 5 );
			assert.strictEqual( document[ 0 ], 'one' );
			assert.strictEqual( document[ 1 ], 'two' );
			assert.strictEqual( document[ 2 ], 'three' );
			assert.strictEqual( document[ 3 ], undefined );
			assert.strictEqual( document[ 4 ], 'xyz' );
		} );

		it( 'It performs reverse indexing when an array index is negative', () => 
		{
			let document = [ 'one', 'two', 'three' ];
			assert.ok( jsongin.SetValue( document, -1, 'xyz' ) === true );
			assert.strictEqual( document.length, 3 );
			assert.strictEqual( document[ 0 ], 'one' );
			assert.strictEqual( document[ 1 ], 'two' );
			assert.strictEqual( document[ 2 ], 'xyz' );
		} );

		it( 'Array elements can be set to undefined, but they are not removed', () => 
		{
			let document = [ 'one', 'two', 'three' ];

			assert.ok( jsongin.SetValue( document, 1, undefined ) );
			assert.strictEqual( document.length, 3 );
			assert.strictEqual( document[ 0 ], 'one' );
			assert.strictEqual( document[ 1 ], undefined );
			assert.strictEqual( document[ 2 ], 'three' );
		} );

		it( 'It sets fields inside an array of objects', () => 
		{
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ id: 102, name: 'Bob' },
					{ id: 103, name: 'Eve' },
				]
			};

			assert.ok( jsongin.SetValue( document, 'users.1.id', 'abc' ) );
			assert.strictEqual( document.users[ 1 ].id, 'abc' );
		} );

		it( 'It rejects a field name against an array by default', () =>
		{
			// MongoDB rejects this outright, with "Cannot create field 'status' in element
			// {users: [ ... ]}". Verified against MongoDB 6.0.1. Writing into every element
			// is a jsongin path extension, off unless PathExtensions is enabled.
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ id: 102, name: 'Bob' },
				]
			};

			assert.throws( function () { jsongin.SetValue( document, 'users.status', 42 ); }, /Cannot create field/ );
			assert.strictEqual( document.users[ 0 ].status, undefined );
			assert.strictEqual( document.users[ 1 ].status, undefined );
		} );

		it( 'It sets fields inside all elements of an array of objects when PathExtensions is enabled', () =>
		{
			let engine = jsongin.NewJsongin( { PathExtensions: true } );
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ id: 102, name: 'Bob' },
					{ id: 103, name: 'Eve' },
				]
			};

			// Omit the array index to set into each array element.
			assert.ok( engine.SetValue( document, 'users.status', 42 ) );
			assert.strictEqual( document.users[ 0 ].status, 42 );
			assert.strictEqual( document.users[ 1 ].status, 42 );
			assert.strictEqual( document.users[ 2 ].status, 42 );
		} );

		it( 'It still reads through an array by field name, which MongoDB does too', () =>
		{
			// The read side is not gated: MongoDB traverses arrays when resolving a query
			// path, so { 'users.id': 101 } has to match.
			let document = {
				users: [
					{ id: 101 },
					{ id: 102 },
				]
			};

			assert.deepStrictEqual( jsongin.GetValue( document, 'users.id' ), [ 101, 102 ] );
			assert.strictEqual( jsongin.Query( document, { 'users.id': 101 } ), true );
		} );

		it( 'It returns false when an empty path is given', () => 
		{
			let document = { user: { name: 'Alice' } };
			assert.ok( jsongin.SetValue( document, '', 42 ) === false );
		} );

		it( 'It throws an error when an invalid document is given', () => 
		{
			try
			{
				jsongin.SetValue( null, 'user.name', 'Bob' );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Document must be an object or array' ) );
			}
		} );

		it( 'It throws an error when an invalid path is given', () => 
		{
			try
			{
				let document = { user: { name: 'Alice' } };
				jsongin.SetValue( document, true, 42 );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'Path is invalid' ) );
			}
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'SafeClone Tests', () =>
	{

		it( 'It can clone a simple object', () => 
		{
			let doc = { b: true, n: 3.14, s: 'abc' };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.b === true );
			assert.ok( clone.n === 3.14 );
			assert.ok( clone.s === 'abc' );
		} );

		it( 'It can clone nested objects', () => 
		{
			let doc = { o: { b: true, n: 3.14, s: 'abc' } };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.o );
			assert.ok( clone.o.b === true );
			assert.ok( clone.o.n === 3.14 );
			assert.ok( clone.o.s === 'abc' );
		} );

		it( 'It can clone an array', () => 
		{
			let doc = { a: [ 1, 2, 3 ] };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.a );
			assert.ok( clone.a.length === 3 );
			assert.ok( clone.a[ 0 ] === 1 );
			assert.ok( clone.a[ 1 ] === 2 );
			assert.ok( clone.a[ 2 ] === 3 );
		} );

		it( 'It can clone an array of objects', () => 
		{
			let doc = { a: [ { one: 1 }, { two: 2 } ] };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.a );
			assert.ok( clone.a.length = 2 );
			assert.ok( clone.a[ 0 ].one === 1 );
			assert.ok( clone.a[ 1 ].two === 2 );
		} );

		it( 'It can clone non-value fields', () => 
		{
			let doc = { l: null, r: /test/, e: new Error( 'hello' ), f: function () { }, u: undefined };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.l === null );
			assert.ok( clone.r instanceof RegExp );
			assert.ok( clone.e instanceof Error );
			assert.ok( typeof clone.f === 'function' );
			assert.ok( typeof clone.u === 'undefined' );
		} );

		it( 'It can clone dates', () =>
		{
			// A Date has short type 'o' but no enumerable own properties, so a member-wise
			// clone of one would silently produce an empty object.
			let doc = { d: new Date( 1700000000000 ) };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.d instanceof Date );
			assert.strictEqual( clone.d.getTime(), 1700000000000 );
		} );

		it( 'It can clone dates which are nested and within arrays', () =>
		{
			let doc = {
				nested: { d: new Date( 1000 ) },
				list: [ new Date( 2000 ), { d: new Date( 3000 ) } ],
			};

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone );
			assert.ok( clone.nested.d instanceof Date );
			assert.strictEqual( clone.nested.d.getTime(), 1000 );
			assert.ok( clone.list[ 0 ] instanceof Date );
			assert.strictEqual( clone.list[ 0 ].getTime(), 2000 );
			assert.ok( clone.list[ 1 ].d instanceof Date );
			assert.strictEqual( clone.list[ 1 ].d.getTime(), 3000 );
		} );

		it( 'It clones dates by value, not by reference', () =>
		{
			let doc = { d: new Date( 1000 ) };

			let clone = jsongin.SafeClone( doc );
			assert.ok( clone.d !== doc.d );
			clone.d.setTime( 9999 );
			assert.strictEqual( doc.d.getTime(), 1000 );
		} );

		it( 'It can clone a date given as the document itself', () =>
		{
			let clone = jsongin.SafeClone( new Date( 4000 ) );
			assert.ok( clone instanceof Date );
			assert.strictEqual( clone.getTime(), 4000 );
		} );

		it( 'It can selectively clone with the Exceptions parameter', () =>
		{
			let doc = { id: 42, ref: { name: 'Alice' } };

			let clone = jsongin.SafeClone( doc, [ 'ref' ] );
			assert.ok( clone );
			clone.ref.name = 'Bob'; // Changed in both doc and clone
			assert.strictEqual( doc.ref.name, 'Bob' );
		} );

		it( 'It should throw an error if an invalid Exceptions paramter is provided', () => 
		{
			try
			{
				jsongin.SafeClone( { a: 1 }, 42 );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message.startsWith( 'The Exceptions parameter must be a document path' ) );
			}
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Flatten/Expand Tests', () =>
	{


		it( 'It flattens a hierarchical document', () => 
		{
			let document = {
				id: 1001,
				user:
				{
					name: 'Alice',
					location: 'East',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};

			let flattened = jsongin.Flatten( document );
			assert.ok( flattened );
			assert.deepStrictEqual( flattened, {
				id: 1001,
				'user.name': 'Alice',
				'user.location': 'East',
				'tags.0': 'Staff',
				'tags.1': 'Dept. A',
			} );
		} );


		it( 'It preserves empty objects and arrays', () =>
		{
			// An empty container holds no leaf to descend to. It used to contribute nothing
			// to the flattened result and so disappeared from the round trip.
			assert.deepStrictEqual( jsongin.Flatten( { a: {}, b: [] } ), { a: {}, b: [] } );
			assert.deepStrictEqual( jsongin.Flatten( { a: { b: {}, c: 1 } } ), { 'a.b': {}, 'a.c': 1 } );
			assert.deepStrictEqual( jsongin.Flatten( { a: { b: { c: {} } } } ), { 'a.b.c': {} } );
			assert.deepStrictEqual( jsongin.Flatten( { a: [ {} ] } ), { 'a.0': {} } );

			// The root is the exception. There is no path to record it under.
			assert.deepStrictEqual( jsongin.Flatten( {} ), {} );
			assert.deepStrictEqual( jsongin.Flatten( [] ), {} );
		} );

		it( 'It round trips a document containing empty containers', () =>
		{
			let documents = [
				{ a: {}, b: [] },
				{ a: { b: {}, c: 1 } },
				{ a: { b: { c: {} } } },
				{ a: [ {} ] },
				{ a: [ [] ] },
				{ a: { b: [], c: {}, d: null } },
			];
			for ( let index = 0; index < documents.length; index++ )
			{
				let document = documents[ index ];
				assert.deepStrictEqual( jsongin.Expand( jsongin.Flatten( document ) ), document );
			}
		} );

		it( 'The flattened result does not alias its source', () =>
		{
			let document = { a: {} };
			let flattened = jsongin.Flatten( document );
			flattened.a.injected = true;
			assert.deepStrictEqual( document, { a: {} } );
		} );

		// The two round trip limitations documented under Flatten. A dot notation path
		// does not record whether a container was an object or an array, so these are
		// properties of the flat representation rather than defects to be fixed.

		it( 'A document which is itself an array expands back as an object', () =>
		{
			assert.deepStrictEqual( jsongin.Flatten( [ 1, 2, 'three' ] ), { '0': 1, '1': 2, '2': 'three' } );

			let expanded = jsongin.Expand( jsongin.Flatten( [ 1, 2, 'three' ] ) );
			assert.strictEqual( Array.isArray( expanded ), false );
			assert.deepStrictEqual( expanded, { '0': 1, '1': 2, '2': 'three' } );

			// Nested arrays are unaffected, because SetValue builds an array from a
			// numeric path element.
			let nested = jsongin.Expand( jsongin.Flatten( { a: [ 1, 2 ], b: [] } ) );
			assert.strictEqual( Array.isArray( nested.a ), true );
			assert.strictEqual( Array.isArray( nested.b ), true );
		} );

		it( 'An object whose keys are canonical integers expands back as an array', () =>
		{
			// Both of these flatten to the identical result, so no expansion restores both.
			assert.deepStrictEqual( jsongin.Flatten( { a: { '0': 'x' } } ), { 'a.0': 'x' } );
			assert.deepStrictEqual( jsongin.Flatten( { a: [ 'x' ] } ), { 'a.0': 'x' } );

			// Expand resolves the ambiguity in favor of an array.
			assert.deepStrictEqual( jsongin.Expand( { 'a.0': 'x' } ), { a: [ 'x' ] } );

			// A non canonical numeric key is a field name and is not ambiguous.
			assert.deepStrictEqual( jsongin.Expand( jsongin.Flatten( { a: { '01': 'x' } } ) ), { a: { '01': 'x' } } );
		} );


		it( 'Use Expand() to turn a flattened document back into a hierarchical document', () =>
		{
			let document = {
				id: 1001,
				user:
				{
					name: 'Alice',
					location: 'East',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};

			let flattened = jsongin.Flatten( document );
			assert.ok( flattened );

			let expanded = jsongin.Expand( flattened );
			//NOTE: The $eq and $eqx need to be fixed to handle nested objects and arrays.
			// assert.ok( jsongin.StrictEquals( expanded, document ) === true );
			assert.ok( jsongin.LooseEquals( expanded, document ) === true );
			// assert.deepStrictEqual( expanded, document );
		} );


		it( 'It should flatten an empty document', () => 
		{
			let flattened = jsongin.Flatten( {} );
			assert.ok( flattened );
			assert.strictEqual( Object.keys( flattened ).length, 0 );
		} );


		it( 'It should expand an empty document', () => 
		{
			let expanded = jsongin.Expand( {} );
			assert.ok( expanded );
			assert.strictEqual( Object.keys( expanded ).length, 0 );
		} );


		it( 'It should flatten an array', () => 
		{
			let flattened = jsongin.Flatten( [ 1, 2, 'three' ] );
			assert.ok( flattened );
			assert.strictEqual( flattened[ '0' ], 1 );
			assert.strictEqual( flattened[ '1' ], 2 );
			assert.strictEqual( flattened[ '2' ], 'three' );
		} );


		it( 'It should flatten an empty array', () => 
		{
			let flattened = jsongin.Flatten( [] );
			assert.ok( flattened );
			assert.strictEqual( Object.keys( flattened ).length, 0 );
		} );


		it( 'It should not flatten a non-document', () => 
		{
			try
			{
				let flattened = jsongin.Flatten( 3.14 );
				assert.fail( 'Should have thrown an error.' );
			}
			catch ( error )
			{
				assert.ok( error.message === 'Document must be an object or array.' );
			}
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'Hybridize/Unhybridize Tests', () =>
	{


		it( 'It hybridizes a hierarchical document', () => 
		{
			let document = {
				id: 1001,
				user:
				{
					name: 'Alice',
					location: 'East',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};

			let hybrid = jsongin.Hybridize( document );
			assert.ok( hybrid );
			assert.deepStrictEqual( hybrid, {
				id: 1001,
				user: '{"type":"o","value":{"name":"Alice","location":"East"}}',
				tags: '{"type":"a","value":["Staff","Dept. A"]}',
			} );
		} );


		it( 'Use Unhybridize() to turn a Hybridized document back into a hierarchical document', () => 
		{
			let document = {
				id: 1001,
				user:
				{
					name: 'Alice',
					location: 'East',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};

			let hybrid = jsongin.Hybridize( document );
			assert.ok( hybrid );

			let unhybrid = jsongin.Unhybridize( hybrid );
			//NOTE: The $eq and $eqx need to be fixed to handle nested objects and arrays.
			// assert.ok( jsongin.StrictEquals( expanded, document ) === true );
			assert.ok( jsongin.LooseEquals( unhybrid, document ) === true );
			// assert.deepStrictEqual( expanded, document );
		} );


		it( 'It should Hybridize an empty document', () => 
		{
			let hybrid = jsongin.Hybridize( {} );
			assert.ok( hybrid );
			assert.strictEqual( Object.keys( hybrid ).length, 0 );
		} );


		it( 'It should Unhybridize an empty document', () => 
		{
			let unhybrid = jsongin.Unhybridize( {} );
			assert.ok( unhybrid );
			assert.strictEqual( Object.keys( unhybrid ).length, 0 );
		} );


		it( 'It Hybridizes and Unhybridizes a complex document', () => 
		{
			let document = {
				id: 1001,
				user:
				{
					name: 'Alice',
					location: 'East',
				},
				tags: [ 'Staff', 'Dept. A' ],
			};

			let hybrid = jsongin.Hybridize( document );
			assert.ok( hybrid );
			assert.deepStrictEqual( hybrid, {
				id: 1001,
				user: '{"type":"o","value":{"name":"Alice","location":"East"}}',
				tags: '{"type":"a","value":["Staff","Dept. A"]}',
			} );
		} );


		//---------------------------------------------------------------------
		// A plain string which happens to parse as JSON is not an envelope.
		// Treating it as one matched none of the type cases and dropped the field.

		it( 'It keeps a string which parses as JSON but is not an envelope', () =>
		{
			assert.deepStrictEqual( jsongin.Unhybridize( { a: '123' } ), { a: '123' } );
			assert.deepStrictEqual( jsongin.Unhybridize( { a: 'true' } ), { a: 'true' } );
			assert.deepStrictEqual( jsongin.Unhybridize( { a: 'null' } ), { a: 'null' } );
			assert.deepStrictEqual( jsongin.Unhybridize( { a: '[1,2]' } ), { a: '[1,2]' } );
			assert.deepStrictEqual( jsongin.Unhybridize( { a: '{"b":1}' } ), { a: '{"b":1}' } );
		} );


		it( 'It keeps an object which carries an unrecognized type name', () =>
		{
			let text = '{"type":"bogus","value":1}';
			assert.deepStrictEqual( jsongin.Unhybridize( { a: text } ), { a: text } );
		} );


		it( 'It keeps a plain string', () =>
		{
			assert.deepStrictEqual( jsongin.Unhybridize( { a: 'hello' } ), { a: 'hello' } );
		} );


		it( 'It carries a value which is not a string across unchanged', () =>
		{
			let when = new Date( 1000 );
			let result = jsongin.Unhybridize( { n: 1, b: true, l: null, d: when, o: { x: 1 }, a: [ 1 ] } );
			assert.strictEqual( result.n, 1 );
			assert.strictEqual( result.b, true );
			assert.strictEqual( result.l, null );
			assert.ok( result.d instanceof Date );
			assert.strictEqual( result.d.getTime(), when.getTime() );
			assert.deepStrictEqual( result.o, { x: 1 } );
			assert.deepStrictEqual( result.a, [ 1 ] );
		} );


		//---------------------------------------------------------------------
		// The envelope's own fields are read from the parsed envelope, never from the string
		// it was parsed from.

		it( 'It round trips an Error with its message', () =>
		{
			let result = jsongin.Unhybridize( jsongin.Hybridize( { a: new Error( 'boom' ) } ) );
			assert.ok( result.a instanceof Error );
			assert.strictEqual( result.a.message, 'boom' );
		} );


		it( 'It round trips a function with its source', () =>
		{
			let result = jsongin.Unhybridize( jsongin.Hybridize( { a: function () { return 7; } } ) );
			assert.strictEqual( typeof result.a, 'function' );
			assert.strictEqual( result.a(), 7 );
		} );


		it( 'It round trips a regular expression with its source and flags', () =>
		{
			let result = jsongin.Unhybridize( jsongin.Hybridize( { a: /ab+c/gi } ) );
			assert.ok( result.a instanceof RegExp );
			assert.strictEqual( result.a.source, 'ab+c' );
			assert.strictEqual( result.a.flags, 'gi' );
		} );


		it( 'It round trips an object, an array, and a date', () =>
		{
			let when = new Date( 1000 );
			let document = { o: { x: 1 }, a: [ 1, 2 ], d: when };
			let result = jsongin.Unhybridize( jsongin.Hybridize( document ) );
			assert.deepStrictEqual( result.o, { x: 1 } );
			assert.deepStrictEqual( result.a, [ 1, 2 ] );
			assert.ok( result.d instanceof Date );
			assert.strictEqual( result.d.getTime(), when.getTime() );
		} );


		it( 'It round trips an undefined value, keeping the field', () =>
		{
			let result = jsongin.Unhybridize( jsongin.Hybridize( { a: undefined } ) );
			assert.ok( Object.prototype.hasOwnProperty.call( result, 'a' ) );
			assert.strictEqual( result.a, undefined );
		} );


		// A method shorthand is not an expression on its own, so it cannot be rebuilt from the
		// source text which Hybridize() recorded for it.
		it( 'It reports a function which cannot be rebuilt from its source', () =>
		{
			let messages = [];
			let engine = jsongin.NewJsongin( { OpError: function ( Message ) { messages.push( Message ); } } );
			let methods = { m() { return 9; } };
			let hybrid = engine.Hybridize( { a: methods.m } );

			assert.throws( function () { engine.Unhybridize( hybrid ); }, SyntaxError );
			assert.strictEqual( messages.length, 1 );
			assert.ok( messages[ 0 ].startsWith( 'Unhybridize: Cannot rebuild the function' ) );
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'Sort Tests', () =>
	{


		it( 'It sorts an array of objects', () => 
		{
			let documents = [
				{ id: 1, type: 'A', title: 'First document' },
				{ id: 2, type: 'B', title: 'Second document' },
				{ id: 3, type: 'A', title: 'Third document' },
				{ id: 4, type: 'B', title: 'Fourth document' },
				{ id: 5, type: 'A', title: 'Fifth document' },
			];
			jsongin.Sort( documents, { title: 1 } );
			assert.ok( documents );
			assert.strictEqual( documents[ 0 ].id, 5 );
			assert.strictEqual( documents[ 1 ].id, 1 );
			assert.strictEqual( documents[ 2 ].id, 4 );
			assert.strictEqual( documents[ 3 ].id, 2 );
			assert.strictEqual( documents[ 4 ].id, 3 );
		} );


		it( 'It sorts across multiple keys', () => 
		{
			let documents = [
				{ id: 1, type: 'A', title: 'First document' },
				{ id: 2, type: 'B', title: 'Second document' },
				{ id: 3, type: 'A', title: 'Third document' },
				{ id: 4, type: 'B', title: 'Fourth document' },
				{ id: 5, type: 'A', title: 'Fifth document' },
			];
			jsongin.Sort( documents, { type: 1, title: 1 } );
			assert.ok( documents );
			assert.strictEqual( documents[ 0 ].id, 5 );
			assert.strictEqual( documents[ 1 ].id, 1 );
			assert.strictEqual( documents[ 2 ].id, 3 );
			assert.strictEqual( documents[ 3 ].id, 4 );
			assert.strictEqual( documents[ 4 ].id, 2 );
		} );


		it( 'It sorts in reverse order', () => 
		{
			let documents = [
				{ id: 1, type: 'A', title: 'First document' },
				{ id: 2, type: 'B', title: 'Second document' },
				{ id: 3, type: 'A', title: 'Third document' },
				{ id: 4, type: 'B', title: 'Fourth document' },
				{ id: 5, type: 'A', title: 'Fifth document' },
			];
			jsongin.Sort( documents, { type: 1, title: -1 } );
			assert.ok( documents );
			assert.strictEqual( documents[ 0 ].id, 3 );
			assert.strictEqual( documents[ 1 ].id, 1 );
			assert.strictEqual( documents[ 2 ].id, 5 );
			assert.strictEqual( documents[ 3 ].id, 2 );
			assert.strictEqual( documents[ 4 ].id, 4 );
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'CompareValues Tests', () =>
	{

		it( 'should compare values of the same type', () =>
		{
			assert.ok( jsongin.CompareValues( 1, 2 ) === -1 );
			assert.ok( jsongin.CompareValues( 2, 2 ) === 0 );
			assert.ok( jsongin.CompareValues( 3, 2 ) === 1 );
			assert.ok( jsongin.CompareValues( 'abc', 'abd' ) === -1 );
			assert.ok( jsongin.CompareValues( false, true ) === -1 );
		} );

		it( 'should treat null and missing values as equivalent', () =>
		{
			assert.ok( jsongin.CompareValues( null, undefined ) === 0 );
			assert.ok( jsongin.CompareValues( null, null ) === 0 );
		} );

		it( 'should order values of different types by MongoDB comparison order', () =>
		{
			// null < numbers < strings < objects < arrays < booleans < dates < regex
			assert.ok( jsongin.CompareValues( null, 5 ) === -1 );
			assert.ok( jsongin.CompareValues( 5, 'abc' ) === -1 );
			assert.ok( jsongin.CompareValues( 'abc', { a: 1 } ) === -1 );
			assert.ok( jsongin.CompareValues( { a: 1 }, [ 1 ] ) === -1 );
			assert.ok( jsongin.CompareValues( [ 1 ], true ) === -1 );
			assert.ok( jsongin.CompareValues( true, new Date( 0 ) ) === -1 );
			assert.ok( jsongin.CompareValues( new Date( 0 ), /abc/ ) === -1 );
		} );

		it( 'should compare dates by their timestamp', () =>
		{
			assert.ok( jsongin.CompareValues( new Date( 1000 ), new Date( 5000 ) ) === -1 );
			assert.ok( jsongin.CompareValues( new Date( 5000 ), new Date( 5000 ) ) === 0 );
		} );

		it( 'should compare arrays element by element', () =>
		{
			assert.ok( jsongin.CompareValues( [ 1, 2 ], [ 1, 2 ] ) === 0 );
			assert.ok( jsongin.CompareValues( [ 1, 2 ], [ 1, 3 ] ) === -1 );
			assert.ok( jsongin.CompareValues( [ 1 ], [ 1, 2 ] ) === -1 );
		} );

		it( 'should compare objects field by field', () =>
		{
			assert.ok( jsongin.CompareValues( { a: 1 }, { a: 1 } ) === 0 );
			assert.ok( jsongin.CompareValues( { a: 1 }, { a: 2 } ) === -1 );
			assert.ok( jsongin.CompareValues( { a: 1 }, { b: 1 } ) === -1 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Sort Ordering Tests', () =>
	{

		it( 'should sort documents which are missing the sort field, as null', () =>
		{
			let documents = [ { n: 2 }, { x: 9 }, { n: 1 } ];
			jsongin.Sort( documents, { n: 1 } );
			assert.ok( documents[ 0 ].x === 9 );
			assert.ok( documents[ 1 ].n === 1 );
			assert.ok( documents[ 2 ].n === 2 );
		} );

		it( 'should sort values of different types by MongoDB comparison order', () =>
		{
			let documents = [ { n: 'abc' }, { n: 5 }, { n: null }, { n: true } ];
			jsongin.Sort( documents, { n: 1 } );
			assert.ok( documents[ 0 ].n === null );
			assert.ok( documents[ 1 ].n === 5 );
			assert.ok( documents[ 2 ].n === 'abc' );
			assert.ok( documents[ 3 ].n === true );
		} );

		it( 'should sort an array field by its smallest element when ascending', () =>
		{
			let documents = [ { a: [ 5, 1 ] }, { a: [ 3 ] }, { a: [ 9, 0 ] }, { a: [ 4, 6 ] } ];
			jsongin.Sort( documents, { a: 1 } );
			// Sort keys are the smallest elements: 0, 1, 3, 4
			assert.ok( jsongin.StrictEquals( documents.map( function ( d ) { return d.a; } ),
				[ [ 9, 0 ], [ 5, 1 ], [ 3 ], [ 4, 6 ] ] ) );
		} );

		it( 'should sort an array field by its largest element when descending', () =>
		{
			let documents = [ { a: [ 5, 1 ] }, { a: [ 3 ] }, { a: [ 9, 0 ] }, { a: [ 4, 6 ] } ];
			jsongin.Sort( documents, { a: -1 } );
			// Sort keys are the largest elements: 9, 6, 5, 3
			assert.ok( jsongin.StrictEquals( documents.map( function ( d ) { return d.a; } ),
				[ [ 9, 0 ], [ 4, 6 ], [ 5, 1 ], [ 3 ] ] ) );
		} );

		it( 'should sort dates', () =>
		{
			let documents = [ { d: new Date( 5000 ) }, { d: new Date( 1000 ) }, { d: new Date( 3000 ) } ];
			jsongin.Sort( documents, { d: 1 } );
			assert.ok( documents[ 0 ].d.getTime() === 1000 );
			assert.ok( documents[ 1 ].d.getTime() === 3000 );
			assert.ok( documents[ 2 ].d.getTime() === 5000 );
		} );

		it( 'should sort a field holding an empty array below every other value', () =>
		{
			// Verified against MongoDB 8.0: [] sorts below null and below a missing field.
			let documents = [ { v: [] }, { v: null }, { v: 5 }, { v: [ 3 ] }, { v: 'a' } ];
			jsongin.Sort( documents, { v: 1 } );
			assert.ok( jsongin.StrictEquals( documents[ 0 ].v, [] ) );
			assert.ok( documents[ 1 ].v === null );
			assert.ok( jsongin.StrictEquals( documents[ 2 ].v, [ 3 ] ) );
			assert.ok( documents[ 3 ].v === 5 );
			assert.ok( documents[ 4 ].v === 'a' );
		} );

		it( 'should sort an empty array below a missing field', () =>
		{
			let documents = [ { v: 5 }, { x: 1 }, { v: [] } ];
			jsongin.Sort( documents, { v: 1 } );
			assert.ok( jsongin.StrictEquals( documents[ 0 ].v, [] ) );
			assert.ok( documents[ 1 ].x === 1 );
			assert.ok( documents[ 2 ].v === 5 );
		} );

		it( 'should place an empty array last when sorting descending', () =>
		{
			let documents = [ { v: [] }, { v: null }, { v: 5 }, { v: 'a' } ];
			jsongin.Sort( documents, { v: -1 } );
			assert.ok( documents[ 0 ].v === 'a' );
			assert.ok( documents[ 1 ].v === 5 );
			assert.ok( documents[ 2 ].v === null );
			assert.ok( jsongin.StrictEquals( documents[ 3 ].v, [] ) );
		} );

		it( 'should still compare an empty array as an array outside of sorting', () =>
		{
			// The empty array sort rule belongs to Sort() only. As a value, an empty
			// array still carries the array type rank, which is above null.
			assert.ok( jsongin.CompareValues( [], null ) === 1 );
			assert.ok( jsongin.Evaluate( {}, { $gt: [ { $literal: [] }, null ] } ) === true );
		} );

		it( 'should sort the array in place and return it', () =>
		{
			let documents = [ { n: 3 }, { n: 1 } ];
			let result = jsongin.Sort( documents, { n: 1 } );
			assert.ok( result === documents );
			assert.ok( documents[ 0 ].n === 1 );
		} );

		it( 'should ignore sort fields with a direction of zero', () =>
		{
			let documents = [ { n: 3 }, { n: 1 } ];
			jsongin.Sort( documents, { n: 0 } );
			assert.ok( documents[ 0 ].n === 3 );
		} );

	} );


	//---------------------------------------------------------------------
	describe( 'Distinct Tests', () =>
	{


		it( 'It gets a distinct array of objects', () => 
		{
			let documents = [
				{ type: 1, category: 'A', title: 'First' },
				{ type: 1, category: 'A', title: 'Second' },
				{ type: 1, category: 'B', title: 'Third' },
				{ type: 1, category: 'A', title: 'Fourth' },
				{ type: 2, category: 'B', title: 'Fifth' },
				{ type: 2, category: 'B', title: 'Sixth' },
				{ type: 2, category: 'A', title: 'Seventh' },
				{ type: 2, category: 'A', title: 'Eighth' },
			];
			let distincts = jsongin.Distinct( documents, { type: true } );
			assert.ok( distincts );
			assert.strictEqual( distincts.length, 2 );
			assert.strictEqual( distincts[ 0 ].type, 1 );
			assert.strictEqual( distincts[ 1 ].type, 2 );
		} );


		it( 'It gets a distinct array using multiple keys', () => 
		{
			let documents = [
				{ type: 1, category: 'A', title: 'First' },
				{ type: 1, category: 'A', title: 'Second' },
				{ type: 1, category: 'B', title: 'Third' },
				{ type: 1, category: 'A', title: 'Fourth' },
				{ type: 2, category: 'B', title: 'Fifth' },
				{ type: 2, category: 'B', title: 'Sixth' },
				{ type: 2, category: 'A', title: 'Seventh' },
				{ type: 2, category: 'A', title: 'Eighth' },
			];
			let distincts = jsongin.Distinct( documents, { type: true, category: true } );
			assert.ok( distincts );
			assert.strictEqual( distincts.length, 4 );
			assert.strictEqual( distincts[ 0 ].type, 1 );
			assert.strictEqual( distincts[ 0 ].category, 'A' );
			assert.strictEqual( distincts[ 1 ].type, 1 );
			assert.strictEqual( distincts[ 1 ].category, 'B' );
			assert.strictEqual( distincts[ 2 ].type, 2 );
			assert.strictEqual( distincts[ 2 ].category, 'B' );
			assert.strictEqual( distincts[ 3 ].type, 2 );
			assert.strictEqual( distincts[ 3 ].category, 'A' );
		} );


	} );


	//---------------------------------------------------------------------
	describe( 'Merge Tests', () =>
	{
		var sample_object_1 = {
			field1: 1,
			field2: 2,
			obj1: {
				field3: 3,
				field4: 4,
			},
			arr1: [ 5, 6 ],
		};


		it( 'It can merge with null objects', () => 
		{
			var document = jsongin.Merge( null, sample_object_1 );
			assert.ok( document );
			assert.deepStrictEqual( document, sample_object_1 );

			document = jsongin.Merge( sample_object_1, null );
			assert.ok( document );
			assert.deepStrictEqual( document, sample_object_1 );
		} );


		it( 'It can merge with empty objects', () => 
		{
			var document = jsongin.Merge( {}, sample_object_1 );
			assert.ok( document );
			assert.deepStrictEqual( document, sample_object_1 );

			document = jsongin.Merge( sample_object_1, {} );
			assert.ok( document );
			assert.deepStrictEqual( document, sample_object_1 );
		} );


		it( 'It can add new fields', () => 
		{
			var document = jsongin.Merge( {}, { test: 'A' } );
			assert.ok( document );
			assert.deepStrictEqual( document, { test: 'A' } );

			document = jsongin.Merge( { test: 'A' }, {} );
			assert.ok( document );
			assert.deepStrictEqual( document, { test: 'A' } );
		} );


		it( 'It can add new sub-fields', () => 
		{
			var document = jsongin.Merge( { A: { B: 2 } }, { A: { C: 3 } } );
			assert.ok( document );
			assert.deepStrictEqual( document, { A: { B: 2, C: 3 } } );

			document = jsongin.Merge( { A: { C: 3 } }, { A: { B: 2 } } );
			assert.ok( document );
			assert.deepStrictEqual( document, { A: { B: 2, C: 3 } } );
		} );


		it( 'It can update existing fields', () => 
		{
			var document = jsongin.Merge( { test: 0 }, { test: 'A' } );
			assert.ok( document );
			assert.deepStrictEqual( document, { test: 'A' } );

			document = jsongin.Merge( { test: 'A' }, { test: 0 } );
			assert.ok( document );
			assert.deepStrictEqual( document, { test: 0 } );
		} );


		it( 'It can update existing sub-fields', () =>
		{
			var document = jsongin.Merge( { A: { B: 2, C: 3 } }, { A: { C: 4 } } );
			assert.ok( document );
			assert.deepStrictEqual( document, { A: { B: 2, C: 4 } } );
		} );


		it( 'It requires both parameters to be objects', () =>
		{
			assert.throws( () => jsongin.Merge( [ 1, 2 ], { a: 1 } ) );
			assert.throws( () => jsongin.Merge( { a: 1 }, [ 1, 2 ] ) );
			assert.throws( () => jsongin.Merge( 5, { a: 1 } ) );
			assert.throws( () => jsongin.Merge( { a: 1 }, 'abc' ) );
			assert.throws( () => jsongin.Merge( { a: 1 }, new Date() ) );
		} );


		it( 'It treats a missing document as an empty one', () =>
		{
			// This is what allows Merge( DEFAULTS, options ) when no options were supplied.
			assert.deepStrictEqual( jsongin.Merge( undefined, { a: 1 } ), { a: 1 } );
			assert.deepStrictEqual( jsongin.Merge( { a: 1 }, undefined ), { a: 1 } );
			assert.deepStrictEqual( jsongin.Merge( null, { a: 1 } ), { a: 1 } );
			assert.deepStrictEqual( jsongin.Merge( { a: 1 }, null ), { a: 1 } );
		} );


		it( 'It replaces arrays rather than merging them member-wise', () =>
		{
			// An array is a value, not a structure to descend into.
			assert.deepStrictEqual( jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [ 9 ] } ), { a: [ 9 ] } );
			assert.deepStrictEqual( jsongin.Merge( { a: [ 1, 2 ] }, { a: [ 3, 4, 5 ] } ), { a: [ 3, 4, 5 ] } );
			// An empty array must be able to clear a default list.
			assert.deepStrictEqual( jsongin.Merge( { a: [ 1, 2, 3 ] }, { a: [] } ), { a: [] } );
		} );


		it( 'It treats null as a value rather than a deletion', () =>
		{
			// This is a deliberate difference from RFC 7386, and agrees with Diff(),
			// which reports a change to null as $set rather than $unset.
			var document = jsongin.Merge( { a: 1, b: 2 }, { a: null } );
			assert.deepStrictEqual( document, { a: null, b: 2 } );
			assert.ok( 'a' in document );

			document = jsongin.Merge( { a: { b: 'c' } }, { a: { b: 'd', c: null } } );
			assert.deepStrictEqual( document, { a: { b: 'd', c: null } } );
		} );


		it( 'It skips undefined values rather than storing them', () =>
		{
			// Storing undefined would leave a key which Object.keys() reports but JSON does not.
			var document = jsongin.Merge( { a: 1 }, { a: undefined } );
			assert.deepStrictEqual( document, { a: 1 } );
			assert.deepStrictEqual( Object.keys( document ), [ 'a' ] );

			document = jsongin.Merge( { a: 1 }, { b: undefined } );
			assert.deepStrictEqual( Object.keys( document ), [ 'a' ] );
		} );


		it( 'It overwrites dates and regular expressions', () =>
		{
			// These have no enumerable members, so member-wise code used to silently
			// discard them and leave the original value in place.
			var document = jsongin.Merge( { w: new Date( 0 ) }, { w: new Date( 86400000 ) } );
			assert.ok( document.w instanceof Date );
			assert.strictEqual( document.w.getTime(), 86400000 );

			document = jsongin.Merge( { w: 123 }, { w: new Date( 86400000 ) } );
			assert.ok( document.w instanceof Date );

			document = jsongin.Merge( { r: /aaa/ }, { r: /bbb/ } );
			assert.ok( document.r instanceof RegExp );
			assert.strictEqual( document.r.source, 'bbb' );
		} );


		it( 'It handles a value which changes type', () =>
		{
			assert.deepStrictEqual( jsongin.Merge( { a: 'c' }, { a: [ 'b' ] } ), { a: [ 'b' ] } );
			assert.deepStrictEqual( jsongin.Merge( { a: { x: 1 } }, { a: [ 1, 2 ] } ), { a: [ 1, 2 ] } );
			assert.deepStrictEqual( jsongin.Merge( { a: [ 1, 2 ] }, { a: { x: 1 } } ), { a: { x: 1 } } );
		} );


		it( 'It does not modify either of the given documents', () =>
		{
			var document_a = { x: { y: 1 }, arr: [ 1, 2 ] };
			var document_b = { x: { z: 2 }, arr: [ 9 ] };
			var merged = jsongin.Merge( document_a, document_b );

			assert.deepStrictEqual( document_a, { x: { y: 1 }, arr: [ 1, 2 ] } );
			assert.deepStrictEqual( document_b, { x: { z: 2 }, arr: [ 9 ] } );

			// The result must not share structure with either document.
			merged.x.y = 99;
			merged.arr.push( 7 );
			assert.strictEqual( document_a.x.y, 1 );
			assert.deepStrictEqual( document_b.arr, [ 9 ] );
		} );


		it( 'It is idempotent', () =>
		{
			// Applying the same overrides twice gives the same result, which is what makes
			// Merge safe to use for layering settings.
			var defaults = { plugins: [ 'a', 'b' ], ui: { theme: 'dark' } };
			var overrides = { plugins: [ 'a' ], ui: { scale: 2 } };

			var once = jsongin.Merge( defaults, overrides );
			var twice = jsongin.Merge( once, overrides );
			assert.deepStrictEqual( twice, once );
			assert.deepStrictEqual( once, { plugins: [ 'a' ], ui: { theme: 'dark', scale: 2 } } );
		} );


	} );


} );
