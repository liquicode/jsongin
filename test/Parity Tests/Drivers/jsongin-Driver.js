'use strict';

module.exports = function ( Settings )
{

	// Called with no Settings, this is the engine the package exports: the very instance a
	// caller gets from require( '@liquicode/jsongin' ), with nothing configured.
	//
	// That is what the parity run wants. Parity is a claim about jsongin ***as it ships***,
	// so pinning settings here would let a change to a default pass unnoticed by the one
	// suite whose job is to catch it.
	//
	// Pass Settings only to test a non default configuration deliberately.
	const LIB_JSONGIN = require( '../../../src/jsongin' );
	const jsongin = ( typeof Settings === 'undefined' ) ? LIB_JSONGIN : LIB_JSONGIN.NewJsongin( Settings );

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
					// Rethrown rather than logged. An engine which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
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
					// Rethrown rather than logged. An engine which rejects an operation is
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
					return await jsongin.Aggregate( this.Storage, Pipeline );
				}
				catch ( error )
				{
					// Rethrown rather than logged. An engine which rejects an operation is
					// stating a behavior, and a parity test has to be able to see it.
					throw error;
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
