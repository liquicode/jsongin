'use strict';
/*md

## Operators > Expression > $rand

Usage: `$rand: {}`

Returns a random float from 0 up to but not including 1.

It takes no operands, and the empty document is how it says so.

***A query reaches it through [$expr](./Query-Operators.md#$expr)***, never on its own:
  `{ $expr: { $lt: [ { $rand: {} }, 0.5 ] } }` selects about half the documents. `$rand` is
  not a query operator and cannot stand as one.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			return Math.random();
		},

	};

	// Return the operator.
	return operator;
};
