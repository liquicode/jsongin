'use strict';
/*md

## Operators > Stage > $project

Usage: `$project: { field: 1 | 0, field: expression, ... }`

Reshapes each document, including or excluding fields and defining new ones from expressions.

A value of `1` or `true` includes a field, a value of `0` or `false` excludes it, and any
  other value is an expression which computes the field.
Inclusions and exclusions cannot be combined in the same projection, with the exception of
  `_id`, which may be suppressed alongside an inclusion.
A computed field implies an inclusion projection.

This stage produces new documents. Every document it emits is a clone, so the caller's
  documents are never written to.

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
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$project requires a projection object.` ); }

				// MongoDB refuses an empty specification here, which is the opposite of the
				// Project() rule: Project( Document, {} ) returns the whole document.
				// Verified against MongoDB 6.0.1. The stage states this itself because
				// Project() cannot tell which of its callers it is serving.
				if ( Object.keys( Args ).length === 0 ) { throw new Error( `$project requires at least one field.` ); }

				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					// Project() clones the document with SafeClone(), so nothing more is needed here.
					// The third argument says this is a stage, where $slice and $elemMatch are
					// expressions rather than projection operators. See Project.js.
					let result = jsongin.Project( Documents[ index ], Args, true, Scope );
					if ( result === null )
					{
						throw new Error( `Unable to project the document at index [${index}].` );
					}
					results.push( result );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$project: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
