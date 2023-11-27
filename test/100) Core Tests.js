'use strict';

const assert = require( 'assert' );
const jsongin = require( '../src/jsongin' )( {
	// OpLog: console.log,
	// OpError: console.error,
} );


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

		it( 'It sets fields inside all elements of an array of objects', () => 
		{
			let document = {
				users: [
					{ id: 101, name: 'Alice' },
					{ id: 102, name: 'Bob' },
					{ id: 103, name: 'Eve' },
				]
			};

			// Omit the array index to set into each array element.
			assert.ok( jsongin.SetValue( document, 'users.status', 42 ) );
			assert.strictEqual( document.users[ 0 ].status, 42 );
			assert.strictEqual( document.users[ 1 ].status, 42 );
			assert.strictEqual( document.users[ 2 ].status, 42 );
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


	} );


} );
