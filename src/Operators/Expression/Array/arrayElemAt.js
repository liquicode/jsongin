'use strict';
/*md

## Operators > Expression > $arrayElemAt

Usage: `$arrayElemAt: [ array-expression, position ]`

Returns the element of an array at a position.

***A negative position counts back from the end***, so `-1` is the last element.
This is the one place a negative number indexes an array: it is an ***operand*** here, not a
  path element, and the path syntax has no reverse indexing.

A position ***out of range*** gives a ***missing*** value, so a projected field is not produced
  at all rather than being set to `null`.
A `null` or missing array gives `null`.
An array operand which is present but is not an array, or a position which is not an integer,
  is an error.

`$arrayElemAt` is the only way to index an array in an aggregation expression, because a field
  path such as `'$a.2'` applies the key to the elements instead.

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
				let operands = arithmetic.Operands( Document, Args, '$arrayElemAt', 2, 2, Scope );

				let values = operands[ 0 ];
				let values_type = jsongin.ShortType( values );
				if ( 'lu'.includes( values_type ) ) { return null; }
				if ( values_type !== 'a' )
				{
					throw new Error( `$arrayElemAt: requires an array as its first operand but found a [${values_type}] operand instead.` );
				}

				let position = operands[ 1 ];
				let position_type = jsongin.ShortType( position );
				if ( 'lu'.includes( position_type ) ) { return null; }
				if ( ( position_type !== 'n' ) || ( Number.isInteger( position ) === false ) )
				{
					throw new Error( `$arrayElemAt: requires an integer as its second operand but found [${JSON.stringify( position )}] instead.` );
				}

				let index = position;
				if ( index < 0 ) { index = values.length + index; }

				// Out of range is missing rather than null, which is undefined here: the
				// projection stage omits a field whose expression resolved to nothing.
				if ( index < 0 ) { return undefined; }
				if ( index >= values.length ) { return undefined; }

				return values[ index ];
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$arrayElemAt: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
