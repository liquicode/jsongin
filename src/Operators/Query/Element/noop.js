'use strict';
/*md

## Operators > Meta > $noop

Usage: `$noop: any`

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Meta',
		TopLevel: false,
		ValueTypes: 'b',

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
