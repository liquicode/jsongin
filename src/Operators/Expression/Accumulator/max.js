'use strict';
/*md

## Operators > Expression > $max

Usage: `$max: [ expression1, expression2, ... ]` or `$max: expression`

Returns the largest of the given values.
Null and missing values are ignored.
Returns null when all of the values are null or missing, and when no values are given at all.
MongoDB answers null for an empty array here rather than refusing it, and so does this.

Note that this is the expression operator `$max` and not the update operator `$max`.
The expression operator selects the largest of several values.
The update operator conditionally modifies a document field.

*/

module.exports = function ( jsongin )
{

	const expression_values = require( './_expression-values' )( jsongin );
	function compare( ValueA, ValueB ) { return jsongin.CompareValues( ValueA, ValueB ); }

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// A single argument may be given without the enclosing array, so any expression type.
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = expression_values.Operands( Document, Args, '$max', Scope );

				let selected = null;
				let has_value = false;
				for ( let index = 0; index < operands.length; index++ )
				{
					// Null and missing values are ignored.
					if ( 'lu'.includes( jsongin.ShortType( operands[ index ] ) ) ) { continue; }
					if ( has_value === false )
					{
						selected = operands[ index ];
						has_value = true;
						continue;
					}
					if ( compare( operands[ index ], selected ) > 0 ) { selected = operands[ index ]; }
				}

				if ( has_value === false ) { return null; }
				return selected;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$max: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
