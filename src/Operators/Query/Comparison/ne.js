'use strict';
/*md

## Operators > Query > $ne

Usage: `$ne: value`

Matches a field which does not equal the value. The exact negation of `$eq`, including through
  an array: a field matches when ***no*** element equals the value.

A field which is ***not there*** matches `$ne`, because a missing field does not equal
  anything.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		// The same set as $eq, which this negates. The two cannot differ.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			return !jsongin.QueryOperators.$eq.Query( Document, MatchValue, Path, ExpandArrays );
		},

	};

	// Return the operator.
	return operator;
};
