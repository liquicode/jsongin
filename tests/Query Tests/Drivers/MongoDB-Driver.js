'use strict';

module.exports = function ()
{

	const LIB_MONGODB = require( 'mongodb' );
	//REFS:
	//	https://www.mongodb.com/docs/manual/core/
	//	https://www.mongodb.com/docs/manual/tutorial/
	//	https://www.mongodb.com/docs/manual/reference/


	//---------------------------------------------------------------------
	async function WithCollection( Settings, api_callback )
	{
		let database = null;
		let client = null;
		try
		{

			// Connect to the server.
			client = await LIB_MONGODB.MongoClient.connect(
				Settings.connection_string,
				{
					// keepAlive: 1,
					keepAlive: true,
					useUnifiedTopology: true,
					useNewUrlParser: true,
				}
			);
			if ( !client ) { throw new Error( `Unable to establish a connection to the mongodb database server.` ); }

			// Get the database.
			database = client.db( Settings.database_name );

			// Get the collection.
			let collection = database.collection( Settings.collection_name );

			// Do the stuff.
			let result = await api_callback( collection );
			return result;

		}
		catch ( error )
		{
			throw error;
		}
		finally
		{
			if ( client )
			{
				client.close();
				// database.close();
			}
		}

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
							try
							{
								let result = null;
								result = await Collection.deleteMany( {} );
								result = await Collection.insertMany( Data );
								return true;
							}
							catch ( error )
							{
								console.error( error );
								return false;
							}
						} );
					return result;
				}
				catch ( error )
				{
					console.error( error );
				}
			},


		//---------------------------------------------------------------------
		Find:
			async function ( Query )
			{
				try
				{
					let result = await WithCollection(
						mongodb_settings,
						async function ( Collection )
						{
							let cursor = await Collection.find( Query );
							return await cursor.toArray();
						} );
					return result;
				}
				catch ( error )
				{
					console.error( error );
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


	};

	return driver;
};
