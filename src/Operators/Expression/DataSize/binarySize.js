'use strict';
/*md

## Operators > Expression > $binarySize

Usage: `$binarySize: expression`

The number of bytes a string occupies.

***A string is measured in bytes, not in characters.***
The accented letter of `'héllo'` is two bytes, so its binary size is 6 where its length is 5.
This is the same counting [$strLenBytes](#$strLenBytes) does.

A null or missing operand makes the result null.
Anything which is not a string has no binary size and throws.
MongoDB also measures `binData` here, which `jsongin` does not carry.

*/

module.exports = function ( jsongin )
{

	const datasize = require( './_datasize' )( jsongin );

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
				let operands = datasize.Operands( Document, Args, '$binarySize', 1, 1, Scope );

				let value = operands[ 0 ];
				let short_type = jsongin.ShortType( value );
				if ( 'lu'.includes( short_type ) ) { return null; }
				if ( short_type !== 's' )
				{
					throw new Error( `$binarySize: requires a string but found a [${short_type}] instead.` );
				}

				return datasize.ByteLength( value );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$binarySize: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
