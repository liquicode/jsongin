'use strict';
/*md

## Operators > Stage > $unionWith

Usage: `$unionWith: <documents>`
  or `$unionWith: { coll: <documents>, pipeline: [ stage, ... ] }`

Adds a second set of documents to the stream, after the ones already in it.

***`coll` is the documents themselves, or a `$$variable` naming them.*** MongoDB names a
  collection there; `jsongin` works on arrays, so it takes the array. That is the only
  difference between them.

***This is a concatenation, not a set union.*** Nothing is de-duplicated, and a document which
  is in both sets comes back twice - measured against MongoDB 8.3.8, where the same `_id` in
  both collections came back twice. Follow it with `$group` to reduce it.

A `pipeline` runs over the second set only, before it joins the stream. Every stage after this
  one sees both sets.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The documents to add: an array written into the stage, or a '$$name' bound in the scope.
	// Shared shape with $lookup's `from`, and the same reasoning - see Stage/lookup.js.
	function documents_from( Coll, Scope )
	{
		let coll_type = jsongin.ShortType( Coll );

		if ( coll_type === 'a' ) { return Coll; }

		if ( coll_type === 's' )
		{
			if ( Coll.startsWith( '$$' ) === false )
			{
				throw new Error( `$unionWith coll [${Coll}] is not a variable. jsongin has no collections: give the documents themselves, or a '$$name' bound in the scope.` );
			}
			let name = Coll.slice( 2 );
			let found = ( Scope && ( typeof Scope.Lookup === 'function' ) ) ? Scope.Lookup( name ) : { Found: false };
			if ( found.Found !== true ) { throw new Error( `$unionWith coll [${Coll}] is not defined.` ); }
			if ( jsongin.ShortType( found.Value ) !== 'a' ) { throw new Error( `$unionWith coll [${Coll}] must be an array of documents.` ); }
			return found.Value;
		}

		throw new Error( `$unionWith requires documents, or a '$$name' bound in the scope.` );
	}


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// The two forms MongoDB takes: the arguments on their own, or a document naming them.
		// An array is the short form here, where a collection name is the short form there.
		ArgTypes: 'aso',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				let args_type = jsongin.ShortType( Args );
				let coll = Args;
				let pipeline = null;

				if ( args_type === 'o' )
				{
					coll = Args.coll;
					if ( typeof Args.pipeline !== 'undefined' )
					{
						if ( jsongin.ShortType( Args.pipeline ) !== 'a' ) { throw new Error( `$unionWith pipeline must be an array of stages.` ); }
						pipeline = Args.pipeline;
					}
					// ***The server refuses this in as many words***: "$unionWith stage without
					// explicit collection must have a pipeline with $documents as first stage".
					// jsongin has no $documents, so a union which names nothing has nothing to
					// add, whichever way it is written.
					if ( ( typeof coll === 'undefined' ) || ( coll === null ) )
					{
						throw new Error( `$unionWith requires documents to add, in coll.` );
					}
				}

				let union_documents = documents_from( coll, Scope );

				// The pipeline runs over the second set alone, before it joins the stream.
				if ( pipeline !== null )
				{
					union_documents = jsongin.Aggregate( union_documents, pipeline, Scope );
				}

				// A selection, so the documents are the caller's own: Union() states the rule.
				return jsongin.Union( Documents, union_documents );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$unionWith: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
