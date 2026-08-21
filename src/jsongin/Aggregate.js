'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Runs an array of documents through an aggregation pipeline.
	// The input array and the documents within it are never modified.
	// Stages which produce documents clone before writing. Stages which only select or
	// reorder documents return the original document references.
	function Aggregate( Documents, Pipeline, Scope )
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( Pipeline ) !== 'a' ) { throw new Error( `Pipeline must be an array.` ); }

			// ***The pipeline frame is made once, here, and that is what makes $$NOW right.***
			// MongoDB gives every document and every stage of one pipeline the same instant,
			// so the clock is read once for the whole run rather than per document. Reading it
			// lower down would be the obvious implementation and would disagree with the
			// server - which the parity suite asserts in both directions.
			//
			// A caller may pass its own frame, which is how a nested pipeline - $facet running
			// a branch, $lookup one day - shares the outer run's instant and variables.
			let scope = Scope;
			if ( jsongin.ShortType( scope ) !== 'o' ) { scope = jsongin.Scope.NewPipeline(); }

			// A new array holding the same document references.
			let documents = Documents.slice();

			for ( let index = 0; index < Pipeline.length; index++ )
			{
				let stage = Pipeline[ index ];
				if ( jsongin.ShortType( stage ) !== 'o' )
				{
					throw new Error( `Pipeline stage [${index}] must be an object.` );
				}

				// A stage object holds exactly one stage operator.
				let keys = Object.keys( stage );
				if ( keys.length !== 1 )
				{
					throw new Error( `Pipeline stage [${index}] must have exactly one key, found [${keys.length}].` );
				}

				let key = keys[ 0 ];
				let operator = jsongin.StageOperators[ key ];
				if ( typeof operator === 'undefined' )
				{
					throw new Error( `Unrecognized aggregation stage [${key}].` );
				}

				// Check the argument against the types the stage says it takes.
				// A stage is still free to validate its own argument, and does when its Stage
				// function is called directly rather than through here.
				if ( jsongin.ShortType( operator.ArgTypes ) === 's' )
				{
					let argument_type = jsongin.ShortType( stage[ key ] );
					if ( operator.ArgTypes.includes( argument_type ) === false )
					{
						throw new Error( `Pipeline stage [${key}] does not take an argument of type [${argument_type}]. It takes [${operator.ArgTypes}].` );
					}
				}

				documents = operator.Stage( documents, stage[ key ], scope );
			}

			return documents;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Aggregate: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Aggregate;
};
