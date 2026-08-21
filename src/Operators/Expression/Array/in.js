'use strict';
/*md

## Operators > Expression > $in

Usage: `$in: [ value-expression, array-expression ]`

Returns `true` when an array contains a value.

Values are compared by ***content***, using the same comparison as the query and expression
  operators, so a value which is an array, a document, or a date is found rather than being
  compared by reference.

***The second operand must be an array***, and a `null` is an error rather than a `false`.
A `null` ***value*** is an ordinary value: it is found only when the array holds one.

Note that this is the expression `$in` and not the query operator `$in`, which takes the array
  on the other side: `{ field: { $in: [ ... ] } }`.
See the Operators Which Share a Name section of the operator reference.

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
				let operands = arithmetic.Operands( Document, Args, '$in', 2, 2, Scope );

				let value = operands[ 0 ];
				let values = operands[ 1 ];
				if ( jsongin.ShortType( values ) !== 'a' )
				{
					throw new Error( `$in: requires an array as its second operand but found a [${jsongin.ShortType( values )}] operand instead.` );
				}

				for ( let index = 0; index < values.length; index++ )
				{
					if ( jsongin.CompareValues( values[ index ], value ) === 0 ) { return true; }
				}

				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$in: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
