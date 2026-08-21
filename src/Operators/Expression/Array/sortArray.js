'use strict';
/*md

## Operators > Expression > $sortArray

Usage: `$sortArray: { input: expression, sortBy: 1 }`
  or `$sortArray: { input: expression, sortBy: { field: 1, ... } }`

Sorts the elements of an array.

`sortBy` is either `1` or `-1`, which sorts the elements themselves by BSON order, or a
  document naming fields to sort by, which sorts documents the way [`Sort()`](./Sort.md) does.

A null or missing input makes the result null.
The document's own array is left as it is; a sorted copy is returned.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$sortArray: requires a document naming an input and a sortBy.` );
				}
				if ( !( 'input' in Args ) || !( 'sortBy' in Args ) )
				{
					throw new Error( `$sortArray: requires both an [input] and a [sortBy].` );
				}

				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( ![ 'input', 'sortBy' ].includes( keys[ index ] ) )
					{
						throw new Error( `$sortArray: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let values = array.AsArrayOrNull( jsongin.Evaluate( Document, Args.input, Scope ), '$sortArray' );
				if ( values === null ) { return null; }

				let sort_by = Args.sortBy;
				let sort_type = jsongin.ShortType( sort_by );

				if ( sort_type === 'n' )
				{
					if ( ( sort_by !== 1 ) && ( sort_by !== -1 ) )
					{
						throw new Error( `$sortArray: requires a sortBy of 1 or -1 but found ${sort_by} instead.` );
					}
					return array.SortedValues( values, ( sort_by === -1 ) );
				}

				if ( sort_type === 'o' )
				{
					// Sort() is the same ordering the $sort stage applies, so an array of
					// documents sorts here exactly as it would in a pipeline.
					return jsongin.Sort( values.slice(), sort_by );
				}

				throw new Error( `$sortArray: requires a sortBy of 1, -1, or a document but found a [${sort_type}] instead.` );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$sortArray: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
