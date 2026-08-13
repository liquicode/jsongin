'use strict';
/*md

## Operators > Expression > $ne

Usage: `$ne: [ expression1, expression2 ]`

Returns true when the two values are not equal.
Null and missing values are equivalent.

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
				if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `$ne: requires an array of two arguments.` ); }
				if ( Args.length !== 2 ) { throw new Error( `$ne: requires exactly two arguments but found ${Args.length} instead.` ); }

				let value_a = jsongin.Evaluate( Document, Args[ 0 ] );
				let value_b = jsongin.Evaluate( Document, Args[ 1 ] );

				return ( compare( value_a, value_b ) !== 0 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ne: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
