'use strict';
/*md

## Operators > Expression > $log

Usage: `$log: [ expression, base ]`

Returns the logarithm of a number in the given base.
The number must be greater than zero, and the base must be greater than zero and not one.
A base of one has no logarithm, because raising one to any power gives one back.

*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

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
				return arithmetic.BinaryNumber( Document, Args, '$log',
					function ( Value, Base )
					{
						if ( Value <= 0 ) { throw new Error( `$log: requires an operand greater than zero but found ${Value} instead.` ); }
						if ( Base <= 0 ) { throw new Error( `$log: requires a base greater than zero but found ${Base} instead.` ); }
						if ( Base === 1 ) { throw new Error( `$log: requires a base other than one.` ); }
						return ( Math.log( Value ) / Math.log( Base ) );
					}, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$log: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
