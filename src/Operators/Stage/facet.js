'use strict';
/*md

## Operators > Stage > $facet

Usage: `$facet: { name: [ stage, ... ], name: [ stage, ... ], ... }`

Runs several pipelines over the same input and gathers their results into one document, one
  field per branch.

***Every branch sees the whole input***, not what another branch left behind, which is the
  point of the stage: it answers several questions about one set of documents in a single pass.

***One document comes out*** however many went in, holding one array per branch. A branch which
  selects nothing answers an empty array, and an empty branch pipeline answers everything.

A branch which is not an array of stages is refused, as is a `$facet` naming no branches.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$facet requires a document naming one or more pipelines.` );
				}

				let names = Object.keys( Args );
				if ( names.length === 0 ) { throw new Error( `$facet requires at least one branch.` ); }

				for ( let index = 0; index < names.length; index++ )
				{
					if ( jsongin.ShortType( Args[ names[ index ] ] ) !== 'a' )
					{
						throw new Error( `$facet branch [${names[ index ]}] must be a pipeline.` );
					}
				}

				let faceted = {};
				for ( let index = 0; index < names.length; index++ )
				{
					// ***Each branch is handed the same input.*** Aggregate() never modifies
					// the array it is given, so one branch cannot disturb the next.
					faceted[ names[ index ] ] = jsongin.Aggregate( Documents, Args[ names[ index ] ] );
				}

				return [ faceted ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$facet: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
