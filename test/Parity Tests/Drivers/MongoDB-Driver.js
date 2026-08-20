'use strict';

module.exports = function ()
{

	const LIB_MONGODB = require( 'mongodb' );
	//REFS:
	//	https://www.mongodb.com/docs/manual/core/
	//	https://www.mongodb.com/docs/manual/tutorial/
	//	https://www.mongodb.com/docs/manual/reference/


	//---------------------------------------------------------------------
	// ***One client for the whole run, not one per operation.***
	//
	// This used to connect and close around every call, which is two connections per test —
	// a SetData and an operation. At a few hundred tests that is fine. At eight hundred it is
	// not: a closed TCP connection sits in TIME_WAIT for minutes, Windows runs out of
	// ephemeral ports, and a full `parity-test-mongodb` run began failing a scattering of
	// unrelated tests with EADDRINUSE. ***Every such failure was a network error and never an
	// assertion***, which is what made it a nuisance rather than a false regression - but a
	// baseline run which is only usually green is not a baseline.
	//
	// A MongoClient is already a connection pool, so holding one and reusing it is both the
	// fix and the way the driver is meant to be used.
	let shared_client = null;

	async function Client( Settings )
	{
		if ( shared_client !== null ) { return shared_client; }

		// Assigned only after the connection succeeds, so a failed attempt leaves nothing
		// behind for the next call to find and reuse.
		let client = await LIB_MONGODB.MongoClient.connect(
			Settings.connection_string,
			{
				keepAlive: true,
			}
		);
		if ( !client ) { throw new Error( `Unable to establish a connection to the mongodb database server.` ); }

		shared_client = client;
		return shared_client;
	};


	//---------------------------------------------------------------------
	async function WithCollection( Settings, api_callback )
	{
		let client = await Client( Settings );
		let collection = client.db( Settings.database_name ).collection( Settings.collection_name );
		return await api_callback( collection );
	};


	// MongoDB running in a local container.
	let mongodb_settings = {
		database_name: 'test',								// Name of the MongoDB database.
		collection_name: 'jsongin-UnitTests',					// Name of the MongoDB collection.
		connection_string: 'mongodb://localhost:27017',		// Connection string to the MongoDB server.
	};


	let driver =
	{


		//---------------------------------------------------------------------
		SetData:
			async function ( Data )
			{
				try
				{
					let result = await WithCollection(
						mongodb_settings,
						async function ( Collection )
						{
							await Collection.deleteMany( {} );
							await Collection.insertMany( Data );
							return true;
						} );
					return result;
				}
				catch ( error )
				{
					// Rethrown rather than logged. A server which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
				}
			},


		//---------------------------------------------------------------------
		Find:
			async function ( Query, Projection )
			{
				try
				{
					let result = await WithCollection(
						mongodb_settings,
						async function ( Collection )
						{
							let cursor = await Collection.find( Query ).project( Projection );
							return await cursor.toArray();
						} );
					return result;
				}
				catch ( error )
				{
					// Rethrown rather than logged. A server which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
				}
			},

		//---------------------------------------------------------------------
		Update:
			async function ( Query, Update )
			{
				try
				{
					let result = await WithCollection(
						mongodb_settings,
						async function ( Collection )
						{
							// updateMany() reports counts, not documents, so the documents it
							// touched have to be read back separately.
							// The ids are taken before the update because an update can change
							// the very fields the query selected on, which would make the same
							// query select a different set afterwards.
							let matched = await Collection.find( Query ).project( { _id: 1 } ).toArray();
							let ids = matched.map( function ( Document ) { return Document._id; } );

							await Collection.updateMany( Query, Update );

							return await Collection.find( { _id: { $in: ids } } ).toArray();
						} );
					return result;
				}
				catch ( error )
				{
					// Rethrown rather than logged. A server which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
				}
			},

		//---------------------------------------------------------------------
		Aggregate:
			async function ( Pipeline )
			{
				try
				{
					let result = await WithCollection(
						mongodb_settings,
						async function ( Collection )
						{
							let cursor = await Collection.aggregate( Pipeline );
							return await cursor.toArray();
						} );
					return result;
				}
				catch ( error )
				{
					// Rethrown rather than logged. A server which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
				}
			},

		//---------------------------------------------------------------------
		Evaluate:
			async function ( Query, Data )
			{
				await this.SetData( [ Data ] );
				let result = await this.Find( Query );
				return result.length === 1;
			},


		//---------------------------------------------------------------------
		// Closes the shared client. Nothing holds the process open afterwards.
		Close:
			async function ()
			{
				if ( shared_client === null ) { return; }
				let client = shared_client;
				shared_client = null;
				await client.close();
			},


	};


	//---------------------------------------------------------------------
	// ***The cleanup registers itself.*** Now that the client outlives each call, something
	// has to close it or mocha never exits. Doing that here rather than in each runner is
	// what keeps it working for the runners `build/parity.js` generates, which are written
	// fresh on every report and would otherwise each need to remember.
	//
	// `after` exists only when a runner is being loaded by mocha. Required from anywhere else
	// - build/docs-check.js, a script, a REPL - there is no hook to register and the caller
	// closes the driver itself.
	if ( typeof after === 'function' )
	{
		after( async function () { await driver.Close(); } );
	}


	return driver;
};
