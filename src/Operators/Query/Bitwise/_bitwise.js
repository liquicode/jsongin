'use strict';

/*
	Shared bit reading for the bitwise query operators.
	This is a helper module, not an operator.

	***The arithmetic is done in BigInt, not with Javascript's bitwise operators.***
	Those convert their operands to 32 bit integers, and MongoDB matches on 64 bits: asking
	for bit position 40 would silently fold back into the low 32 and answer about the wrong
	bit. BigInt also gets a negative value right, because it treats one as two's complement
	extending indefinitely - which is what makes { v: -20 } match bit position 40.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Query Tests/test-suite/Bitwise Query Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Returns the bit mask a match value asks about.
	//
	// The value is either a bitmask, which names its bits directly, or an array of bit
	// positions counted from the least significant bit. Both must be non-negative integers:
	// there is no bit at position -1 or at position 1.5, so those are refused rather than
	// quietly matching nothing.
	helper.AsMask = function ( MatchValue, OperatorName, Path )
	{
		let short_type = jsongin.ShortType( MatchValue );

		if ( short_type === 'n' )
		{
			if ( !Number.isInteger( MatchValue ) || ( MatchValue < 0 ) )
			{
				throw new Error( `${OperatorName}: requires a non-negative integer bitmask but found ${MatchValue} at [${Path}].` );
			}
			return BigInt( MatchValue );
		}

		if ( short_type === 'a' )
		{
			let mask = 0n;
			for ( let index = 0; index < MatchValue.length; index++ )
			{
				let position = MatchValue[ index ];
				if ( jsongin.ShortType( position ) !== 'n' )
				{
					throw new Error( `${OperatorName}: requires numeric bit positions at [${Path}].` );
				}
				if ( !Number.isInteger( position ) || ( position < 0 ) )
				{
					throw new Error( `${OperatorName}: requires non-negative integer bit positions but found ${position} at [${Path}].` );
				}
				mask = mask | ( 1n << BigInt( position ) );
			}
			return mask;
		}

		throw new Error( `${OperatorName}: requires a bitmask or an array of bit positions at [${Path}].` );
	};


	//---------------------------------------------------------------------
	// Returns the bits of a value, or null when it has none to read.
	// A fractional number has no bit pattern, and neither has anything which is not a number.
	// Both are answered with no match rather than with an error: the query is well formed and
	// the document simply does not satisfy it.
	helper.AsBits = function ( Value )
	{
		if ( jsongin.ShortType( Value ) !== 'n' ) { return null; }
		if ( !Number.isInteger( Value ) ) { return null; }
		return BigInt( Value );
	};


	//---------------------------------------------------------------------
	// Applies one bit test to every value the path can mean.
	// Compare receives the value's bits and the mask, and answers whether they satisfy it.
	helper.MatchBits = function ( Document, MatchValue, Path, ExpandArrays, OperatorName, Compare )
	{
		let mask = helper.AsMask( MatchValue, OperatorName, Path );

		let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
		for ( let index = 0; index < candidates.length; index++ )
		{
			let bits = helper.AsBits( candidates[ index ] );
			if ( bits === null ) { continue; }
			if ( Compare( bits, mask ) ) { return true; }
		}

		if ( jsongin.OpLog ) { jsongin.OpLog( `${OperatorName}: no value at [${Path}] satisfied the mask.` ); }
		return false;
	};


	//---------------------------------------------------------------------
	return helper;
};
