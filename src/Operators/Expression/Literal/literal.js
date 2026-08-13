'use strict';
/*md

## Operators > Expression > $literal

Usage: `$literal: value`

Returns `value` without evaluating it.
Use this to produce a literal string that begins with a `$` character.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Literal',
		ArgTypes: 'bnsdloaru',
		ArgCount: 1,

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			// The argument is intentionally not evaluated.
			return Args;
		},

	};

	// Return the operator.
	return operator;
};
