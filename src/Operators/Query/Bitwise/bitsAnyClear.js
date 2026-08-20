'use strict';
/*md

## Operators > Query > $bitsAnyClear

Usage: `$bitsAnyClear: bitmask`
  or `$bitsAnyClear: [ position, ... ]`

Matches when ***at least one*** bit named by the mask is clear in the field.

The bits asked about are given either as a ***bitmask***, which names them directly, or as an
  array of ***bit positions*** counted from the least significant bit, where position 0 is the
  ones place. An empty array of positions asks whether any of no bits is clear, which is not satisfied.

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
				return bitwise.MatchBits( Document, MatchValue, Path, ExpandArrays, '$bitsAnyClear',
					function ( Bits, Mask )
					{
						return ( ( Bits & Mask ) !== Mask );
					} );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$bitsAnyClear: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
