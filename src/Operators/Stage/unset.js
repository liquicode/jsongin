'use strict';
/*md

## Operators > Stage > $unset

Usage: `$unset: 'path'` or `$unset: [ 'path', 'path', ... ]`

Removes fields from every document. A shorthand for a [$project](#$project) of exclusions.

***A path here, not a name.*** A dot means a step into a sub-document, so `'sub.q'` removes the
  `q` of the `sub`. That is the opposite of the expression operator
  [$unsetField](./Expression-Operators.md#$unsetField), which names one field and reads a dot as
  part of the name.

A document which does not have the field is passed along unchanged, and `_id` may be removed
  like any other field.

An empty specification is refused, as is a path which is not a string.

***There is also an update operator called `$unset`***, which removes fields from one document
  being updated rather than from every document in a stream. See
  [Update Operators](./Update-Operators.md#$unset).

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'sa',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				let paths = Args;
				if ( jsongin.ShortType( paths ) === 's' ) { paths = [ paths ]; }
				if ( jsongin.ShortType( paths ) !== 'a' )
				{
					throw new Error( `$unset requires a field path or an array of them.` );
				}
				if ( paths.length === 0 ) { throw new Error( `$unset requires at least one field path.` ); }

				for ( let index = 0; index < paths.length; index++ )
				{
					if ( jsongin.ShortType( paths[ index ] ) !== 's' )
					{
						throw new Error( `$unset requires field paths to be strings but found a [${jsongin.ShortType( paths[ index ] )}] instead.` );
					}
					if ( paths[ index ].length === 0 )
					{
						throw new Error( `$unset requires a field path which is not empty.` );
					}
				}

				// Built as the exclusion projection it stands for, so that the two cannot
				// disagree about what a dotted path means or about a field which is not there.
				let projection = {};
				for ( let index = 0; index < paths.length; index++ )
				{
					projection[ paths[ index ] ] = 0;
				}

				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					results.push( jsongin.Project( Documents[ index ], projection, true, Scope ) );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$unset: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
