'use strict';

module.exports = function ( Settings )
{

	const LIB_NEDB = require( 'nedb' );
	//REF: https://www.npmjs.com/package/nedb


	//---------------------------------------------------------------------
	async function WithCollection( api_callback )
	{
		try
		{
			// Get the collection.
			let collection = new LIB_NEDB( Settings );
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


	// const LIB_FS = require( 'fs' );

	//---------------------------------------------------------------------
	let driver =
	{


		//---------------------------------------------------------------------
		SetData:
			async function ( Data )
			{
				let result = await WithCollection(
					async function ( Collection )
					{
						try
						{
							let result = null;
							result = await new Promise(
								async function ( resolve, reject )
								{
									Collection.remove( {},
										async function ( error, numRemoved ) 
										{
											if ( error ) { reject( error ); }
											else { resolve( numRemoved ); }
										} );
								}
							);
							result = await new Promise(
								async function ( resolve, reject )
								{
									Collection.insert( Data,
										async function ( error, documents ) 
										{
											if ( error ) { reject( error ); }
											else { resolve( documents ); }
										} );
								}
							);
							return true;
						}
						catch ( error )
						{
							console.error( error );
							return false;
						}
					} );
				return result;
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
							let result = await new Promise(
								async ( resolve, reject ) =>
								{
									try
									{
										Collection.find( Query,
											function ( error, documents ) 
											{
												if ( error ) { reject( error ); }
												else { resolve( documents ); }
											} );
									}
									catch ( error )
									{
										reject( error );
									}
									return;
								} );
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
