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
	// Reduces a list of buckets to one document each, the way $group reduces a group.
	//
	// ***A bucket nothing fell into is left out entirely***, rather than reported with a count
	// of zero, which is what MongoDB does and is the opposite of what an empty $group key would
	// suggest. Both bucketing stages follow the rule, so it is written here once.
	//
	// The accumulators are run through the $group stage rather than reimplemented, so that a
	// bucket and a group cannot disagree about what an accumulator means or which of them are
	// recognized.
	helper.ReduceBuckets = function ( Buckets, Accumulators, OperatorName )
	{
		if ( jsongin.ShortType( Accumulators ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires [output] to be a document of accumulators.` );
		}

		// ***An empty output is allowed***, and answers the _id alone. The two stages disagree
		// about what it means and each settles that before calling here: $bucket takes it
		// literally, and $bucketAuto reads it as no output at all and counts instead.

		let results = [];
		for ( let index = 0; index < Buckets.length; index++ )
		{
			if ( Buckets[ index ].Documents.length === 0 ) { continue; }

			// _id is fixed here rather than computed, so $group is asked for a single group.
			let specification = { _id: null };
			let names = Object.keys( Accumulators );
			for ( let name = 0; name < names.length; name++ )
			{
				specification[ names[ name ] ] = Accumulators[ names[ name ] ];
			}

			let grouped = jsongin.StageOperators.$group.Stage( Buckets[ index ].Documents, specification );

			let reduced = { _id: jsongin.SafeClone( Buckets[ index ].Key ) };
			for ( let name = 0; name < names.length; name++ )
			{
				if ( ( names[ name ] in grouped[ 0 ] ) === false ) { continue; }
				reduced[ names[ name ] ] = grouped[ 0 ][ names[ name ] ];
			}

			results.push( reduced );
		}

		return results;
	};


	//---------------------------------------------------------------------
	return helper;
};
