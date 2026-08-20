'use strict';
/*md

## Operators > Query > $bitsAnySet

Usage: `$bitsAnySet: bitmask`
  or `$bitsAnySet: [ position, ... ]`

Matches when ***at least one*** bit named by the mask is set in the field.

The bits asked about are given either as a ***bitmask***, which names them directly, or as an
  array of ***bit positions*** counted from the least significant bit, where position 0 is the
  ones place. An empty array of positions asks whether any of no bits is set, which is not satisfied.

A field which is not an integer has no bits to read and does not match.
A negative integer does: its bits are read as two's complement.

*/

module.exports = function ( jsongin )
{

	const bitwise = require( './_bitwise' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'na',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				return bitwise.MatchBits( Document, MatchValue, Path, ExpandArrays, '$bitsAnySet',
					function ( Bits, Mask )
					{
						return ( ( Bits & Mask ) !== 0n );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$bitsAnySet: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
