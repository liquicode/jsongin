'use strict';
/*md

## Operators > Query > $comment

Usage: `$comment: text`

Annotates a query with a note, and selects every document.

***A comment is not a predicate.*** It narrows nothing, so a query carrying one finds exactly
  what it would have found without it. It exists so that a query appearing in a log or a
  profiler can say why it was run.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// A comment stands on its own in a query rather than beside a field path.
		TopLevel: true,
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			return true;
		},

	};

	// Return the operator.
	return operator;
};
