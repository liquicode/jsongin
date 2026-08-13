'use strict';
/*md

## Operators > Expression > $cmp

Usage: `$cmp: [ expression1, expression2 ]`

Compares two values and returns:
- `-1` when the first value is less than the second.
- `0` when the two values are equal.
- `1` when the first value is greater than the second.

*/

module.exports = function ( jsongin )
{

	function compare( ValueA, ValueB ) { return jsongin.CompareValues( ValueA, ValueB ); }

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		ArgTypes: 'a',
		ArgCount: 2,

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `$cmp: requires an array of two arguments.` ); }
				if ( Args.length !== 2 ) { throw new Error( `$cmp: requires exactly two arguments but found ${Args.length} instead.` ); }

				let value_a = jsongin.Evaluate( Document, Args[ 0 ] );
				let value_b = jsongin.Evaluate( Document, Args[ 1 ] );

				return compare( value_a, value_b );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$cmp: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
