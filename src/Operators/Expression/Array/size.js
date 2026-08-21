'use strict';
/*md

## Operators > Expression > $size

Usage: `$size: expression`

Returns the number of elements in an array.

***The operand must be an array.*** Unlike most of the expression operators, a `null` or a
  ***missing*** field is an error here rather than a `null` result.

Note that this is the expression `$size` and not the query operator `$size`.
The expression returns the count. The query operator matches a field whose array has that many
  elements.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$size', 1, 1, Scope );

				let value = operands[ 0 ];
				if ( jsongin.ShortType( value ) !== 'a' )
				{
					throw new Error( `$size: requires an array operand but found a [${jsongin.ShortType( value )}] operand instead.` );
				}

				return value.length;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$size: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
