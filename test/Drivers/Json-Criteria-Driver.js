'use strict';

module.exports = function ( Settings )
{

	require( 'babel-polyfill' );
	const LIB_JSON_CRITERIA = require( 'json-criteria' );


	let driver =
	{


		//---------------------------------------------------------------------
		Storage: [],


		//---------------------------------------------------------------------
		SetData:
			async function ( Data )
			{
				this.Storage = Data;
				return true;
			},


		//---------------------------------------------------------------------
		Find:
			async function ( Query )
			{
				try
				{
					let result = [];
					for ( let index = 0; index < this.Storage.length; index++ )
					{
						if ( await LIB_JSON_CRITERIA.test( this.Storage[ index ], Query ) )
						{
							result.push( this.Storage[ index ] );
						}
					}
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
