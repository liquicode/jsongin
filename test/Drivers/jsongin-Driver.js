'use strict';

module.exports = function ( Settings )
{

	const jsongin = require( '../../src/jsongin' )( Settings );

	let driver =
	{


		//---------------------------------------------------------------------
		Engine: jsongin,
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
			async function ( Query, Projection )
			{
				try
				{
					let result = [];
					for ( let index = 0; index < this.Storage.length; index++ )
					{
						if ( await jsongin.Query( this.Storage[ index ], Query ) )
						{
							let document = this.Storage[ index ];
							if ( Projection )
							{
								document = await jsongin.Projection( document, Projection );
							}
							result.push( document );
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
		Update:
			async function ( Query, Update )
			{
				try
				{
					let result = [];
					for ( let index = 0; index < this.Storage.length; index++ )
					{
						if ( await jsongin.Query( this.Storage[ index ], Query ) )
						{
							let document = this.Storage[ index ];
							document = await jsongin.Update( document, Update );
							if ( document === null ) { continue; }
							this.Storage[ index ] = document;
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
