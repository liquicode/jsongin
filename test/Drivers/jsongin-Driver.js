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
			async function ( Criteria, Projection )
			{
				try
				{
					let result = [];
					for ( let index = 0; index < this.Storage.length; index++ )
					{
						if ( await jsongin.Query( this.Storage[ index ], Criteria ) )
						{
							let document = this.Storage[ index ];
							if ( Projection )
							{
								document = await jsongin.Project( document, Projection );
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
			async function ( Criteria, Update )
			{
				try
				{
					let result = [];
					for ( let index = 0; index < this.Storage.length; index++ )
					{
						if ( await jsongin.Query( this.Storage[ index ], Criteria ) )
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
			async function ( Criteria, Data )
			{
				await this.SetData( [ Data ] );
				let result = await this.Find( Criteria );
				return result.length === 1;
			},


	};

	return driver;
};
