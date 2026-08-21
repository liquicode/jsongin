'use strict';
/*md

## Operators > Expression > $range

Usage: `$range: [ start, end ]`
  or `$range: [ start, end, step ]`

Generates an array of numbers from `start` up to but not including `end`.

***The end is never reached***, and a range which runs the wrong way is empty rather than an
  error: `$range: [ 4, 0 ]` gives `[]` because the default step of 1 never gets there.
A step of zero would never end and is refused, and all three operands must be whole numbers.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'a',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let operands = array.Operands( Document, Args, '$range', 2, 3, Scope );

				let start = array.AsWholeNumber( operands[ 0 ], '$range', 'start' );
				let end = array.AsWholeNumber( operands[ 1 ], '$range', 'end' );

				let step = 1;
				if ( operands.length === 3 )
				{
					step = array.AsWholeNumber( operands[ 2 ], '$range', 'step' );
					if ( step === 0 ) { throw new Error( `$range: requires a step other than zero.` ); }
				}

				let values = [];
				if ( step > 0 )
				{
					for ( let value = start; value < end; value = value + step ) { values.push( value ); }
				}
				else
				{
					for ( let value = start; value > end; value = value + step ) { values.push( value ); }
				}

				return values;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$range: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
