'use strict';
/*md

## Operators > Expression > $concatArrays

Usage: `$concatArrays: [ array-expression, ... ]`

Joins several arrays into one, in the order given.
Takes any number of operands, and gives an empty array for none.

***A single `null` or missing operand takes the whole result***, which becomes `null` rather
  than the other operands joined without it.
An operand which is present and is neither an array nor `null` is an error.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = arithmetic.Operands( Document, Args, '$concatArrays', 0, null );

				// Every operand is checked before any of them is joined, so that a null which
				// arrives after a valid array still takes the whole result.
				for ( let index = 0; index < operands.length; index++ )
				{
					let operand_type = jsongin.ShortType( operands[ index ] );
					if ( 'lu'.includes( operand_type ) ) { return null; }
					if ( operand_type !== 'a' )
					{
						throw new Error( `$concatArrays: requires array operands but found a [${operand_type}] operand instead.` );
					}
				}

				let joined = [];
				for ( let index = 0; index < operands.length; index++ )
				{
					joined = joined.concat( operands[ index ] );
				}

				return joined;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$concatArrays: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
