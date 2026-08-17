'use strict';
/*md

## Operators > Query > $noop

Usage: `$noop: anything`

***A jsongin extension.*** MongoDB has no operator of this name.

Matches every document, whatever it is given. Useful as a placeholder where a query is required
  but no condition is wanted, and it works at the top level of a query.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// $noop is used to comment out a portion of a query, which means it has to be
		// allowed at the top level of one. That is where a commented out clause sits.
		TopLevel: true,
		// $noop ignores its value, so it takes anything. A clause is commented out by renaming
		// its key, and whatever that clause held has to be allowed through unexamined.
		ValueTypes: 'bnsdloarefyu',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `$noop: always returns true at [${Path}].` ); }
			return true;
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			return;
		},

		//---------------------------------------------------------------------
		ToSql: function ( Expression )
		{
			return '';
		},

	};

	// Return the operator.
	return operator;
};
