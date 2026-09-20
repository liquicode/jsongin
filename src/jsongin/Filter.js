'use strict';

module.exports = function ( jsongin )
{
	//---------------------------------------------------------------------
	// Selects the documents which match, into a new array.
	//
	// The array is new and the documents in it are the caller's own objects, which are
	// deliberately ***not*** cloned: writing into a document of the result writes into the
	// document the caller passed. Filter is a selection rather than a transformation, and a
	// filter which selects ten documents out of a hundred thousand should not copy ten
	// documents the caller already holds.
	//
	// This is the convention the pass-through aggregation stages follow, and
	// docs/guides/jsongin/Aggregate.md names Filter as the thing they follow. A stage which
	// produces documents rather than selecting them clones with SafeClone before writing.
	// Filter.md states the same rule for callers.
	// ***Options is Query's***, and is passed to every document: { ExpandArrays, Scope }. A
	// filter which is part of a pipeline hands its scope along here, which is what lets a
	// '$$name' bound by $lookup's `let` resolve inside a $match's $expr - the pipeline frame
	// would otherwise stop at this function. See src/QueryOptions.js.
	function Filter( Documents, QueryCriteria, Options )
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( QueryCriteria ) !== 'o' ) { throw new Error( `QueryCriteria must be an object.` ); }
			let filtered = [];
			for ( let index = 0; index < Documents.length; index++ )
			{
				if ( jsongin.Query( Documents[ index ], QueryCriteria, '', Options ) )
				{
					filtered.push( Documents[ index ] );
				}
			}
			return filtered;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Filter: ' + error.message ); }
			throw error;
		}
	};
	return Filter;
};
