'use strict';
/*md

## Operators > Query > $nin

Usage: `$nin: [ value, ... ]`

Matches a field which equals ***none*** of the listed values. The exact negation of `$in`.

A field which is ***not there*** matches `$nin` for any list which does not contain `null`.

*/

const LIB_QUERY_OPTIONS = require( '../../../QueryOptions' );

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', Options )
		{
			let options = LIB_QUERY_OPTIONS.Normalize( Options );
			return !jsongin.QueryOperators.$in.Query( Document, MatchValue, Path, options );
		},

	};

	// Return the operator.
	return operator;
};
