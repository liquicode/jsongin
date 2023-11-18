'use strict';

const assert = require( 'assert' );

module.exports = function ( Driver )
{


	//---------------------------------------------------------------------
	before(
		async function ()
		{
			let result = await Driver.SetData( [
				{
					"session_id": "39141da7-5b24-47d5-b666-9f0a493d1084",
					"order_number": 1,
					"__": {
						"id": "bf71bf6e-4603-464e-96d1-3cb75c209f08",
						"created_at": "2023-11-14T20:39:37.035Z",
						"updated_at": "2023-11-14T20:39:37.035Z",
						"owner_id": "alice@fake.com",
						"readers": [],
						"writers": [],
						"public": false
					},
					"_id": "631b7ab6-a728-42ce-b4f8-f8db70cfebdf"
				}
			] );
			assert.ok( result );
			return;
		}
	);


	//---------------------------------------------------------------------
	describe( 'Ad-Hoc Projection Tests', () =>
	{


		it( 'should do simple projection', async () => 
		{
			let query = { _id: "631b7ab6-a728-42ce-b4f8-f8db70cfebdf" };
			let projection = {
				session_id: 1,
			};
			let result = await Driver.Find( query, projection );
			assert.ok( result );
			assert.ok( result.length );
			assert.ok( result[ 0 ].session_id === '39141da7-5b24-47d5-b666-9f0a493d1084' );
			assert.ok( typeof result[ 0 ].order_number === 'undefined' );
			assert.ok( typeof result[ 0 ].__ === 'undefined' );
			assert.ok( result[ 0 ]._id === '631b7ab6-a728-42ce-b4f8-f8db70cfebdf' );
		} );


		it( 'should project embedded fields', async () => 
		{
			let query = { _id: "631b7ab6-a728-42ce-b4f8-f8db70cfebdf" };
			let projection = {
				session_id: 1,
				'__.owner_id': 1,
			};
			let result = await Driver.Find( query, projection );
			assert.ok( result );
			assert.ok( result.length );
			assert.ok( result[ 0 ].session_id === '39141da7-5b24-47d5-b666-9f0a493d1084' );
			assert.ok( typeof result[ 0 ].order_number === 'undefined' );
			assert.ok( result[ 0 ].__ );
			assert.ok( typeof result[ 0 ].__.id === 'undefined' );
			assert.ok( typeof result[ 0 ].__.created_at === 'undefined' );
			assert.ok( typeof result[ 0 ].__.updated_at === 'undefined' );
			assert.ok( result[ 0 ].__.owner_id === 'alice@fake.com' );
			assert.ok( typeof result[ 0 ].__.readers === 'undefined' );
			assert.ok( typeof result[ 0 ].__.writers === 'undefined' );
			assert.ok( typeof result[ 0 ].__.public === 'undefined' );
			assert.ok( result[ 0 ]._id === '631b7ab6-a728-42ce-b4f8-f8db70cfebdf' );
		} );


		it( 'should supress fields', async () => 
		{
			let query = { _id: "631b7ab6-a728-42ce-b4f8-f8db70cfebdf" };
			let projection = {
				__: 0,
			};
			let result = await Driver.Find( query, projection );
			assert.ok( result );
			assert.ok( result.length );
			assert.ok( result[ 0 ].session_id === '39141da7-5b24-47d5-b666-9f0a493d1084' );
			assert.ok( result[ 0 ].order_number === 1 );
			assert.ok( typeof result[ 0 ].__ === 'undefined' );
			assert.ok( result[ 0 ]._id === '631b7ab6-a728-42ce-b4f8-f8db70cfebdf' );
		} );


		it( 'should supress the _id field', async () => 
		{
			let query = { _id: "631b7ab6-a728-42ce-b4f8-f8db70cfebdf" };
			let projection = {
				_id: 0,
			};
			let result = await Driver.Find( query, projection );
			assert.ok( result );
			assert.ok( result.length );
			assert.ok( result[ 0 ].session_id === '39141da7-5b24-47d5-b666-9f0a493d1084' );
			assert.ok( result[ 0 ].order_number === 1 );
			assert.ok( result[ 0 ].__ );
			assert.ok( result[ 0 ].__.id === 'bf71bf6e-4603-464e-96d1-3cb75c209f08' );
			assert.ok( result[ 0 ].__.created_at === '2023-11-14T20:39:37.035Z' );
			assert.ok( result[ 0 ].__.updated_at === '2023-11-14T20:39:37.035Z' );
			assert.ok( result[ 0 ].__.owner_id === 'alice@fake.com' );
			assert.ok( result[ 0 ].__.readers.length === 0 );
			assert.ok( result[ 0 ].__.writers.length === 0 );
			assert.ok( result[ 0 ].__.public === false );
			assert.ok( typeof result[ 0 ]._id === 'undefined' );
		} );


		it( 'should supress the _id field while including others', async () => 
		{
			let query = { _id: "631b7ab6-a728-42ce-b4f8-f8db70cfebdf" };
			let projection = {
				_id: 0,
				session_id: 1,
			};
			let result = await Driver.Find( query, projection );
			assert.ok( result );
			assert.ok( result.length );
			assert.ok( result[ 0 ].session_id === '39141da7-5b24-47d5-b666-9f0a493d1084' );
			assert.ok( typeof result[ 0 ].order_number === 'undefined' );
			assert.ok( typeof result[ 0 ].__ === 'undefined' );
			assert.ok( typeof result[ 0 ]._id === 'undefined' );
		} );


	} );


};
