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
			if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$noop: always returns true at [${Path}].` ); }
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
