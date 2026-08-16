'use strict';

module.exports = function ( Settings )
{

	const LIB_SEALD_NEDB = require( '@seald-io/nedb' );
	//REF: https://www.npmjs.com/package/@seald-io/nedb


	//---------------------------------------------------------------------
	async function WithCollection( api_callback )
	{
		try
		{
			// Get the collection.
			let collection = new LIB_SEALD_NEDB( Settings );
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
		}

	};


	//---------------------------------------------------------------------
	let driver =
	{


		//---------------------------------------------------------------------
		SetData:
			async function ( Data )
			{
				try
				{
					let result = await WithCollection(
						async function ( Collection )
						{
							try
							{
								let result = null;
								result = await Collection.removeAsync( {} );
								result = await Collection.insertAsync( Data );
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
						async function ( Collection )
						{
							let result = null;
							result = await Collection.findAsync( Query );
							return result;
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
