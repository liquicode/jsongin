'use strict';

/*
	Shared handling for the pipeline stages.
	This is a helper module, not a stage.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Reshaping Stage Tests.js.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Evaluates an expression which has to produce a whole document, for the stages which
	// replace one document with another.
	//
	// ***A missing or non-document result fails the pipeline*** rather than dropping the
	// document, which is why $ifNull is the usual guard on a field which may not be there.
	helper.AsNewRoot = function ( Document, Expression, OperatorName )
	{
		let value = jsongin.Evaluate( Document, Expression );

		let short_type = jsongin.ShortType( value );
		if ( short_type !== 'o' )
		{
			throw new Error( `${OperatorName}: requires an expression which produces a document but found a [${short_type}] instead.` );
		}

		return jsongin.SafeClone( value );
	};


	//---------------------------------------------------------------------
	// Validates the argument document of a stage which takes named arguments.
	// Every name in Allowed is required, since no stage here has an optional one.
	helper.ReadArgs = function ( Args, OperatorName, Allowed )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document naming [${Allowed.join( '], [' )}].` );
		}

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( Allowed.includes( keys[ index ] ) === false )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this stage.` );
			}
		}
		for ( let index = 0; index < Allowed.length; index++ )
		{
			if ( ( Allowed[ index ] in Args ) === false )
			{
				throw new Error( `${OperatorName}: requires an argument named [${Allowed[ index ]}].` );
			}
		}

		return Args;
	};


	//---------------------------------------------------------------------
	return helper;
};
